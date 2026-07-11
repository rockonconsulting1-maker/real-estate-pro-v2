Ask AI completed (Milestone 1 — Proxy Foundation
2/9
PIT leaves the browser; every GHL call flows through the Edge Function proxy.

#1GHL-1.1Ask AI (dev sub-account) Dev PIT + scope verification Issue/verify dev PIT with all v1 scopes plus medias, documents/contracts, webhook management. Hand PIT + Location ID to Supabase agent.
#2GHL-1.2Ask AI (dev sub-account) Baseline schema audit Confirm dev snapshot matches docs: 4 custom objects, fields, pipelines, 6 association types. Commit corrections to docs/database/.). see file "MILESTONE_1_REPORT.md". --- Implement (## Milestone 1 — Proxy Foundation ### SB-1.1 ghl-proxy Edge Function — **Contract**
Authenticated pass-through: verify the caller's Supabase JWT, load that user's PIT from ghl_credentials (service-role read), attach it server-side, forward the request to GHL, return the response.
Support all methods/paths the typed service layer uses (see GHL_Integration_Mapping.md); enforce an allowlist of GHL path prefixes.
Central rate limiting per user with 429 backoff; normalized error shape for auth failures vs GHL errors vs network errors.
**Acceptance:** every v1 service-layer call succeeds through the proxy; a request without a valid JWT is rejected; the PIT never appears in any response or log. ### SB-1.2 Proxy auth + credentials hardening
Confirm/extend ghl_credentials so the PIT is write-only from the client's perspective: RLS permits insert/update by owner, no select of the token column by any client role (service-role only).
**Acceptance:** a client-session select cannot read the token; proxy still resolves it. ### SB-1.3 Credentials + test-connection endpoints — **Contract**
Endpoint to save/rotate PIT + Location ID (validates against GHL before saving) and a test-connection endpoint exercising the full proxy path.
**Acceptance:** valid credentials save and verify; invalid ones return a distinguishable error the frontend can map to the credentials banner. ### SB-1.4 Sentry on Edge Functions
Sentry (backend DSN) wired into all Edge Functions with environment + function tagging.
**Acceptance:** a forced proxy error appears in the backend Sentry project, distinguishable from frontend events. --- ---------------------------------- Note I added GHL location id, PIT, base url, and api version into supabase project. see: ( Custom secrets Secrets you have defined for this project Search for a secret Name Digest SHA256 Updated GHL_LOCATION_ID b1d1a843ed4c80384cce49a8b52794bbb08031bd875dad5f5f37afc8fcc45744 09 Jul 2026 03:32:07 (+0000) GHL_PIT 6b1227ba12e354a42d2365fc65a613abcf1429b50e382102d230bb07a3f860e9 09 Jul 2026 03:32:07 (+0000) GHL_BASE_URL 9cd469b83549a8ca4bc66f6270b78b9963ab220651bd3c5aeb48985d0631a9a9 09 Jul 2026 03:32:07 (+0000) GHL_API_VERSION e0d2747b9ab7abb6eb65e0373fa1b428a28bd6d8a2380106dcc080f58005ee14 09 Jul 2026 03:32:07 (+0000) ) --- Also Note: We want to use GHL API version: "v3" )
