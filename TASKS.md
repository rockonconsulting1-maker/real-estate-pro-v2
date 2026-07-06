# Real Estate Pro CRM — Master Build TASKS.md

**Goal:** Complete React + TypeScript web app (Desktop & Mobile responsive), LIVE data from a GHL Sub-Account via Private Integration Token (PIT), Supabase for user auth. **NO MOCK DATA in the final app** — the design prototype's `mobile/data.jsx` is a *shape reference only*.

**Design source of truth (GitHub):** https://github.com/rockonconsulting1-maker/RealEstate-Pro-CRM---Design
Key reference files: `design.md`, `SCREENS.md`, `frontend-designs.md`, `GHL_Integration_Mapping.md`, `RC CRM Desktop.html`, `RC CRM Mobile.html`, `RC CRM Auth Desktop.html`, `RC CRM Auth Mobile.html`, `/desktop/*.jsx`, `/mobile/*.jsx`, both `styles.css` files, and the GHL schema docs (`SECTION_1`–`SECTION_6`, `GoHighLevel__GHL__API_Integration.txt`).

---

## Stack (locked)

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Language | TypeScript (strict) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS + CSS-variable token system (OKLCH tokens from `design.md`) |
| UI | shadcn/ui on Radix primitives |
| Server state | TanStack Query v5 |
| Local state | React Context + hooks |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |
| Charts | recharts |
| Dates | date-fns |
| Auth | Supabase (`https://xdenkkphnhjjpdirvsii.supabase.co`) |
| Data | GHL API 2.0 (`https://services.leadconnectorhq.com`) via PIT |

## Architecture rules (apply to every task)

- **Responsive, one codebase:** desktop layout ≥1024px (sidebar + topbar + split panes), mobile <1024px (TabBar + FAB + bottom sheets). Shared route tree; per-route `Desktop*`/`Mobile*` view components where layouts diverge; shared hooks/data layer always.
- **Data layer:** all GHL calls go through `src/lib/ghl/client.ts` + typed service modules in `src/lib/ghl/services/*`. UI components never call `fetch` directly.
- **Query keys:** centralized in `src/lib/queryKeys.ts`. Pattern: `['ghl', resource, params]`.
- **Live data only:** every list, detail, KPI, and dropdown reads from GHL (or Supabase for auth/profile). Loading = skeletons matching the design; empty = designed empty states; error = retryable error card.
- **v1 auth-to-data flow:** GHL PIT + Location ID stored on the authenticated Supabase user (private table with RLS, see Phase 1). Direct browser → GHL calls. (v2 will move to Supabase Edge Function proxy + webhooks — structure the client so only the base transport swaps.)
- **Custom objects:** `custom_objects.my_listings`, `custom_objects.properties` (MLS), `custom_objects.real_estate_offer`. Relations via Associations API.
- **Pipelines:** `Lead Nurture Pipeline` (Leads), `Buyer Pipeline` / `Buyer Transaction`, `Seller Pipeline` (Clients). IDs resolved at bootstrap, never hardcoded (except as `.env` fallbacks).
- **Every task's Definition of Done:** desktop + mobile implemented, wired to live GHL data, loading/empty/error states, TypeScript strict passes, matches `design.md` tokens.

## Performance & caching strategy (build in Phase 1, use everywhere)

1. **Bootstrap prefetch:** on login, one parallel batch fetches pipelines (+stages), custom object schemas, custom field definitions, association keys, calendar list, user list, and dashboard page-1 data — before the shell renders (behind a branded splash).
2. **Persisted cache:** TanStack Query + `@tanstack/query-persist-client` (localStorage/IndexedDB) so repeat visits render instantly from cache, then revalidate (stale-while-revalidate).
3. **staleTime tiers:** schema/pipelines/fields = 24h; lists = 60s; detail records = 30s; conversations = 15s + refetchInterval while thread open.
4. **Route-level prefetch:** prefetch a module's page-1 query on nav-item hover (desktop) / on tab mount (mobile). Prefetch detail record on list-row hover.
5. **Pagination:** `searchAfter` cursor pagination on custom-object search & contacts; `useInfiniteQuery` with virtualized lists (TanStack Virtual) for large tables.
6. **Optimistic updates:** stage drags, task toggles, note edits, message send — update cache immediately, rollback on error.
7. **Denormalized cache seeding:** when a list loads, seed each record's detail query cache so detail pages open instantly.
8. **Request discipline:** batch parallel requests with `Promise.all`, dedupe via Query, respect GHL rate limits (100 req/10s burst) with a small client-side queue + exponential backoff on 429.

## Legend

`[ ]` open · `[x]` done · **(D)** desktop · **(M)** mobile · **(B)** both surfaces
Each phase pairs with a prompt in `VIBE_PROMPTS.md` (P0.1, P2.3, etc.).

---

# PHASE 0 — Project Foundation

## 0.1 Scaffold & tooling → Prompt P0.1
- [x] Vite + React 18 + TS strict scaffold; path alias `@/`
- [x] Install/configure: react-router-dom v6, @tanstack/react-query (+devtools, persist-client), tailwindcss, shadcn/ui init, react-hook-form, zod, @hookform/resolvers, lucide-react, recharts, date-fns, @supabase/supabase-js, @tanstack/react-virtual
- [x] ESLint + Prettier + strict tsconfig; `npm run typecheck`
- [x] `.env` handling: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, optional `VITE_GHL_*` dev fallbacks; `.env.example` committed
- [x] Folder structure: `src/{app,routes,components/{ui,shared,desktop,mobile},features/<module>,lib/{ghl,supabase},hooks,types,styles}`

## 0.2 Design-system port → Prompt P0.2
- [x] Port OKLCH token set from repo `design.md` + `desktop/styles.css` + `mobile/styles.css` into `src/styles/tokens.css` (CSS variables) and map into Tailwind config (colors, radius, shadows, spacing, typography)
- [x] Typography scale + tabular numerals for money/time; `Money`, `Countdown`, `Spark`, `Avatar`, `StageDot`, `TempBadge`, `RoleBadge` shared primitives (port from `desktop/shell.jsx`)
- [x] Semantic vs stage color separation rule (stage colors never fill cards)
- [x] Dark mode scaffolding (class strategy, token overrides) — P3 design-brief item, wire the toggle in Settings
- [x] Skeleton, EmptyState, ErrorState, Toast (sonner or shadcn toast) shared components
- [x] 44×44 touch targets on mobile; focus rings preserved

## 0.3 Responsive app shell & navigation → Prompt P0.3
- [x] **(D)** Sidebar: logo, nav groups (Dashboard, Leads, Clients, Contacts, My Listings, Offers, Transactions, MLS Properties, Conversations, Calendar, Tasks, Notes, Docs, Reports, Team, Settings), collapse state, active indicators — port from `desktop/shell.jsx`
- [x] **(D)** Topbar: global search field, breadcrumbs, Quick Add button, notifications bell + popover, user avatar menu (profile, settings, sign out)
- [x] **(M)** TabBar: Dashboard, Leads, Clients, Calendar, More (More = sheet with remaining modules) — port pattern from `mobile/app.jsx`
- [x] **(M)** FAB + FabPicker sheet (Lead, Client, Listing, Offer, Task, Note, Event) — routes to creation sheets
- [x] **(M)** Safe-area insets, gesture-friendly bottom sheets (vaul or Radix Dialog bottom variant)
- [x] Route tree with lazy-loaded modules + Suspense skeletons; 404 route; scroll restoration
- [x] `useSurface()` hook (desktop/mobile breakpoint) + per-route view switcher
- [x] Global search overlay **(B)**: recent searches, browse-by-type, live results across contacts/leads/clients/listings/offers (wired in Phase 2+, stub now)

---

# PHASE 1 — Auth, Supabase & GHL Integration Layer

## 1.1 Supabase client & auth pages → Prompt P1.1
Reference: `RC CRM Auth Desktop.html`, `RC CRM Auth Mobile.html` (6 screens each)
- [x] `src/lib/supabase/client.ts` singleton
- [x] **(B)** Sign In: email+password, show/hide toggle, error states, "Welcome back" layout; desktop = left brand panel w/ tagline+features+stage dots, mobile = full-screen
- [x] **(B)** Create Account: first/last name, email, brokerage, phone, password + live strength meter (Weak/Fair/Strong), confirm, ToS checkbox → `supabase.auth.signUp` with user metadata (first_name, last_name, brokerage, phone)
- [x] **(B)** Forgot Password: email → `resetPasswordForEmail` with redirect
- [x] **(B)** Check Your Email: redacted email display, resend link (with cooldown)
- [x] **(B)** Reset Password: new + confirm w/ strength meter → `updateUser`
- [x] **(B)** Password Changed: success screen → Sign in CTA
- [x] Zod schemas for all auth forms; RHF integration; inline field errors
- [x] Email confirm flow (`token_hash` handling route)

## 1.2 Session, guards & profile store → Prompt P1.2
- [x] AuthProvider context: session, user, loading; `onAuthStateChange` subscription
- [x] `<ProtectedRoute>` wrapper; redirect to /auth/sign-in preserving intended path; auth pages redirect away when signed in
- [x] Supabase `public.profiles` table (id FK auth.users, first_name, last_name, brokerage, phone, avatar_url) + signup trigger + RLS (owner-only)
- [x] Supabase `public.ghl_credentials` table (user_id PK/FK, pit_token, location_id, calendar_id default, updated_at) + **RLS owner-only select/insert/update** — SQL migration file committed
- [x] `useGhlCredentials()` hook: load once post-login, cache in memory (not localStorage), expose `{pit, locationId, isConfigured}`
- [x] If not configured → route to Settings ▸ Integrations onboarding step

## 1.3 GHL API client & service layer → Prompt P1.3
Reference: `GoHighLevel__GHL__API_Integration.txt`, `GHL_Integration_Mapping.md`, https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken
- [x] `ghlFetch` transport: base `https://services.leadconnectorhq.com`, headers `Authorization: Bearer <PIT>`, `Version` header per GHL docs, JSON handling, typed errors (401 → credentials invalid banner, 429 → queued retry w/ backoff, 5xx → retry once)
- [x] Rate limiter (token bucket) + request dedupe
- [x] Typed service modules: `contacts.ts`, `opportunities.ts` (+pipelines), `objects.ts` (generic custom-object CRUD + search w/ searchAfter), `associations.ts` (keys + relations), `conversations.ts`, `calendars.ts` (+appointments), `tasks.ts`, `notes.ts`, `users.ts`, `customFields.ts`, `customValues.ts`, `tags.ts`, `locations.ts`, `medias.ts`
- [x] Zod response schemas per service → inferred TS types in `src/types/ghl.ts`
- [x] `validateCredentials()` = `GET /locations/{locationId}` smoke test

## 1.4 Query architecture, bootstrap & cache persistence → Prompt P1.4
- [x] QueryClient config: default staleTime tiers, retry policy, persister (localStorage w/ 24h maxAge, buster on app version)
- [x] `queryKeys.ts` factory for every resource
- [x] `useBootstrap()`: parallel-load pipelines+stages, custom object schemas (3), custom field defs, association keys, calendars, location users, tags → stored in long-stale queries; branded splash until resolved
- [x] `PipelineRegistry` helper: resolve pipeline/stage IDs by name ("Lead Nurture", "Buyer", "Seller"); stage id→label/color maps
- [x] Hover/route prefetch utilities; list→detail cache seeding helper
- [x] Optimistic mutation helper (`optimisticUpdate(queryKey, updater)`) with rollback
- [x] Infinite query + virtualization pattern component (`VirtualizedTable`, `VirtualizedList`)

## 1.5 Settings ▸ Integrations (credentials onboarding) → Prompt P1.5
- [x] **(B)** Integrations screen: PIT input (password field), Location ID input, "Test connection" (validateCredentials → shows location name on success), Save (upsert ghl_credentials), rotate-token guidance copy, scopes checklist display
- [x] First-run gate: after sign-in, if `!isConfigured` → guided setup wizard (explain PIT creation steps w/ link to GHL docs)
- [x] Security note UI: token stored server-side in Supabase, sent only to GHL from this browser session

---
# PHASE 2 — Dashboard

Reference: `desktop/dashboard.jsx`, `mobile/screen-dashboard.jsx`, `GHL_Integration_Mapping.md §2`

## 2.1 Desktop Dashboard → Prompt P2.1
- [x] 3-column composition: NextAppt hero + timeline | work queue | stats
- [x] **Next Up / Now ribbon:** next appointment from `GET /calendars/events` (startTime ≥ now, sorted asc): title, time, countdown (`Countdown` primitive), client chip (contact link), location, event-type chip; map placeholder/link
- [x] **KPI grid:** Active Leads (opportunity search count, Lead Nurture pipeline, status=open), Active Clients (Buyer+Seller pipelines open), Under Contract (stage filter), Pending Offers (`real_estate_offer` search status=submitted/pending), New Leads this week (createdAt ≥ 7d), Closings this month (closing_date within month) — each KPI clickable → routes to filtered module
- [x] **Needs Attention widget:** overdue tasks (tasks search, dueDate < now, incompleted), stale leads (no activity Xd), offers expiring (irrevocable_until < 48h), appointments unconfirmed today
- [x] **New Leads list:** latest 5 opportunities in Lead Nurture (name, source, temp badge, age) → lead detail
- [x] **Pending Offers list:** latest offers w/ price, property address, status chip, countdown to irrevocable
- [x] **Activity feed:** merged recent notes + task completions + stage changes + messages (parallel queries, merged+sorted client-side) with type filter chips (functional, not visual-only)
- [x] Loading skeleton matching 3-col layout; per-widget error/empty states

## 2.2 Mobile Dashboard → Prompt P2.2
- [x] "Now" card (active/next appointment) with countdown + call/text/directions quick actions
- [x] Horizontal KPI stat scroll (same live KPIs, swipeable)
- [x] Needs-attention widget, New Leads (top 3), Pending Offers (top 3)
- [x] Activity feed with functional filter chips; pull-to-refresh
- [x] Global Search screen (from TopBar search): recent searches (localStorage), browse by type, debounced live search across contacts + opportunities + listings + offers

---

# PHASE 3 — Leads (Buyers & Sellers)

Reference: `desktop/leads.jsx`, `mobile/screen-leads.jsx`, `mobile/screen-lead-detail.jsx`, `GHL_Integration_Mapping.md §4–5`
Data: `POST /opportunities/search` (pipelineId = Lead Nurture) + contact custom fields.

## 3.1 Leads list & board (Desktop) → Prompt P3.1
- [x] **List view:** sortable table (Name, Role, Stage dot, Temperature, Budget/Target, Source, Last Contact, Age, Value); column sort client-side on loaded pages; sticky header; row hover prefetches detail
- [x] **Filter chips row:** All / Buyers / Sellers (contact.type custom field), Hot/Warm/Cold (tags `temperature:*`), Source dropdown, Assigned-to dropdown (location users), stage multi-select
- [x] **Search:** debounced `q` on opportunities search
- [x] **Kanban board view:** columns = live Lead Nurture stages (from PipelineRegistry), cards (name, role avatar, temp, budget, age), horizontal scroll, **drag-and-drop → `PUT /opportunities/{id}` pipelineStageId with optimistic move**
- [x] View toggle (List/Board) persisted per user (localStorage)
- [x] Master-detail split pane: row click opens detail pane right; deep-link `/leads/:id`

## 3.2 Leads (Mobile) → Prompt P3.2
- [x] List: FilterChipRow (same filters), SwipeRow cards — swipe right = Done (opportunity status won), swipe left = Reschedule (opens task/event sheet) / Delete (confirm → DELETE /opportunities/{id})
- [x] Vertical collapsible Kanban stack (lane header: stage dot, count, total value tabular)
- [x] Segmented List/Board toggle; pull-to-refresh; infinite scroll

## 3.3 Lead Detail (B) → Prompt P3.3
- [x] Header: avatar, name, role badge, temp badge, stage selector (inline stage move), last contact, quick actions Call/Text/Email/Note
- [x] **Buyer variant tabs:** Buyer Info (budget, pre-approval lender/status, must-haves, deal-breakers, timeline — editable custom fields w/ inline save `PUT /contacts/{id}`), Properties (associated MLS records + interest level), Appointments, Tasks, Notes, Activity, Files
- [x] **Seller variant tabs:** Seller Info (motivation, target price, urgency, competing agents, property address), Property, Comparables, Tasks, Notes, Activity
- [x] Tasks tab: CRUD `GET/POST/PUT/DELETE /contacts/{id}/tasks`, complete toggle optimistic
- [x] Notes tab: CRUD `/contacts/{id}/notes`
- [x] Appointments tab: `GET /contacts/{id}/appointments` + New Event modal
- [x] Activity: merged notes/tasks/messages/stage-history timeline
- [x] Editable contact core fields (phone, email, source, assignedTo, tags) with RHF+Zod inline forms

## 3.4 Lead modals & conversion (B) → Prompt P3.4
- [x] New Lead modal/sheet: Name, Role (buyer/seller/investor), Phone, Email, Budget, Source, Temperature → creates Contact (`POST /contacts/`) + Opportunity in Lead Nurture (`POST /opportunities/`) + tags
- [x] **Convert Lead flow:** choose Buyer or Seller pipeline + starting stage + monetary value → `PUT /opportunities/{id}` (move pipelines) or create new opportunity in target pipeline; apply lifecycle tags; success routes to Client Detail
- [x] Delete/archive lead w/ confirm

---

# PHASE 4 — Clients (Buyers & Sellers — NO RENTALS)

Reference: `desktop/screens.jsx`, `desktop/screens3.jsx`, `desktop/screens4.jsx`, `mobile/screen-clients.jsx`, `screen-client-detail*.jsx`, `GHL_Integration_Mapping.md §6–7`, `Buyer-Seller-Journeys.md`

## 4.1 Clients pipeline views (B) → Prompt P4.1
- [x] Buyer/Seller pipeline segmented switcher (two distinct stage sets — never merged)
- [x] **(D)** Kanban: live stages as lanes; cards show name, stage, value, DOM (associated listing), status tag (Firm/Under Contract via opportunity tags); drag = stage update optimistic
- [x] **(D)** List view: Name, Stage, Status tag, Value, DOM, Next milestone, Closing date; sortable; filters (stage, status tag, assigned)
- [x] **(M)** Vertical Kanban w/ collapsible lanes; summary meta line ("11 active · $13.8M" = live aggregate)
- [x] Header aggregates: active count + total pipeline value per pipeline (live)

## 4.2 Client Detail — Buyer (B) → Prompt P4.2
- [x] Pipeline step-dot progress (live stage position); metric grid: Budget, Pre-Approval, Active Offer (associated offer where status=submitted), Target close
- [x] Tabs: Overview (contact + buyer custom fields, editable) · Properties (saved/viewed associated MLS records, interest level) · Offers (associated `real_estate_offer` records → offer detail) · Appointments · Conversations (thread embed) · Tasks · Notes · Activity · Documents
- [x] Sticky action bar (M): Call · Text · Note · Appt
- [x] Stage advance control w/ confirm (maps to Buyer journey stages)

## 4.3 Client Detail — Seller (B) → Prompt P4.3
- [x] Header: list price, current high offer (max over associated offers), DOM (from associated my_listings record)
- [x] Six-stage seller progress; Offers tab = comparison table **sorted by net proceeds** (price − conditions cost heuristic) with accept/counter/decline actions
- [x] Tabs: Overview · Listing (associated my_listings record, editable) · Offers · Showings (calendar events filtered by property) · Marketing (views/saves stats fields) · Tasks · Notes · Activity · Documents

## 4.4 Client Detail — Both (dual buyer+seller) (B) → Prompt P4.4
- [x] Detect same contact with open opportunities in both pipelines
- [x] **(D)** side-by-side dual-opportunity layout; **(M)** Buy/Sell segmented tabs
- [x] Linked timeline: combined activity across both opportunities; cross-links between the sell listing and buy search

## 4.5 Client modals (B) → Prompt P4.5
- [x] New Client sheet/modal: Name, Type (buyer/seller), Stage, Phone, Email, Budget/Pre-approval (buyer) or Property/Price (seller) → Contact + Opportunity + custom fields + tags
- [x] Edit stage / close (won/lost/abandoned) actions → `PUT /opportunities/{id}/status`

---

# PHASE 5 — Contacts (Vendors, SOI, RE Agents, Team Members…)

Reference: `desktop/contacts.jsx`, `mobile/screen-contacts.jsx`, `GHL_Integration_Mapping.md §11`

## 5.1 Contacts directory (B) → Prompt P5.1
- [ ] **(D)** Split pane: searchable directory left (alpha groups, virtualized), detail right
- [ ] **(M)** Directory list w/ quick call/text buttons per row; alpha index scrubber
- [ ] Data: `GET /contacts/` w/ pagination; search via query param; filter chips by role tags (All / Vendors / SOI / RE Agents / Team / Past Clients / Leads / Clients — tag taxonomy `type:*`, `lifecycle:*`)
- [ ] Sort: name, recent activity, date added

## 5.2 Contact detail (B) → Prompt P5.2
- [x] Header: avatar, name, role tags (editable tag picker → `POST/DELETE contact tags`), source
- [x] Sections/tabs: Info (phone, email, address, DND flags — editable), Vendor variant (Service Type / Priority / Last Used / Preferred Comm custom fields), Tasks, Notes, Conversations link, Activity, Related (associated opportunities/listings/offers via relations)
- [x] Quick actions: Call, Text (→ Conversations composer), Email, Add note, Add task

## 5.3 Contact modals (B) → Prompt P5.3
- [x] New Contact modal/sheet: name, phone, email, role tag(s), source, address
- [x] Merge-duplicate helper (GHL duplicate search on email/phone before create; warn + open existing)
- [x] Delete contact w/ confirm

---

# PHASE 6 — My Listings (Agent inventory)

Reference: `desktop/screens.jsx` (My Listings), `mobile/screen-props-offers.jsx`, `GHL_Integration_Mapping.md §8`
Data: `POST /objects/custom_objects.my_listings/records/search`

## 6.1 Listings inventory (B) → Prompt P6.1
- [x] **(D)** Card grid + table toggle: photo, address, MLS#, price (Money), stage chip (listing_stage), beds/baths/sqft, DOM, views
- [x] **(M)** Card list w/ stage tracking strip
- [x] Filters: stage (Coming Soon/Active/Pending/Sold…), price range, beds/baths min, property type; sort: price, DOM, newest
- [x] Stage board view (optional lane view by listing_stage) with drag → record update

## 6.2 Listing detail (B) → Prompt P6.2
- [x] Hero image carousel (image_urls), price, status, specs grid, public remarks
- [x] Tabs: Overview · Offers (associated offers, sorted net) · Showings (calendar events matched to property) · Marketing (views/saves, price-history) · Documents (documents_ref) · Notes/Tasks · Seller (associated contact/opportunity link)
- [x] Inline edit of listing fields → `PUT /objects/custom_objects.my_listings/records/{id}`

## 6.3 Listing modals (B) → Prompt P6.3
- [x] New Listing sheet/modal: address, MLS#, list price, stage, beds, baths, sqft, type, seller contact link (creates association `listing_to_contact`)
- [x] Change-stage action; price-change action (records old price in history field)

---

# PHASE 7 — Offers

Reference: `desktop/screens.jsx` (Offers), `mobile/screen-props-offers.jsx`, `GHL_Integration_Mapping.md §10`, `SECTION_5` offer record shape
Data: `POST /objects/custom_objects.real_estate_offer/records/search` + associations (offer_to_property, offer_to_contact)

## 7.1 Offers table/list (B) → Prompt P7.1
- [x] **(D)** Table: Offer ID, Property address, Buyer/Seller, Offer price, Deposit, Status chip (Pending/Accepted/Declined/Countered), Irrevocable countdown, Closing date, Conditions deadline
- [x] **(M)** Offer cards w/ status + countdown
- [x] Filters: status, offer_type (buyer_offer/received), date range, property; sort: price, irrevocable, closing date
- [x] Urgency highlighting: irrevocable_until < 24h

## 7.2 Offer detail (B) → Prompt P7.2
- [x] Terms panel: purchase price, deposit, financing type, possession/closing dates, conditions + conditions_deadline, commission
- [x] Negotiation history timeline (counter chain — linked offer records or history field)
- [x] Associated records: property card, buyer contact, seller contact (via relations)
- [x] Actions: Accept / Decline / Counter (Counter opens pre-filled New Offer modal linked to parent) → status updates via `PUT` record
- [x] Condition checklist w/ toggle + deadline countdowns

## 7.3 Offer modals (B) → Prompt P7.3
- [x] New Offer sheet/modal: property picker (search my_listings + properties), buyer contact picker, price, deposit, financing type, dates, conditions multi-select → create record + create relations (offer_to_property, offer_to_contact)
- [x] Edit offer; withdraw offer

---

# PHASE 8 — Transactions

(Deals under contract → closed; derived surface over Opportunities in later stages + associated offers/listings.)

## 8.1 Transactions list (B) → Prompt P8.1
- [x] Data: opportunities in Buyer+Seller pipelines at/after "Under Contract" stage (PipelineRegistry stage-position filter)
- [x] Table/cards: client, side (Buy/Sell), property, contract price (accepted offer), key dates (conditions deadline, closing, possession), status (Conditional/Firm via tags), commission
- [x] Filters: side, month of closing, status; sort by closing date (default asc)
- [x] Closing-this-week / conditions-due widgets

## 8.2 Transaction detail (B) → Prompt P8.2
- [x] Milestone tracker (stage-mapped): Under Contract → Conditions → Firm → Clear to Close → Closed
- [x] Critical dates panel w/ countdowns; parties panel (client, co-op agent, lawyer, lender — associated contacts)
- [x] Tabs: Overview · Conditions checklist · Documents · Tasks · Notes · Activity
- [x] Commission calculator card (sale price, rate, splits → net) — S3 suggested screen, include here

---

# PHASE 9 — Properties (MLS)

Reference: `desktop/mls.jsx`, `mobile/screen-mls.jsx`, `GHL_Integration_Mapping.md §8–9`
Data: `POST /objects/custom_objects.properties/records/search`

## 9.1 MLS search (B) → Prompt P9.1
- [x] **(D)** Advanced filter bar: city, price min/max, beds+, baths+, property type, status; results grid/table toggle; saved-search chips
- [x] **(M)** Touch-optimized filter sheet + card feed, infinite scroll
- [x] Debounced text search; cursor pagination (searchAfter); result count
- [x] Sort: price asc/desc, newest, DOM

## 9.2 Property detail (B) → Prompt P9.2
- [x] Image carousel, price, status, specs, public remarks
- [x] Sections: Offers (associated), Showings (calendar events filter), Documents, Interested buyers (associated contacts)
- [x] Actions: Link to buyer client (create relation w/ interest level), Draft Offer (pre-filled New Offer), Add showing (New Event pre-filled)

---

# PHASE 10 — Conversations (Email, SMS, Messenger, WhatsApp, Webchat)

Reference: `desktop/conversations.jsx`, `mobile/screen-conversations.jsx`, `GHL_Integration_Mapping.md §12`

## 10.1 Inbox (B) → Prompt P10.1
- [x] Thread list: `GET /conversations/` — contact name/avatar, channel icon (sms/email/fb/whatsapp/webchat), lastMessageBody preview, time, unread badge; sorted by lastMessageDate
- [x] Filters: channel chips, Unread toggle, Starred, search by contact
- [x] **(D)** split-pane inbox | thread; **(M)** list → full-screen thread
- [x] Unread polling (refetchInterval 15s while mounted); mark-read on open

## 10.2 Thread view (B) → Prompt P10.2
- [x] `GET /conversations/{id}/messages` — bubbles by direction, channel-specific rendering (email subject block, call logs, review, group SMS per mobile design), day dividers, delivery status
- [x] Composer: channel switcher (SMS/Email/WhatsApp where available), text area, attachments (medias upload), templates dropdown (custom values merge)
- [x] Send: `POST /conversations/messages` typed per channel; optimistic bubble + status; Log Call action (type: call)
- [x] Contact context header → links to lead/client/contact detail

---

# PHASE 11 — Calendar

Reference: `desktop/screens.jsx` + `screens2.jsx`, `mobile/screen-calendar-full.jsx`, `screen-cal-tasks.jsx`, `GHL_Integration_Mapping.md §13`

## 11.1 Calendar views (B) → Prompt P11.1
- [x] Data: `GET /calendars/events` by range (fetch per visible range, cache by range key); appointment status colors (confirmed/showed/noshow); event-type chips via tags (Showing/Consult/Inspect/Offer/Call)
- [x] **(D)** Week (time grid), Day, Month, Agenda views; now-line; click event → Event Detail modal
- [x] **(M)** Day / Week / Month grids + Agenda-first view; horizontal day swipe
- [x] Conflict detection banner (overlapping events → banner + one-click Reschedule) — design.md §11.10
- [x] Date navigation (today, prev/next, mini month picker)

## 11.2 Event modals (B) → Prompt P11.2
- [x] Event Detail modal/sheet: kind chip, time, duration, client link, property link, location, notes; Edit + Add note + status actions (confirm/showed/noshow → `PUT /calendars/events/appointments/{id}`)
- [x] New Event: type (showing/consult/inspect/offer/call), title, date, time, duration, client picker, property picker (conditional on type), calendar select → `POST /calendars/events/appointments`
- [x] Reschedule flow (drag on desktop week grid = time update optimistic; sheet on mobile)

---

# PHASE 12 — Tasks

Reference: `desktop/screens.jsx`, `mobile/screen-cal-tasks.jsx`, `screen-tasks-notes.jsx`, `GHL_Integration_Mapping.md §14`

## 12.1 Tasks views (B) → Prompt P12.1
- [x] Data: `POST /locations/{locationId}/tasks/search` (all) + per-contact CRUD endpoints
- [x] Today + Overdue grouped list (M design); All / Today / Overdue / Upcoming / Completed filter chips
- [x] Group-by: Property, Client, Tag (from mobile screen-tasks-notes) — client-side grouping
- [x] **(D)** Bulk-edit table view toggle (multi-select → complete/reschedule/delete) + today's mini-calendar scheduler (drag unscheduled tasks onto slots) — design.md §11.11
- [x] Complete toggle optimistic everywhere; priority badge via `priority:*` tag
- [x] Sort: due date, priority, created

## 12.2 Task modals (B) → Prompt P12.2
- [x] New Task: title, due (quick picks Today/Tomorrow/Next week + custom), body, client/lead picker, property link, priority, assignee
- [x] Task Detail/Edit: editable title, complete toggle, due, priority, client, property, notes, delete (confirm)

---

# PHASE 13 — Notes

## 13.1 Notes feed & groups (B) → Prompt P13.1
- [x] Global feed: aggregate recent notes across recently-active contacts (batched `GET /contacts/{id}/notes`), newest first; author, linked record chip, tags
- [x] Group-by: Client, Property, Tag; search within notes (client-side over loaded)
- [x] **(M)** Quick Note minimal sheet (body + linked-to)

## 13.2 Note modals (B) → Prompt P13.2
- [x] New Note: body, client/lead picker, tags → `POST /contacts/{id}/notes`
- [x] Note Detail/Edit: editable body, linked-to selector, tags, delete

---

# PHASE 14 — Docs (Document Vault)

Reference: `mobile/screen-documents.jsx` (stub → full build, Screen Inventory S1), `Buyer-Seller-Journeys.md §2`

## 14.1 Vault (B) → Prompt P14.1
- [x] Storage: Supabase Storage bucket `documents` (RLS: owner) + metadata table `documents` (id, user_id, name, category, linked_record_type, linked_record_id, ghl_contact_id, size, mime, created_at); GHL record field `documents_ref` stores UUIDs
- [x] Category folders: Listing Agreements · Offer Docs · Inspection Reports · Client Files · MLS Sheets (+ journey doc types from Buyer-Seller-Journeys §2.2 as tag taxonomy)
- [x] Upload (drag-drop D / picker M), progress, preview (pdf/image), download, rename, delete
- [x] Link-to-record picker (client/listing/offer/transaction); filtered views per record surface in detail tabs
- [x] Search + filter by category/record; sort by date/name

---

# PHASE 15 — Reports (Analytics)

Reference: Screen Inventory S2 (suggested screen — build it)

## 15.1 Reports dashboard (B) → Prompt P15.1
- [x] GCI to date vs annual goal (goal stored in Supabase profile settings); recharts progress + bar
- [x] Deal volume by month (closed opportunities monetaryValue) — bar/sparkline
- [x] Pipeline conversion funnel: Lead → Client → Under Contract → Closed (counts via stage/status queries)
- [x] Average DOM (my_listings aggregate); Source attribution breakdown (contacts by source — pie/bar)
- [x] Date-range selector (This month/quarter/year/custom); export CSV of underlying rows
- [x] All aggregates computed client-side from paged live queries with cached results

---

# PHASE 16 — Team

## 16.1 Team directory (B) → Prompt P16.1
- [x] Data: `GET location users` (GHL users API) — name, role, email, phone, avatar
- [x] Member card + detail: assigned leads/clients counts (opportunity search by assignedTo), open tasks count
- [x] Reassign action: bulk reassign selected opportunities/contacts to another user
- [x] (If users API restricted by PIT scopes → fall back to team contacts tagged `type:team` and note limitation)

---

# PHASE 17 — Settings

Reference: `desktop/screens2.jsx`, `mobile/screen-settings.jsx`

## 17.1 Settings (B) → Prompt P17.1
- [x] Tab layout **(D)** / stacked sections **(M)**: Profile & Account · Notifications · Display · Integrations · Data
- [x] **Profile:** avatar upload (Supabase Storage), name, brokerage, phone (profiles table), email (Supabase auth email change flow), change password
- [x] **Notifications:** toggle preferences persisted to Supabase (new lead, offer updates, task due, appointment reminders)
- [x] **Display:** theme (Light/Dark/System — wires dark mode), density, default landing page, default calendar view
- [x] **Integrations:** the Phase 1.5 GHL credentials screen lives here; connection status card
- [x] **Data:** export my data (CSV of contacts/opps via paged fetch), clear local cache button, app version
- [x] Sign out (all screens), delete account (Supabase, confirm flow)

---

# PHASE 18 — Global & Cross-Cutting Completion

## 18.1 Quick Add & global modals (B) → Prompt P18.1
- [x] **(D)** Topbar Quick Add menu → New Lead / Client / Contact / Listing / Offer / Task / Note / Event modals (reuse module modals)
- [x] **(M)** FAB picker fully wired to all creation sheets
- [x] Notifications popover **(D)** / sheet **(M)**: derived feed (overdue tasks, expiring offers, unread messages, today's appointments) w/ deep links + mark-read state (localStorage)

## 18.2 Global search (B) → Prompt P18.2
- [x] Parallel search across contacts, opportunities (both pipelines groups), my_listings, properties, offers; grouped results w/ type icons; keyboard nav (cmd+k on desktop); recent searches

## 18.3 QA, polish & performance pass → Prompt P18.3
- [x] Verify every screen against `SCREENS.md` + Screen Inventory (50 mobile / 41 desktop / auth) — checklist sweep
- [x] Lighthouse pass: code-split confirmation, image lazy-load, bundle audit
- [x] Error boundary per route; offline banner; 401 credential-expired interceptor → Integrations
- [x] Accessibility: focus traps in modals, ARIA on kanban DnD, 44px targets, contrast check
- [x] Empty-state copy pass; skeleton coverage audit; toast coverage for all mutations
- [x] README: setup, env vars, PIT creation guide, architecture notes, v2 (Edge Function proxy + webhooks) migration notes
