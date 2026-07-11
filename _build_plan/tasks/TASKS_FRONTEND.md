# TASKS_FRONTEND.md — v2 Frontend Tasks (Vibe AI)

**Agent:** Vibe AI (frontend-only — React 18 + Vite + TypeScript, shadcn/ui, TanStack Query v5, React Router v6)
**Scope:** All browser-side work for v2. No backend execution — every server capability referenced here is delivered by the Supabase agent (see `TASKS_SUPABASE.md`) and consumed via HTTPS.
**Source of truth:** `_build_plan/prd.md` (scope), `design.md` (design system), `GHL_Integration_Mapping.md` (screen → data mapping).

## Rules (apply to every task)

1. No GHL calls from the browser. All data access goes through the Supabase Edge Function proxy or supabase-js reads on mirror tables. `fetch` to `services.leadconnectorhq.com` in browser code is a defect.
2. Never handle, store, or transmit the PIT in browser code beyond the one-time submission to the credentials endpoint in Settings.
3. Preserve v1 patterns: `Skeleton` / `EmptyState` / `ErrorState`, `useOptimisticMutation`, centralized query keys, staleTime tiers. No visual redesign — `design.md` stands.
4. All new env values are `VITE_`-prefixed and safe for the client (Supabase URL, publishable key, Sentry frontend DSN). No secrets.
5. Zero user-visible feature regressions per milestone: all 18 modules must behave as v1 unless a task below changes them.
6. Do not start a task whose **Blocked by** dependency (a Supabase or GHL task ID) is not confirmed done.

---

## Milestone 1 — Proxy Foundation

### FE-1.1 Repoint the GHL client to the Edge Function proxy
- Rewrite `src/lib/ghl/client.ts` transport so `ghlFetch` targets the proxy endpoint (authenticated with the user's Supabase session JWT) instead of GHL directly. Typed services in `src/lib/ghl/services/*` stay unchanged — transport swap only.
- Remove all browser-side PIT retrieval, storage, and header injection. Remove any client-side GHL base-URL/env references.
- Keep the client-side rate limiter as a courtesy throttle or remove it if the proxy enforces limits — follow whichever the proxy contract specifies.
- **Blocked by:** SB-1.1 (proxy deployed), SB-1.2 (proxy auth contract).
- **Acceptance:** every module works as v1; browser network tab shows zero requests to GHL domains; no PIT-related code remains in `src/`.

### FE-1.2 Settings ▸ Integrations updates
- Update security copy: token is only ever used server-side, never sent to the browser.
- Credential submission posts PIT + Location ID to the credentials endpoint (one-way); the form never re-displays a stored token.
- "Test connection" exercises the full proxy path and reports success/failure with the v1 status treatment. PIT rotation (paste new token, save) takes effect immediately.
- **Blocked by:** SB-1.3 (credentials + test-connection endpoints).
- **Acceptance:** new credentials validate end-to-end; a deliberately bad token shows the v1-style credentials banner routing to Integrations.

### FE-1.3 Frontend Sentry
- Initialize Sentry in the app shell with the frontend DSN, environment tagging, and user context (Supabase user id only — no PII beyond what Sentry config allows).
- Wrap the router in the Sentry error boundary; keep the v1 error-state UI as the user-facing fallback.
- **Acceptance:** a thrown test error appears in the frontend Sentry project with route context.

---

## Milestone 2 — Mirror & Backfill

### FE-2.1 First-run backfill progress screen
- New route/screen shown after credential save (and on first v2 login for existing users): per-type progress ("Syncing your contacts… pipeline… listings…") driven by sync-state reads.
- App unlocks when essential types (contacts, opportunities) are in; remaining types continue in the background with a non-blocking indicator.
- Partial-failure state: show which types succeeded, which failed, and a retry button that resumes without restarting completed types.
- **Blocked by:** SB-2.2 (backfill engine + sync-state contract).
- **Acceptance:** fresh account sees live progress and lands in the app; forced partial failure shows per-type results with working retry.

### FE-2.2 Sync status card in Settings
- New Settings card: overall health (healthy / syncing / problem), last-sync time per data type, "Force full re-sync" button with confirm dialog.
- Reads sync-state via supabase-js; re-sync button calls the sync-trigger endpoint.
- **Blocked by:** SB-2.2, SB-2.3 (re-sync trigger).
- **Acceptance:** card reflects real sync state; force re-sync re-runs backfill after confirmation.

---

## Milestone 3 — Webhooks & Live Sync

### FE-3.1 Conversation refetch-nudge wiring
- Subscribe (Supabase Realtime channel or lightweight signal table — per SB-3.3 contract) to "thread updated" nudges; on nudge, invalidate the affected conversation query keys so open threads refetch, and refresh unread/badge counts.
- No message content is ever read from or written to Supabase.
- **Blocked by:** SB-3.3 (nudge channel contract).
- **Acceptance:** an inbound test message updates an open thread and badge counts within seconds, without polling loops in frontend code.

---

## Milestone 4 — Fast Reads & Realtime

### FE-4.1 Mirror-read data layer
- Add a mirror read path (supabase-js queries with typed row mappers to the existing GHL types) and route reads per the smart-routing matrix: lists, kanban, dashboard, and global search → mirror; conversations, notes, and open-record-for-edit freshness → live proxy.
- Detail pages hydrate instantly from mirror data, then silently revalidate live.
- Global search and all list filters query the mirror across the full dataset (not loaded pages).
- **Blocked by:** SB-4.1 (RLS-verified read access), Milestones 2–3 complete.
- **Acceptance:** lists/boards/dashboard/search load near-instantly; filters match records beyond the first page; edits still read fresh data.

### FE-4.2 Optimistic writes with webhook confirmation
- Keep `useOptimisticMutation` UX: instant UI update on save/stage-move/task-check → write to GHL via proxy → mirror confirms via webhook/Realtime. Rejected writes roll back with the v1 error-toast pattern.
- Guard against double-application when the confirming webhook lands (idempotent cache updates keyed by record id + updatedAt).
- **Acceptance:** a stage move is instant, survives webhook confirmation without flicker, and rolls back cleanly on a forced rejection.

### FE-4.3 Realtime UI updates
- Subscribe to mirror-table changes (scoped to the signed-in user) and update TanStack Query caches in place: kanban cards move, list rows appear/update, tasks check off, document statuses flip — desktop and mobile.
- Non-disruptive rules: never reshuffle a list under an active scroll or mid-edit; use a "new items" affordance where insertion would be jarring. Badge counts update live.
- Add the "last updated" freshness cue on the dashboard per the design system.
- **Blocked by:** SB-4.2 (Realtime enabled on mirror tables).
- **Acceptance:** a change made in the GHL UI appears on an open board within seconds without refresh, on both surfaces, without layout jank.

### FE-4.4 App-shell sync-health indicator
- Subtle indicator in the shell (desktop sidebar + mobile header, per design system) when sync state is unhealthy; tapping routes to the Settings sync-status card. Hidden when healthy.
- **Acceptance:** forcing an error sync-state shows the indicator; resolving hides it.

---

## Milestone 5 — Docs Vault on GHL Media

### FE-5.1 Docs vault on GHL Media
- Rebuild the Docs module data layer on the media endpoints (via proxy): folder tree + file browsing from the documents mirror (instant), upload / rename / delete / download through the proxy.
- Surface the 25 MB per-file limit before upload; clear "too large" error state.
- Preserve the v1 vault UI (list/grid, preview, actions) — data source change, not redesign.
- **Blocked by:** SB-5.1 (media proxy routes), SB-5.2 (documents mirror), GHL-5.1 (folder conventions).
- **Acceptance:** vault lists GHL Media instantly; an upload appears in GHL's Media Library in the right folder; delete removes it from both.

### FE-5.2 Document links on record pages
- Contact and transaction detail pages list attached documents from the mirror using the `documents_ref` → GHL file ID linkage; attach/detach flows call the proxy.
- **Blocked by:** GHL-5.2 (`documents_ref` field format confirmed).
- **Acceptance:** attaching a file from a contact page shows it on that contact and in the correct GHL folder.

### FE-5.3 Migration summary UI
- One-time transition surface: shows counts of migrated files, any failures with retry, and completes into the normal vault. Avatars are untouched.
- **Blocked by:** SB-5.3 (migration function + status contract).
- **Acceptance:** migration summary reports accurately; retry recovers a forced failure.

---

## Milestone 6 — Documents & Contracts (e-sign)

### FE-6.1 Send-document flow
- "Send document" action on client (buyer/seller) detail pages and in the Docs module: searchable template list (fetched live via proxy), recipient confirmation, one-step send.
- Stage-aware suggestions: surface templates mapped to the client's current pipeline stage first (mapping per `Buyer-Seller-Journeys.md`, delivered as config by GHL-6.2).
- **Blocked by:** SB-6.1 (templates + send proxy routes), GHL-6.1 (templates exist in dev), GHL-6.2 (stage→template map).
- **Acceptance:** an agent can pick a suggested template on a client page and send it in one step; the recipient receives GHL's signing email.

### FE-6.2 Status tracking UI
- Documents section on client detail pages: each sent document with status chips (Draft / Sent / Viewed / Completed) and timestamps, reading the sent-documents mirror; statuses flip live via Realtime.
- Dashboard needs-attention area lists pending signatures, with the design system's countdown treatment where an expiry applies.
- Completed documents are viewable/downloadable and appear alongside the client's other vault documents.
- **Blocked by:** SB-6.2 (sent-documents mirror + status webhooks).
- **Acceptance:** signing via the emailed link flips the chip to "Completed" within seconds on an open client page; the signed file is accessible from the vault.
