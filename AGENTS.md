# AGENTS.md — Real Estate Pro CRM (Vibe AI Build Repo)

This file orients an AI coding agent working in **this repo** (the writable Vibe AI build repo) and tells it exactly which document to open for any task — including the docs and prototype that live in a **separate, read-only Design repo**.

Read this file first. Then read `PRD.md`. Then start from `TASKS.md` + `PROMPT.md`.

---

## 1. What we're building

A **Real Estate Pro CRM** — one responsive React 18 + TypeScript (Vite) web app that renders a **desktop** surface (≥1024px) and a **mobile** surface (<1024px) from a single shared route tree and data layer.

- **Data backend:** a GoHighLevel (GHL) sub-account, read/written **directly from the browser** using a **Private Integration Token (PIT)**.
- **Auth:** Supabase (email/password). The PIT + `locationId` are stored server-side on an RLS-protected Supabase table and loaded to memory for the session.
- **This is the v1 live-data release.** No mock data ships. A later v2 (out of scope) moves GHL access behind a Supabase Edge Function proxy + webhooks — so keep the GHL transport isolated.

Full product intent, scope, and requirements: **`PRD.md`**.

---

## 2. Two repositories — know which is which

| Repo | Access | Contains |
|---|---|---|
| **This repo (Vibe AI build)** | **Read + write** — build the app here | The 6 planning/spec docs below, plus the app source you create. |
| **Design repo** | **Read-only** — reference only, you cannot commit to it | The visual prototype (HTML/JSX/CSS), the full screen inventory, and the granular GHL schema/API reference docs. |

**Design repo URL (read-only):** https://github.com/rockonconsulting1-maker/RealEstate-Pro-CRM---Design

> When a task says "port from the prototype" or "match the design," the files to read are in the **Design repo** at the URL above. Read them there. Do not invent tokens, layouts, or component structure from memory, and do not try to write to the Design repo.

---

## 3. Docs in THIS repo (read these here)

| File | What it is | Read it when… |
|---|---|---|
| **`PRD.md`** | Product Requirements — the *what & why*. Scope, personas, architecture, data/integration model, performance strategy, per-module requirements, non-functional requirements, risks. | Starting anything; you need the requirement or acceptance bar for a feature. |
| **`TASKS.md`** | Engineering build plan — the *how*. Phased, dependency-ordered checklist (Phase 0 → 18). Each item has a Definition of Done and a matching prompt. | Deciding what to build next; checking a task's DoD. |
| **`PROMPT.md`** | Per-phase build prompts (P0.1, P2.3, …) that pair with `TASKS.md` phases. | Executing a specific phase; you want the detailed prompt for that step. |
| **`design.md`** | Design system: OKLCH tokens, typography, layout shells, components, patterns, motion, voice, file map. | Building any UI; porting tokens/primitives; writing copy/empty states. |
| **`GHL_Integration_Mapping.md`** | Screen → GHL endpoint/field mapping for every screen, plus modal field maps, association-key registry, custom-field dictionary, enums. | Wiring any screen to GHL; you need the exact endpoint, field, filter, or tag. |
| **`Real Estate Pro CRM — Full Integration Schema.md`** | Consolidated GHL data schema — object catalog, detailed data dictionary, tags/custom values/custom fields, associations & relationships matrix, architecture overview, ERD. | Modeling data; understanding an object's fields, relationships, or cardinality. |

---

## 4. Docs in the DESIGN repo (read via the URL)

All of these are **read-only reference** in the Design repo — https://github.com/rockonconsulting1-maker/RealEstate-Pro-CRM---Design

| File(s) | What it is | Read it when… |
|---|---|---|
| `SCREENS.md`, `RC CRM Screen Inventory.html` | Complete inventory of every screen, view, and modal (desktop, mobile, auth). | Confirming coverage; finding which prototype file a screen lives in. |
| `RC CRM Desktop.html`, `RC CRM Mobile.html`, `RC CRM Auth Desktop.html`, `RC CRM Auth Mobile.html` | Prototype entry points (bezel/switcher + which JSX loads). | Understanding how the prototype composes screens. |
| `desktop/*.jsx` (`shell.jsx`, `dashboard.jsx`, `leads.jsx`, `contacts.jsx`, `mls.jsx`, `conversations.jsx`, `modals.jsx`, `screens*.jsx`, `app.jsx`) | Desktop prototype screens/components — **shape & interaction reference only, not production code.** | Building a desktop screen; porting a component, primitive, or layout. |
| `mobile/*.jsx` (`screen-*.jsx`, `app.jsx`, `data.jsx`, `print-app.jsx`) | Mobile prototype screens + `data.jsx` mock **shape** reference + `Icon` registry. | Building a mobile screen; checking the expected record shape (shape only — data is live). |
| `styles.css` (desktop + mobile) | The actual CSS tokens & primitives behind `design.md`. | Porting the OKLCH token set and component styles into Tailwind/`src/styles/tokens.css`. |
| `SECTION_1`–`SECTION_6` | The granular schema docs that were consolidated into this repo's Full Integration Schema. | You need more detail than the consolidated schema gives (full data dictionary, per-relationship notes, ERD prose). |
| `GoHighLevel__GHL__API_Integration.txt`, `Associations_Apis-*.md` | GHL API reference (endpoints, headers, auth, versioning, rate limits) + Associations API detail. | Implementing the GHL client/transport, a service module, or association relations. |
| `Buyer-Seller-Journeys.md` | Buyer (10-stage) & Seller (9-stage) pipeline stages, stage-mapped tasks/documents, doc catalog, client-portal plan. | Building Clients/Transactions stage logic, the Docs taxonomy, or stage-mapped behavior. |
| `Supabase_Intergration_Docs.txt` | Supabase auth/config reference (client setup, env vars, profiles table, user-management patterns). | Building auth, the profiles/credentials tables, or Storage. |

---

## 5. Task → document routing (quick lookup)

- **"What should this feature do / what's the acceptance bar?"** → `PRD.md` (module section + §7 performance + §10 non-functional).
- **"What do I build next and what's done?"** → `TASKS.md` → matching prompt in `PROMPT.md`.
- **"How should this look / what tokens/components?"** → `design.md` (this repo) + `styles.css` / `*.jsx` (Design repo).
- **"Which GHL endpoint/field/tag for this screen?"** → `GHL_Integration_Mapping.md`.
- **"What fields/relationships does this object have?"** → `Real Estate Pro CRM — Full Integration Schema.md` (deep dive: Design repo `SECTION_1`–`SECTION_6`).
- **"How do I call GHL / handle auth / rate limits / associations?"** → Design repo `GoHighLevel__GHL__API_Integration.txt` + `Associations_Apis-*.md`.
- **"What are the pipeline stages / stage-mapped tasks & docs?"** → Design repo `Buyer-Seller-Journeys.md`.
- **"How does Supabase auth/storage work here?"** → Design repo `Supabase_Intergration_Docs.txt` + `PRD.md §6.2`.
- **"Does this screen exist / where's its prototype?"** → Design repo `SCREENS.md` + `RC CRM Screen Inventory.html`.

---

## 6. Recommended reading order (first pass)

1. `AGENTS.md` (this file) — orientation.
2. `PRD.md` — full product context, especially §5 architecture, §6 integration, §7 performance, §8 module requirements.
3. `design.md` — design language and file map; skim `styles.css` in the Design repo.
4. `TASKS.md` — Phase 0 foundation + the architecture rules and performance strategy at the top.
5. `GHL_Integration_Mapping.md` + `Real Estate Pro CRM — Full Integration Schema.md` — data layer grounding before wiring screens.
6. Per feature: the relevant `PROMPT.md` prompt + the matching Design-repo prototype file(s).

---

## 7. Non-negotiable rules (apply to every task)

These come from `PRD.md` and `TASKS.md` — treat them as always-on:

1. **One responsive codebase.** Shared route tree + data layer; per-route `Desktop*` / `Mobile*` view components only where layout diverges. Use a `useSurface()` breakpoint hook. Desktop ≥1024px, mobile <1024px.
2. **Live data only.** Every list, detail, KPI, and dropdown reads from GHL (or Supabase for auth/profile/docs). No mock data in the shipped app — the Design repo's `mobile/data.jsx` is a **shape reference only**.
3. **Data-layer discipline.** All GHL calls go through `src/lib/ghl/client.ts` + typed service modules. UI never calls `fetch` directly. Centralize query keys as `['ghl', resource, params]`.
4. **PIT model (v1).** GHL PIT + `locationId` stored server-side in Supabase (RLS owner-only), loaded to memory (never localStorage), sent to GHL only from the user's session. Keep the transport isolated so v2's Edge-Function proxy swaps just that layer. Never commit secrets; never hardcode the PIT.
5. **Resolve IDs at bootstrap.** Pipeline, stage, custom-object schema, custom-field, and association-key IDs are resolved at runtime (`.env` fallbacks only) — never hardcoded inline.
6. **No rentals.** Clients are Buyers and Sellers only — no rental/lease workflow anywhere.
7. **Performance is a requirement, not a bonus.** Implement the `PRD.md §7` strategy: bootstrap prefetch, persisted stale-while-revalidate cache, staleTime tiers, hover/route prefetch, cursor pagination + virtualization, optimistic updates with rollback, denormalized cache seeding, rate-limit-aware request queue with backoff.
8. **Definition of Done (every task):** desktop + mobile implemented, wired to live data, loading skeletons + designed empty states + retryable error states, TypeScript strict passes, matches `design.md` tokens.
9. **Match the design; don't reinvent it.** Port tokens, primitives, and layouts from the Design repo prototype rather than approximating from memory.
10. **No timelines.** Do not add dates or time estimates to plans, `TASKS.md`, or any generated task list. Order work by dependency only.

---

## 8. Stack (locked)

React 18 · Vite · TypeScript (strict) · React Router v6 · Tailwind + OKLCH CSS-variable tokens · shadcn/ui (Radix) · TanStack Query v5 (+ persist-client) · React Hook Form + Zod · lucide-react · recharts · date-fns · TanStack Virtual · `@supabase/supabase-js` · GHL API via PIT.

See `TASKS.md` (Stack + Architecture rules) and `PRD.md §5.2` for the authoritative list.

---

## 9. Key references

- **GHL base URL:** `https://services.leadconnectorhq.com` (send the `Version` header). PIT auth: https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken
- **Supabase project:** `https://xdenkkphnhjjpdirvsii.supabase.co` (publishable key in `.env`; secret key server-side only — never in the client bundle).
- **Custom objects:** `custom_objects.my_listings`, `custom_objects.properties` (unique on `mls`), `custom_objects.real_estate_offer`, `custom_objects.transactions`.
- **Pipelines:** Lead Nurture · Buyer Transaction (10 stages) · Seller Transaction (9 stages) — IDs resolved at bootstrap.
- **Association keys:** `offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`, `BUSINESSES_CONTACTS_ASSOCIATION`.
- **Design repo (read-only):** https://github.com/rockonconsulting1-maker/RealEstate-Pro-CRM---Design

---

*If a doc and this file ever disagree, `PRD.md` governs requirements, `design.md` governs visuals, `Real Estate Pro CRM — Full Integration Schema.md` + `GHL_Integration_Mapping.md` govern data, and `TASKS.md` governs build order. This file only points you to them.*