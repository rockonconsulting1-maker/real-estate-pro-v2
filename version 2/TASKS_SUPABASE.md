# TASKS_SUPABASE.md — v2 Supabase Tasks (Claude AI / Jules)

**Agent:** Claude AI or Jules (Supabase engineer — Edge Functions in Deno/TypeScript, Postgres migrations, RLS, Realtime, scheduled functions)
**Scope:** All server-side work for v2: the GHL proxy, mirror schema, backfill/sync engine, webhook receiver, reconciliation, media proxy + migration, and documents/e-sign endpoints. Frontend consumption is Vibe AI's job (`TASKS_FRONTEND.md`); in-GHL configuration is Ask AI's job (`TASKS_GHL.md`).
**Source of truth:** `_build_plan/prd.md`, `Real Estate Pro CRM — Full Integration Schema.md` + `docs/database/` (GHL field/association shapes), `GHL_Integration_Mapping.md`.

## Rules (apply to every task)

1. GHL is the system of record. Mirror tables are read caches — no server logic may treat the mirror as authoritative for writes.
2. The PIT and the Supabase service-role key exist only in Edge Function secrets. They must never appear in responses, logs, error messages, or Sentry events.
3. Every mirror table: GHL ID as key, owning `user_id`, `synced_at`, RLS policy restricting rows to the owner. Service-role writes only from sync code.
4. All webhook and sync writes are idempotent (upsert keyed on GHL ID; ignore stale events by timestamp/version).
5. Respect GHL rate limits centrally in the proxy (the browser-side limiter is gone); include backoff on 429.
6. Every Edge Function reports errors to Sentry (backend DSN) with event/record context.
7. Migrations via Supabase CLI, committed to the repo; no dashboard-only schema changes.
8. Publish a short endpoint contract (path, auth, request/response shape) in `supabase/edge-functions.md` for every task marked **Contract** — Vibe AI builds against these.

---

## Milestone 1 — Proxy Foundation

### SB-1.1 `ghl-proxy` Edge Function — **Contract**
- Authenticated pass-through: verify the caller's Supabase JWT, load that user's PIT from `ghl_credentials` (service-role read), attach it server-side, forward the request to GHL, return the response.
- Support all methods/paths the typed service layer uses (see `GHL_Integration_Mapping.md`); enforce an allowlist of GHL path prefixes.
- Central rate limiting per user with 429 backoff; normalized error shape for auth failures vs GHL errors vs network errors.
- **Acceptance:** every v1 service-layer call succeeds through the proxy; a request without a valid JWT is rejected; the PIT never appears in any response or log.

### SB-1.2 Proxy auth + credentials hardening
- Confirm/extend `ghl_credentials` so the PIT is write-only from the client's perspective: RLS permits insert/update by owner, no select of the token column by any client role (service-role only).
- **Acceptance:** a client-session select cannot read the token; proxy still resolves it.

### SB-1.3 Credentials + test-connection endpoints — **Contract**
- Endpoint to save/rotate PIT + Location ID (validates against GHL before saving) and a test-connection endpoint exercising the full proxy path.
- **Acceptance:** valid credentials save and verify; invalid ones return a distinguishable error the frontend can map to the credentials banner.

### SB-1.4 Sentry on Edge Functions
- Sentry (backend DSN) wired into all Edge Functions with environment + function tagging.
- **Acceptance:** a forced proxy error appears in the backend Sentry project, distinguishable from frontend events.

---

## Milestone 2 — Mirror & Backfill

### SB-2.1 Mirror schema migrations
- Tables per the PRD data model: `contacts_mirror`, `opportunities_mirror`, `listings_mirror`, `properties_mirror`, `offers_mirror`, `transactions_mirror`, `tasks_mirror`, `appointments_mirror`, `associations_mirror`, plus bookkeeping `sync_state` and `webhook_events` (with retention pruning). Field shapes follow the GHL data dictionary in `docs/database/`.
- Indexes to serve the frontend's list/search/filter patterns; RLS on all tables per Rule 3.
- **Acceptance:** migrations apply cleanly to a fresh project; RLS verified (user A cannot read user B's rows).

### SB-2.2 Backfill engine — **Contract**
- Edge Function(s) that pull a user's full GHL dataset into the mirror: paginated, resumable per data type, chunked to stay within Edge Function and GHL rate limits (self-re-invoking or queue-driven continuation for large accounts).
- Writes per-type progress to `sync_state` (status, counts, last cursor) so the frontend progress screen and status card can read it live.
- Per-type failure isolation: one failed type doesn't roll back others; retry resumes from the last cursor.
- **Acceptance:** a dev account with several thousand contacts backfills completely without timeout; killing it mid-run and retrying resumes rather than restarts.

### SB-2.3 Sync trigger endpoint — **Contract**
- Endpoint to start first-run backfill and to force a full re-sync (drop-and-refill or upsert-sweep per type), guarded against concurrent runs per user.
- **Acceptance:** force re-sync from Settings re-runs backfill exactly once even if triggered twice.

---

## Milestone 3 — Webhooks & Live Sync

### SB-3.1 Webhook receiver Edge Function
- Public endpoint receiving GHL webhooks: verify authenticity (GHL signature/public key), log every event to `webhook_events`, upsert the affected mirror row, update `sync_state.last_webhook_at`.
- Handle: contact create/update/delete, opportunity create/update/stage-change/delete, task events, appointment events, custom-object record events (as available — see GHL-3.2), and document/contract status events (consumed in milestone 6).
- Failed processing → logged with error, retried (queue or scheduled sweep of unprocessed events).
- **Acceptance:** an edit in the GHL dev sub-account updates the mirror row within seconds; a tampered signature is rejected; a forced processing failure is retried to success.

### SB-3.2 Automatic webhook registration
- During onboarding/first sync, register all needed webhook subscriptions against the user's sub-account via API (idempotent — safe to re-run). Coordinate the exact event list with GHL-3.1 findings.
- **Acceptance:** a fresh account gets working webhooks with zero manual GHL configuration.

### SB-3.3 Conversation refetch-nudge channel — **Contract**
- On inbound-message webhooks, emit a "thread updated" nudge (Realtime broadcast or minimal signal table) carrying conversation/contact IDs only — never message content.
- **Acceptance:** an inbound message in the dev sub-account produces a nudge event the frontend can subscribe to; no message body is persisted anywhere in Supabase.

### SB-3.4 Reconciliation scheduled function
- Periodic pass per user: compare mirror freshness against GHL (updated-since queries / count checks), repair drift, and cover record types without webhook coverage. Also prunes `webhook_events` past retention.
- **Acceptance:** manually corrupting a mirror row is repaired by the next reconciliation run; Sentry receives a report only on genuine failures, not routine repairs.

---

## Milestone 4 — Fast Reads & Realtime

### SB-4.1 Read-path verification for the frontend
- Verify client-role (RLS) read performance on all mirror tables for the frontend's list/search/filter patterns; add missing indexes; document the query patterns in `supabase/edge-functions.md`.
- **Acceptance:** representative list/search queries return quickly at dev-account scale under the client role.

### SB-4.2 Enable Realtime on mirror tables
- Enable Supabase Realtime (postgres_changes) on all mirror tables, scoped so users only receive their own rows.
- **Acceptance:** a webhook-driven mirror update produces a Realtime event received only by the owning user's session.

---

## Milestone 5 — Docs Vault on GHL Media

### SB-5.1 Media proxy routes — **Contract**
- Extend the proxy for GHL Media Library operations: list files/folders, upload (multipart, ≤ 25 MB enforced server-side), rename, delete, create folder, and return GHL-hosted URLs for preview/download. Apply the folder conventions from GHL-5.1.
- **Acceptance:** each operation round-trips against the dev sub-account's Media Library.

### SB-5.2 Documents mirror + media webhooks/reconciliation
- `documents_mirror` table (file metadata + linked contact/deal); keep it fresh via media webhook events where GHL provides them, with reconciliation fallback where it doesn't.
- **Acceptance:** uploading a file via GHL's own UI appears in the mirror within the reconciliation window or sooner.

### SB-5.3 Storage → Media migration function — **Contract**
- One-time per-user migration: copy document files from Supabase Storage to GHL Media (into the GHL-5.1 folder structure), update `documents_ref` linkages to GHL file IDs, record per-file status for the frontend summary, support retry of failures only. Avatars excluded. Source files retained until the user's migration reports fully complete.
- **Acceptance:** a dev account with legacy Storage files migrates with an accurate per-file report; a forced mid-run failure retries only the failed files.

---

## Milestone 6 — Documents & Contracts (e-sign)

### SB-6.1 Templates + send proxy routes — **Contract**
- Proxy routes for: list document/contract templates, send a template to a contact (generate + send in one call), fetch a sent document's current state, and download a completed document.
- **Acceptance:** a template send from the dev sub-account produces GHL's signing email to the recipient.

### SB-6.2 Sent-documents mirror + status webhooks
- `sent_documents_mirror` (template, recipient, status, sent/viewed/signed timestamps); consume document/contract status webhooks in the receiver (SB-3.1) so status flips land within seconds; Realtime enabled for live chips.
- Reconciliation fallback polls in-flight documents if webhook coverage is incomplete (per GHL-6.3 findings).
- **Acceptance:** completing a signature in the dev sub-account flips the mirror row to Completed within seconds and emits a Realtime event.
