# TASKS.md — Remediation Plan (Dev Agent Instructions)

**Generated:** 2026-07-06 from the full-repo review; **updated same day** with the deep-pass findings (`REVIEW_REPORT.md` §9).
**Supersedes:** the original master build checklist (preserved in git history at commit `34078cb`).

**Context:** The app builds and typechecks, but the GHL service layer has wrong API endpoints (custom objects, custom fields/tags, message send, calendar appointments, users), a bootstrap race condition, ~10 features claimed done but missing, 338 lint errors, and repo-hygiene problems. Work the tasks in order — Workstream A and B unblock everything else.

## Rules for the Dev Agent (apply to every task)

1. **Verify endpoints against GHL API 2.0 docs** (https://marketplace.gohighlevel.com/docs/) before changing them; the paths below are from the docs and the original spec, but confirm the `Version` header and body shape per endpoint.
2. All GHL calls stay inside `src/lib/ghl/services/*` via `ghlFetch` — never `fetch` in components.
3. After each task: `bun run typecheck && bun run lint && bunx vitest run && bun run build` must pass (lint may still fail globally until D1 lands; do not add *new* errors).
4. Add/extend a vitest test when a task touches pure logic (services, registry, helpers).
5. Preserve existing loading/empty/error state patterns (`Skeleton`, `EmptyState`, `ErrorState`).
6. Commit per task with message `fix(<area>): <task-id> <summary>`.

Definition of Done per task = code change + acceptance criteria met + toolchain green + committed.

---

# WORKSTREAM A — GHL API corrections (CRITICAL — app is non-functional against live data without these)

## A1. Fix Custom Objects endpoints and schema keys
**File:** `src/lib/ghl/services/objects.ts`
**Problem:** Uses `POST /custom-objects/{key}/records/search` with bare keys (`my_listings`). Real API: `POST /objects/{schemaKey}/records/search` with fully-qualified keys (`custom_objects.my_listings`).
**Instructions:**
1. Change all five methods in `objectsService` from `/custom-objects/...` to `/objects/...`.
2. Add a constant map at top of file: `export const OBJECT_KEYS = { listings: 'custom_objects.my_listings', properties: 'custom_objects.properties', offers: 'custom_objects.real_estate_offer' } as const;` and use it in the three thin wrappers (`myListingsService`, `mlsPropertiesService`, `offersService`).
3. In `searchRecords`, rename body field `limit` → `pageLimit` and add `page` support; keep `searchAfter` cursor support. Confirm exact body shape in docs ("Search Object Records").
4. Grep the codebase for **every** caller passing keys directly to `objectsService.searchRecords(...)` and switch them to the wrappers/`OBJECT_KEYS`. Known inconsistent call sites: `src/components/shared/global-search.tsx:69` (bare `'properties'`) and `src/features/reports/desktop-view.tsx` + `mobile-view.tsx` (already-prefixed `'custom_objects.my_listings'`) — today these two conventions contradict each other, so one is always broken.
**Acceptance:** All listings/MLS/offers queries hit `/objects/custom_objects.*` paths; no string-literal object keys remain outside `OBJECT_KEYS`; add a unit test asserting the built path/body for `searchRecords`.

## A2. Fix custom fields / custom values / tags / medias endpoints
**File:** `src/lib/ghl/services/misc.ts`
**Problem:** `/custom-fields/`, `/custom-values/`, `/tags/`, `/medias/` are not valid GHL endpoints.
**Instructions:**
1. `customFieldsService.list` → `GET /locations/{locationId}/customFields` (response key `customFields`). If object-scoped fields are needed for custom objects, also add `getByObjectKey(objectKey)` → `GET /custom-fields/object-key/{objectKey}?locationId=...` (verify in docs).
2. `customValuesService.list` → `GET /locations/{locationId}/customValues` (response key `customValues`).
3. `tagsService.list` → `GET /locations/{locationId}/tags` (response key `tags`).
4. `mediasService.list` → `GET /medias/files` with `query: { locationId, ... }` (verify param name, possibly `altId`/`altType`).
**Acceptance:** bootstrap fields/tags resolve (no silent rejection); tag-driven filters (temperature, `type:*`) receive real definitions.

## A3. Fix conversations message send, channel types, and mark-read
**Files:** `src/lib/ghl/services/conversations.ts`, `src/features/conversations/components/thread-view.tsx`
**Problem:** Send posts to read-only `POST /conversations/{id}/messages` with numeric `type`; `PUT /conversations/{id}/read` doesn't exist.
**Instructions:**
1. `sendMessage` → `POST /conversations/messages` with body per docs: `{ type: 'SMS' | 'Email' | 'WhatsApp' | 'IG' | 'FB' | 'Live_Chat', contactId, message }` for SMS-like channels; for Email include `html` (or `message`), `subject`, and `emailFrom` if required. Signature: `sendMessage(data: SendMessagePayload)` — it no longer needs `conversationId`, it needs `contactId`.
2. In `thread-view.tsx`, replace numeric channel state (`1/2/4`) with a string union `'SMS' | 'Email' | 'WhatsApp'`; pass `contactId` (already derived at line ~56) into the mutation; keep optimistic bubble logic.
3. `markRead` → `PUT /conversations/{conversationId}` with `{ unreadCount: 0 }` (verify field name in "Update Conversation" docs).
4. Add "Log Call" action support (`type: 'Call'` inbound/outbound per docs) — it was claimed in the original 10.2 task.
**Acceptance:** SMS and Email send succeed against a live sub-account (or, without live creds, payload matches docs and a unit test asserts endpoint+body); mark-read clears unread badge.

## A4. Fix calendar appointment endpoints and events query params
**File:** `src/lib/ghl/services/calendars.ts`
**Instructions:**
1. `createAppointment` → `POST /calendars/events/appointments`.
2. `getAppointment`/`updateAppointment`/`deleteAppointment` → `/calendars/events/appointments/{eventId}` (DELETE may be `/calendars/events/{eventId}` — verify in docs).
3. `eventsByRange`: `GET /calendars/events` requires `locationId`, `startTime`, `endTime` **in epoch milliseconds**, plus one of `userId` | `calendarId` | `groupId`. Change signature to accept `{ start: Date; end: Date; calendarId?: string; userId?: string }`, convert to millis, and require a calendarId/userId (thread the user's default calendar from `ghl_credentials.default_calendar_id`, falling back to iterating bootstrap calendars).
4. Update all callers (calendar views, dashboard next-up widget, contact appointments tabs) for the new signature.
**Acceptance:** calendar week/day/month views and event modals build correct requests; unit test asserts millis conversion and required params.

## A5. Fix users list endpoint for sub-account PIT
**File:** `src/lib/ghl/services/users.ts`
**Instructions:** Replace `GET /users/search?locationId=...` (requires agency `companyId`) with `GET /users/` + `query: { locationId }`. Keep `get(id)`. Verify response key (`users`).
**Acceptance:** Team directory and assigned-to dropdowns populate with a location-scoped PIT.

## A6. Contacts: server-side tag filtering + pagination correctness
**File:** `src/lib/ghl/services/contacts.ts` (+ callers in `src/features/contacts/*`)
**Problem:** Tag filter is applied client-side to the current page only — silently drops matches; role filter values in `desktop-view.tsx`/`mobile-view.tsx` (`'Vendor'`, `'SOI'`) don't match the `type:*` tag taxonomy.
**Instructions:**
1. Migrate `search()` to `POST /contacts/search` with proper `filters` (tag filter group) and `searchAfter` pagination per docs; remove the client-side tag filter.
2. Update `ROLE_FILTERS` in both contact views to the real taxonomy (`type:vendor`, `type:soi`, `type:re-agent`, `type:team`, `lifecycle:past-client`, `lifecycle:lead`, `lifecycle:client`) — confirm actual tags used in the sub-account; keep labels human-readable.
**Acceptance:** filtering by role returns matches beyond page 1; no client-side tag filtering remains.

## A7. Opportunities search params hygiene
**File:** `src/lib/ghl/services/opportunities.ts`
**Instructions:** The `search()` spread `{ locationId, ...params }` sends `filters` objects into the query string (`[object Object]`). Whitelist the documented `GET /opportunities/search` params: `q`, `pipeline_id`, `pipeline_stage_id`, `assigned_to`, `contact_id`, `status`, `date`, `limit`, `page`, `location_id` (verify snake_case vs camelCase in docs — the API uses `location_id` style for this endpoint). Map the service's camelCase inputs to the documented param names explicitly. Remove the `filters?: any` param or implement it properly.
**Acceptance:** built query string contains only documented params; unit test covers mapping.

## A8. Fix dashboard KPI queries (filters arrays are silently discarded)
**Files:** `src/features/dashboard/widgets/kpi-grid.tsx` (+ mobile dashboard equivalents), `src/features/dashboard/widgets/new-leads.tsx`, `needs-attention.tsx`, `pending-offers.tsx`
**Problem (REVIEW_REPORT §9 S6):** widgets pass `filters: [{ field: 'status', operator: 'eq', value: 'open' }]`-style arrays to `opportunitiesService.search`, which serializes them into the GET query string as `[object Object]`. Every KPI count (Active Leads, Active Clients, New Leads 7d, Under Contract base query) is unfiltered or rejected.
**Instructions:**
1. After A7 lands, rewrite each widget query using the documented params (`status: 'open'`, `pipeline_id`, `date`), not filter arrays.
2. "New Leads this week": the GET endpoint has no `createdAt >= X` param — either use the `date` param if it supports ranges (verify docs) or fetch page 1 sorted by created date and count client-side with an explicit "approximate" note.
3. Offers KPIs (`offersService.search({ filters })`) go through the objects **POST** search — verify the documented filter body shape for object records search and use it (or filter client-side on fetched pages, documented as approximation).
4. "Under Contract" KPI: replace the `pos >= 3` heuristic with the C11 stage-resolution helper.
**Acceptance:** each KPI issues a request with only documented params and returns a correct count against seeded test data; no `filters` array reaches a GET query string anywhere (add a lint-style unit test on the service).

---

# WORKSTREAM B — Bootstrap & credentials lifecycle (CRITICAL)

## B1. Fix bootstrap race (credentials set after bootstrap fires)
**Files:** `src/app/layout.tsx`, `src/hooks/use-ghl-credentials.ts`, `src/hooks/use-bootstrap.ts`, `src/lib/ghl/client.ts`
**Problem:** `useBootstrap` is enabled the same render credentials arrive, but `setGhlCredentials` runs in a later effect → first bootstrap runs with null PIT, `allSettled` swallows the failures, and empty results are cached for 24h (empty `PipelineRegistry`, blank app).
**Instructions:**
1. Move credential injection into the data path: in `useGhlCredentials`'s `queryFn`, call `setGhlCredentials(data.pit_token, data.location_id)` before returning (and `setGhlCredentials(null, null)` when no row). Keep the layout effect as a safety net or remove it.
2. In `useBootstrap`, gate on module-level credentials too: `enabled: isConfigured && !!getGhlCredentials().pit`.
3. Make bootstrap failure loud: if **all** six sub-fetches reject, throw so the query errors (splash can show retry); keep `isPartial` for partial failures.
4. On sign-out (`auth-provider`), call `setGhlCredentials(null, null)` and `queryClient.clear()`.
**Acceptance:** cold sign-in on a fresh profile never fires GHL calls without a PIT; a manual test (mock `getGhlCredentials`) proves ordering; full-failure bootstrap shows an error/retry instead of an empty app.

## B2. Surface `isPartial` bootstrap state
**Files:** `src/app/layout.tsx`, `src/hooks/use-bootstrap.ts`
**Instructions:** When `data.isPartial` is true, render a dismissible warning banner in the shell ("Some workspace data failed to load — Retry") that calls `refetch()`. List which groups failed (extend the hook to return `failed: string[]`).
**Acceptance:** killing one endpoint (e.g. wrong tags path pre-A2) yields a visible banner with working retry, not a silent empty state.

## B3. Improve 401 handling (no hard redirect)
**Files:** `src/lib/ghl/client.ts`, `src/app/layout.tsx`
**Instructions:** Replace `window.location.href = '/settings/integrations'` with: sonner toast ("GHL credentials invalid — update in Settings ▸ Integrations" with action button) + `react-router` `navigate()` only when the user confirms, and debounce the event so N parallel 401s produce one toast. Remove the unused `toast` import in `client.ts` or use it here.
**Acceptance:** a 401 shows one toast, no full page reload, in-progress SPA state preserved.

## B4. Implement documented `VITE_GHL_*` dev fallbacks (or remove them)
**Files:** `src/hooks/use-ghl-credentials.ts`, `.env.example`, `README.md`
**Instructions:** `.env.example`/README document `VITE_GHL_PIT`/`VITE_GHL_LOCATION_ID` dev fallbacks but nothing reads them. In `useGhlCredentials`, when Supabase has no row **and** `import.meta.env.DEV` and both vars are set, return the env credentials (never in production builds). Otherwise delete the vars from `.env.example` and README.
**Acceptance:** behavior matches documentation; production build ignores env fallbacks.

## B5. Honor the `?next=` redirect after sign-in
**Files:** `src/features/auth/sign-in.tsx` (line ~47), optionally `sign-up.tsx`/`confirm.tsx`
**Problem (REVIEW_REPORT §9 S3):** `ProtectedRoute` redirects to `/auth/sign-in?next=<intended path>`, but sign-in hardcodes `navigate('/')` — the preserved path is dropped.
**Instructions:** Read `next` via `useSearchParams`; after successful sign-in, `navigate(next, { replace: true })` when `next` is a **same-origin relative path starting with `/`** (reject `//`, absolute URLs, and `/auth/*` to prevent open-redirect/loops); fall back to `/`. Apply the same logic to the post-email-confirm redirect if applicable.
**Acceptance:** visiting `/offers/123` signed-out → sign-in → lands on `/offers/123`; malicious `?next=https://evil.example` falls back to `/`.

---

# WORKSTREAM C — Features claimed done but missing (restore parity with original checklist)

## C1. Contacts directory polish (original Phase 5.1 — was honestly unchecked)
**Files:** `src/features/contacts/desktop-view.tsx`, `mobile-view.tsx`
**Instructions:** Add alpha-group section headers in the sorted-by-name list and a right-edge A–Z index scrubber on mobile (tap/drag scrolls the virtualized list via `scrollToIndex`). Keep quick call/text buttons per row on mobile (verify they exist; add `tel:`/`sms:` links if not).
**Acceptance:** name-sorted list shows letter groups; scrubber jumps correctly; 44px touch targets.

## C2. Conversations composer: attachments + templates
**Files:** `src/features/conversations/components/thread-view.tsx`, `src/lib/ghl/services/misc.ts` (medias), new `src/lib/ghl/services/templates.ts` if needed
**Instructions:**
1. Attachments: file picker → upload via medias API (`POST /medias/upload-file`, multipart — note `ghlFetch` JSON-encodes bodies; add a `rawBody` option or a dedicated upload helper) → include returned URL(s) in send payload `attachments: string[]`.
2. Templates: load SMS/Email templates (`GET /locations/{locationId}/templates` — verify endpoint) into a dropdown; inserting a template merges custom values via `customValuesService`.
**Acceptance:** send with an attachment succeeds (payload verified against docs); templates dropdown inserts body text.

## C3. Desktop calendar drag-to-reschedule
**File:** `src/features/calendar/desktop-view.tsx`
**Instructions:** On the week/day time grid, make event blocks draggable vertically/horizontally (reuse `@dnd-kit/core`); on drop, compute new start/end, optimistic cache update, `calendarsService.updateAppointment` (post-A4 path), rollback + toast on error. Keep the existing mobile sheet-based reschedule.
**Acceptance:** dragging an event updates its time optimistically and persists; failed update rolls back.

## C4. Tasks desktop bulk-edit + mini-calendar scheduler
**File:** `src/features/tasks/desktop-view.tsx` (+ `task-modals.tsx`)
**Instructions:**
1. Add a table-view toggle with row checkboxes; selection toolbar: Complete, Reschedule (date picker applies to all), Delete (confirm dialog). Batch via `Promise.allSettled` over `tasksGlobalService.update/delete`, one summary toast.
2. Add the "today mini-calendar scheduler" panel: unscheduled/today tasks draggable onto hour slots → sets `dueDate`.
**Acceptance:** multi-select bulk actions work with optimistic updates; drag onto a slot sets the due time.

## C5. Kanban drag-and-drop accessibility (ARIA)
**Files:** `src/features/leads/components/kanban-board.tsx`, `src/features/clients/components/kanban-board.tsx`, `src/features/listings/*` board if present
**Instructions:** Use dnd-kit's accessibility props: `announcements` for screen readers, `aria-roledescription="sortable"` on cards, `role="list"`/`aria-label` per lane, keyboard sensor (`KeyboardSensor`) so cards can be moved with arrow keys.
**Acceptance:** axe/devtools shows labeled lanes/cards; keyboard-only stage move works.

## C6. Route/row hover prefetch
**Files:** `src/components/desktop/shell.tsx` (nav items), list views (`leads`, `clients`, `contacts`), `src/hooks/use-query-helpers.ts`
**Instructions:** Implement the claimed prefetch: on desktop nav-item `onMouseEnter`, `queryClient.prefetchQuery` the module's page-1 list; on list-row hover, prefetch the detail query (helpers already exist — wire them). Also seed detail caches from list results (`setQueryData` per record) in the main list hooks.
**Acceptance:** hovering a nav item fires the page-1 fetch (visible in devtools); opening a hovered row renders instantly from cache.

## C7. Bootstrap custom-object schemas
**Files:** `src/hooks/use-bootstrap.ts`, `src/lib/ghl/services/objects.ts`
**Instructions:** Add `getSchema(objectKey)` → `GET /objects/{key}` (verify path) and fetch the 3 schemas in the bootstrap parallel batch (`ghl.schemas()` key, 24h stale). Expose via bootstrap result for field editors.
**Acceptance:** bootstrap loads 3 schemas; listing/offer field editors can read field definitions.

## C8. Account deletion flow (or de-scope honestly)
**Files:** `src/features/settings/components/data-tab.tsx`, `supabase/` (new edge function)
**Instructions:** Preferred: add a Supabase Edge Function `delete-account` (service-role `auth.admin.deleteUser`, verifies JWT of caller, cascades via existing FKs), call it from the confirm dialog, then sign out. If edge functions are out of scope for v1, replace the fake flow with honest UI copy and remove the claim.
**Acceptance:** either a working delete (user removed, rows cascaded, signed out) or truthful UI + doc note.

## C9. Fix `react-hooks/exhaustive-deps` churn in thread view
**File:** `src/features/conversations/components/thread-view.tsx` (line ~47)
**Instructions:** Wrap the `messages` derivation in `useMemo` as the lint warning says; verify the scroll-to-bottom effect doesn't refire on every 15s poll unless messages actually changed (compare last message id).
**Acceptance:** warning gone; no scroll jump on idle polls.

## C10. Reports: paginate the source data and fix date semantics
**Files:** `src/features/reports/desktop-view.tsx`, `mobile-view.tsx`
**Problem (REVIEW_REPORT §9 S5):** all analytics (GCI, deal volume, funnel, source attribution, avg DOM) are computed from a single page of 100 opportunities/contacts/listings — silently wrong beyond 100 records. GCI/volume also bucket won deals by `createdAt` instead of close date.
**Instructions:**
1. Add a `fetchAllPages(fetchPage, { maxPages: 10 })` helper (respects the rate limiter; stops at cursor end or cap) and use it for the three report sources; surface a "showing first N records" notice if the cap is hit.
2. Base GCI and deal-volume-by-month on the won date — use `lastStatusChangeAt`/`updatedAt` if the API exposes it (verify field in docs), else document `updatedAt` as the approximation.
3. Cache the aggregated result under a dedicated query key (`['reports', dateRange]`, staleTime ≥ 5 min).
**Acceptance:** with >100 seeded records, totals reflect all pages; changing date range re-buckets by close-date basis; page cap notice renders when applicable.

## C11. Resolve "Under Contract" by stage name, not position ≥ 3
**Files:** `src/lib/pipeline-registry.ts`, `src/features/transactions/desktop-view.tsx` (+ mobile), `src/features/dashboard/widgets/kpi-grid.tsx`
**Problem (REVIEW_REPORT §9 S8):** transactions and the Under Contract KPI treat stage position ≥ 3 as under-contract; with 10-stage Buyer / 9-stage Seller pipelines that misclassifies active-search clients as transactions.
**Instructions:** Add `Registry.underContractPosition(pipelineId): number` that finds the first stage whose name matches /under contract|conditional|firm|pending|clos/i and returns its position (fallback: `stages.length - 3`, logged). Replace all `pos >= 3` heuristics with `pos >= underContractPosition(o.pipelineId)`. Unit-test with realistic stage lists.
**Acceptance:** transactions list contains only at/after-under-contract opportunities for both pipelines; heuristic covered by tests.

## C12. Settings ▸ Display: add the claimed density control (or de-scope)
**File:** `src/features/settings/components/display-tab.tsx`
**Instructions:** Theme, default landing page, and calendar-view selects exist; **density** (comfortable/compact) does not. Either implement it (persist in `profiles.preferences`, toggle a `data-density` attribute consumed by row-height/padding tokens) or remove the claim from docs. Implementing is preferred — lists are the core surface of this app.
**Acceptance:** density switch visibly tightens list/table row heights app-wide and persists across sessions.

---

# WORKSTREAM D — Code quality, lint, tests

## D1. Eliminate the 338 lint errors (typed service layer)
**Files:** `src/lib/ghl/**`, `src/lib/queryKeys.ts`, `src/types/ghl.ts`, feature files listed by `bun run lint`
**Instructions:**
1. Replace `ghlFetch<any>` with typed response interfaces inferred from the existing Zod schemas in `src/types/ghl.ts` (add missing schemas: association key/relation, custom field, tag, media file, meta/pagination).
2. `queryKeys.ts`: type `params` as `Record<string, unknown> | undefined` or specific param interfaces.
3. For genuinely dynamic GHL payloads use `unknown` + Zod parse, not `any`.
4. Fix the 4 warnings (3 fast-refresh mixed exports → move constants to separate files; 1 exhaustive-deps → C9).
5. `src/pages/GhlSmoke.tsx`: type it or delete it (see E3).
**Acceptance:** `bun run lint` exits 0. Do this incrementally per directory; don't blanket-disable rules.

## D2. Real test coverage for the fixed integration layer
**Files:** new tests under `src/lib/ghl/__tests__/`, `src/lib/__tests__/`
**Instructions:** Add vitest suites (mock `fetch`): (a) `ghlFetch` — auth header, Version header, 429 retry w/ Retry-After, 401 event, dedupe; (b) each service's endpoint path + body for the corrected endpoints (regression-lock A1–A7); (c) `PipelineRegistry` name matching (note: `byName('buyer')` matcher list, ensure "Buyer Pipeline"/"Buyer Transaction" both resolve and "Lead" doesn't falsely match "Seller lead" etc.); (d) contacts/opportunities param mapping. Delete `src/test/example.test.ts`.
**Acceptance:** ≥ 20 meaningful assertions; suite green in CI-mode (`vitest run`).

## D3. Add Prettier (claimed in original 0.1) or drop the claim
**Instructions:** Add `prettier` + config consistent with existing style, `format` script, and run it once repo-wide in a dedicated commit. Alternatively document that formatting is ESLint-only.
**Acceptance:** `bun run format --check` (or documented decision) passes.

## D4. Shared hook fixes
**Files:** `src/hooks/use-query-helpers.ts`, `src/hooks/use-surface.ts`
**Instructions (REVIEW_REPORT §9 S10/S11):**
1. `useOptimisticMutation`: capture the caller's `onMutate` return value and merge it into the returned context (`return { previousData, ...(callerContext ?? {}) }`) so composed rollback data isn't lost; pass the full context through to the caller's `onError`/`onSettled`.
2. `useSurface`: initialize state from `window.matchMedia('(min-width: 1024px)').matches` in the `useState` initializer to kill the desktop-flash-on-mobile frame.
**Acceptance:** unit test proves caller `onMutate` context reaches `onError`; no layout flash on a mobile-width first paint.

---

# WORKSTREAM E — Security & repo hygiene

## E1. Untrack `.env` (`.gitignore` already added)
**Instructions:**
1. ~~Create `.gitignore`~~ — **done** (commit `5efe08d`).
2. `git rm --cached .env` and commit. Keep `.env.example` (placeholders only — remove the real location ID currently in `.env`; `.env.example` is already blank, good).
3. Note in README that the previously committed Supabase publishable key is public-by-design but the Supabase project should confirm RLS coverage (it exists) and the GHL location ID should be treated as non-secret-but-private.
**Acceptance:** `git ls-files | grep .env` returns only `.env.example`; fresh clone builds after copying `.env.example`.

## E2. Offline banner vs mobile tab bar
**File:** `src/app/layout.tsx`
**Instructions:** The fixed bottom offline banner (`z-[100]`) covers the mobile TabBar/FAB. Position it above the tab bar on mobile (respect safe-area inset + tab bar height) or render as a top banner.
**Acceptance:** with offline simulated, tab bar remains tappable on mobile viewport.

## E3. Remove or gate debug routes
**File:** `src/app/router.tsx` (lines ~89–96), `src/pages/DesignPreview.tsx`, `src/pages/GhlSmoke.tsx`
**Instructions:** Wrap `/design-preview` and `/ghl-smoke` registration in `if (import.meta.env.DEV)` (build the route array conditionally) so they're tree-shaken from production, or delete the pages.
**Acceptance:** production build contains no chunk for these pages; dev still serves them.

## E4. Lock down the avatars storage bucket (SECURITY)
**File:** new migration `supabase/migrations/0005_avatars_policies_fix.sql`
**Problem (REVIEW_REPORT §9 S1):** the 0004 policies allow **anyone** (any role, no ownership check) to upload/update/delete any object in the `avatars` bucket.
**Instructions:**
1. Drop the three write policies from 0004 ("Anyone can upload/update/delete...").
2. Recreate them `to authenticated` with an ownership path convention — store avatars at `{auth.uid()}/avatar.<ext>` and check `(storage.foldername(name))[1] = auth.uid()::text` in `with check` (insert) and `using` (update/delete). Keep public read.
3. Update `profile-tab.tsx` upload path to match the `{uid}/...` convention if it doesn't already.
**Acceptance:** authenticated user A cannot write to user B's avatar path (verify with two test users or a SQL policy test); avatar upload/replace still works in the UI.

## E5. Provision the `documents` bucket + storage RLS via migration
**File:** new migration `supabase/migrations/0006_documents_bucket.sql`
**Problem (REVIEW_REPORT §9 S2):** the bucket is only mentioned in a "create it in the dashboard" comment — fresh environments have a broken Docs vault and no defined storage-level access control.
**Instructions:** Insert bucket `documents` (private, `public = false`). Add owner-scoped policies `to authenticated` for select/insert/update/delete where `bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text` — this matches `storage.ts`, which already writes to `{user_id}/{doc_id}`. Remove the dashboard-instructions comment from 0002.
**Acceptance:** on a fresh Supabase project with migrations applied, upload → signed-url download → delete round-trips; a second user cannot read the first user's file path.

---

# WORKSTREAM F — Performance & polish

## F1. Split the 1.37 MB main chunk
**File:** `vite.config.ts`
**Instructions:** Add `build.rollupOptions.output.manualChunks` separating at least: `recharts` (only reports/dashboard use it — additionally lazy-import the chart components), `@supabase/supabase-js`, `react-dom`+router, radix primitives. Target: no chunk > 600 KB minified.
**Acceptance:** build output shows main chunk < 600 KB min; reports still render.

## F2. Real splash progress (optional, small)
**File:** `src/app/layout.tsx`
**Instructions:** Drive `Progress` from actual settled count of the 6 bootstrap fetches (expose `settledCount` from `use-bootstrap` via `Promise.allSettled` progress wrapper) instead of a fake interval.
**Acceptance:** progress reflects real load; completes at 100% when bootstrap settles.

## F3. Reconcile documentation
**Files:** `README.md`, `AGENTS.md`
**Instructions:** After A–E land: update README scopes list if endpoints changed scope needs (e.g. `locations/customFields.readonly`, `medias.readonly/write`, `templates.readonly` for C2), document the dev fallback behavior from B4, document the `documents` upload-progress limitation, and remove/update claims that no longer hold.
**Acceptance:** README instructions produce a working setup on a clean machine.

---

## Suggested execution order

| Order | Tasks | Why |
|---|---|---|
| 1 | E1, E4, E5 | Untrack `.env`; close the open avatar-bucket policies; make Docs vault provisionable |
| 2 | A1–A8 | App is non-functional against live GHL until these land (A8 depends on A7) |
| 3 | B1–B3, B5 | First-load correctness, visible failures, working sign-in redirect |
| 4 | D2 (partial, alongside A) | Regression-lock every endpoint fix as it lands |
| 5 | C1–C12 | Feature parity + correct analytics/transactions classification |
| 6 | D1, D3, D4 | Lint to zero + shared-hook fixes once churn settles |
| 7 | B4, E2, E3, F1–F3 | Hygiene + performance + docs |

**Verification gate for release:** `typecheck` ✅ · `lint` ✅ 0 errors · `vitest run` ✅ with real suites · `build` ✅ no chunk > 600 KB · manual smoke of each module against a live GHL sub-account (leads board drag, client detail tabs, listing/offer/MLS lists, send SMS + Email, calendar CRUD, tasks bulk edit, docs upload/download, reports render + CSV, settings save).
