# Real Estate Pro CRM — Product Requirements Document (PRD)

**Product:** Real Estate Pro CRM — Web Application (Desktop + Mobile)
**Version:** v1.0 — First Live-Data Release
**Status:** Approved for build
**Owner:** Product / RockOn Consulting
**Frontend framework:** React 18 + TypeScript (Vite)
**Data backend:** GoHighLevel (GHL) sub-account via Private Integration Token (PIT)
**Auth:** Supabase

### Where the docs live

This PRD lives in the build repo alongside the app source. The design system (`design.md`), integration mapping, and schema docs in this repo are the complete reference set — the app source itself is now the canonical implementation of the design.

**Companion documents in this repo:**

- `PRD.md` — this document (product requirements: the *what/why*)
- `TASKS.md` — the current remediation plan (dependency-ordered tasks with instructions and acceptance criteria)
- `REVIEW_REPORT.md` — full-repo review findings driving the remediation plan
- `design.md` — design system (tokens, primitives, patterns, file map)
- `GHL_Integration_Mapping.md` — screen → GHL endpoint/field mapping
- `Real Estate Pro CRM — Full Integration Schema.md` — consolidated GHL data schema (object catalog, data dictionary, associations, ERD)
- `Entity Breakdown.md` — entity-level breakdown supporting the schema doc

See **`AGENTS.md`** for a navigation guide that maps every task to the right doc.

---

## 1. Overview & Vision

Real Estate Pro CRM is a focused, high-density operational tool for independent real-estate agents and small teams. It replaces the generic GHL sub-account UI with a purpose-built, real-estate-native front end that speaks the agent's language — leads, clients, listings, offers, showings, and closings — while using the GHL sub-account as the live system of record.

The product ships as **one responsive React codebase** rendering two distinct surfaces from a shared route tree and data layer: a **desktop workspace** (≥1024px) for pipeline review, master-detail work, and offer ops, and a **mobile app** (<1024px) tuned for in-the-field work (the "Now" ribbon, swipe actions, quick call/text/directions).

The voice and feel are defined in `design.md`: professional, understated, dense, keyboard-friendly; a single calm-blue accent; time as a first-class citizen (countdowns everywhere a deadline exists).

**This is the first live-data version.** Its defining constraint is a direct browser → GHL integration using a Private Integration Token, with Supabase providing user authentication. A later version (out of scope here) will move data access behind a Supabase Edge Function proxy with webhooks; the client is structured so only the transport layer swaps.

---

## 2. Goals & Non-Goals

### 2.1 Product goals

1. Give an agent a single, fast surface for their entire day: what's next, what's overdue, what needs a decision.
2. Model the real-estate workflow natively — Leads → Clients (Buyer/Seller transactions) → Offers → Transactions → Closed — on top of GHL pipelines and custom objects.
3. Deliver a **seamless, near-instant UX** despite a remote CRM backend, through aggressive prefetch, persisted cache, and optimistic updates (§7).
4. Work equally well on desktop and phone from one codebase, matching `design.md` pixel-for-intent.
5. Operate entirely on **live GHL data** — no mock data in the shipped app.

### 2.2 Non-goals (v1)

- No Supabase Edge Function proxy, no GHL webhooks, no server-side sync engine (v2).
- No rentals workflow anywhere in the product (Clients are Buyers and Sellers only).
- No public/consumer-facing client portal (future work).
- No billing, marketing funnels, courses/memberships, e-commerce, or website/blog modules from the wider GHL object catalog — those objects exist in the sub-account but are not surfaced.
- No multi-agency or agency-level administration; the app is scoped to a single sub-account (`locationId`).
- No native mobile app store build (responsive web only; installable PWA is a nice-to-have, not a requirement).

---

## 3. Target Users & Personas

| Persona | Description | Primary needs |
|---|---|---|
| **Independent agent (primary)** | Solo REALTOR® running their own pipeline day-to-day, often on a phone between showings. | See the next appointment + drive time, triage overdue tasks and expiring offers, log notes/calls fast, advance a deal's stage. |
| **Small-team lead** | Agent with 1–3 team members; assigns and reviews. | Pipeline overview, reassignment, team activity, reports against a GCI goal. |
| **Team member / assistant** | Supports transactions; handles tasks, documents, showings. | Task lists by audience, document vault, calendar, conversations. |

The desktop surface skews toward planning and review (team lead / desk work); the mobile surface skews toward in-the-field execution (primary agent).

---

## 4. Scope — Core Modules (v1)

All modules must be built for **both desktop and mobile**, wired to live GHL/Supabase data, with loading skeletons, designed empty states, and retryable error states.

| # | Module | Purpose | Primary GHL data source |
|---|---|---|---|
| 1 | **Dashboard** | Day-at-a-glance: Now ribbon, KPIs, needs-attention, pending offers, activity feed. | Calendar events, opportunity search, tasks search, offer records |
| 2 | **Leads** (Buyers, Sellers) | Nurture funnel: list + Kanban, convert to client. | Opportunities in Lead Nurture pipeline + contact custom fields |
| 3 | **Clients** (Buyers, Sellers — **no rentals**) | Active transactions through to closing. | Opportunities in Buyer / Seller Transaction pipelines |
| 4 | **Contacts** (Vendors, SOI, RE Agents, Team, …) | Global person directory. | `GET /contacts` + role tags |
| 5 | **My Listings** | Agent's own inventory. | `custom_objects.my_listings` |
| 6 | **Offers** | Money instruments with expiry countdowns; accept/counter/decline. | `custom_objects.real_estate_offer` + associations |
| 7 | **Transactions** | Under-contract → funded closing coordination. | Opportunities at/after "Under Contract" + `custom_objects.transactions` |
| 8 | **Properties (MLS)** | Market search, comps, buyer matching. | `custom_objects.properties` |
| 9 | **Conversations** | Unified inbox: Email, SMS, Messenger, WhatsApp, Webchat. | `GET /conversations` + messages |
| 10 | **Calendar** | Day / Week / Month / Agenda; showings, consults, inspections. | `GET /calendars/events` (appointments) |
| 11 | **Tasks** | Action items across records; today/overdue/upcoming. | `POST /locations/{id}/tasks/search` + per-contact CRUD |
| 12 | **Notes** | Centralized note feed. | `/contacts/{id}/notes` |
| 13 | **Docs** | Document vault linked to records. | Supabase Storage + metadata table; GHL `documents_ref` field |
| 14 | **Reports** | GCI-to-goal, volume, funnel, DOM, source attribution. | Client-side aggregates over paged live queries |
| 15 | **Team** | Team directory, assignment counts, reassignment. | GHL users API (fallback: `type:team` contacts) |
| 16 | **Settings** | Profile & account, Notifications, Display, Integrations. | Supabase (profile/prefs) + GHL credentials |

Plus **Authentication** (sign in/up, forgot/reset, email confirm) and **cross-cutting** capabilities: global search, Quick Add / FAB, notifications feed.

### 4.1 Contacts — role taxonomy

Contacts are segmented by tag taxonomy (`type:*`, `lifecycle:*`): Vendors, Sphere-of-Influence (SOI), RE Agents (co-op/referral partners), Team Members, Past Clients, plus the Leads/Clients that also live as opportunities. Filter chips map to these tags.

### 4.2 Explicit "no rentals" rule

Clients represent **purchase/sale transactions only**. No rental listings, rental applications, tenant screening, or lease tracking anywhere in the product. This applies to Clients, Listings, Properties, and Offers.

---

## 5. System Architecture

### 5.1 High-level shape (v1)

```
┌─────────────────────────────────────────────────────────────┐
│  React 18 + TS SPA (Vite)  — one responsive codebase        │
│  ├── Auth (Supabase JS)  → session / JWT                    │
│  ├── Data layer (src/lib/ghl/*)  → typed services           │
│  │     • ghlFetch transport (PIT bearer, Version header)     │
│  │     • rate limiter + retry/backoff + dedupe               │
│  ├── TanStack Query v5  → cache, prefetch, persistence       │
│  └── UI: shared route tree → Desktop* / Mobile* views        │
└───────────────┬──────────────────────────┬──────────────────┘
                │ auth (JWT, RLS)           │ direct API calls (PIT)
                ▼                           ▼
        ┌───────────────┐        ┌──────────────────────────┐
        │  Supabase     │        │  GoHighLevel Sub-Account │
        │  • auth.users │        │  services.leadconnect... │
        │  • profiles   │        │  • contacts, opps        │
        │  • ghl_creds  │        │  • custom objects        │
        │  • documents  │        │  • associations, convos  │
        │  • Storage    │        │  • calendars, tasks      │
        └───────────────┘        └──────────────────────────┘
```

- **Single codebase, responsive:** desktop layout ≥1024px (sidebar + topbar + split panes); mobile <1024px (bottom TabBar + FAB + bottom sheets). Shared route tree; per-route `Desktop*` / `Mobile*` view components where layouts diverge; shared hooks/data layer always. A `useSurface()` hook resolves the breakpoint.
- **Data-layer discipline:** all GHL calls pass through `src/lib/ghl/client.ts` + typed service modules. UI components never call `fetch` directly. Query keys are centralized (`['ghl', resource, params]`).
- **Live data only:** every list, detail, KPI, and dropdown reads from GHL (or Supabase for auth/profile/docs).

### 5.2 Locked technology stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Language | TypeScript (strict) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS + CSS-variable OKLCH token system (from `design.md`) |
| UI primitives | shadcn/ui on Radix |
| Server state | TanStack Query v5 (+ persist-client) |
| Local state | React Context + hooks |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |
| Charts | recharts |
| Dates | date-fns |
| Virtualization | TanStack Virtual |
| Auth | Supabase (`@supabase/supabase-js`) |
| Data | GHL API v2/v3 via PIT |

---

## 6. Data & Integration Layer

### 6.1 GHL authentication — Private Integration Token (v1)

- **Transport:** `https://services.leadconnectorhq.com`, header `Authorization: Bearer <PIT>`, `Version` header per GHL docs, JSON.
- **Reference:** GHL Private Integrations Token — https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken
- **Required scopes:** `contacts.readonly/write`, `opportunities.readonly/write`, `objects.readonly/write`, `conversations.readonly/write`, `calendars.readonly/write`, plus tasks/notes/users/customFields/associations as needed.
- **Credential storage (v1 model):** the PIT and `locationId` are stored **server-side in Supabase** on a private, RLS-protected `public.ghl_credentials` table keyed to the authenticated user. They are loaded once post-login into memory (never localStorage) and attached to GHL requests **from the authenticated browser session only**.
- **Credential onboarding:** Settings ▸ Integrations provides a guided setup (PIT input as a password field, Location ID, "Test connection" via `GET /locations/{locationId}`, save/upsert, rotate-token guidance, scopes checklist). A first-run gate routes unconfigured users here.

> **Security note (explicit v1 limitation):** In this version the PIT is used for direct browser→GHL calls, so the token is present in the client session at runtime. This is an accepted, documented tradeoff for the first live release. **v2 moves all GHL access behind a Supabase Edge Function proxy** (token never reaches the browser) **plus webhooks for push updates.** The client transport is isolated so this swap does not touch feature code. UI must surface a plain-language note that the token is stored server-side and only sent to GHL from the user's session.

### 6.2 Supabase — auth & app-owned data

- **Auth:** email/password via Supabase (`getClaims` to validate local JWT), sign-up with user metadata (first/last name, brokerage, phone), forgot/reset, email confirm (`token_hash` flow), password change.
- **`public.profiles`** (FK `auth.users`, RLS owner-only): first_name, last_name, brokerage, phone, avatar_url; populated by signup trigger.
- **`public.ghl_credentials`** (user_id PK/FK, pit_token, location_id, default calendar_id, updated_at; RLS owner-only).
- **`public.documents`** metadata + Supabase Storage `documents` bucket (RLS owner) for the Docs vault; GHL records reference these via `documents_ref` (comma-separated Storage UUIDs).
- Session guards: `AuthProvider` context (`onAuthStateChange`), `<ProtectedRoute>` (redirect preserving intended path), auth pages redirect away when signed in.

### 6.3 GHL object model (what the app reads/writes)

**First-class objects (Objects API):** Contact (`contact`), Company (`business`), Opportunity (`opportunity`), Offer (`custom_objects.real_estate_offer`), Property/MLS (`custom_objects.properties`, unique on `mls`), My Listings (`custom_objects.my_listings`), Transaction (`custom_objects.transactions`).

**Supporting objects (dedicated namespaces):** Task, Note, Appointment, Calendar, Conversation, Message, Tag, User, Custom Field, Custom Value, Association.

**Pipelines (IDs resolved at bootstrap, never hardcoded except as `.env` fallbacks):**

- **Lead Nurture** → Leads module.
- **Buyer Transaction** (10 stages: Needs Analysis → Property Search → Offer Preparation → Offer Submitted → Under Contract → Inspection & Due Diligence → Conditions Removal → Financing Confirmation → Clear to Close → Closed).
- **Seller Transaction** (9 stages: Pre-Listing → Listing Agreement Signed → Listing Prep → Active on Market → Showings & Open Houses → Offer Review → Under Contract → Conditions & Closing Prep → Closed).

A `PipelineRegistry` helper resolves pipeline/stage IDs by name and provides stage-id → label/color maps.

**Custom field & tag conventions:** documented in `GHL_Integration_Mapping.md §18–20` (e.g., `contact.buyer_budget` MONETARY, `contact.buyer_must_haves` LARGE_TEXT, `properties.days_on_market` NUMERICAL; temperature/type/lifecycle tag taxonomies).

### 6.4 Associations (relationships)

Many-to-many relationships use the GHL Associations API (keys + relations). Required registry:

| From | To | Association key |
|---|---|---|
| Contact | Offer | `offer_to_contact` |
| Property (MLS) | Offer | `offer_to_property` |
| Opportunity | Property | `opportunity_to_property` |
| My Listing | MLS Property | `mls_to_property` |
| Opportunity | Transaction | `opportunity_to_transaction` |
| Contact | Company | `SYSTEM: BUSINESSES_CONTACTS_ASSOCIATION` |

Association keys are resolved at bootstrap. Full relationship matrix and cardinality live in `Real Estate Pro CRM — Full Integration Schema.md`.

### 6.5 API versioning & rate limits

- v2 is the current baseline (full field coverage); v3 namespace covers Objects/Associations. Send the `Version` header per the API reference.
- GHL per-sub-account limits: standard reads ~100 req/s, writes ~40 req/s, bulk ~10 req/s, search ~50 req/s. The client enforces a token-bucket limiter with request dedupe and exponential backoff on 429; a 401 triggers a "credentials invalid" banner routing to Integrations.

---

## 7. Performance & Caching Strategy (Seamless-UX Requirement)

A remote CRM backend must still feel instant. This section is a **hard requirement**, not a nice-to-have, and is built in the foundation phase and used by every module.

1. **Bootstrap prefetch (pre-cache before shell renders).** On login, one parallel batch (`Promise.all`) fetches the slow-changing spine — pipelines + stages, the 3 custom-object schemas, custom-field definitions, association keys, calendar list, location users, tags — plus dashboard page-1 data, behind a branded splash. The app shell renders only once this resolves, so the first painted screen already has data.
2. **Persisted cache (instant repeat visits).** TanStack Query + `@tanstack/query-persist-client` writes the cache to localStorage/IndexedDB (24h maxAge, busted on app-version change). Repeat visits render immediately from cache, then revalidate — stale-while-revalidate.
3. **staleTime tiers.** Schema / pipelines / fields = 24h; lists = 60s; detail records = 30s; conversations = 15s + `refetchInterval` while a thread is open. Tiers prevent redundant refetching of stable data.
4. **Route- and hover-level prefetch.** Prefetch a module's page-1 query on nav-item hover (desktop) or tab mount (mobile). Prefetch a detail record on list-row hover so detail pages open with data already warm.
5. **Cursor pagination + virtualization.** `searchAfter` cursor pagination on custom-object search and contacts; `useInfiniteQuery` with virtualized lists/tables (TanStack Virtual) so large datasets never block the main thread.
6. **Optimistic updates with rollback.** Kanban stage drags, task toggles, note edits, message sends, and appointment status changes update the cache immediately and roll back on error. The UI never waits on a round-trip for a user's own action.
7. **Denormalized cache seeding.** When a list loads, seed each row's detail-query cache from the list payload (GHL denormalizes contact data onto opportunities), so detail pages open instantly and refine in the background.
8. **Request discipline.** Batch parallel requests, dedupe via Query, and respect rate limits with the client-side queue + backoff (§6.5).

**Acceptance target:** on a warm cache, primary screens (Dashboard, Leads, Clients, Conversations) render meaningful content in **≤200ms perceived**; cold loads always show a skeleton matching the destination layout (never a blank screen or spinner-only state).

---

## 8. Functional Requirements by Module

Each module's detailed screen/endpoint/field mapping is in `GHL_Integration_Mapping.md` (endpoint paths verified against the official GHL API docs); outstanding fixes and gaps per module are tracked in `TASKS.md` (the remediation plan). Requirements below define *what each module must do* on both surfaces. **Definition of Done for every module:** desktop + mobile implemented, wired to live data, loading/empty/error states present, TypeScript strict **and ESLint** pass, matches `design.md` tokens.

### 8.1 Authentication

- Sign In (email + password, show/hide, error states); desktop = brand panel + form, mobile = full-screen.
- Create Account (name, email, brokerage, phone, password with live strength meter, confirm, ToS) → `supabase.auth.signUp` with metadata.
- Forgot Password → reset email; Check Your Email (redacted address, resend w/ cooldown); Reset Password (strength meter) → `updateUser`; Password Changed success.
- Zod + RHF validation with inline errors; email-confirm `token_hash` route.

### 8.2 Dashboard

- **Now ribbon / Now card:** next appointment (`GET /calendars/events`, startTime ≥ now, sorted asc) with title, time, live countdown, client chip, location, event-type chip, map placeholder/link. Mobile adds call/text/directions quick actions; if drive time ≥ scheduled gap, the ribbon flips to a warning tone.
- **KPI grid (each clickable → filtered module):** Active Leads, Active Clients, Under Contract, Pending Offers, New Leads this week, Closings this month — computed from opportunity/offer/task queries.
- **Needs Attention:** overdue tasks, stale leads, offers expiring (<48h), unconfirmed appointments today.
- **New Leads list** (latest 5) and **Pending Offers list** (price, address, status, countdown).
- **Activity feed:** merged notes + task completions + stage changes + messages, client-side merged/sorted, with functional filter chips. Mobile supports pull-to-refresh.

### 8.3 Leads (Buyers & Sellers)

- **List** (sortable: Name, Role, Stage dot, Temperature, Budget/Target, Source, Last Contact, Age, Value) and **Kanban** (live Lead Nurture stages; drag → `PUT /opportunities/{id}` stage change, optimistic). View toggle persisted per user.
- **Filters:** All / Buyers / Sellers, Hot/Warm/Cold (temperature tags), Source, Assigned-to, stage multi-select; debounced search.
- **Desktop** master-detail split pane; deep-link `/leads/:id`. **Mobile** swipe rows (Done / Reschedule / Delete), vertical collapsible Kanban, infinite scroll.
- **Lead Detail:** header (avatar, role/temp badges, inline stage move, quick actions Call/Text/Email/Note); Buyer vs Seller tab variants with editable custom fields (inline save); Tasks / Notes / Appointments CRUD; merged Activity timeline.
- **New Lead** modal/sheet → creates Contact + Opportunity (Lead Nurture) + tags. **Convert Lead** → move/create opportunity in Buyer or Seller pipeline at a starting stage; routes to Client Detail.

### 8.4 Clients (Buyers & Sellers — no rentals)

- **Pipeline views:** Buyer/Seller segmented switcher (two distinct stage sets, never merged). Desktop Kanban (drag = optimistic stage update) + sortable list; mobile vertical collapsible Kanban. Header aggregates: active count + live total pipeline value per pipeline.
- **Client Detail — Buyer:** live step-dot progress; metric grid (Budget, Pre-Approval, Active Offer, Target close); tabs Overview · Properties · Offers · Appointments · Conversations · Tasks · Notes · Activity · Documents; mobile sticky action bar.
- **Client Detail — Seller:** header (list price, current high offer, DOM); six-plus-stage progress; **Offers tab as comparison table sorted by net proceeds** with accept/counter/decline; tabs Overview · Listing · Offers · Showings · Marketing · Tasks · Notes · Activity · Documents.
- **Client Detail — Both:** detect same contact with open opportunities in both pipelines; desktop side-by-side, mobile Buy/Sell segmented; linked combined timeline and cross-links.
- **New Client** and stage/close (won/lost/abandoned) actions via `PUT /opportunities/{id}/status`.

### 8.5 Contacts

- Desktop split-pane directory (alpha groups, virtualized) + detail; mobile list with quick call/text per row and alpha scrubber.
- `GET /contacts` with pagination and query search; role filter chips (Vendors / SOI / RE Agents / Team / Past Clients / Leads / Clients).
- **Contact Detail:** editable info, editable role tags, vendor variant fields, Tasks/Notes, Conversations link, Related records (via associations), quick actions.
- **New Contact** with duplicate-check (email/phone) before create; delete with confirm.

### 8.6 My Listings

- Desktop card grid + table toggle (photo, address, MLS#, price, stage chip, beds/baths/sqft, DOM, views); mobile card list with stage strip. Optional stage-board (drag → record update).
- Filters (stage, price range, beds/baths min, type); sort (price, DOM, newest).
- **Listing Detail:** hero carousel, specs, remarks; tabs Overview · Offers (sorted net) · Showings · Marketing · Documents · Notes/Tasks · Seller link; inline field edit → `PUT` record.
- **New Listing** (address, MLS#, price, stage, specs, seller contact link → association); change-stage / price-change (records old price).

### 8.7 Offers

- Desktop table (Offer ID, Property, Buyer/Seller, Price, Deposit, Status chip, irrevocable countdown, closing date, conditions deadline); mobile offer cards. Urgency highlight when irrevocable < 24h.
- Filters (status, offer_type, date range, property); sort (price, irrevocable, closing).
- **Offer Detail:** terms panel; negotiation/counter history timeline; associated property + buyer + seller (relations); Accept / Decline / Counter (counter pre-fills a linked New Offer); condition checklist with deadline countdowns.
- **New Offer** with property picker (my_listings + properties), buyer picker, terms, conditions → creates record + relations (`offer_to_property`, `offer_to_contact`); edit/withdraw.

### 8.8 Transactions

- Derived over opportunities at/after "Under Contract" in Buyer+Seller pipelines, joined to accepted offer + listing + `custom_objects.transactions`.
- List/cards (client, side, property, contract price, key dates, status, commission); filters (side, closing month, status); closing-this-week / conditions-due widgets.
- **Transaction Detail:** milestone tracker (Under Contract → Conditions → Firm → Clear to Close → Closed); critical-dates panel with countdowns; parties panel (client, co-op agent, lawyer, lender); tabs Overview · Conditions · Documents · Tasks · Notes · Activity; commission calculator card.

### 8.9 Properties (MLS)

- Desktop advanced filter bar (city, price min/max, beds+, baths+, type, status) + grid/table toggle + saved-search chips; mobile filter sheet + card feed with infinite scroll. Cursor pagination; debounced search; sort (price, newest, DOM).
- **Property Detail:** carousel, specs, remarks; sections Offers · Showings · Documents · Interested buyers; actions Link to buyer client (relation + interest level), Draft Offer (pre-filled), Add showing (pre-filled event).

### 8.10 Conversations (Email, SMS, Messenger, WhatsApp, Webchat)

- Thread list (`GET /conversations`): contact, channel icon, preview, time, unread badge; filters (channel chips, Unread, Starred, search); desktop split-pane, mobile list → full-screen thread; unread polling (15s) + mark-read on open.
- **Thread view:** channel-specific message rendering (email subject block, call logs, group SMS), day dividers, delivery status; composer with channel switcher, attachments (media upload), template dropdown (custom-value merge); send via `POST /conversations/messages` typed per channel with optimistic bubble; Log Call action; contact-context header links to the record.

### 8.11 Calendar

- `GET /calendars/events` by visible range (cached per range key); appointment-status colors; event-type chips (Showing/Consult/Inspect/Offer/Call).
- Desktop Week (time grid) / Day / Month / Agenda with now-line and drag-to-reschedule; mobile Day/Week/Month + Agenda-first with day swipe. Conflict-detection banner with one-click reschedule; date navigation.
- **Event Detail** (kind, time, duration, client/property links, notes; confirm/showed/noshow actions). **New Event** (type, title, date/time/duration, client picker, conditional property picker, calendar select).

### 8.12 Tasks

- `POST /locations/{id}/tasks/search` (global) + per-contact CRUD. Today + Overdue grouped; filters All/Today/Overdue/Upcoming/Completed; group-by Property/Client/Tag; priority via `priority:*` tag; optimistic complete everywhere.
- Desktop bulk-edit table (multi-select complete/reschedule/delete) + drag-to-schedule mini-calendar; mobile swipe actions.
- **New Task** (title, due quick-picks, body, client/lead + property link, priority, assignee); **Task Detail/Edit** with delete-confirm.

### 8.13 Notes

- Global feed aggregating recent notes across active contacts, newest first (author, linked-record chip, tags); group-by Client/Property/Tag; in-note search. Mobile Quick Note minimal sheet.
- **New Note** → `POST /contacts/{id}/notes`; **Note Detail/Edit** with linked-to selector, tags, delete.

### 8.14 Docs (Vault)

- Supabase Storage `documents` bucket + metadata table; GHL `documents_ref` stores UUIDs.
- Category folders (Listing Agreements · Offer Docs · Inspection Reports · Client Files · MLS Sheets, plus buyer/seller journey doc types as a tag taxonomy); upload (drag-drop / picker) with progress, preview (pdf/image), download, rename, delete; link-to-record picker; filtered views surface in each record's Documents tab; search + filter + sort.

### 8.15 Reports

- GCI-to-date vs annual goal (goal stored in Supabase profile settings); deal volume by month; pipeline conversion funnel (Lead → Client → Under Contract → Closed); average DOM; source attribution. Date-range selector; CSV export of underlying rows. All aggregates computed client-side from paged, cached live queries (recharts).

### 8.16 Team

- GHL location users (name, role, email, phone, avatar); member detail with assigned leads/clients + open-task counts; bulk reassignment of opportunities/contacts. If the users API is restricted by PIT scopes, fall back to `type:team` contacts and surface the limitation.

### 8.17 Settings

- Tabs (desktop) / stacked sections (mobile): **Profile & Account** (avatar upload, name, brokerage, phone, email change, change password), **Notifications** (preference toggles persisted to Supabase), **Display** (theme Light/Dark/System, density, default landing page, default calendar view), **Integrations** (the GHL credentials screen + connection-status card), **Data** (export CSV, clear local cache, app version). Sign out; delete account (confirm flow).

### 8.18 Cross-cutting

- **Quick Add (desktop) / FAB picker (mobile):** New Lead / Client / Contact / Listing / Offer / Task / Note / Event, reusing module modals.
- **Global search (both):** parallel search across contacts, opportunities (both pipeline groups), my_listings, properties, offers; grouped results with type icons; keyboard nav (⌘K on desktop); recent searches persisted.
- **Notifications feed:** derived from overdue tasks, expiring offers, unread messages, today's appointments; deep links; mark-read state.

---

## 9. Design System Requirements

The product implements `design.md` (this repo) exactly — the token values, primitives, and layouts are specified there and already ported into the app source (`src/styles/`, `src/components/shared/primitives.tsx`). Key requirements:

- **OKLCH token system** (source: `design.md`) ported into `src/styles/tokens.css` and mapped into Tailwind (colors, radius, shadows, spacing, typography). One accent (calm blue) carries selection/focus/active; role hues (Buyer/Seller/Past/Vendor/SOI) and stage dots encode meaning only — never decoration. Stage colors never fill cards.
- **Typography:** Inter for text, JetBrains Mono for any digit/identifier whose alignment matters; tabular numerals for all money/time/counts; `Money`, `Countdown`, `Spark`, `Avatar`, `StageDot`, `TempBadge`, `RoleBadge` shared primitives.
- **Layout:** desktop shell (232px sidebar + 60px topbar + page); mobile shell (status spacer + topbar + scroll + FAB + 6-col blurred tabbar). Master-detail split panes on desktop; swipe actions, bottom sheets, and the "Now" ribbon on mobile.
- **Time as first-class:** every deadline shows a countdown chip whose tone reflects urgency (ok / warn / danger / expired), driven by shared logic used for offer expiry and task urgency alike.
- **States:** designed empty states (agent-voiced sentence + one action, no illustrations), skeletons matching destination layout, retryable error cards, toasts for every mutation.
- **Motion:** restrained — tap squish, Now-pulse, swipe reveal, panel slide only. No emojis, no decorative iconography.
- **Placeholders:** striped `.ph` swatch with monospaced label for any missing image/asset; never invent imagery.

---

## 10. Non-Functional Requirements

### 10.1 Security & privacy

- Supabase RLS on all app-owned tables (`profiles`, `ghl_credentials`, `documents`) — owner-only. GHL PIT stored server-side, loaded to memory only (never localStorage), transmitted only to GHL from the user's session.
- No secret keys in the client bundle. `.env.example` committed; real secrets never committed.
- Sub-account isolation is inherent: all GHL data is scoped to a single `locationId`.
- A 401 from GHL invalidates the session's credential state and routes the user to re-enter/rotate the token.

### 10.2 Performance

- Meets the §7 targets. Code-split per module (lazy routes + Suspense skeletons); image lazy-load; bundle audited via Lighthouse.

### 10.3 Accessibility

- 44×44 hit targets on mobile; brand blue passes 4.5:1 contrast; selection state never color-only; focus rings preserved; focus traps in modals; ARIA on Kanban drag-and-drop; screen-reader-stable tabular output.

### 10.4 Reliability & resilience

- Per-route error boundaries; offline banner; retryable error states everywhere; optimistic rollback on failure; rate-limit-aware queue with backoff.

### 10.5 Browser & device support

- Modern evergreen browsers; iPhone-class mobile web as the primary mobile target (design references iPhone 15, 393×852) and standard desktop widths ≥1024px.

### 10.6 Maintainability

- TypeScript strict; centralized query keys; Zod response schemas → inferred types; ESLint + Prettier; the GHL transport isolated so the v2 Edge-Function proxy swap touches only one layer. README documents setup, env vars, PIT creation, architecture, and v2 migration notes.

---

## 11. Success Metrics

| Metric | Target |
|---|---|
| Warm-cache render of primary screens | ≤200ms perceived; content (not spinner) on first paint |
| Cold-load first meaningful paint | Skeleton immediately; data within one revalidation cycle |
| Screen coverage vs inventory | 100% of the screen inventory (all desktop, mobile, and auth screens per §8 module requirements) |
| Live-data coverage | 0 mock records in shipped app; every list/detail/KPI reads live |
| Mutation feedback | 100% of mutations produce optimistic UI + toast; rollback on error |
| Rate-limit incidents | 0 user-visible 429 failures under normal single-agent usage (queue absorbs bursts) |
| TypeScript strict | Passes with no errors |
| Accessibility | Meets §10.3 across all interactive surfaces |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **PIT exposed in browser (v1 model)** | Token theft if session/device compromised | Documented, accepted v1 tradeoff; server-side storage + memory-only load; clear UI note; v2 Edge-Function proxy removes token from browser entirely. |
| **GHL rate limits under bursty use** | Failed requests, janky UX | Token-bucket limiter, dedupe, batched parallel calls, exponential backoff on 429, staleTime tiers to cut refetching. |
| **Custom-object / association schema drift** | Broken reads/writes | Resolve schema, field, pipeline, and association IDs at bootstrap; never hardcode (except `.env` fallbacks); Zod-validate responses. |
| **Users API restricted by PIT scopes (Team module)** | Team features degrade | Detect and fall back to `type:team` contacts; surface the limitation in-UX. |
| **No webhooks in v1 → data can be stale** | Agent sees outdated state | Stale-while-revalidate, short staleTime on volatile data, conversation polling, pull-to-refresh; v2 adds webhooks. |
| **Aggregates computed client-side (Reports/KPIs)** | Cost/latency on large accounts | Paged cursor queries with cached results; compute over loaded pages; date-range scoping. |
| **Two-surface complexity from one codebase** | Divergent/broken layouts | Shared route tree + data layer; per-route Desktop/Mobile view split only where layout diverges; `useSurface()`; QA sweep against the inventory. |

---

## 13. Release Plan (Dependency-ordered — no dates)

**Status:** the original 18-phase build (foundation → auth/integration layer → all 16 modules → cross-cutting completion) is implemented and merged. A full-repo review (`REVIEW_REPORT.md`) found the build structurally complete but **not release-ready** — wrong GHL endpoints in the service layer, a bootstrap race, storage-policy security gaps, and several unimplemented claims.

**The path to release is now the remediation plan in `TASKS.md`**, ordered by dependency across six workstreams:

1. **E (first slice)** — security & repo hygiene: untrack `.env`; lock down the avatars storage bucket; provision the `documents` bucket with owner-scoped policies.
2. **A** — GHL API corrections: custom objects (`/objects/{schemaKey}`), custom fields/values/tags, conversations send/mark-read, calendar appointment endpoints, users endpoint, contacts server-side filtering, opportunities/KPI param hygiene.
3. **B** — bootstrap & credentials lifecycle: fix the credentials-injection race, surface partial-bootstrap failures, non-destructive 401 handling, honor the `?next=` sign-in redirect.
4. **C** — feature gaps: contacts directory polish, composer attachments/templates, calendar drag-reschedule, tasks bulk edit + scheduler, kanban ARIA, hover prefetch, object-schema bootstrap, account deletion, report pagination/date semantics, stage-name-based under-contract detection, display density.
5. **D** — code quality: lint to zero (typed service layer), real test coverage over the integration layer, formatter decision, shared-hook fixes.
6. **F** — performance & docs: bundle splitting, real splash progress, documentation reconciliation.

**Release gate** (from `TASKS.md`): typecheck ✅ · lint 0 errors · real test suites green · no build chunk > 600 KB · manual live-data smoke of every module.

**v2 (out of scope here):** Supabase Edge Function proxy (PIT never in browser) + GHL webhooks for push updates; client-facing portal.

---

## 14. Open Questions & Assumptions

**Assumptions**

- The GHL sub-account already contains the 3 real-estate custom objects, the Lead Nurture / Buyer Transaction / Seller Transaction pipelines, the documented custom fields/tags, and the association keys. The app resolves their IDs at runtime.
- A valid PIT with the scopes in §6.1 is available per user and entered via Settings ▸ Integrations.
- One user maps to one GHL sub-account in v1.
- Conversations channels (Email/SMS/Messenger/WhatsApp/Webchat) are provisioned in the sub-account; the app renders whatever channels exist.

**Open questions**

- Does the PIT grant the GHL Users API scope, or should Team default to the `type:team` fallback?
- Are call recordings retained long enough to link from Conversations, given plan-dependent retention?
- Should Reports goals (annual GCI) be per-user (Supabase profile) or shared team-level?
- Preferred document taxonomy: fixed category folders vs the fuller journey-stage document catalog as tags?
- Is an installable PWA in scope for v1, or strictly responsive web?

---

## 15. Appendix — Key Reference IDs & Conventions

- **GHL base URL:** `https://services.leadconnectorhq.com` (send `Version` header).
- **Supabase project:** `https://xdenkkphnhjjpdirvsii.supabase.co` (publishable key in `.env`; secret key server-side only).
- **Sub-account:** `locationId` scopes all GHL data (example in schema docs: `jHEaG68TeCsXHXPhrVtU`).
- **Custom objects:** `custom_objects.my_listings`, `custom_objects.properties` (unique on `mls`), `custom_objects.real_estate_offer`, `custom_objects.transactions`.
- **Pipelines:** Lead Nurture; Buyer Transaction (10 stages); Seller Transaction (9 stages) — IDs resolved at bootstrap.
- **Association keys:** `offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`, `BUSINESSES_CONTACTS_ASSOCIATION`.
- **Field/tag dictionaries & full field mapping:** `GHL_Integration_Mapping.md §18–22`.
- **Full data dictionary / ERD / associations:** `Real Estate Pro CRM — Full Integration Schema.md` + `Entity Breakdown.md`.

---

*End of PRD. This document defines requirements and intent. Engineering execution steps live in `TASKS.md` (the current remediation plan); review findings live in `REVIEW_REPORT.md`; the design system lives in `design.md`. See `AGENTS.md` for a full doc-navigation map.*