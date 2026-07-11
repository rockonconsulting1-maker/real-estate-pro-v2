// _shared.ts — common helpers for GHL Edge Functions (ghl-proxy, ghl-credentials)
// Rule 2 (TASKS_SUPABASE.md): the PIT and service-role key must never appear in
// responses, logs, error messages, or Sentry events. Nothing in this module logs
// headers, tokens, or request bodies.

import { createClient } from "jsr:@supabase/supabase-js@2";
import * as Sentry from "https://deno.land/x/sentry/index.mjs";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export const GHL_BASE_URL =
  Deno.env.get("GHL_BASE_URL") ?? "https://services.leadconnectorhq.com";
export const GHL_API_VERSION = Deno.env.get("GHL_API_VERSION") ?? "v3";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "development";

// ---------------------------------------------------------------------------
// SB-1.4 — Sentry (backend DSN). No-ops safely when SENTRY_DSN is unset.
// ---------------------------------------------------------------------------

const SENTRY_DSN = Deno.env.get("SENTRY_DSN");

export function initSentry(functionName: string): void {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    defaultIntegrations: false,
    tracesSampleRate: 0,
    // Scrub anything that could carry a secret before it leaves the function.
    beforeSend(event) {
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
        delete event.request.data;
      }
      return event;
    },
  });
  Sentry.setTag("source", "edge-function");
  Sentry.setTag("function", functionName);
  Sentry.setTag("environment", ENVIRONMENT);
  const region = Deno.env.get("SB_REGION");
  if (region) Sentry.setTag("region", region);
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setContext("request", context);
    Sentry.captureException(err);
  });
  const flush = Sentry.flush(2000);
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  if (rt?.waitUntil) rt.waitUntil(flush);
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-ghl-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

export function preflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// ---------------------------------------------------------------------------
// Normalized error shape (SB-1.1 contract)
// { "error": { "type", "status", "message", "details"?, "retryAfter"? } }
// types: "auth" | "credentials_missing" | "forbidden_path" | "validation"
//        | "rate_limited" | "invalid_token" | "invalid_location"
//        | "ghl" | "network" | "internal"
// ---------------------------------------------------------------------------

export type ErrorType =
  | "auth"
  | "credentials_missing"
  | "forbidden_path"
  | "validation"
  | "rate_limited"
  | "invalid_token"
  | "invalid_location"
  | "ghl"
  | "network"
  | "internal";

export function errorResponse(
  type: ErrorType,
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({ error: { type, status, message, ...extra } }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

// ---------------------------------------------------------------------------
// Auth — verify the caller's Supabase JWT and return the user id.
// (The platform also enforces verify_jwt; this resolves the identity.)
// ---------------------------------------------------------------------------

export async function requireUserId(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError("auth", 401, "Missing Authorization bearer token");
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new AppError("auth", 401, "Invalid or expired session");
  }
  return data.user.id;
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function appErrorToResponse(e: AppError): Response {
  return errorResponse(e.type, e.status, e.message, e.extra);
}

// ---------------------------------------------------------------------------
// Credential resolution (service-role read of ghl_credentials).
// Falls back to project secrets GHL_PIT / GHL_LOCATION_ID when the user has
// no row (dev bootstrap). The token never leaves this process.
// ---------------------------------------------------------------------------

export interface GhlCredentials {
  pitToken: string;
  locationId: string;
  source: "user" | "env";
}

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Central per-user rate limit + credential load in ONE service-role RPC.
// public.ghl_proxy_gate enforces a fixed 10s window (90 req default) in
// Postgres, so the limit holds across every Edge Function isolate.
export async function resolveCredentials(userId: string): Promise<GhlCredentials> {
  const { data, error } = await serviceClient
    .rpc("ghl_proxy_gate", { p_user_id: userId })
    .maybeSingle();

  if (error) {
    throw new AppError("internal", 500, "Failed to load integration credentials");
  }
  if (data && data.allowed === false) {
    throw new AppError("rate_limited", 429, "Proxy rate limit exceeded", {
      retryAfter: data.retry_after,
    });
  }
  if (data?.pit_token && data?.location_id) {
    return { pitToken: data.pit_token, locationId: data.location_id, source: "user" };
  }
  const envPit = Deno.env.get("GHL_PIT");
  const envLoc = Deno.env.get("GHL_LOCATION_ID");
  if (envPit && envLoc) {
    return { pitToken: envPit, locationId: envLoc, source: "env" };
  }
  throw new AppError(
    "credentials_missing",
    412,
    "No GHL credentials configured for this user",
  );
}

export function upsertCredentials(
  userId: string,
  pitToken: string,
  locationId: string,
  defaultCalendarId?: string | null,
) {
  return serviceClient.from("ghl_credentials").upsert(
    {
      user_id: userId,
      pit_token: pitToken,
      location_id: locationId,
      ...(defaultCalendarId !== undefined
        ? { default_calendar_id: defaultCalendarId }
        : {}),
      connected: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

// ---------------------------------------------------------------------------
// GHL header builder — the ONLY place the PIT is attached.
// ---------------------------------------------------------------------------

export function ghlHeaders(
  pitToken: string,
  opts?: { contentType?: string | null; versionOverride?: string | null },
): Headers {
  const h = new Headers();
  h.set("Authorization", `Bearer ${pitToken}`);
  h.set("Version", opts?.versionOverride || GHL_API_VERSION);
  h.set("Accept", "application/json");
  if (opts?.contentType) h.set("Content-Type", opts.contentType);
  return h;
}
