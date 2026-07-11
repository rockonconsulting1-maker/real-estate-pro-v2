// ghl-proxy — SB-1.1 (Contract) + SB-1.4
// Authenticated pass-through: verifies the caller's Supabase JWT, loads that
// user's PIT server-side, attaches it, forwards the request to GHL, and returns
// the response. The PIT never reaches the browser and is never logged.
//
// Invocation shape:
//   {SUPABASE_URL}/functions/v1/ghl-proxy/<ghl-path>?<query>
//   e.g. GET  /functions/v1/ghl-proxy/contacts/?locationId=...&limit=20
//        POST /functions/v1/ghl-proxy/objects/custom_objects.properties/records
// Headers from the client: Authorization: Bearer <supabase access token>,
//   apikey: <publishable key>, optional x-ghl-version to override the Version header.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  AppError,
  appErrorToResponse,
  captureError,
  corsHeaders,
  errorResponse,
  ghlHeaders,
  GHL_BASE_URL,
  initSentry,
  preflight,
  requireUserId,
  resolveCredentials,
} from "./_shared.ts";

initSentry("ghl-proxy");

// --- Allowlist of GHL path prefixes the typed service layer uses -----------
// (GHL_Integration_Mapping.md: contacts, opportunities, objects/custom objects,
// associations, conversations, calendars/appointments, locations [custom fields,
// custom values, tags, location read], users, businesses/companies, media,
// documents/contracts, proposals.)
const ALLOWED_PREFIXES = [
  "contacts",
  "opportunities",
  "objects",
  "associations",
  "conversations",
  "calendars",
  "locations",
  "users",
  "businesses",
  "companies",
  "medias",
  "documents",
  "proposals",
];

// --- Per-user rate limiting (central; browser-side limiter is gone) --------
// Sliding window per isolate: 90 requests / 10s per user (GHL location burst
// limit is 100 / 10s — headroom left for webhooks/other consumers).
const WINDOW_MS = 10_000;
const MAX_PER_WINDOW = 90;
const buckets = new Map<string, number[]>();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const stamps = (buckets.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - stamps[0])) / 1000);
    throw new AppError("rate_limited", 429, "Proxy rate limit exceeded", {
      retryAfter,
    });
  }
  stamps.push(now);
  buckets.set(userId, stamps);
}

// --- GHL 429 backoff ---------------------------------------------------------
const MAX_GHL_RETRIES = 2;
const MAX_BACKOFF_MS = 8_000;

function extractGhlPath(req: Request): string {
  const url = new URL(req.url);
  // Path arrives as /ghl-proxy/<rest> (or /functions/v1/ghl-proxy/<rest>)
  const marker = "/ghl-proxy/";
  const idx = url.pathname.indexOf(marker);
  const rest = idx >= 0 ? url.pathname.slice(idx + marker.length) : "";
  return rest.replace(/^\/+/, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflight();

  let ghlPath = "";
  try {
    const userId = await requireUserId(req);
    checkRateLimit(userId);

    ghlPath = extractGhlPath(req);
    const firstSegment = ghlPath.split("/")[0]?.split("?")[0] ?? "";
    if (!ghlPath || !ALLOWED_PREFIXES.includes(firstSegment)) {
      throw new AppError(
        "forbidden_path",
        403,
        `Path '/${firstSegment}' is not on the proxy allowlist`,
      );
    }

    const creds = await resolveCredentials(userId);

    // Build target URL with the original query string intact.
    const incoming = new URL(req.url);
    const target = new URL(`${GHL_BASE_URL}/${ghlPath}`);
    target.search = incoming.search;

    // Buffer the body once so retries can resend it (also supports multipart
    // uploads to /medias — content-type is passed through verbatim).
    const hasBody = !["GET", "HEAD"].includes(req.method);
    const bodyBuf = hasBody ? await req.arrayBuffer() : undefined;

    const headers = ghlHeaders(creds.pitToken, {
      contentType: hasBody ? req.headers.get("Content-Type") : null,
      versionOverride: req.headers.get("x-ghl-version"),
    });

    let ghlResponse: Response | null = null;
    for (let attempt = 0; attempt <= MAX_GHL_RETRIES; attempt++) {
      try {
        ghlResponse = await fetch(target.toString(), {
          method: req.method,
          headers,
          body: bodyBuf && bodyBuf.byteLength > 0 ? bodyBuf : undefined,
        });
      } catch (netErr) {
        if (attempt === MAX_GHL_RETRIES) {
          captureError(netErr, { path: ghlPath, method: req.method });
          return errorResponse("network", 502, "Could not reach GHL");
        }
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

      if (ghlResponse.status === 429 && attempt < MAX_GHL_RETRIES) {
        const ra = Number(ghlResponse.headers.get("Retry-After"));
        const waitMs = Math.min(
          Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt,
          MAX_BACKOFF_MS,
        );
        await ghlResponse.body?.cancel();
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }

    const res = ghlResponse!;
    const contentType = res.headers.get("Content-Type") ?? "application/json";
    const payload = await res.arrayBuffer();

    if (!res.ok) {
      // Normalized GHL error: preserve status, wrap body under details.
      let details: unknown = null;
      try {
        details = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        details = new TextDecoder().decode(payload).slice(0, 2000);
      }
      const type = res.status === 429 ? "rate_limited" : "ghl";
      if (res.status >= 500) {
        captureError(new Error(`GHL ${res.status} on ${req.method} /${firstSegment}`), {
          path: ghlPath,
          method: req.method,
          ghlStatus: res.status,
        });
      }
      return errorResponse(type, res.status, "GHL request failed", {
        ghlStatus: res.status,
        details,
        ...(res.status === 429
          ? { retryAfter: Number(res.headers.get("Retry-After")) || undefined }
          : {}),
      });
    }

    return new Response(payload.byteLength > 0 ? payload : null, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  } catch (err) {
    if (err instanceof AppError) return appErrorToResponse(err);
    captureError(err, { path: ghlPath, method: req.method });
    return errorResponse("internal", 500, "Unexpected proxy error");
  }
});
