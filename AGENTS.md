# AGENTS.md — Real Estate Pro CRM (Build Repo)

This file orients an AI coding agent working in this repo and tells it exactly which document to open for any task.

Read this file first. Then read `REVIEW_REPORT.md` for the current state of the codebase. Then start from `TASKS.md`.

---

## 1. What we're building

A **Real Estate Pro CRM** — one responsive React 18 + TypeScript (Vite) web app that renders a **desktop** surface (≥1024px) and a **mobile** surface (<1024px) from a single shared route tree and data layer.

- **Data backend:** a GoHighLevel (GHL) sub-account, read/written **directly from the browser** using a **Private Integration Token (PIT)**.
- **Auth:** Supabase (email/password). The PIT + `locationId` are stored server-side on an RLS-protected Supabase table and loaded to memory for the session.
- **This is the v1 live-data release.** No mock data ships. A later v2 (out of scope) moves GHL access behind a Supabase Edge Function proxy + webhooks — so keep the GHL transport isolated.

Full product intent, scope, and requirements: **`PRD.md`**.

---

## 2. Current project phase — remediation

The initial build of all 18 phases is complete and merged to `main`. A full-repo review (2026-07-06) found that the app **builds and typechecks but is not functional against live GHL data** — wrong API endpoints in the service layer, a bootstrap race condition, Supabase storage-policy security gaps, and several features that were claimed done but are missing.

- **`REVIEW_REPORT.md`** — the authoritative findings: critical bugs (§3), mis-checked claims (§4), high/medium issues (§5–6), deep-pass findings (§9).
- **`TASKS.md`** — the remediation plan: 37 tasks in 6 dependency-ordered workstreams (A: GHL API corrections · B: bootstrap/credentials lifecycle · C: feature gaps · D: code quality/lint/tests · E: security/hygiene · F: performance/polish). Each task has file paths, step-by-step instructions, and acceptance criteria.

**Work `TASKS.md` in its "Suggested execution order" and follow its "Rules for the Dev Agent" section for every task** (docs-verified endpoints, toolchain green after each task, one commit per task).

---

## 3. Docs in this repo

| File | What it is | Read it when… |
|---|---|---|
| **`REVIEW_REPORT.md`** | Full review findings — what is broken, missing, or mis-claimed, with file/line references. | Before starting any task; understanding why a task exists. |
| **`TASKS.md`** | The remediation plan — dependency-ordered tasks with per-task instructions and acceptance criteria. | Deciding what to build next; checking a task's Definition of Done. |
| **`PRD.md`** | Product Requirements — the *what & why*. Scope, personas, architecture, data/integration model, performance strategy, per-module requirements. | You need the requirement or acceptance bar for a feature. |
| **`design.md`** | Design system: OKLCH tokens, typography, layout shells, components, patterns, motion, voice. | Building or fixing any UI; writing copy/empty states. |
| **`GHL_Integration_Mapping.md`** | Screen → GHL endpoint/field mapping for every screen, plus modal field maps, association-key registry, custom-field dictionary, enums. | Wiring any screen to GHL; you need the exact endpoint, field, filter, or tag. |
| **`Real Estate Pro CRM — Full Integration Schema.md`** | Consolidated GHL data schema — object catalog, data dictionary, tags/custom values/custom fields, associations matrix, ERD. | Modeling data; understanding an object's fields, relationships, or cardinality. |
| **`Entity Breakdown.md`** | Entity-level breakdown supporting the schema doc. | Deep-diving a specific record type. |
| **`README.md`** | Setup, env vars, PIT creation guide, architecture notes. | Environment setup; onboarding. |

> **Note:** endpoint paths shown in older docs are not guaranteed correct — several were found wrong in the review. When implementing Workstream A, **verify every endpoint against the official GHL API 2.0 docs** (https://marketplace.gohighlevel.com/docs/), which are the source of truth.

---

## 4. Task → document routing (quick lookup)

- **"What do I fix next and what's done?"** → `TASKS.md` (execution order table + per-task status).
- **"Why is this a bug / what's the evidence?"** → `REVIEW_REPORT.md` (§3 critical, §9 deep pass).
- **"What should this feature do / what's the acceptance bar?"** → `PRD.md` (module section + §7 performance + §10 non-functional).
- **"How should this look / what tokens/components?"** → `design.md`.
- **"Which GHL endpoint/field/tag for this screen?"** → `GHL_Integration_Mapping.md`, verified against the official GHL API docs.
- **"What fields/relationships does this object have?"** → `Real Estate Pro CRM — Full Integration Schema.md` + `Entity Breakdown.md`.
- **"How does Supabase auth/storage work here?"** → `PRD.md §6.2` + `supabase/migrations/*` (the migrations are the source of truth for the actual schema).

---

## 5. Non-negotiable rules (apply to every task)

1. **One responsive codebase.** Shared route tree + data layer; per-route `Desktop*` / `Mobile*` view components only where layout diverges. Use the `useSurface()` breakpoint hook. Desktop ≥1024px, mobile <1024px.
2. **Live data only.** Every list, detail, KPI, and dropdown reads from GHL (or Supabase for auth/profile/docs). No mock data in the shipped app.
3. **Data-layer discipline.** All GHL calls go through `src/lib/ghl/client.ts` + typed service modules in `src/lib/ghl/services/*`. UI never calls `fetch` directly. Centralize query keys in `src/lib/queryKeys.ts` as `['ghl', resource, params]`.
4. **PIT model (v1).** GHL PIT + `locationId` stored server-side in Supabase (RLS owner-only), loaded to memory (never persisted to localStorage), sent to GHL only from the user's session. Keep the transport isolated so v2's Edge-Function proxy swaps just that layer. Never commit secrets; never hardcode the PIT.
5. **Resolve IDs at bootstrap.** Pipeline, stage, custom-object schema, custom-field, and association-key IDs are resolved at runtime (`.env` fallbacks only) — never hardcoded inline.
6. **No rentals.** Clients are Buyers and Sellers only — no rental/lease workflow anywhere.
7. **Performance is a requirement, not a bonus.** Implement the `PRD.md §7` strategy: bootstrap prefetch, persisted stale-while-revalidate cache, staleTime tiers, hover/route prefetch, cursor pagination + virtualization, optimistic updates with rollback, denormalized cache seeding, rate-limit-aware request queue with backoff.
8. **Definition of Done (every task):** the task's acceptance criteria in `TASKS.md`, plus desktop + mobile implemented, wired to live data, loading skeletons + designed empty states + retryable error states, TypeScript strict **and ESLint** pass, matches `design.md` tokens.
9. **Verify endpoints against official GHL docs** before writing or changing any service call — do not trust paths from memory or from older docs in this repo.
10. **No timelines.** Do not add dates or time estimates to plans, `TASKS.md`, or any generated task list. Order work by dependency only.

---

## 6. Stack (locked)

React 18 · Vite · TypeScript (strict) · React Router v6 · Tailwind + OKLCH CSS-variable tokens · shadcn/ui (Radix) · TanStack Query v5 (+ persist-client) · React Hook Form + Zod · lucide-react · recharts · date-fns · TanStack Virtual · `@supabase/supabase-js` · GHL API via PIT.

See `PRD.md §5.2` for the authoritative list. Toolchain: `bun run typecheck` · `bun run lint` · `bunx vitest run` · `bun run build`.

---

## 7. Key references

- **GHL base URL:** `https://services.leadconnectorhq.com` (send the `Version` header). PIT auth: https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken — API docs: https://marketplace.gohighlevel.com/docs/
- **Supabase project:** `https://xdenkkphnhjjpdirvsii.supabase.co` (publishable key in `.env`; secret key server-side only — never in the client bundle).
- **Custom objects:** `custom_objects.my_listings`, `custom_objects.properties` (unique on `mls`), `custom_objects.real_estate_offer`, `custom_objects.transactions`. Use the `OBJECT_KEYS` constant (TASKS.md A1) — never string literals at call sites.
- **Pipelines:** Lead Nurture · Buyer Transaction (10 stages) · Seller Transaction (9 stages) — IDs resolved at bootstrap via `PipelineRegistry`.
- **Association keys:** `offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`, `BUSINESSES_CONTACTS_ASSOCIATION`.

---

*If a doc and this file ever disagree: `TASKS.md` governs what to do now, `REVIEW_REPORT.md` governs the evidence, `PRD.md` governs requirements, `design.md` governs visuals, and `Real Estate Pro CRM — Full Integration Schema.md` + `GHL_Integration_Mapping.md` govern data (endpoint paths verified against official GHL docs). This file only points you to them.*
