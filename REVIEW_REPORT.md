# Repository Review Report — Real Estate Pro CRM v2

**Date:** 2026-07-06 (updated same day with second, deeper pass — see §9)
**Branch reviewed:** `main` (34078cb)
**Scope:** Full-repo review against the original master build checklist, PRD, and the GHL API 2.0 integration spec. Toolchain verification: install, typecheck, lint, test, production build. Second pass: auth/session lifecycle, Supabase migrations & storage policies, settings persistence, dashboard/report calculations, and shared hooks.

---

## 1. Executive Summary

The app is **structurally complete** — all 18 phases have real (non-stub) implementations: 16 feature modules, responsive desktop/mobile shells, Supabase auth (8 screens), documents vault, reports, settings, quick-add, and global search. TypeScript compiles clean and the production build succeeds.

However, it is **not functionally complete against live GHL data**. The GHL service layer contains multiple **wrong API endpoints** that will fail at runtime against the real GoHighLevel API — most importantly the entire Custom Objects layer (My Listings, MLS Properties, Offers), custom fields/tags, message sending, and calendar appointment CRUD. Because the bootstrap swallows errors (`Promise.allSettled`) and caches results for 24h, these failures are largely **silent**: the app renders with empty data instead of surfacing errors.

There is also a **bootstrap race condition** that can cause the very first load after sign-in to fetch with no credentials, cache an empty pipeline registry for 24 hours, and degrade every pipeline-driven screen.

Additionally, **~10 checklist items marked `[x]` in TASKS.md are not actually implemented** (details in §4), lint fails with 338 errors, and test coverage is effectively zero (1 placeholder test).

**Verdict: NOT ready for release.** Remediation: 37 tasks across 6 workstreams, grouped in the new `TASKS.md`. The deep pass (§9) added two Supabase storage security findings, a broken sign-in redirect, and analytics-correctness issues on top of the first-pass GHL integration bugs.

---

## 2. Verification Results (toolchain)

| Check | Result | Notes |
|---|---|---|
| `bun install` | ✅ | 482 packages |
| `tsc --noEmit` (typecheck) | ✅ | Passes |
| `eslint .` | ❌ **338 errors, 4 warnings** | Almost all `@typescript-eslint/no-explicit-any`, concentrated in `src/lib/ghl/**`, `src/lib/queryKeys.ts`, feature views. Contradicts "TypeScript strict" Definition of Done. |
| `vitest run` | ⚠️ Passes | Only **1 placeholder test** (`src/test/example.test.ts`). No real coverage. |
| `vite build` | ⚠️ Succeeds | Main chunk **1.37 MB min / 392 KB gzip** — recharts, supabase, all shared code in one chunk. Route modules are code-split, but the "Lighthouse/bundle audit" claim (18.3) is not credible with this chunk. |

---

## 3. Critical Bugs (break the app against live GHL)

### C1. Custom Objects API — wrong paths and keys (`src/lib/ghl/services/objects.ts`)
- Code calls `POST /custom-objects/{key}/records/search` with bare keys (`my_listings`, `properties`, `real_estate_offer`).
- GHL API 2.0 uses **`/objects/{schemaKey}/records/search`** with fully-qualified keys (**`custom_objects.my_listings`**, etc.) — as the original TASKS.md itself specifies.
- Search body uses `limit`; the objects search endpoint expects `page` / `pageLimit` (+ `searchAfter`).
- **Impact:** My Listings, MLS Properties, Offers, the offer/listing dashboard KPIs, reports DOM aggregate, global search (listings/offers/properties groups), and every association-driven tab return 404 → empty screens.

### C2. Location metadata endpoints wrong (`src/lib/ghl/services/misc.ts`)
- `GET /custom-fields/`, `GET /custom-values/`, `GET /tags/` with `locationId` query — these are not GHL endpoints. Correct: **`GET /locations/{locationId}/customFields`**, **`/locations/{locationId}/customValues`**, **`/locations/{locationId}/tags`**.
- `mediasService` calls `GET /medias/` — correct endpoint is **`GET /medias/files`**.
- **Impact:** bootstrap `fields`/`tags` silently fail every session; temperature/type tag filters and custom-field editors run without definitions.

### C3. Conversations — message send & mark-read broken (`src/lib/ghl/services/conversations.ts`, `thread-view.tsx`)
- Send posts to `POST /conversations/{id}/messages` with `{ type: <number>, message }`. The real endpoint is **`POST /conversations/messages`** with `{ type: 'SMS' | 'Email' | 'WhatsApp' | ..., contactId, message | html/subject/emailFrom, ... }`. The per-conversation `/messages` path is read-only (GET).
- `channel` state is numeric (`1=SMS, 2=Email, 4=WhatsApp`) and sent as the payload `type` — GHL expects string channel types on send.
- `markRead` calls `PUT /conversations/{id}/read`, which does not exist; conversation update is `PUT /conversations/{id}` (e.g. `{ unreadCount: 0 }`).
- **Impact:** sending any message and mark-as-read fail; optimistic bubble appears then rolls back.

### C4. Calendar appointments — wrong CRUD paths (`src/lib/ghl/services/calendars.ts`)
- Create/get/update/delete use `/calendars/events` and `/calendars/events/{id}`. Correct appointment endpoints: **`POST /calendars/events/appointments`**, **`GET/PUT/DELETE /calendars/events/appointments/{eventId}`** (original TASKS.md documents these correctly).
- `GET /calendars/events` requires `locationId` **plus one of `userId` / `calendarId` / `groupId`**, and epoch-millisecond `startTime`/`endTime`. Code passes only ISO strings + locationId — request will be rejected.
- **Impact:** all calendar views and event modals fail against the live API.

### C5. Bootstrap race condition → empty app cached for 24h (`src/app/layout.tsx` + `src/hooks/use-bootstrap.ts`)
- `useBootstrap()` (line 17) becomes `enabled` on the same render in which credentials arrive, but `setGhlCredentials(pit, locationId)` runs in a **later** `useEffect` (line 32–36). React Query's fetch effect for `useBootstrap` registers **before** the layout effect, so on first load the queryFn runs with `currentPit = null` → every call throws `missing_credentials`.
- Because `Promise.allSettled` swallows the failures, the query **succeeds** with empty pipelines/fields/users and caches for `staleTime: 24h`. `PipelineRegistry` is set to `[]`.
- `isPartial` is computed but **never consumed anywhere** — no banner, no retry.
- **Impact:** first session after sign-in (and after each cache bust) can render the entire app with no pipelines: leads/clients/transactions boards empty, KPIs zero, with no error shown.

### C6. Users list uses agency-scope endpoint (`src/lib/ghl/services/users.ts`)
- `GET /users/search` requires `companyId` (agency scope). With a sub-account PIT the correct call is **`GET /users/`** with `locationId`.
- **Impact:** team directory, assigned-to filters, and assignee pickers get 401/422 → empty.

---

## 4. TASKS.md claims vs. reality (mis-checked items)

Items marked `[x]` in the original TASKS.md that are **not implemented**:

| Claim | Reality |
|---|---|
| 1.4 "Hover/route prefetch utilities" | Helper exists (`use-query-helpers.ts`) but no nav-hover or row-hover prefetch is wired anywhere. |
| 1.4 bootstrap loads "custom object schemas (3)" | Bootstrap never fetches object schemas at all. |
| 10.2 Composer "attachments (medias upload), templates dropdown" | Neither exists in `thread-view.tsx`. |
| 11.2 "Reschedule flow (drag on desktop week grid)" | No drag logic in `calendar/desktop-view.tsx`. |
| 12.1 "(D) Bulk-edit table view toggle (multi-select…) + mini-calendar scheduler" | No multi-select or scheduler in `tasks/desktop-view.tsx`. |
| 17.1 "delete account (Supabase, confirm flow)" | Stub — shows toast "requires admin privileges, contact support" (`data-tab.tsx:69`). |
| 18.3 "ARIA on kanban DnD" | No `aria-*` attributes in either kanban board. |
| 18.3 "Lighthouse pass / bundle audit" | 1.37 MB main chunk; no evidence of audit. |
| 18.3 checklist sweep / QA | 1 placeholder test; lint failing. |
| 0.1 "ESLint + Prettier" | No Prettier config exists in repo. |

Conversely, **Phase 5.1 (Contacts directory) is unchecked `[ ]` but mostly done** — split-pane directory, virtualized list, debounced search, sort, filters, detail pane all exist. Missing bits: alpha-group headers/index scrubber (M), and the role filter uses display labels (`"Vendor"`, `"SOI"`) instead of the `type:*` tag taxonomy, so filters won't match real tags.

---

## 5. High-priority issues

1. **`.env` with real values is committed** (Supabase URL, publishable key, GHL location ID) and **no `.gitignore` exists in the repo at all**. README explicitly says not to commit `.env`. Publishable key is public-by-design but the file must be untracked; `dist/`, `node_modules/` are also unprotected.
2. **Lint failure (338 errors)** — service layer returns `any` everywhere; several Zod schemas exist in `src/types/ghl.ts` but responses are typed `ghlFetch<any>`.
3. **Contacts tag filtering is client-side per page** (`contacts.ts` `search()` filters after fetch) — a filtered view silently drops matches beyond the loaded pages; GHL supports server-side tag filters via `POST /contacts/search`.
4. **Debug routes shipped:** `/design-preview` and `/ghl-smoke` are registered in the production router (`src/app/router.tsx:89–96`).
5. **401 handling:** `ghl:unauthorized` triggers `window.location.href = '/settings/integrations'` — full page reload, loses SPA state, and any transient 401 kicks the user out of what they were doing. No banner/toast as specified.
6. **`VITE_GHL_PIT` / `VITE_GHL_LOCATION_ID` dev fallbacks** are documented in `.env.example`/README but **never read** anywhere in `src/`.
7. **`isPartial` bootstrap flag unused** — degraded-bootstrap state invisible to the user (compounds C5).
8. **Dead import:** `toast` imported and unused in `src/lib/ghl/client.ts`.
9. **Opportunities search pagination** relies on `meta` loosely; verify `q`/filters against `GET /opportunities/search` params (`q`, `pipeline_id`, `pipeline_stage_id`, `assigned_to`, `status`, `date`, `limit`, `page`) — code spreads arbitrary params (`filters` object goes into query string as `[object Object]` if ever passed).

## 6. Medium / low

- Splash progress bar is simulated (interval to 90%) rather than tied to actual bootstrap progress — acceptable, but noted.
- `validateCredentials` bypasses the rate limiter and dedupe (direct `fetch`) — fine for a smoke test, but duplicates header logic.
- `react-hooks/exhaustive-deps` warning in `thread-view.tsx` (`messages` logical expression) — real re-render churn risk while polling every 15s.
- 3 fast-refresh warnings (mixed exports in component files).
- `RateLimiter` is 10 tokens / 10 per second = 100/10s — matches GHL burst; OK, but burst capacity of 10 may throttle the bootstrap's parallel batch unnecessarily (minor).
- Documents upload has DB-then-storage with rollback — good; but no upload **progress** indicator despite task claim (supabase-js upload doesn't expose progress without TUS; note as limitation).
- No scroll-restoration test, no offline-banner z-index conflict check (banner covers mobile tab bar).

## 7. What's in good shape

- Architecture matches the spec: single route tree, `Desktop*`/`Mobile*` per-route views, shared service layer, centralized query keys, persisted query cache **with credentials correctly excluded from localStorage persistence** (`providers.tsx` `shouldDehydrateQuery`).
- Supabase migrations are sound: RLS owner-only on `profiles`, `ghl_credentials`, `documents`, avatar bucket policies; signup trigger with `security definer set search_path = ''`.
- Auth flow complete (sign-in/up, forgot/reset/changed, check-email with cooldown, token_hash confirm route, protected routes with intended-path preservation).
- Rate limiting, in-flight dedupe, 429 backoff w/ Retry-After, 5xx retry-once in `ghlFetch`.
- Optimistic updates with rollback implemented consistently (kanban drags, task toggles, message send, note edits).
- Quick Add hub wires all 8 creation modals; duplicate-contact check before create exists.
- Conflict-detection banner in calendar exists; conversations 15s polling exists; reports CSV export exists.

---

## 8. Remediation plan

See the new **`TASKS.md`** for the full breakdown across 6 workstreams (A: GHL API corrections, B: bootstrap/credentials lifecycle, C: mis-checked feature gaps, D: code quality/lint/tests, E: security/hygiene, F: performance/polish), each with file paths, step-by-step instructions, and acceptance criteria for the Dev Agent.

---

## 9. Deep-pass findings (second review)

### 9.1 Security — Supabase storage policies

**S1 (HIGH). Avatars bucket policies are wide open** (`supabase/migrations/0004_avatars_bucket.sql`). The insert/update/delete policies check only `bucket_id = 'avatars'` — no `auth.uid()` ownership check and no `to authenticated` role restriction. Despite the policy names ("Anyone can update **their own** avatar"), **any user — including anonymous clients holding the public publishable key — can upload, overwrite, or delete any user's avatar**. → Task **E4**.

**S2 (HIGH). The `documents` storage bucket is never provisioned.** `0002_documents.sql` creates only the metadata table; a comment says the bucket and its storage RLS "need to be created in the Supabase dashboard." On any fresh environment the Docs vault upload fails (`storage.ts` uploads to bucket `documents`). Infrastructure-as-code gap and an unwritten owner-scoping requirement. → Task **E5**.

### 9.2 Auth/session correctness

**S3 (HIGH). `?next=` redirect is never consumed.** `ProtectedRoute` redirects to `/auth/sign-in?next=<intended path>`, but `sign-in.tsx:47` hardcodes `navigate('/')` after login. The claimed "preserve intended path" behavior (original 1.2, marked done) doesn't work. → Task **B5**.

**S4 (MEDIUM). Sign-out doesn't clear state.** `auth-provider.tsx` `signOut()` only calls `supabase.auth.signOut()` — the persisted+in-memory query cache (another user's contacts, KPIs, docs metadata) and the module-level GHL credentials survive into the next session on the same browser. (Covered by task B1 step 4; called out here as a distinct data-leak finding.)

### 9.3 Data correctness — dashboards & reports

**S5 (HIGH). Reports aggregate only the first page.** `reports/desktop-view.tsx` (and mobile) fetch exactly one page of 100 opportunities / 100 contacts / 100 listings and compute GCI, deal volume, funnel, source attribution, and average DOM from that. Any account with >100 records gets silently wrong analytics. The original claim was "aggregates computed client-side from **paged** live queries." Also: GCI/deal-volume bucket **won** opportunities by `createdAt` within the selected range — closed-date basis was intended. → Task **C10**.

**S6 (HIGH). KPI queries pass structured `filters` arrays into GET query strings.** `kpi-grid.tsx` calls `opportunitiesService.search({ filters: [{ field: 'status', ... }] })`; the service spreads params into URL query params, so filters serialize as `filters=%5Bobject+Object%5D`. The GET opportunities-search endpoint doesn't accept filter arrays at all — Active Leads / Active Clients / New-Leads-7d KPI counts are unfiltered or rejected. Same pattern feeds the offers KPIs. → folded into tasks **A7/A8**.

**S7 (MEDIUM). Internally inconsistent custom-object keys.** Reports call `objectsService.searchRecords('custom_objects.my_listings', …)` while the wrappers and global search use bare keys (`'my_listings'`, `'properties'`). Whatever the correct key format is, one of these call sites is always broken. A1's `OBJECT_KEYS` constant must be adopted by **all** callers (reports included). → covered by expanded **A1**.

**S8 (MEDIUM). Transactions "Under Contract" detection is a hardcoded heuristic.** `transactions/desktop-view.tsx:53-56` treats stage position ≥ 3 (or name containing "contract"/"firm"/"close") as under-contract. With the real 10-stage Buyer / 9-stage Seller pipelines, position 3 is far too early — the list will include active-search clients. The dashboard "Under Contract" KPI uses the same `pos >= 3` assumption. → Task **C11**.

**S9 (LOW). `next-up` widget passes epoch-millis strings to `eventsByRange` while the calendar feature passes ISO strings** — two callers, two formats, one wrong signature. Confirms the A4 redesign (typed `Date` params).

### 9.4 Shared hooks & UI

**S10 (LOW).** `useOptimisticMutation` (`use-query-helpers.ts`) invokes a caller-supplied `onMutate` but discards its returned context — composing optimistic mutations silently loses rollback data. → Task **D4**.

**S11 (LOW).** `useSurface()` initializes to `'desktop'` and corrects itself in an effect — a one-frame desktop-shell flash on mobile. Initialize from `window.matchMedia(...).matches` in the `useState` initializer. → Task **D4**.

**S12 (LOW).** Settings ▸ Display lacks the claimed **density** control (theme, landing page, and calendar-view selects exist). Minor parity gap. → Task **C12**.

### 9.5 What the deep pass confirmed as sound

- `profiles` update, notification preferences (jsonb `preferences` column via migration 0003), and avatar upload UI flow are correctly wired to Supabase.
- Auth provider subscription handling, `AuthRoute` inverse guard, notes-feed batching (20 recent contacts → parallel note fetches), team bulk-reassign mutation, notifications read-state in localStorage, and the swipe-row touch handling all check out.
- The `documents` metadata table RLS is correct (owner-only).
