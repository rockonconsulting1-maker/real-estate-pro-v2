# Real Estate Pro CRM — v2 (Edge Proxy, Mirror & Webhooks)

> **About these build-plan files:** Everything in `_build_plan/` (this PRD and the per-milestone folders) is a **temporary documentation and guidance artifact** for the v2 build-out of this codebase. These files are not functional — no code, configuration, runtime logic, tests, or deployment process should import, read, reference, or depend on anything in `_build_plan/`. Once the v2 milestones are built and shipped, the entire `_build_plan/` folder is expected to be deleted. Do not treat it as long-living documentation.

## What we're building

Real Estate Pro CRM v2 keeps the same product surface — all 18 modules, desktop and mobile, unchanged in design and feature scope — and replaces the plumbing underneath it. All GoHighLevel (GHL) API access moves behind a Supabase Edge Function proxy so the Private Integration Token (PIT) never reaches the browser. A Supabase Postgres mirror of hot CRM data serves near-instant reads for lists, boards, dashboard, and search, kept fresh in near-real-time by GHL webhooks. Supabase Realtime pushes those changes into open browser sessions so the UI updates live without refresh.

v2 also changes where documents live: the Docs vault moves from Supabase Storage to the **GHL Media Library**, and buyer/seller paperwork (fill and e-sign) is powered by **GHL Documents & Contracts** — the app sends GHL templates to clients and tracks signature status live.

GHL remains the single system of record. All writes go to GHL; the mirror is a read cache that webhooks and a reconciliation pass keep honest.

**Stack:** the existing React 18 + TypeScript (Vite) app — React Router v6, Tailwind + shadcn/ui, TanStack Query v5 (persisted), React Hook Form + Zod — plus, new in v2: Supabase Edge Functions (proxy, webhook receiver, sync), Supabase Postgres with RLS (mirror tables), Supabase Realtime, Supabase scheduled functions (reconciliation), and Sentry for error monitoring on both frontend and Edge Functions. The build is structured as six dependency-ordered milestones; each ends with something testable in the browser.

**This is a brownfield project.** The v1 app is complete and live-data functional in this repo. v1's data-layer discipline (all GHL calls through `src/lib/ghl/client.ts` + typed services; centralized query keys) was designed so that v2 swaps the transport without touching feature code. Existing repo docs remain authoritative for their domains: `design.md` (design system), `GHL_Integration_Mapping.md` (screen → endpoint mapping), `Real Estate Pro CRM — Full Integration Schema.md` + `Entity Breakdown.md` (GHL data schema), `docs/database/` (data dictionary, associations registry, agent DB guide).

---

### What the app does (new in v2)

- Every screen loads near-instantly: lists, kanban boards, the dashboard, and global search read from the app's own Supabase mirror instead of waiting on GHL.
- Changes made anywhere — the GHL UI, automations, another device — appear in the app within seconds via webhooks, and open screens update live without refresh.
- Search and filters run across the *entire* dataset instantly (v1 could only filter loaded pages).
- The agent's PIT is only ever used server-side; it never reaches the browser.
- First-run backfill syncs the user's GHL data with a per-type progress screen; a background reconciliation pass quietly repairs anything webhooks miss.
- Settings shows a sync-status card (health, last-sync per data type) with a force full re-sync control; an unhealthy sync surfaces a subtle indicator in the app shell.
- The Docs vault browses, uploads, previews, and deletes files in the GHL Media Library, organized in per-contact/per-deal folders visible inside GHL itself; existing Supabase Storage files migrate over automatically.
- Agents send GHL document/contract templates to buyers and sellers for fill and e-signature in one step, with stage-aware template suggestions; recipients sign in-browser via GHL's standard signing link.
- Sent-document status (Draft → Sent → Viewed → Completed) shows on the client detail page and dashboard needs-attention area, flipping live when the client signs.
- Open conversations refresh almost immediately on inbound messages via webhook-triggered refetch (no message content is stored in Supabase).

---

### Already provided by the existing codebase (do not re-spec)

- All 18 modules on both surfaces: Dashboard, Leads, Clients, Contacts, My Listings, Offers, Transactions, Properties (MLS), Conversations, Calendar, Tasks, Notes, Docs, Reports, Team, Settings, plus Quick Add/FAB, global search, and notifications.
- Supabase auth (email/password, guards, profiles), the RLS-protected `ghl_credentials` table, and the Settings ▸ Integrations onboarding flow.
- The full typed GHL service layer, token-bucket rate limiter with dedupe and 429 backoff, bootstrap registry (pipelines, schemas, custom fields, association keys, calendars, users, tags), and TanStack Query architecture with persisted cache and staleTime tiers.
- The design system (`design.md`): OKLCH tokens, components, patterns, loading skeletons, empty states, error states.
- Supabase Storage handling for user avatars (retained in v2; documents move out).

---

### Out of scope (v2)

- **Client-facing portal** — a standalone product; v3+ per `Buyer-Seller-Journeys.md`.
- **New CRM features or screens** — v2 changes no feature scope; all 18 modules stay functionally as-is.
- **UI/design changes** — `design.md` stands; the only additions are the sync-status card/indicator, Settings copy updates, and the document-send/status UI specified below.
- **Two-way conflict resolution / offline writes** — GHL is the single system of record; no offline-first write queue or merge logic.
- **Mirroring everything** — conversation/message content, notes bodies, and audit trails are not stored in Supabase; conversations get webhook-triggered refetch only.
- **Multi-sub-account / agency support** — still one user → one GHL sub-account.
- **GHL OAuth 2.0 marketplace app** — the PIT model stays (now server-side only); OAuth conversion is a separate future effort.
- **Native mobile / PWA push notifications** — responsive web only, same as v1.
- **Building or editing document templates in-app** — templates are authored in GHL's Documents & Contracts editor; the app consumes them.
- **Payment collection inside documents**, multi-recipient signing beyond a single send, and unsigned-document reminder automation (GHL workflows can handle reminders).
- **Supabase Storage for documents** — deprecated in v2; retained only for user avatars.

---

### Data model

All data below lives in the app's Supabase Postgres database. GHL remains the system of record for CRM data; mirror tables are fast local copies. Every mirror table follows a shared pattern: the GHL record's ID as the key, the record's fields, the owning user (so row-level security keeps each user's data private), and when it was last synced.

#### Mirror tables (copies of GHL data)

**Contacts mirror**
- Name, email, phone numbers, tags, contact type (lead / buyer / seller), and the key custom fields the app displays (budget, must-haves, temperature, etc.)
- Which user owns this record; when it was last synced from GHL

**Opportunities mirror** (pipeline cards)
- Name, which pipeline and stage it's in, monetary value, status, and the contact it belongs to

**Listings mirror** (`my_listings` custom object)
- Address, price, listing status, and the linked MLS property

**Properties (MLS) mirror**
- MLS number, address, price, beds/baths, days on market

**Offers mirror**
- Offer amount, status, expiry, and the linked contact and property

**Transactions mirror**
- Key dates, amounts, and the linked opportunity

**Tasks mirror**
- Title, due date, completed or not, assignee, linked contact

**Appointments mirror**
- Title, start/end times, which calendar, location, linked contact

**Associations mirror**
- The "X is linked to Y" relationships between the records above (offer↔contact, offer↔property, opportunity↔property, listing↔property, opportunity↔transaction, contact↔company), so linked records load instantly without extra GHL calls

**Documents mirror** (GHL Media Library metadata)
- File name, folder, size, type, the GHL-hosted URL, and any linked contact or deal — the file *content* stays in GHL Media

**Sent-documents mirror** (Documents & Contracts)
- Which template was used, the recipient contact, current status (Draft / Sent / Viewed / Completed), and sent/viewed/signed timestamps

#### Sync bookkeeping tables

**Sync state**
- Per user, per data type: last full sync time, last webhook received, current status (healthy / syncing / error) — powers the Settings sync-status card and app-shell indicator

**Webhook event log**
- Every webhook received: event type, affected record, when it arrived, whether it processed OK or errored — used by the reconciliation pass and Sentry to pinpoint misses; auto-pruned after a retention window

#### Fetched live, not mirrored

- Conversations and message content (proxy + webhook-triggered refetch)
- Notes (live fetch through the proxy)
- Document/contract **templates** (small list fetched live from GHL when the send flow opens)

---

## Milestone 1 — Proxy Foundation

The Edge Function proxy goes live and the PIT leaves the browser. Every module works exactly as before — same screens, same behavior — but every GHL call now travels browser → Supabase Edge Function → GHL. Sentry monitoring comes online for both the app and the Edge Functions.

### What gets built

- All GHL API traffic from every module flows through a Supabase Edge Function proxy that attaches the user's stored PIT server-side; the PIT is never sent to, loaded by, or visible in the browser.
- Every screen in the app behaves identically to v1 — no user-visible feature change anywhere.
- Settings ▸ Integrations updates: the security note now states the token is only ever used server-side; "Test connection" verifies the full proxy path end-to-end; pasting a new PIT (rotation) takes effect immediately.
- If the proxy is unreachable or the stored token is invalid, the user sees the existing v1-style "credentials invalid / connection problem" banner routing to Integrations.
- Sentry captures errors from both the React app and the Edge Function, tagged so proxy failures are distinguishable from app errors.
- Existing v1 users' stored credentials carry over — no re-entry required.

### What milestone 1 explicitly does NOT include

- Any mirror tables, backfill, or Supabase reads — all reads still go live to GHL (through the proxy).
- Webhooks, Realtime, or the sync-status card.
- Any document/media changes — the Docs vault still runs on Supabase Storage in this milestone.
- Multiple tokens or sub-accounts per user; any proxy admin/monitoring UI beyond Sentry.

### Done when

Signing in and using every module works normally with the browser making zero direct calls to GHL (verifiable in the browser's network tab — only Supabase URLs appear), "Test connection" in Settings succeeds through the proxy, and a forced bad-token state shows the credentials banner.

---

## Milestone 2 — Mirror & Backfill

The Supabase mirror comes to life: tables for all mirrored data types, a first-run backfill with a progress screen, and the sync-status card in Settings. After this milestone the mirror is populated and observable, though screens don't read from it yet.

### What gets built

- Mirror tables for contacts, opportunities, listings, properties, offers, transactions, tasks, appointments, and associations — each row private to its owning user.
- First-run backfill: after credentials are saved (or on first v2 login for existing users), a progress screen shows per-type sync progress ("Syncing your contacts… pipeline… listings…"); the app opens once the essentials are in and finishes the rest in the background.
- Large accounts (thousands of contacts) backfill gracefully without timeouts or blowing GHL rate limits.
- Partial-failure handling: if backfill fails partway, the user sees which data types succeeded and a retry button — no starting over from zero.
- The **Sync status card** in Settings: overall health (healthy / syncing / problem), last-sync time per data type, and a "Force full re-sync" button with a confirm step.
- Sync-state bookkeeping recorded per user per data type, powering the card.

### What milestone 2 explicitly does NOT include

- Screens reading from the mirror — the app still reads live through the proxy; the mirror is populated but not yet consumed.
- Webhooks or reconciliation (milestone 3) and Realtime (milestone 4).
- The app-shell sync-health indicator (milestone 4, once the mirror is actually serving reads).
- Documents/media mirroring (milestones 5–6).
- User-configurable sync scopes or schedules; per-type manual sync buttons; a sync-history log screen.

### Done when

A fresh account completes the backfill with visible per-type progress and lands in the app; the Settings sync-status card shows healthy state and per-type last-sync times; "Force full re-sync" re-runs the backfill after confirmation; and the mirror tables contain the account's GHL data (verifiable in Supabase).

---

## Milestone 3 — Webhooks & Live Sync

GHL starts pushing changes. A webhook receiver keeps the mirror fresh within seconds, a scheduled reconciliation pass repairs anything missed, and inbound messages nudge open conversation threads to refetch.

### What gets built

- Webhook subscriptions are registered automatically during onboarding/first sync — the user configures nothing in GHL manually. Only verified, authentic GHL calls are accepted.
- Changes made anywhere (GHL UI, automations, another device) land in the mirror within seconds: contact create/update/delete, opportunity create/update/stage-change/delete, task events, appointment events, and custom-object record events where GHL supports them.
- Inbound-message webhooks trigger a "refresh this thread" nudge: an open conversation updates almost immediately and unread indicators/badge counts update without polling. No message content is stored.
- Every webhook is logged (type, record, outcome); failed events are retried, and the user never sees a broken state — just slightly older data until reconciliation catches it.
- A periodic background reconciliation pass compares mirror freshness against GHL and repairs gaps — covering record types without webhook coverage and any missed events — with no user action or visible interruption.
- Webhook and sync failures report to Sentry with enough context to pinpoint the record and event.

### What milestone 3 explicitly does NOT include

- Screens reading from the mirror (milestone 4) — webhooks keep the mirror fresh, but reads are still live.
- Realtime browser updates (milestone 4) — a webhook updates the database; pushing that to open screens comes next.
- A user-facing webhook event viewer; outbound webhooks to other systems; user-tunable event subscriptions.
- Document status webhooks (milestone 6).

### Done when

Editing a contact or moving a pipeline stage in the GHL UI updates the corresponding mirror row within seconds (verifiable in Supabase); sending an inbound test message refreshes an open conversation thread without manual reload; the webhook event log records the events; and the reconciliation pass demonstrably repairs a manually-broken mirror row.

---

## Milestone 4 — Fast Reads & Realtime

The payoff milestone: screens flip to mirror-backed reads and the app gets fast everywhere, with optimistic writes and live UI updates on both surfaces.

### What gets built

- Lists, kanban boards, the dashboard, and global search read from the mirror — near-instant loads, even first thing in the morning. Search and filters run against the whole dataset, not just loaded pages.
- Smart routing is invisible: non-mirrored data (conversations, notes) and anything needing guaranteed freshness (e.g., opening a record to edit) fetches live through the proxy; detail pages open instantly from mirror data, then silently refresh live.
- Writes are optimistic: the UI updates instantly on save/stage-move/task-check, the write goes to GHL through the proxy, and the mirror confirms via webhook. A rejected write rolls back with the v1 error-toast pattern.
- Open screens update live via Supabase Realtime: a kanban card moves stage, a new lead appears, a task gets checked off on another device — without refresh, on desktop and mobile.
- Live updates are non-disruptive: no reflows under the user mid-action; lists don't reshuffle mid-scroll (a gentle "new items" affordance where appropriate). Notification badge counts update live.
- A subtle "last updated" freshness cue where it matters (e.g., dashboard), per the design system.
- The app-shell sync-health indicator: if sync is unhealthy, a subtle indicator appears in the shell and taps through to the Settings sync-status card.

### What milestone 4 explicitly does NOT include

- Offline mode or queued writes while disconnected.
- A user-visible "force live mode" data-source toggle (force re-sync in Settings is the only control).
- Conflict-resolution UI — last write wins at GHL; the webhook brings back truth.
- Presence features, typing indicators, or OS push notifications.
- Docs/documents work (milestones 5–6).

### Done when

Lists, boards, dashboard, and search visibly load near-instantly from the mirror; a stage change made in the GHL UI appears on an open kanban board within seconds without refresh; an optimistic write shows instantly and survives (or rolls back on a forced rejection); and the same live-update behavior works on the mobile surface.

---

## Milestone 5 — Docs Vault on GHL Media

The Docs module moves to the GHL Media Library, and existing files migrate over from Supabase Storage.

### What gets built

- The Docs vault browses GHL Media folders and files with the same list/grid, preview, download, upload, rename, and delete actions as today — now backed by GHL.
- Uploads go to GHL Media with the 25 MB per-file limit surfaced clearly in the UI; oversized files get a clear "too large" message.
- Files land in an organized folder structure (per-contact / per-deal), so the same files are visible and organized inside GHL itself.
- Documents remain linkable to contacts and deals via the existing `documents_ref` pattern, now referencing GHL file IDs; contact and transaction detail pages still show their attached documents.
- Media file metadata is mirrored (name, folder, size, URL, linked record) so vault browsing and search are instant; the file content itself stays in GHL.
- One-time migration: existing Supabase Storage documents are copied into GHL Media automatically during the v2 transition, with a summary of what moved and a retry for anything that failed. Avatars stay in Supabase Storage.

### What milestone 5 explicitly does NOT include

- In-app file editing or annotation; file version history.
- Keeping Supabase Storage as a parallel or backup document store.
- E-sign/templates (milestone 6).

### Done when

The Docs vault lists the account's GHL Media files near-instantly, uploading a file from the app makes it appear in GHL's Media Library in the right folder, deleting removes it from both, a contact detail page shows its linked documents, and the migration summary reports all legacy files moved (with retry working on a forced failure).

---

## Milestone 6 — Documents & Contracts (e-sign)

Buyer/seller paperwork goes digital end-to-end: send a GHL template for fill and signature in one step, and watch status flip live when the client signs.

### What gets built

- A "Send document" action on client (buyer/seller) detail pages and in the Docs module: a searchable list of the account's GHL document/contract templates, recipient confirmation, and a one-step send.
- Stage-aware suggestions: the send flow suggests the right templates for the client's current pipeline stage, per the buyer/seller journey document mapping.
- The recipient receives GHL's standard email with a secure signing link and fills/signs in-browser — no login, no downloads (GHL handles the signing experience).
- A documents section on the client detail page lists each sent document with status chips (Draft / Sent / Viewed / Completed) and timestamps.
- Pending-signature items surface in the dashboard's needs-attention area, with the design system's countdown treatment where an expiry applies.
- Status flips live via webhook — when a client signs, the agent sees "Completed" within seconds on any open screen.
- Completed/signed documents are viewable and downloadable, appearing alongside the client's other documents in the vault.

### What milestone 6 explicitly does NOT include

- Building or editing templates in-app (authored in GHL's editor).
- Payment collection inside documents.
- Multi-recipient signing flows beyond what a single send supports.
- In-app reminder/nudge automation for unsigned documents (GHL workflows can handle this).

### Done when

An agent can pick a template from the send flow on a client's page (with the client's stage suggesting relevant templates), send it, see the sent document with a "Sent" chip on the client page, and — after signing via the emailed link — see the status flip to "Completed" live, with the signed document accessible from the vault.
