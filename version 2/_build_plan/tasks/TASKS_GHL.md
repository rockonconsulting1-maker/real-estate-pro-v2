# TASKS_GHL.md — v2 GHL Database & Configuration Tasks (Ask AI)

**Agent:** Ask AI (has access to the snapshot **dev** sub-account)
**Scope:** All work performed *inside* GHL: verifying plan/API capabilities, custom-object and field configuration, folder conventions, document/contract templates, webhook-coverage verification, and dev test data. No app code — findings and artifacts are handed off to the Supabase agent (`TASKS_SUPABASE.md`) and Vibe AI (`TASKS_FRONTEND.md`) via the deliverables noted per task.
**Source of truth:** `_build_plan/prd.md`, `Real Estate Pro CRM — Full Integration Schema.md`, `Buyer-Seller-Journeys.md`, `docs/database/` (data dictionary + associations registry).

## Rules (apply to every task)

1. All changes happen in the **dev snapshot sub-account** only. Nothing touches production until the milestone it supports has passed its "Done when" checks in dev.
2. Any schema change (custom object, field, association key) must be recorded in the repo docs (`docs/database/` data dictionary / associations registry) as part of the task deliverable — the other agents build from those docs.
3. Where a capability depends on the GHL plan (API access, webhook event types, Documents & Contracts), the deliverable is a written confirmation of exactly what is available, not an assumption.
4. Verify API behaviors against the official docs (https://marketplace.gohighlevel.com/docs/) and by live test in the dev sub-account.

---

## Milestone 1 — Proxy Foundation

### GHL-1.1 Dev PIT + scope verification
- Issue (or verify) a Private Integration Token in the dev sub-account with every scope the app uses (see `GHL_Integration_Mapping.md`) **plus** the new v2 surfaces: medias, documents/contracts (proposals), and webhook management.
- **Deliverable:** the dev PIT + Location ID handed to the Supabase agent for Edge Function secrets; a scope checklist confirming each API family responds.

### GHL-1.2 Baseline schema audit
- Confirm the dev snapshot matches the documented schema: 4 custom objects (`my_listings`, properties, offers, transactions), their fields, contact custom fields, pipelines/stages, and the 6 association types with their keys/IDs.
- **Deliverable:** corrections committed to `docs/database/`; a list of any drift between snapshot and docs.

---

## Milestone 2 — Mirror & Backfill

### GHL-2.1 Dev test dataset at scale
- Seed the dev sub-account with a realistic dataset large enough to exercise backfill paging and rate limits: several thousand contacts, plus proportionate opportunities across all pipelines/stages, custom-object records of all 4 types, associations, tasks, and appointments.
- **Deliverable:** a summary of seeded counts per type so backfill acceptance (SB-2.2) can verify completeness against known totals.

### GHL-2.2 Pagination + rate-limit behavior confirmation
- Confirm by live test: page sizes and cursor behavior for each list/search endpoint the backfill uses (contacts search, opportunities search, custom-object record search, tasks, appointments, associations), and the effective rate-limit headers/thresholds on the dev account.
- **Deliverable:** an endpoint-by-endpoint notes file for the Supabase agent (cursor field names, max page sizes, observed limits).

---

## Milestone 3 — Webhooks & Live Sync

### GHL-3.1 Webhook event coverage matrix
- Determine exactly which webhook event types the plan supports and fire correctly in dev: contact create/update/delete, opportunity create/update/stage-change/delete, task events, appointment events, inbound messages, media events, and document/contract status events.
- For each: confirm the payload shape (IDs present, timestamps, signature header) by capturing real events.
- **Deliverable:** a coverage matrix (event → supported? payload sample) — this decides what SB-3.4 reconciliation must cover.

### GHL-3.2 Custom-object webhook verification
- Specifically verify whether custom-object record create/update/delete events are emitted for the 4 objects, and whether association changes emit any event.
- **Deliverable:** findings appended to the GHL-3.1 matrix; if unsupported, flag those types as reconciliation-only for the Supabase agent.

### GHL-3.3 Signature verification material
- Obtain the webhook signature public key / verification mechanism GHL uses, and produce a captured signed request the Supabase agent can use to test verification (SB-3.1).
- **Deliverable:** the key/mechanism documentation + one captured signed sample event.

### GHL-3.4 Live-sync test protocol
- After SB-3.1/3.2 deploy: run scripted changes in the dev GHL UI (edit contact, move stage, complete task, send inbound test message) and confirm each lands as a webhook.
- **Deliverable:** pass/fail log per event type against the coverage matrix.

---

## Milestone 5 — Docs Vault on GHL Media

### GHL-5.1 Media Library folder conventions
- Design and create the folder structure in dev Media Library for per-contact / per-deal organization (naming convention, root folders, how contact/deal identity is encoded in folder names or paths so files are findable in GHL's own UI).
- Verify folder create/list/rename/delete via API, upload limits (25 MB), and the URL format returned for hosted files (preview/download behavior, expiry if any).
- **Deliverable:** a written folder-convention spec for the Supabase agent (SB-5.1) and Vibe AI (FE-5.1).

### GHL-5.2 `documents_ref` field migration format
- Confirm/update the `documents_ref` custom fields (on contacts and relevant objects) to hold GHL Media file IDs/URLs instead of Supabase Storage paths — field type, length limits, and multi-file format.
- **Deliverable:** the confirmed field format documented in `docs/database/`; dev fields updated.

### GHL-5.3 Media API behavior verification
- Live-test edge cases the migration (SB-5.3) will hit: duplicate filenames, unsupported types, oversized files, deleting a file referenced by a `documents_ref`, and whether media events appear in webhooks (feeds GHL-3.1 matrix).
- **Deliverable:** behavior notes for the Supabase agent.

---

## Milestone 6 — Documents & Contracts (e-sign)

### GHL-6.1 Build the template library
- Create the buyer and seller document/contract templates in the dev sub-account's Documents & Contracts editor, covering the stage-mapped documents in `Buyer-Seller-Journeys.md` §2.2 — with fillable fields (text, date, checkbox) and signature/initial blocks placed per document.
- Verify each template is visible via the list-templates API and sends correctly via the send-template API.
- **Deliverable:** the template set live in dev + a registry (template name → template ID → purpose) for the stage map.

### GHL-6.2 Stage → template mapping
- Produce the machine-readable mapping from pipeline stage (buyer and seller pipelines) to suggested template IDs, per `Buyer-Seller-Journeys.md`.
- **Deliverable:** the mapping file committed to the repo (consumed by FE-6.1 for stage-aware suggestions).

### GHL-6.3 E-sign lifecycle verification
- Run full signing tests in dev: send a template to a test contact, open the signing link, sign, and capture every status transition (Draft → Sent → Viewed → Completed) — confirming which transitions arrive as webhooks vs require polling, and what the completed-document download returns.
- **Deliverable:** lifecycle findings for the Supabase agent (SB-6.2), including webhook payload samples for document status events.

### GHL-6.4 End-to-end acceptance data
- After SB-6.x and FE-6.x deploy: stage dev contacts at various pipeline stages with sent documents in each status, so the milestone 6 "Done when" checks (suggestions, chips, dashboard needs-attention, live status flip) can be verified against known states.
- **Deliverable:** a checklist of staged records and expected app states.
