// ghl-credentials — SB-1.3 (Contract) + SB-1.4
// Routes (all require a valid Supabase JWT):
//   POST {SUPABASE_URL}/functions/v1/ghl-credentials
//     body: { "pitToken": string, "locationId": string, "defaultCalendarId"?: string }
//     Validates the pair against GHL (GET /locations/{id}) BEFORE saving; on
//     success upserts ghl_credentials (service-role) and returns location info.
//   POST {SUPABASE_URL}/functions/v1/ghl-credentials/test
//     No body. Loads the caller's STORED credentials and exercises the full
//     proxy path (same header builder, same GHL call). Returns connection state.
//
// Distinguishable failures for the frontend credentials banner:
//   invalid_token (401/403 from GHL) · invalid_location (404/400 from GHL)
//   credentials_missing (412, /test with nothing stored) · network (502) · ghl (other)

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
  upsertCredentials,
} from "./_shared.ts";

initSentry("ghl-credentials");

interface LocationCheck {
  ok: boolean;
  status: number;
  locationName?: string;
  details?: unknown;
}

async function checkLocation(
  pitToken: string,
  locationId: string,
): Promise<LocationCheck> {
  let res: Response;
  try {
    res = await fetch(`${GHL_BASE_URL}/locations/${encodeURIComponent(locationId)}`, {
      method: "GET",
      headers: ghlHeaders(pitToken),
    });
  } catch (netErr) {
    captureError(netErr, { op: "checkLocation" });
    throw new AppError("network", 502, "Could not reach GHL to validate credentials");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (res.ok) {
    // deno-lint-ignore no-explicit-any
    const name = (body as any)?.location?.name ?? (body as any)?.data?.location?.name;
    return { ok: true, status: res.status, locationName: name };
  }
  return { ok: false, status: res.status, details: body };
}

function mapGhlFailure(check: LocationCheck): never {
  if (check.status === 401 || check.status === 403) {
    throw new AppError(
      "invalid_token",
      400,
      "GHL rejected the token (check the PIT and its scopes)",
      { ghlStatus: check.status },
    );
  }
  if (check.status === 404 || check.status === 400 || check.status === 422) {
    throw new AppError(
      "invalid_location",
      400,
      "GHL could not find that Location ID for this token",
      { ghlStatus: check.status },
    );
  }
  throw new AppError("ghl", 502, "GHL returned an unexpected error during validation", {
    ghlStatus: check.status,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return preflight();

  try {
    const userId = await requireUserId(req);
    const url = new URL(req.url);
    const isTest = /\/ghl-credentials\/test\/?$/.test(url.pathname);

    if (req.method !== "POST") {
      throw new AppError("validation", 405, "Use POST");
    }

    // ---- POST /test — exercise the full proxy path with stored creds ------
    if (isTest) {
      const creds = await resolveCredentials(userId); // throws 412 credentials_missing
      const check = await checkLocation(creds.pitToken, creds.locationId);
      if (!check.ok) mapGhlFailure(check);
      return new Response(
        JSON.stringify({
          ok: true,
          locationId: creds.locationId,
          locationName: check.locationName ?? null,
          credentialSource: creds.source,
          checkedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- POST / — save or rotate credentials (validate BEFORE saving) -----
    let body: { pitToken?: string; locationId?: string; defaultCalendarId?: string };
    try {
      body = await req.json();
    } catch {
      throw new AppError("validation", 400, "Body must be JSON");
    }
    const pitToken = body.pitToken?.trim();
    const locationId = body.locationId?.trim();
    if (!pitToken || !locationId) {
      throw new AppError("validation", 400, "pitToken and locationId are required");
    }

    const check = await checkLocation(pitToken, locationId);
    if (!check.ok) mapGhlFailure(check);

    const { error: upsertError } = await upsertCredentials(
      userId,
      pitToken,
      locationId,
      body.defaultCalendarId,
    );
    if (upsertError) {
      captureError(new Error(`ghl_credentials upsert failed: ${upsertError.code}`), {
        op: "save",
      });
      throw new AppError("internal", 500, "Failed to save credentials");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        locationId,
        locationName: check.locationName ?? null,
        savedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (err instanceof AppError) return appErrorToResponse(err);
    captureError(err, { fn: "ghl-credentials" });
    return errorResponse("internal", 500, "Unexpected error");
  }
});
