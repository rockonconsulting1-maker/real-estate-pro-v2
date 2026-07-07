# TASKS.md — Remediation Plan v2 (AI Dev Agent Instructions)

**Generated:** 2026-07-07 from a full verification pass against the codebase (supersedes the prior TASKS.md, preserved in git history).
**Scope:** This list contains **only work that is still outstanding, broken, or partial** as verified against the running toolchain. Tasks already completed in prior work (A2–A5, A7, A8, B1–B5, C1, C2, C7, C9, C10, C11, D4, E2, E4, E5, F1, F2) are intentionally omitted — do not redo them.

## Current toolchain state (baseline for this plan)

| Gate | Status | Notes |
|---|---|---|
| `bun run typecheck` | ✅ passes | keep it green |
| `bun run lint` | ❌ 293 problems | 291 `no-explicit-any` errors, 3 `react-refresh`, 2 `exhaustive-deps` → **T-D1** |
| `bunx vitest run` | ❌ 1 failing | `services.test.ts` objectsService body field → **T-A1** |
| `bun run build` | ✅ passes | largest chunk 399 KB (< 600 KB) |

## Rules for the AI Dev Agent (apply to every task)

1. Verify GHL endpoints/body shapes against GHL API 2.0 docs (https://marketplace.gohighlevel.com/docs/) before changing them.
2. All GHL calls stay inside `src/lib/ghl/services/*` via `ghlFetch` — never `fetch` in components.
3. After each task, all four must hold (no *new* failures): `bun run typecheck && bun run lint && bunx vitest run && bun run build`. Lint may remain non-zero until **T-D1** lands, but do not add new lint errors.
4. Add/extend a vitest test whenever a task touches pure logic (services, registry, helpers).
5. Preserve existing loading/empty/error patterns (`Skeleton`, `EmptyState`, `ErrorState`) and optimistic-update patterns (`useOptimisticMutation`).
6. Commit per task: `fix(<area>): <task-id> <summary>`. Never commit `node_modules/`, `dist/`, or `*.tsbuildinfo` (now covered by `.gitignore`).

**Definition of Done per task** = code change + acceptance criteria met + toolchain not regressed + committed.

**Suggested order:** T-A1 → T-E1 → T-D1 → T-BUGS → T-C-features (C3/C4/C5/C6/C8/C12) → T-E3 → T-D3 → T-F3.

---

# WORKSTREAM T-A — Broken integration (unblocks the test gate)

## T-A1. Fix custom-object search body field (`limit` → `pageLimit`)
**File:** `src/lib/ghl/services/objects.ts` (line ~25)
**Problem:** `searchRecords` accepts a `pageLimit` param but writes it to the body as `limit`. The regression test `src/lib/ghl/__tests__/services.test.ts` asserts the body carries `pageLimit`, so **the test suite is currently red**, and the payload contradicts the documented "Search Object Records" body.
**Instructions:**
1. In `searchRecords`, set `body.pageLimit = params.pageLimit ?? 20` (drop `body.limit`). Confirm the exact field name (`pageLimit` vs `limit`) in the GHL "Search Object Records" docs and match it; update the test to match the confirmed truth if docs say otherwise.
2. Keep `page` and `searchAfter` cursor support.
**Acceptance:** `bunx vitest run` is fully green; the built body for `searchRecords` matches the documented field name.

## T-A6. Contacts search pagination uses cursor (minor)
**File:** `src/lib/ghl/services/contacts.ts`
**Problem:** `search()` correctly moved to `POST /contacts/search` with a tag filter group, but paginates with `page`/`limit` instead of the documented `searchAfter` cursor — deep pages may be unreliable.
**Instructions:** Switch pagination to `searchAfter` per docs; expose the cursor from `meta` back to callers (`use-ghl-infinite`). Keep the tag filter group.
**Acceptance:** paging past page 1 returns correct, non-overlapping results; unit test asserts the cursor is threaded.

---

# WORKSTREAM T-C — Features claimed done but missing/partial

## T-C3. Desktop calendar drag-to-reschedule
**File:** `src/features/calendar/desktop-view.tsx`
**Status:** Not implemented (no dnd on the desktop grid).
**Instructions:** On the week/day time grid, make event blocks draggable (reuse `@dnd-kit/core`); on drop compute new start/end, apply an optimistic cache update, call `calendarsService.updateAppointment`, and roll back + toast on error. Keep the existing mobile sheet-based reschedule.
**Acceptance:** dragging an event updates its time optimistically and persists; a failed update rolls back with a toast.

## T-C4. Tasks desktop bulk-edit + mini-calendar scheduler
**File:** `src/features/tasks/desktop-view.tsx` (+ `task-modals.tsx`)
**Status:** Not implemented (current view is a kanban with a per-row complete checkbox only).
**Instructions:**
1. Add a table-view toggle with row checkboxes and a selection toolbar: **Complete**, **Reschedule** (date picker applied to all), **Delete** (confirm dialog). Batch via `Promise.allSettled` over `tasksGlobalService.update/delete` with one summary toast.
2. Add a "today mini-calendar scheduler" panel: unscheduled/today tasks draggable onto hour slots → sets `dueDate`.
**Acceptance:** multi-select bulk actions work with optimistic updates; dragging a task onto a slot sets its due time.

## T-C5. Kanban drag-and-drop accessibility (ARIA)
**Files:** `src/features/leads/components/kanban-board.tsx`, `src/features/clients/components/kanban-board.tsx`, and any `src/features/listings/*` board.
**Status:** Partial — `KeyboardSensor` exists in the **leads** board only; no `announcements`, `aria-roledescription`, or `role="list"` anywhere; the **clients** board has no `KeyboardSensor`.
**Instructions:** Add dnd-kit accessibility to every board: `announcements` for screen readers, `aria-roledescription="sortable"` on cards, `role="list"` + `aria-label` per lane, and a `KeyboardSensor` (with `sortableKeyboardCoordinates`) so cards move via arrow keys.
**Acceptance:** axe/devtools shows labeled lanes and cards; keyboard-only stage moves work on **both** leads and clients boards.

## T-C6. Wire route/row hover prefetch
**Files:** `src/components/desktop/shell.tsx` (nav items), list views (`leads`, `clients`, `contacts`), `src/hooks/use-query-helpers.ts`
**Status:** Not wired — the prefetch helper exists in `use-query-helpers.ts` but nothing calls it.
**Instructions:** On desktop nav-item `onMouseEnter`, `queryClient.prefetchQuery` the module's page-1 list; on list-row hover, prefetch the detail query. Seed detail caches from list results (`setQueryData` per record) in the main list hooks.
**Acceptance:** hovering a nav item fires the page-1 fetch (visible in React Query devtools); opening a hovered row renders instantly from cache.

## T-C8. Account deletion — real flow or honest UI
**Files:** `src/features/settings/components/data-tab.tsx`, `supabase/functions/delete-account/` (new)
**Status:** Not done — no edge function; the confirm dialog states "This will permanently delete your account" but `handleDeleteAccount` only fires an error toast ("contact support"). This is misleading.
**Instructions (pick one):**
- **Preferred:** add a Supabase Edge Function `delete-account` (service-role `auth.admin.deleteUser`, verifies the caller's JWT, cascades via existing FKs); call it from the confirm dialog, then sign out.
- **De-scope honestly:** if edge functions are out of scope for v1, change the dialog copy and button to reflect reality (e.g. "Request account deletion" that emails support) — no UI may claim an immediate permanent delete that doesn't happen.
**Acceptance:** either a working delete (user removed, rows cascaded, signed out) **or** UI copy that matches actual behavior.

## T-C12. Settings ▸ Display: density control + fix dead selects
**File:** `src/features/settings/components/display-tab.tsx`
**Status:** Not done. Density control is missing, and the "Default Landing Page" and "Default Calendar View" selects use `defaultValue` with no `onValueChange`/persistence — they silently do nothing.
**Instructions:**
1. Add a **density** control (comfortable/compact): persist in `profiles.preferences`, toggle a `data-density` attribute consumed by row-height/padding tokens.
2. Wire the existing "Default Landing Page" and "Default Calendar View" selects to real state persisted in `profiles.preferences`, and actually honor them (landing redirect on sign-in; calendar initial view).
**Acceptance:** density switch visibly tightens list/table rows app-wide and persists; landing-page and calendar-view selections persist and take effect across sessions.

---

# WORKSTREAM T-D — Code quality, lint, tests, formatting

## T-D1. Eliminate lint errors (typed service layer)
**Files:** `src/lib/ghl/**`, `src/lib/queryKeys.ts`, `src/types/ghl.ts`, and every file listed by `bun run lint`.
**Status:** 291 `no-explicit-any` errors + 3 `react-refresh/only-export-components` + 2 `react-hooks/exhaustive-deps`.
**Instructions:**
1. Replace `any` in the GHL services and types with response interfaces inferred from the Zod schemas in `src/types/ghl.ts` (add missing schemas: association key/relation, custom field, tag, media file, template, meta/pagination). Use `unknown` + Zod parse for genuinely dynamic payloads.
2. `queryKeys.ts`: type params as `Record<string, unknown> | undefined` or specific interfaces.
3. Fix the 3 fast-refresh warnings (move constants out of component files) and the 2 exhaustive-deps warnings.
4. Do it incrementally per directory; do not blanket-disable rules.
**Acceptance:** `bun run lint` exits 0.

## T-D2. Keep the integration test suite green and expand it
**Files:** `src/lib/ghl/__tests__/`, `src/lib/__tests__/`
**Status:** Suite is red until **T-A1** lands. Existing suites cover `ghlFetch`, some services, and `PipelineRegistry`.
**Instructions:** After T-A1, ensure `bunx vitest run` is green, then add regression assertions for any endpoint/body touched by T-A6 and the param mapping in contacts/opportunities. Target ≥ 20 meaningful assertions total.
**Acceptance:** `vitest run` green in CI mode with the expanded assertions.

## T-D3. Add Prettier (or document the ESLint-only decision)
**Files:** `package.json`, new `.prettierrc`
**Status:** Not done — no `prettier` dep, no `format` script.
**Instructions:** Add `prettier` + a config consistent with existing style and a `format` script; run it once repo-wide in a dedicated commit. Alternatively, document in README that formatting is ESLint-only and remove any Prettier claim.
**Acceptance:** `bun run format --check` passes, or a documented decision is recorded.

---

# WORKSTREAM T-E — Security & repo hygiene

## T-E1. Untrack `.env` and scrub the committed location ID
**Files:** `.env` (tracked), `.env.example`, `README.md`
**Status:** Not done — `.env` is still tracked and contains a real GHL location ID (`VITE_GHL_LOCATION_ID`). `.gitignore` now lists `.env`, but that does not untrack an already-committed file.
**Instructions:**
1. `git rm --cached .env` and commit.
2. Ensure `.env.example` carries placeholders only (no real IDs/keys).
3. Note in README that the previously committed Supabase publishable key is public-by-design, and that the GHL location ID should be treated as private (rotate the sub-account if warranted).
**Acceptance:** `git ls-files | grep -E '\.env'` returns only `.env.example`; a fresh clone builds after copying `.env.example`.

## T-E3. Keep debug pages out of the production bundle
**File:** `src/app/router.tsx`
**Status:** Partial — the `/design-preview` and `/ghl-smoke` routes are gated behind `import.meta.env.DEV`, but the page components are **statically imported** at the top of the file, so they still ship in the production bundle.
**Instructions:** Convert `DesignPreview` and `GhlSmoke` to `React.lazy` dynamic imports referenced only inside the `import.meta.env.DEV` route branch (or delete the pages) so a production build tree-shakes them out.
**Acceptance:** a production build contains no chunk referencing these pages; dev still serves them.

---

# WORKSTREAM T-BUGS — Deep-review defects (outside the original checklist)

## T-BUGS1. Remove unused `toast` import in the GHL client
**File:** `src/lib/ghl/client.ts` (line 1)
**Problem:** `import { toast } from 'sonner'` is unused (401 handling now lives in `layout.tsx`). Dead code; will trip lint once T-D1 tightens rules.
**Instructions:** Delete the import.
**Acceptance:** import gone; typecheck/lint unaffected.

## T-BUGS2. Bootstrap `failed[]` omits `tags`
**File:** `src/hooks/use-bootstrap.ts`
**Problem:** The partial-load `failed` array pushes every group **except** `tags`, so a tags-endpoint failure never surfaces in the T-B2 warning banner (tag-driven filters silently break).
**Instructions:** Add `if (tags.status === 'rejected') failed.push('tags');`.
**Acceptance:** killing the tags endpoint shows `tags` in the partial-load banner.

---

# WORKSTREAM T-F — Docs

## T-F3. Reconcile documentation with reality
**Files:** `README.md`, `AGENTS.md`, `FINDINGS.md`
**Problem:** `FINDINGS.md` asserts "all critical and high-priority issues have been addressed across Workstreams A through F," which is inaccurate given the open items above.
**Instructions:** After the workstreams above land, update README scopes if endpoints changed scope needs, document the `VITE_GHL_*` dev fallback and the `documents` upload limitation, and correct/remove claims (in `FINDINGS.md` and elsewhere) that no longer hold.
**Acceptance:** README produces a working setup on a clean machine; no doc claims completion of work that is still open.

---

## Verification gate for release

`typecheck` ✅ · `lint` ✅ 0 errors · `vitest run` ✅ green · `build` ✅ no chunk > 600 KB · `git ls-files | grep '\.env'` returns only `.env.example` · manual smoke of each module against a live GHL sub-account (leads/clients board drag + keyboard move, contact detail tabs, listing/offer/MLS lists, send SMS + Email + Log Call, calendar CRUD + desktop drag-reschedule, tasks bulk edit, docs upload/download, reports render + CSV, settings save incl. density).
