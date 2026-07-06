# Real Estate Pro CRM — Vibe Prompts (PROMPT.md)

**How to use this file:**
This file contains the exact prompts to feed into the Vibe agent, phase by phase.
1. Copy the "STANDING CONTEXT" block and paste it into every single prompt you send to Vibe. (Vibe forgets context between sessions).
2. Copy the specific Phase prompt (e.g., "Prompt P1.1") and paste it below the standing context.
3. Wait for Vibe to complete the task. Verify it against the `TASKS.md` checklist.

---

## 📋 STANDING CONTEXT (Paste this at the top of EVERY prompt)

```text
PROJECT: Real Estate Pro CRM — production React web app. Desktop + Mobile responsive from ONE codebase.
LIVE DATA ONLY: All data comes from a GoHighLevel (GHL) sub-account via API (Private Integration Token) and Supabase (auth/profile/docs). NEVER ship mock data. The design repo's mobile/data.jsx is a SHAPE REFERENCE ONLY — use it to understand record shapes and UI content, then delete any temporary stubs before finishing a task.

STACK (locked): React 18, Vite, TypeScript strict, React Router v6, Tailwind + CSS-variable OKLCH tokens, shadcn/ui (Radix), TanStack Query v5, React Context, React Hook Form + Zod, lucide-react, recharts, date-fns, @supabase/supabase-js.

TWO REPOS — read the right doc for the task (AGENTS.md maps every task → doc across both):

BUILD REPO (this repo, writable — where the app is built). Companion docs to follow:
- PRD.md — product requirements (the what/why): scope, goals, non-goals, UX principles.
- TASKS.md — phased, ordered engineering build plan (the how). Every prompt below maps to a TASK id.
- PROMPT.md — this per-phase prompt series (paste Standing Context once, then the numbered prompt).
- design.md — design system SOURCE OF TRUTH: OKLCH tokens, type scale, spacing, primitives, patterns, prototype file map.
- GHL_Integration_Mapping.md — screen → GHL endpoint/field mapping (FOLLOW THIS for every data-wiring task).
- Real Estate Pro CRM — Full Integration Schema.md — consolidated GHL data schema for this repo (object catalog, data dictionary, associations, ERD); the SECTION_1..6 docs are its source.

DESIGN REPO (read-only reference): https://github.com/rockonconsulting1-maker/RealEstate-Pro-CRM---Design
Read via the URL; never write to it. Prototype code is shape/interaction reference only — NOT production code.
- SCREENS.md + "RC CRM Screen Inventory.html" — full screen/modal inventory (desktop, mobile, auth).
- RC CRM Desktop.html / RC CRM Mobile.html / RC CRM Auth Desktop.html / RC CRM Auth Mobile.html — prototype entry points to port.
- desktop/*.jsx — desktop implementations to port (shell.jsx, dashboard.jsx, contacts.jsx, leads.jsx, conversations.jsx, mls.jsx, modals.jsx, screens*.jsx) + styles.css.
- mobile/*.jsx — mobile implementations to port (app.jsx = TabBar/FAB shell, screen-*.jsx per screen, data.jsx = SHAPE REFERENCE ONLY) + styles.css.
- frontend-designs.md — per-screen field breakdowns (where present).
- SECTION_1..SECTION_6 (granular schema docs) + GoHighLevel__GHL__API_Integration.txt + Associations_Apis-*.md — GHL data dictionary & API/associations reference.
- Buyer-Seller-Journeys.md — pipeline stages, stage-mapped tasks & documents, client-portal plan.
- Supabase_Intergration_Docs.txt — Supabase auth/config reference.

GHL: base https://services.leadconnectorhq.com · headers: Authorization: Bearer <PIT>, Version header per GHL API 2.0 docs (2021-07-28), Content-Type/Accept application/json.
Custom objects: custom_objects.my_listings · custom_objects.properties (MLS) · custom_objects.real_estate_offer. Relations via Associations API.
Pipelines (resolve IDs at runtime by name, never hardcode): "Lead Nurture" (Leads), "Buyer"/"Buyer Transaction" and "Seller" (Clients).
PIT docs: https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken

SUPABASE (auth only + profile/credentials/docs):
VITE_SUPABASE_URL=https://xdenkkphnhjjpdirvsii.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Gg-ck2dVMrtES3lTPb_xJQ_t4r6K3YI

ARCHITECTURE RULES:
1. All GHL calls go through src/lib/ghl/client.ts + typed services in src/lib/ghl/services/*. UI never fetches directly.
2. Query keys centralized in src/lib/queryKeys.ts.
3. Responsive: useSurface() hook — desktop ≥1024px (sidebar/topbar/split panes), mobile <1024px (TabBar/FAB/bottom sheets). Shared data hooks; per-surface view components only where layouts diverge.
4. Every screen ships loading skeletons, designed empty states, and retryable error states.
5. Mutations are optimistic with rollback where sensible (stage drags, toggles, sends).
6. TypeScript strict must pass. Zod-validate GHL responses at the service boundary.
7. Match design.md tokens exactly: tabular numerals for money/time, stage colors never fill cards, 44px mobile touch targets.

DEFINITION OF DONE for any prompt: desktop + mobile built, live GHL data wired, all listed filters/sorts/modals/tabs functional, states covered, typecheck clean.
```

---
---

# PHASE 0 — Project Foundation

## Prompt P0.1 — Scaffold & Tooling

```text
TASK 0.1 from TASKS.md.

Scaffold the project:
1. Vite + React 18 + TypeScript (strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes). Path alias "@/" → src.
2. Install and configure: react-router-dom@6, @tanstack/react-query + react-query-devtools + query persist packages, tailwindcss, shadcn/ui (init with CSS-variables mode), react-hook-form, zod, @hookform/resolvers, lucide-react, recharts, date-fns, @supabase/supabase-js, @tanstack/react-virtual.
3. ESLint + Prettier; scripts: dev, build, preview, typecheck, lint.
4. Env: .env.example with VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (values in Standing Context), plus optional VITE_GHL_PIT / VITE_GHL_LOCATION_ID dev-only fallbacks (read only in dev mode). Never commit .env.
5. Folder structure:
   src/app (providers, router), src/routes, src/components/{ui,shared,desktop,mobile},
   src/features/{dashboard,leads,clients,contacts,listings,offers,transactions,mls,conversations,calendar,tasks,notes,docs,reports,team,settings},
   src/lib/{ghl/services,supabase}, src/hooks, src/types, src/styles.
6. Boot a placeholder App with QueryClientProvider + BrowserRouter + a "hello" route to prove the toolchain.

Acceptance: npm run dev/build/typecheck all pass; folder tree committed; no mock data anywhere.
```

## Prompt P0.2 — Design System Port

```text
TASK 0.2 from TASKS.md.

Port the design system from the repo into the codebase:
References: design.md (§ tokens/typography/spacing/components), desktop/styles.css, mobile/styles.css, desktop/shell.jsx (primitives).

1. Create src/styles/tokens.css with the full OKLCH CSS-variable set from design.md + both styles.css files: --bg, --surface, --border(-2), --ink(-2/-3/-4), --brand(-soft), --success(-soft), --warn, --danger, stage color set, radii, shadows. Map every variable into tailwind.config (colors, borderRadius, boxShadow, fontFamily incl. mono for time/money).
2. Typography: implement the design.md type scale as Tailwind utilities/components; tabular-nums on all numeric displays.
3. Port shared primitives to src/components/shared with TypeScript props: Money (currency, compact option), Countdown (live ticking, danger under threshold), Spark (recharts sparkline), Avatar (initials fallback), StageDot, TempBadge (hot/warm/cold), RoleBadge (buyer/seller/investor/vendor/agent), StatusChip.
4. Shared state components: Skeleton variants (row, card, table, kpi), EmptyState (icon+title+body+action), ErrorState (message+Retry), Toaster setup; confirm dialog helper.
5. Dark mode scaffolding: `class` strategy, duplicate token block under `.dark`, ThemeProvider with light/dark/system (toggle wired later in Settings). design.md §2: "Dark mode is first-class."
6. Enforce: 44×44 mobile hit targets utility, visible focus rings, stage-vs-semantic color rule documented in a comment header.

Acceptance: a /design-preview dev-only route rendering all primitives in both themes; visual match to the repo prototypes.
```

## Prompt P0.3 — App Shell & Navigation

```text
TASK 0.3 from TASKS.md.

Build the app shell. References: desktop/shell.jsx (Sidebar/Topbar), mobile/app.jsx (TabBar/FAB/bezel logic — ignore the bezel, port the patterns), design.md layout specs.

1. useSurface() hook: 'desktop' ≥1024px else 'mobile' (matchMedia, SSR-safe). <SurfaceSwitch desktop={..} mobile={..}/> helper.
2. Route tree (React Router v6, all lazy + Suspense skeletons):
   /auth/* (Phase 1) · / (dashboard) · /leads, /leads/:id · /clients, /clients/:id · /contacts, /contacts/:id · /listings, /listings/:id · /offers, /offers/:id · /transactions, /transactions/:id · /mls, /mls/:id · /conversations, /conversations/:id · /calendar · /tasks · /notes · /docs · /reports · /team · /settings/* · 404.
3. DESKTOP shell: fixed Sidebar (logo, grouped nav exactly per Core Functions list, active inset-bar indicator, collapse toggle persisted) + Topbar (global search input → opens search overlay, breadcrumbs from route, Quick Add button (menu stub), notifications bell (popover stub), avatar menu: Profile, Settings, Sign out).
4. MOBILE shell: bottom TabBar (Dashboard, Leads, Clients, Calendar, More) with safe-area padding; More opens a sheet listing every remaining module; FAB (+) opens FabPicker sheet grid (Lead, Client, Listing, Offer, Task, Note, Event) — tiles route to creation sheets (stubs now, wired in module phases).
5. Bottom-sheet primitive (Radix Dialog styled as sheet w/ drag handle) reused by all mobile modals.
6. Scroll restoration, document titles per route, ErrorBoundary per route.

Acceptance: navigating every route on both surfaces shows shell + skeleton placeholder; nav states match prototype screenshots; typecheck clean.
```

---

# PHASE 1 — Auth & Integration Layer

## Prompt P1.1 — Supabase Auth Flow

```text
TASK 1.1 from TASKS.md.

Implement the complete auth flow with Supabase. References: RC CRM Auth Desktop.html and RC CRM Auth Mobile.html in the repo — match layout, copy, and interactions exactly.

1. src/lib/supabase/client.ts singleton from env vars.
2. Routes under /auth: sign-in, sign-up, forgot-password, check-email, reset-password, password-changed, confirm (token_hash handler).
3. SIGN IN (B): email+password, show/hide eye toggle, inline errors, submit → signInWithPassword; desktop layout = left brand panel (tagline, feature list, stage dots) + right form card; mobile = full-screen with RC mark header. Links: Forgot password, Create account.
4. CREATE ACCOUNT (B): first+last name (2-col grid desktop), email, brokerage, phone, password with LIVE strength meter (Weak/Fair/Strong bar exactly like prototype), confirm password, ToS checkbox required → signUp with options.data {first_name,last_name,brokerage,phone} → route to check-email.
5. FORGOT (B): email → resetPasswordForEmail(redirectTo /auth/reset-password) → check-email variant copy.
6. CHECK EMAIL (B): mail icon circle, redacted email, Resend (30s cooldown), back link.
7. RESET (B): new+confirm with strength meter → updateUser({password}) → password-changed.
8. PASSWORD CHANGED (B): check icon circle, "Sign in" CTA.
9. All forms: React Hook Form + Zod (email format, pw ≥8 chars, match), disabled/loading button states, error toast on Supabase errors mapped to friendly copy.

Acceptance: full round-trip works against the live Supabase project; both surfaces pixel-faithful to the auth prototypes.
```

## Prompt P1.2 — Session guards & credential storage (Supabase SQL included)

```text
TASK 1.2 from TASKS.md.

1. AuthProvider: getSession on boot + onAuthStateChange; expose {session, user, loading, signOut}.
2. <ProtectedRoute>: unauthenticated → /auth/sign-in?next=…; authed users hitting /auth/* → /.
3. Create supabase/migrations/0001_profiles_credentials.sql and run it in the Supabase SQL editor:

-- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text, last_name text, brokerage text, phone text,
  avatar_url text, gci_goal numeric, created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, brokerage, phone)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
          new.raw_user_meta_data->>'brokerage', new.raw_user_meta_data->>'phone');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GHL credentials (v1: browser reads these to call GHL directly; v2 moves to Edge Function proxy)
create table public.ghl_credentials (
  user_id uuid primary key references auth.users on delete cascade,
  pit_token text not null, location_id text not null,
  default_calendar_id text, updated_at timestamptz default now()
);
alter table public.ghl_credentials enable row level security;
create policy "own creds" on public.ghl_credentials for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

4. useGhlCredentials(): fetch once after login (React Query, staleTime Infinity, memory only — never persist the PIT to localStorage); expose {pit, locationId, isConfigured, refresh}.
5. Post-login gate: if !isConfigured, redirect to /settings/integrations (setup wizard built in P1.5); otherwise run bootstrap (P1.4).

Acceptance: new signup creates a profile row; credentials CRUD works under RLS; unauthenticated access to any app route redirects.
```

## Prompt P1.3 — GHL API client & typed services

```text
TASK 1.3 from TASKS.md.

References: GoHighLevel__GHL__API_Integration.txt (endpoint tables), SECTION_2 data dictionary (field keys/types), GHL_Integration_Mapping.md.

1. src/lib/ghl/client.ts: ghlFetch<T>(path, {method, body, query}) →
   - base https://services.leadconnectorhq.com
   - headers: Authorization Bearer (from useGhlCredentials via a module-level credential store set at bootstrap), Version per GHL 2.0 docs, JSON accept/content-type
   - error normalization: GhlError{status, code, message}; 401 → emit 'ghl:unauthorized' event (global banner + route to Integrations); 429 → wait Retry-After or exp backoff, max 3; 5xx → single retry
   - token-bucket rate limiter (≈10 req/s) + in-flight dedupe by method+path+body hash.
2. Services (each: typed functions + Zod schema parse + params typed):
   contacts.ts (list/search w/ query+page, get, create, update, delete, tags add/remove, tasks CRUD, notes CRUD, appointments list)
   opportunities.ts (search {pipelineId, q, page, filters}, get, create, update, updateStatus, delete, pipelines list)
   objects.ts (generic: searchRecords(schemaKey, {query, page, pageLimit, searchAfter, filters}), getRecord, createRecord, updateRecord, deleteRecord) + thin wrappers: myListings, mlsProperties, offers
   associations.ts (getKeys, relationsByRecord(recordId, objectKey?), createRelation, deleteRelation)
   conversations.ts (list, messages(id), sendMessage(typed per channel), markRead)
   calendars.ts (calendars list, events by range, appointment get/create/update/delete)
   tasksGlobal.ts (POST /locations/{locationId}/tasks/search)
   users.ts, customFields.ts, customValues.ts, tags.ts, locations.ts (get location), medias.ts (upload/list)
3. src/types/ghl.ts: exported inferred types (Contact, Opportunity, Pipeline, Stage, ListingRecord, PropertyRecord, OfferRecord, Conversation, Message, Appointment, GhlTask, GhlNote, GhlUser). Custom-object records: helper to strip the `custom_objects.<key>.` prefix into clean typed fields.
4. validateCredentials(pit, locationId) → GET /locations/{id}, returns {ok, locationName}.

Acceptance: a dev-only /ghl-smoke route that runs validateCredentials + one search per service against the live sub-account and renders raw counts. Remove after verification in P18.3.
```

## Prompt P1.4 — Query architecture, bootstrap & performance layer

```text
TASK 1.4 from TASKS.md. This is the speed/UX backbone — implement fully.

1. QueryClient: defaults {staleTime 60s, gcTime 24h, retry: smart (no retry on 4xx)}; persistQueryClient → localStorage, maxAge 24h, buster = app version; DO NOT persist any query whose key includes 'credentials'.
2. src/lib/queryKeys.ts factory: ghl.pipelines(), ghl.schemas(), ghl.fields(), ghl.assocKeys(), ghl.users(), ghl.tags(), ghl.contacts(params), ghl.contact(id), ghl.opps(params), ghl.opp(id), ghl.records(schema, params), ghl.record(schema, id), ghl.relations(recordId), ghl.conversations(params), ghl.messages(id), ghl.events(range), ghl.tasks(params), ghl.notes(contactId), sb.profile(), sb.creds(), sb.docs(params).
3. useBootstrap(): after credentials load, Promise.all → pipelines(+stages), the 3 custom-object schemas, custom field definitions, association keys, calendars, users, tags. staleTime 24h. Branded splash (logo + progress) until settled; partial-failure = app loads with per-widget errors, full auth failure = Integrations.
4. PipelineRegistry (context/module): byName('lead'|'buyer'|'seller') → {pipelineId, stages[{id,name,position,color}]}; stageLabel(stageId); stagePosition(stageId). Match names case-insensitively with sensible fallbacks ("Lead Nurture Pipeline", "Buyer Pipeline"/"Buyer Transaction", "Seller Pipeline"); surface a Settings warning if a pipeline can't be resolved.
5. Prefetch utils: usePrefetchOnHover(queryKey, fn) for desktop nav items + list rows; route loaders prefetch page-1 for the target module.
6. seedDetailCache(listKey→items, detailKeyFn): after any list query, setQueryData for each record's detail key.
7. optimisticMutation helper: {queryKey, updater, mutationFn} with cancel/snapshot/rollback/invalidate.
8. VirtualizedTable + VirtualizedList components (TanStack Virtual) used by all long lists; useGhlInfinite(schemaOrService, params) wrapping searchAfter cursors.
9. staleTime tiers constant: SCHEMA 24h, LIST 60s, DETAIL 30s, MESSAGES 15s (+refetchInterval 15s while thread mounted).

Acceptance: cold login shows splash then instant dashboard shell; second visit paints lists from persisted cache then revalidates; React Query devtools shows seeded detail caches.
```

## Prompt P1.5 — Settings ▸ Integrations (PIT onboarding)

```text
TASK 1.5 from TASKS.md.

Build /settings/integrations on both surfaces (also the first-run gate).

1. Setup wizard state (not configured): explainer of Private Integration Tokens with steps to create one in GHL (Settings → Private Integrations → New, select scopes) + link https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken. Scope checklist rendered: contacts r/w, opportunities r/w, objects/schema r, objects/record r/w, associations r/w, conversations r/w + message w, calendars r/w + events r/w, users r, locations r, custom fields/values r, tags r/w, medias r/w, tasks r/w, notes r/w.
2. Form: Location ID (text), PIT (password input w/ show toggle). "Test connection" → validateCredentials → success card shows live location name; failure shows mapped error (bad token / wrong location / missing scope hint from status).
3. Save → upsert public.ghl_credentials → refresh credential store → trigger bootstrap → route to dashboard (first-run) or toast (edit).
4. Connected state: masked token (••••last4), location name, last validated timestamp, Re-test, Replace token, Disconnect (delete row, confirm).
5. Security copy: token stored in your Supabase account (RLS-protected), only transmitted from your session to GHL; v2 will proxy via Edge Functions.

Acceptance: brand-new user goes sign-up → confirm → wizard → live dashboard without touching code or env files.
```

---

# PHASE 2 — DASHBOARD

## Prompt P2.1 — Desktop Dashboard

```text
TASK 2.1 from TASKS.md. References: desktop/dashboard.jsx (port composition + styling), GHL_Integration_Mapping.md §2.

Build /(dashboard) desktop view — every widget LIVE:
1. NEXT UP hero: soonest upcoming appointment (calendars.eventsByRange(now → +7d), sort asc, first). Title, event-type chip (tag), start time + live Countdown, client chip → contact/lead/client detail, location line, Confirm/Reschedule quick actions. Empty: "No upcoming appointments" + New Event CTA.
2. KPI GRID (each card = one cached count query; clickable → pre-filtered module route):
   - Active Leads: opportunities.search(lead pipeline, status open) total
   - Active Clients: buyer+seller pipelines open totals summed
   - Under Contract: opportunities at stage position ≥ "Under Contract" (PipelineRegistry)
   - Pending Offers: offers.search(status in submitted/pending) total
   - New Leads (7d): lead pipeline, createdAt ≥ now-7d
   - Closings this month: offers accepted w/ closing_date in current month (fallback: opportunities w/ closing custom field)
3. NEEDS ATTENTION: overdue tasks (tasksGlobal.search dueDate<now, incompleted), stale leads (lastActivity > 7d in lead pipeline), offers w/ irrevocable_until < 48h, today's unconfirmed appointments. Each row deep-links; per-section counts.
4. NEW LEADS: 5 newest lead-pipeline opportunities — name, source, TempBadge, age.
5. PENDING OFFERS: 5 offers — price (Money), property address, StatusChip, irrevocable Countdown.
6. ACTIVITY FEED: merge (client-side, sorted desc, capped 30) recent notes + completed tasks + appointments created + opportunity stage changes if available; FUNCTIONAL filter chips (All/Notes/Tasks/Events/Stage) — chips filter the merged array.
7. 3-column responsive-within-desktop grid per prototype; every widget: skeleton, empty, error+retry independently.

Acceptance: with a live sub-account, all numbers/lists are real; KPI clicks land on correctly pre-filtered pages (wire filters via router search params even if modules are still stubs).
```

## Prompt P2.2 — Mobile Dashboard + Global Search screen

```text
TASK 2.2 from TASKS.md. References: mobile/screen-dashboard.jsx.

1. "NOW" card: current-or-next appointment with live countdown; quick actions Call (tel:), Text (sms: or → conversation), Directions (maps URL from location).
2. KPI horizontal snap-scroll: same six live KPIs as P2.1 (shared hooks — do not refetch separately).
3. Needs-attention widget (top 4 + "view all"), New Leads (3), Pending Offers (3).
4. Activity feed with functional chips; pull-to-refresh (invalidate dashboard keys).
5. SEARCH SCREEN (opened from top search field): recent searches persisted (localStorage, max 8, clearable), "Browse by type" tiles (Leads/Clients/Contacts/Listings/Offers/Properties → module routes), debounced (300ms) live search fanning out to contacts.search + opportunities.search + myListings.search + offers.search, grouped results with type icons and highlighted match; tap → detail route.

Acceptance: dashboard usable one-handed; search returns live grouped results in <1s on warm cache.
```

---

# PHASE 3 — LEADS

## Prompt P3.1 — Leads list & Kanban (Desktop)

```text
TASK 3.1 from TASKS.md. References: desktop/leads.jsx (port both views), GHL_Integration_Mapping.md §4.

Data: useGhlInfinite over opportunities.search {pipelineId: lead, limit 50}; contact fields denormalized on cards.
1. LIST VIEW: VirtualizedTable — columns Name (avatar+name), Role (RoleBadge from contact.type custom field), Stage (StageDot+label), Temp (TempBadge from temperature:* tag), Budget/Target (Money — buyer_budget or target_list_price), Source, Last Contact (relative), Age, Value. Sticky header; client-side column sort over loaded pages w/ sort indicator; row hover prefetches contact+opportunity detail; row click opens right detail pane AND sets /leads/:id.
2. FILTERS (all combine, reflected in URL search params): segmented All/Buyers/Sellers; Temp chips Hot/Warm/Cold (multi); Source select (distinct sources from tags/bootstrap); Assigned select (users); Stage multi-select. Debounced search box → q param.
3. KANBAN: columns = live lead-pipeline stages; column header stage dot + name + count + total value (tabular); dense cards (name, role avatar, temp, budget, age); horizontal scroll; DRAG-AND-DROP (dnd-kit): drop → optimistic stage move + PUT /opportunities/{id} {pipelineStageId}, rollback+toast on error.
4. List/Board toggle persisted (localStorage per user); result count + active-filter pills w/ clear-all.

Acceptance: filters/sorts/drag all hit live data; URL is shareable/restorable.
```

## Prompt P3.2 — Leads (Mobile)

```text
TASK 3.2 from TASKS.md. References: mobile/screen-leads.jsx.

1. LIST: FilterChipRow (same filter model as P3.1, horizontally scrollable); SwipeRow cards (role badge, stage dot, temp, budget/target, last-contact age; inline call/text buttons):
   - swipe RIGHT reveals Done → opportunities.updateStatus(id,'won') optimistic
   - swipe LEFT reveals Reschedule (opens New Task/Event sheet prelinked) and Delete (confirm sheet → opportunities.delete)
2. BOARD: vertical stacked collapsible lanes (stage dot, count, total value in header); lane color = identity only, never card fill.
3. Segmented List/Board toggle; infinite scroll; pull-to-refresh; tap card → /leads/:id full-screen detail.

Acceptance: swipe gestures don't conflict with vertical scroll; all mutations optimistic w/ rollback.
```

## Prompt P3.3 — Lead Detail (Both)

```text
TASK 3.3 from TASKS.md. References: desktop/leads.jsx (right pane), mobile/screen-lead-detail.jsx, GHL_Integration_Mapping.md §5.

1. HEADER: avatar, name, role badge, temp badge, stage selector (dropdown, inline stage update), last contact age, quick actions (Call/Text/Email/Note).
2. TABS (Buyer variant — role:buyer):
   - Buyer Info: budget, pre-approval status, must-haves, timeline. Editable inline (RHF+Zod) → PUT /contacts/{id} custom fields.
   - Properties: associated MLS records (read-only list).
3. TABS (Seller variant — role:seller):
   - Seller Info: target price, urgency, property address. Editable inline.
   - Property: associated my_listings record (read-only stub).
4. SHARED TABS:
   - Tasks: GET /contacts/{id}/tasks; list w/ optimistic complete toggle; Add Task button.
   - Notes: GET /contacts/{id}/notes; list; Add Note button.
   - Appointments: GET /contacts/{id}/appointments; list; New Event button.
   - Activity: timeline merging the above.
5. (D) renders in the right split-pane; (M) renders full-screen with sticky header.

Acceptance: editing a custom field updates GHL and invalidates the contact cache; tabs render correct variants.
```

## Prompt P3.4 — Lead Modals & Conversion

```text
TASK 3.4 from TASKS.md.

1. NEW LEAD (Sheet/Modal): Name, Role (buyer/seller/investor), Phone, Email, Budget, Source, Temperature.
   - Submit → POST /contacts/ (with tags) → POST /opportunities/ (Lead Nurture pipeline, stage 1) → invalidate lists.
2. CONVERT LEAD FLOW (Dialog):
   - Triggered from Lead Detail header.
   - Form: Target Pipeline (Buyer/Seller), Starting Stage, Value (pre-fills from budget).
   - Submit → PUT /opportunities/{id} (update pipelineId, stageId, value) + POST /contacts/{id}/tags (add lifecycle:client) → route to /clients/:id.
3. Delete/Archive: confirm dialog → DELETE /opportunities/{id} → route to /leads.

Acceptance: creating a lead shows up in GHL immediately; converting a lead moves it out of the Leads view and into Clients.
```

---

# PHASE 4 — CLIENTS (Buyers & Sellers)

## Prompt P4.1 — Clients Pipeline Views

```text
TASK 4.1 from TASKS.md. References: desktop/screens.jsx, mobile/screen-clients.jsx, GHL_Integration_Mapping.md §6.

Data: opportunities.search over Buyer OR Seller pipeline (never merged).
1. Pipeline Switcher: segmented control (Buyer / Seller) at the top. Persist selection to localStorage.
2. Header Aggregates: active count + total value for the *currently selected* pipeline.
3. KANBAN (D): lanes = pipeline stages. Cards: name, stage, value, DOM (if associated listing), status tag (Firm/Under Contract via tags). Drag-drop optimistic stage update.
4. LIST (D): Name, Stage, Status tag, Value, DOM, Next milestone, Closing date. Sortable.
5. KANBAN (M): vertical collapsible lanes, summary meta line.
6. Filters: stage, status tag, assigned user.

Acceptance: toggling Buyer/Seller completely swaps the stages and data; drags update GHL.
```

## Prompt P4.2 — Client Detail (Buyer)

```text
TASK 4.2 from TASKS.md. References: screen-client-detail-buyer.jsx, GHL_Integration_Mapping.md §7.

1. Header: Name, Stage dot, Pipeline step-dot progress bar (visualize stage position).
2. Metric Grid: Budget, Pre-Approval, Active Offer (from associated offer), Target close.
3. Tabs:
   - Overview: contact + buyer custom fields (editable).
   - Properties: associated properties (MLS records).
   - Offers: associated real_estate_offer records (summary list → links to offer detail).
   - Appointments, Tasks, Notes, Activity, Documents (stub).
4. Sticky Action Bar (M): Call, Text, Note, Appt.
5. Stage advance control: explicit "Next Stage" button with confirmation.
```

## Prompt P4.3 — Client Detail (Seller)

```text
TASK 4.3 from TASKS.md. References: screen-client-detail-seller.jsx.

1. Header: list price, current high offer (max over associated offers), DOM (from associated my_listings).
2. Six-stage seller progress bar.
3. Tabs:
   - Overview: seller custom fields (editable).
   - Listing: associated my_listings record (editable fields).
   - Offers: comparison table sorted by net proceeds (price - conditions cost heuristic). Accept/Counter/Decline actions.
   - Showings: calendar events filtered by property.
   - Marketing: views/saves stats.
   - Tasks, Notes, Activity, Documents.
```

## Prompt P4.4 — Dual Client Handling & Modals

```text
TASK 4.4 & 4.5 from TASKS.md.

1. Dual Client Detection: if contact has open opps in BOTH Buyer and Seller pipelines.
   - (D) Side-by-side dual-opportunity layout (split pane).
   - (M) Buy/Sell segmented tabs in the detail view.
   - Linked timeline: combined activity.
2. NEW CLIENT (Sheet/Modal): Name, Type (buyer/seller), Stage, Phone, Email, Budget/Property.
   - Submit → Contact + Opportunity + Tags.
3. Edit Stage / Close Actions: win/loss/abandon → PUT /opportunities/{id}/status.

Acceptance: creating a client directly bypasses the lead pipeline; dual clients render correctly without crashing.
```

---

# PHASE 5 — CONTACTS

## Prompt P5.1 — Contacts Directory & Detail

```text
TASK 5.1 & 5.2 from TASKS.md. References: desktop/contacts.jsx, mobile/screen-contacts.jsx.

1. DIRECTORY (B):
   - Data: GET /contacts/ (cursor pagination).
   - (D) Split pane: virtualized list left, detail right.
   - (M) List with quick call/text buttons, alpha index scrubber.
   - Filters: role tags (Vendors, SOI, RE Agents, Team, Past, Leads, Clients).
2. DETAIL (B):
   - Header: avatar, name, editable role tags, source.
   - Tabs: Info (phone, email, address, DND — editable), Vendor variant (Service Type, Priority custom fields), Tasks, Notes, Activity, Related (associated opps/listings).
3. MODALS (B):
   - New Contact: name, phone, email, roles, source. Duplicate check (warning if email/phone exists).
   - Delete contact (confirm).
```

---

# PHASE 6 — MY LISTINGS

## Prompt P6.1 — Listings Inventory & Detail

```text
TASK 6.1, 6.2, 6.3 from TASKS.md. References: desktop/screens.jsx, mobile/screen-props-offers.jsx.

1. INVENTORY (B):
   - Data: POST /objects/custom_objects.my_listings/records/search.
   - (D) Card grid + table toggle. (M) Card list.
   - Fields: photo, address, MLS#, price, stage chip, beds/baths/sqft, DOM.
   - Filters: stage, price, beds/baths.
2. DETAIL (B):
   - Hero image carousel, price, status, specs grid, public remarks.
   - Tabs: Overview, Offers (associated, sorted net), Showings (calendar events), Marketing, Documents (stub), Seller (associated contact).
   - Inline edit of fields → PUT record.
3. MODALS:
   - New Listing: address, MLS#, price, stage, specs, seller contact link (creates listing_to_contact association).
```

---

# PHASE 7 — OFFERS

## Prompt P7.1 — Offers & Transactions

```text
TASK 7.1, 7.2, 7.3, 8.1, 8.2 from TASKS.md.

1. OFFERS LIST (B):
   - Data: custom_objects.real_estate_offer.
   - Table/Cards: Property, Buyer/Seller, Price, Status, Irrevocable countdown (highlight < 24h).
2. OFFER DETAIL (B):
   - Terms panel (price, deposit, dates, conditions).
   - Negotiation timeline (counter chain).
   - Actions: Accept / Decline / Counter (opens New Offer modal linked to parent).
3. TRANSACTIONS LIST (B):
   - Derived view: Opportunities in Buyer/Seller pipelines at/after "Under Contract" stage.
   - Table: client, side, property, contract price, closing date, status.
4. TRANSACTION DETAIL (B):
   - Milestone tracker (Under Contract → Closed).
   - Critical dates countdowns; parties panel (associated contacts).
   - Commission calculator card.
```

---

# PHASE 11 — CALENDAR & TASKS

## Prompt P11.1 — Calendar & Tasks

```text
TASK 11.1, 11.2, 12.1, 12.2 from TASKS.md.

1. CALENDAR (B):
   - Data: GET /calendars/events by range.
   - Views: (D) Week, Day, Month, Agenda. (M) Day/Week/Agenda.
   - Conflict detection banner.
   - Event Detail Modal: kind chip, time, client/property links, notes, status actions (confirm/showed/noshow).
   - New Event Modal: type, title, date/time, client picker.
2. TASKS (B):
   - Data: POST /locations/{locationId}/tasks/search.
   - List grouped by Today / Overdue / Upcoming.
   - Complete toggle (optimistic).
   - New Task Modal: title, due, body, client/property links, priority.
```

---

# PHASE 18 — GLOBAL COMPLETION

## Prompt P18.1 — Global Search, Quick Add & Polish

```text
TASK 18.1, 18.2, 18.3 from TASKS.md.

1. QUICK ADD (B):
   - (D) Topbar menu → wires to all New * modals.
   - (M) FAB picker → wires to all creation sheets.
2. GLOBAL SEARCH (B):
   - Parallel search across contacts, opportunities, listings, offers.
   - Grouped results with type icons. Keyboard nav (cmd+k). Recent searches (localStorage).
3. POLISH:
   - Notifications popover/sheet (derived from overdue tasks, expiring offers, unread msgs).
   - Verify 44px touch targets, focus rings, empty states, error boundaries.
   - Ensure NO mock data remains anywhere in the app.
```
