# Milestone 1 — Proxy Foundation — Log

> Source records for this log live in `./handoff/` (GHL/Ask-AI reports and the
> Supabase build progress notes). The canonical acceptance report is
> `docs/reports/MILESTONE_1_REPORT.md`.

## What's new in the app

- Nothing changes for the user yet — every screen behaves exactly as in v1. What
  changed is underneath: the groundwork for routing all GoHighLevel traffic through
  a secure server-side proxy is now built and deployed.
- The agent's Private Integration Token (PIT) can now be handled entirely
  server-side. Once the frontend is repointed (FE-1.1, not part of this milestone),
  the token will never reach the browser.
- "Save credentials" and "Test connection" now have server endpoints that validate
  the PIT + Location ID against GHL *before* saving, so a bad token is caught up front.

## What was built (deployed to `xdenkkphnhjjpdirvsii`, verified against the live GHL dev sub-account)

- **`supabase/functions/ghl-proxy/`** — authenticated pass-through. Verifies the
  caller's Supabase JWT, loads that user's PIT via a service-role RPC, attaches it,
  forwards to GHL, and returns the response. Path allowlist, per-user rate limiting,
  GHL 429 backoff, and a normalized error shape.
- **`supabase/functions/ghl-credentials/`** — `POST /` (save/rotate, validates against
  `GET /locations/{id}` before saving) and `POST /test` (exercises the full proxy path
  with stored creds). Returns distinguishable errors the frontend maps to the
  credentials banner.
- **`supabase/migrations/0007_ghl_credentials_pit_write_only.sql`** — `pit_token`
  becomes write-only for client roles (column-level SELECT revoked; service-role only).
- **`supabase/migrations/0008_ghl_proxy_rate_gate.sql`** — `public.ghl_proxy_rate`
  table + `public.ghl_proxy_gate()` RPC: one service-role call enforces a fixed
  90-req/10s window **and** returns the PIT, so the proxy makes a single DB roundtrip.
- **`supabase/edge-functions.md`** — the published endpoint contract for the frontend.
- Sentry is wired into both functions (`initSentry`) with a `beforeSend` scrubber;
  it no-ops until `SENTRY_DSN` is set (see Pending below).

## Decisions made during implementation (not pre-specified)

- **Rate limiting moved to Postgres.** An in-memory limiter can't hold across Edge
  Function isolates, so "central" would have been a lie. `ghl_proxy_gate()` enforces
  the window in Postgres and returns the PIT in the same call (zero extra roundtrips).
  A cheap per-isolate throttle remains in `ghl-proxy/index.ts` as a first-line guard.
- **GHL API version `v3`** is sent on every call (`GHL_API_VERSION` secret), with a
  per-request `x-ghl-version` override for any endpoint still on `2021-07-28`.
- **Dev fallback:** when a user has no `ghl_credentials` row, the proxy falls back to
  the `GHL_PIT` / `GHL_LOCATION_ID` project secrets. `credentialSource` on `/test`
  reports `user` vs `env`.
- **Schema fix committed here:** the `connected` column the functions write was never
  in migration `0001`; `0007` now adds it (`add column if not exists`) before granting
  on it, so the repo migration history is self-consistent.

## Deviations from the PRD

- None functional. Numbering: the Milestone 1 staging files were `0002_sb_1_2` /
  `0003_sb_1_1`; they are committed to the repo as `0007` / `0008` to avoid colliding
  with the existing `0002`–`0006` migrations.

## What the next milestone needs to know

- The frontend is **not** yet repointed — `src/lib/ghl/client.ts` still calls GHL
  directly with a browser PIT and `Version: 2021-07-28`. FE-1.1 (repoint to the proxy)
  is the remaining Milestone 1 frontend task and a prerequisite for the "browser makes
  zero direct GHL calls" acceptance check.
- Endpoint contract to build against: `supabase/edge-functions.md`.
- GHL registry handed off (see `handoff/GHL_milestone_1_report.md`): 4 custom objects,
  3 pipelines (27 stages), 24 associations, and the 21-field `real_estate_offer` map.

## Pending / blocking before Milestone 2

- **Sentry DSN:** add `SENTRY_DSN` (backend project) + optional `ENVIRONMENT` to project
  secrets, then force an error to confirm it lands tagged `source=edge-function`.
- **Schema drift (from the GHL audit):** contact temperature field key/type (D-01/D-02)
  and the `my_listings` field check (D-08) — see `handoff/GHL_milestone_1_report.md`.
