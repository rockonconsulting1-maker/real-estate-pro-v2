# /docs/database — Database Documentation Package

**Product:** Real Estate Pro CRM | **Sub-Account:** 9% Realty — Southern Alberta (`jHEaG68TeCsXHXPhrVtU`)
**Backend:** GoHighLevel (GHL) sub-account via Private Integration Token · Supabase (auth + document storage)
**Package Version:** 2.0.0 | Generated: 2026-07-07 | Supersedes: v1.x schema sections of `Real Estate Pro CRM — Full Integration Schema.md` and §18–22 of `GHL_Integration_Mapping.md`

---

## What lives here

| File | Purpose | Read this when… |
|---|---|---|
| `DATA_DICTIONARY.md` | **Canonical field schema** for all 7 objects — every field key, type, enum, required/unique/searchable flag, and convention | You touch any field key, form, column, filter, or payload |
| `ASSOCIATIONS_REGISTRY.md` | **Canonical relationship registry** — live association keys, cardinality, forward/reverse labels, role pattern, 1:1 business rules, workflow hooks | You link records, render an association panel, or build a workflow trigger |
| `schema.dbml` | Reconciled DBML — paste into dbdiagram.io to regenerate the ERD | You need the visual ERD or want to review structure at a glance |
| `MIGRATION_MAP.md` | **Deprecated → canonical mapping** for every field key, association key, and enum value that changed | You are updating existing code, hooks, or components written against the old docs |
| `AGENT_DB_GUIDE.md` | **AI-agent & developer alignment guide** — bootstrap registry, query-key conventions, hook ↔ object mapping, component ↔ field mapping, validation and write rules | You (human or agent) are writing or reviewing any code that reads/writes CRM data |

## Document precedence (conflict resolution order)

1. **Live GHL API schema** (`GET /objects/{key}?fetchProperties=true`) — always wins.
2. `DATA_DICTIONARY.md` + `ASSOCIATIONS_REGISTRY.md` (this package) — canonical written record of #1.
3. `Real Estate Pro CRM — Full Integration Schema.md` — retained for API quick-reference (Part 7) and history; its Part 2/3 field & association tables are superseded by this package.
4. `GHL_Integration_Mapping.md` — retained for **screen → endpoint** mapping only. Its §18 field mapping, §19 association keys, §20 field dictionary, and §22 enum lists are **deprecated**; use `MIGRATION_MAP.md`.

## Hard rules for AI agents (non-negotiable)

- **Never invent a field key.** If a key is not in `DATA_DICTIONARY.md`, verify against the live API before use.
- **Custom-object field keys always carry the full dotted prefix in API payloads:** `custom_objects.properties.mls`, never bare `mls`.
- **Single-select values are option keys (snake_case), never display labels:** `"cmhc_insured"`, not `"CMHC Insured"`.
- **Monetary = raw CAD numbers** (`500000`), **dates = ISO 8601** (`"2026-07-15"`), **null until known** (never `0` or `1970-01-01` placeholders).
- **Association IDs are resolved at bootstrap by key** — never hard-code association IDs; keys are in `ASSOCIATIONS_REGISTRY.md`.
- **1:1 conversions (Offer→Transaction, Opportunity→Transaction, My Listing→Transaction) are workflow/app-enforced**, not platform-enforced. Always check for an existing link before creating.
- **Soft-FKs (`*.mls_number` → `properties.mls`) are plain text.** Whenever code creates the platform association, it must also write the soft-FK field (and vice-versa checks in reads).

## Versioning

Bump `Package Version` (semver) whenever a field, enum, or association changes in GHL Settings, and record it in each file's changelog. The Data Dictionary is regenerated from the live API; the other files are maintained by hand against it.
