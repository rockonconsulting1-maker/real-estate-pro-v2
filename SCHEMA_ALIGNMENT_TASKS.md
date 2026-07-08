# SCHEMA_ALIGNMENT_TASKS.md — AI Agent Task List

**Purpose:** Align the project code with the **canonical `/docs/database/` (v2.0.0)** schema. Every task below closes a specific gap between the live GHL schema and current `src/` code, found by reviewing `/docs/database/` against the code.

**Scope note:** This complements the existing `TASKS.md` (general remediation). This file is **schema-alignment only** — object keys, field keys, enums, associations, types, and the deal lifecycle. Where a task overlaps a `TASKS.md` item, that's noted.

**Canonical references (open these, don't guess):**
- Fields: `/docs/database/DATA_DICTIONARY.md` · Associations: `/docs/database/ASSOCIATIONS_REGISTRY.md`
- Deprecated→canonical: `/docs/database/MIGRATION_MAP.md` · Usage rules: `/docs/database/AGENT_DB_GUIDE.md`
- Entity + code ownership + gap list: `ENTITY_BREAKDOWN.md §12` · Screen map: `GHL_INTEGRATION_MAPPING.md`

---

## Rules for the AI Dev Agent (apply to every task)

1. **Never invent a field/association key.** If it's not in `DATA_DICTIONARY.md`/`ASSOCIATIONS_REGISTRY.md`, verify against the live API (`GET /objects/{key}?fetchProperties=true`) before use.
2. **Custom-object field keys carry the full dotted prefix in payloads** (`custom_objects.real_estate_offer.purchase_price`). Reads may strip it via `cleanCustomObjectFields`.
3. **Single/multi-selects submit snake_case option keys, not labels.** Money = raw number; date = `YYYY-MM-DD`; null until known.
4. **Resolve pipeline/stage/association/custom-field IDs at bootstrap — never hard-code.** Association relations use `{ associationId, firstRecordId, secondRecordId }`.
5. **All GHL calls stay in `src/lib/ghl/services/*` via `ghlFetch`.** No `fetch` in components. Query keys in `src/lib/queryKeys.ts`.
6. **Toolchain green after each task** (no new failures): `bun run typecheck && bun run lint && bunx vitest run && bun run build`. Add/extend a vitest test whenever a task touches pure logic (services, registry, helpers, id generators, guards).
7. **One commit per task:** `fix(schema): <task-id> <summary>`. **No timelines** — order by dependency only.
8. **Definition of Done** = code change + acceptance criteria met + toolchain not regressed + desktop & mobile wired + committed.

**Suggested execution order (dependency-first):**
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13

---

# WORKSTREAM 1 — Foundation (object keys, association registry, types)

## T1 — Complete `OBJECT_KEYS` and add the Transactions object key
**Gap:** G1. `OBJECT_KEYS` (in `src/lib/ghl/services/objects.ts`) omits transactions; call sites also use bare `'real_estate_offer'` / `'my_listings'` literals.
**Files:** `src/lib/ghl/services/objects.ts`
**Do:**
- Add `transactions: 'custom_objects.transactions'` to `OBJECT_KEYS`.
- Confirm all four custom keys present: `listings`, `properties`, `offers`, `transactions`.
- Export `OBJECT_KEYS` for use everywhere (ban string literals at call sites in later tasks).
**Acceptance:** `OBJECT_KEYS` has 4 entries; `typecheck` green.

## T2 — Add `transactionsService` + load Transactions schema at bootstrap
**Gap:** G1. No transactions service; bootstrap loads only 3 schemas.
**Files:** `src/lib/ghl/services/objects.ts`, `src/hooks/use-bootstrap.ts`
**Do:**
- Add `transactionsService` mirroring `offersService` (search/get/create/update/delete on `OBJECT_KEYS.transactions`).
- In `useBootstrap()`, add `objectsService.getSchema(OBJECT_KEYS.transactions)` to the parallel batch and to the returned `schemas.transactions`; add `'schemaTransactions'` to the `failed[]` tracking.
**Acceptance:** bootstrap resolves 4 schemas; `useBootstrap().data.schemas.transactions` is populated against live data; existing bootstrap test updated.

## T3 — Build the association-key → ID registry + a canonical `createRelation`
**Gap:** G5, G6. `associationsService.getKeys()` returns a raw list; `createRelation` posts arbitrary bodies; two broken call shapes exist.
**Files:** `src/lib/ghl/services/associations.ts`, `src/hooks/use-bootstrap.ts`, `src/lib/queryKeys.ts`
**Do:**
- After `getKeys()`, build a `Map<canonicalKey, associationId>` in the bootstrap result (e.g. `assocRegistry`). Match on the association `key` field from the API.
- Add `associationsService.resolveId(key: string): string` (throws if unresolved) sourced from the registry, and a helper `linkRecords({ key, firstRecordId, secondRecordId })` that resolves the key and POSTs `{ associationId, firstRecordId, secondRecordId, locationId }`.
- Add `associationsService.findRelation(key, recordId)` for 1:1 guards (traverse `GET /associations/relations`).
**Acceptance:** the 24 canonical keys from `ASSOCIATIONS_REGISTRY.md` resolve to IDs at runtime; a unit test asserts `resolveId` maps a known key; no code passes `fromObjectKey`/`relationType`/`record1Id` shapes anymore.

## T4 — Generate per-object TypeScript types + Zod enums from the Data Dictionary
**Gap:** G9. Custom objects are `Record<string, any>`; no enum validation.
**Files:** `src/types/ghl.ts` (+ new `src/types/objects.ts` if cleaner)
**Do:**
- Add typed field interfaces + Zod schemas for Contact, Opportunity, Property, MyListing, Offer, Transaction using canonical keys and **option-key enums** from `DATA_DICTIONARY.md`/`GHL_INTEGRATION_MAPPING.md §16`.
- Enums to encode: offer `status`, `offer_type`, `financing_type`; transaction `status`, `transaction_type`; property `property_status`, `property_type`, `garage`, `basement`, `heating_type`; my_listings `listing_status`, `property_type`.
- Keep `.passthrough()` for forward-compat, but type the known keys.
**Acceptance:** `typecheck` green; a vitest asserts a valid record parses and an invalid enum value fails.

---

# WORKSTREAM 2 — Field-key & enum migration (grep-and-replace per MIGRATION_MAP)

> For each task: grep the deprecated key, replace with canonical, update forms/columns/filters, and re-run the toolchain. Anything from `MIGRATION_MAP.md` still present after this workstream is a defect.

## T5 — Offers: migrate field keys, object key, enum, and payload prefix
**Gap:** G2, G3. `MIGRATION_MAP.md §2`.
**Files:** `src/features/offers/components/new-offer-sheet.tsx`, `desktop-offer-detail.tsx`, `mobile-offer-detail.tsx`, `src/features/offers/desktop-view.tsx`, `mobile-view.tsx`, `src/features/dashboard/widgets/{pending-offers,needs-attention}.tsx`
**Replace:**
- object key `'real_estate_offer'` → `OBJECT_KEYS.offers` (`custom_objects.real_estate_offer`).
- `offer_price` → `purchase_price` · `irrevocable_until` → `expiry_date` · offer create `status: 'submitted'` → `'pending'`.
- Reads: unify `status`/`offer_status` on canonical **`status`**.
- Payload: write custom fields with full dotted prefix (`custom_objects.real_estate_offer.<key>`).
**Acceptance:** no `offer_price`/`irrevocable_until`/`'submitted'` remain under `features/offers` or dashboard; offer create/list/detail render against live data.

## T6 — Offers: generate `offer_id`, link parent Opportunity + Property, write soft-FK
**Gap:** G2. `AGENT_DB_GUIDE.md §5.1`, `ASSOCIATIONS_REGISTRY.md §6`.
**Files:** `src/features/offers/components/new-offer-sheet.tsx`, new `src/lib/ghl/ids.ts` (id generator)
**Do:**
- Add `nextOfferId()` → `OFR-YYYYMMDD-NNN` (search existing offers for today's prefix to pick NNN). Same helper shape reused by T10.
- Require a parent Opportunity in the form; on create, `linkRecords({ key: 'offers_opportunity', … })`.
- If a Property (MLS) is selected, `linkRecords({ key: 'offers_property', … })` **and** set `mls_number = properties.mls` + denormalize `property_address`.
- Link buyer/seller/agents with role keys (`offer_buyer`, `offer_seller`, `offer_buyer_agent`, `offer_seller_agent`).
**Acceptance:** a created offer has a valid `offer_id`, a parent-opp relation, and (when a property is chosen) an `offers_property` relation + populated `mls_number`.

## T7 — My Listings: migrate field keys, enum, and add MLS-property link
**Gap:** G4. `MIGRATION_MAP.md §4`.
**Files:** `src/features/listings/components/new-listing-sheet.tsx`, `listing-edit-modal.tsx`, `listing-actions.tsx`, `listing-tabs.tsx`, `desktop-listing-detail.tsx`, `mobile-listing-detail.tsx`, `src/features/listings/{desktop,mobile}-view.tsx`
**Replace:**
- `address` → `property_address` · `list_price` → `listing_price` · `listing_stage` → `listing_status` · `beds` → `bedrooms` · `baths` → `bathrooms` · `sqft` → `square_footage`.
- `property_type` values → option keys (`house`/`condo`/`townhouse`/`land`/`commercial`); `listing_status` → `active`/`pending`/`sold`/`expired`/`withdrawn`.
- On create: `mls_number` required (soft-FK); search Property MLS by `mls`, and if found `linkRecords({ key: 'my_listings_mls_property', … })`; link seller via `my_listings_seller`.
**Acceptance:** no `listing_stage`/`beds`/`baths`/`sqft`/`address`/`list_price` keys under `features/listings`; listing create links seller (`my_listings_seller`) and, when matched, the MLS property.

## T8 — MLS Properties: align read keys; enforce read-only
**Gap:** `MIGRATION_MAP.md §4`.
**Files:** `src/features/mls/**`
**Replace (reads):** `properties.address` → `full_address` · `properties.mls_number` → `mls` · `sqft` → `square_footage` · `public_remarks` → `feature_highlights`/`property_notes` · `postal_code` → `postal` · `image_urls` → `property_images` + `listing_url`.
**Do:** keep `mlsPropertiesService` read-only (no create/update UI); expose `latitude`/`longitude` for map, `tax_assessment`/`condo_fees` for pricing.
**Acceptance:** MLS list/detail render canonical keys; no create/edit path exists on the Property object.

## T9 — Contacts/Leads: `lead_temperature`, `budget_max`, `lead_source`, tag mirroring
**Gap:** G7. `MIGRATION_MAP.md §5`.
**Files:** `src/features/leads/**`, `src/features/contacts/**`, `src/components/shared/notifications-feed.tsx`
**Replace/Do:**
- Temperature badge/filter read **`contact.lead_temperature`** (keep `temperature:*` tag as a mirror, not the source).
- `buyer_budget` → `budget_max` · `contact.source` → `lead_source` (canonical option list) · `buyer_must_haves` → `property_type_preference` (+ `notes_summary`) · `listing_address` → `current_address` · `pre_approval_lender` → `preapproval_status`.
- On any `lead_temperature` write, swap the matching `temperature:*` tag in the same mutation.
**Acceptance:** temperature/budget/source render from structured fields; writing temperature updates both the field and its tag.

---

# WORKSTREAM 3 — Deal lifecycle & remaining objects

## T10 — Transactions feature wired to live data + `transaction_id` generation
**Gap:** G1. `GHL_INTEGRATION_MAPPING.md §9`, `DATA_DICTIONARY.md §8`.
**Files:** `src/features/transactions/**`, `src/lib/ghl/ids.ts`
**Do:** wire `{desktop,mobile}-view.tsx` + detail components to `transactionsService` (search/get). Bind financials (`contract_price`, `commission_amount`, `commission_rate`, `profit_net`, `deposit_escrow`), status enum, and deadline countdowns (`inspection_deadline`, `financing_deadline`, `appraisal_date`, `final_walkthrough`, `closing_date`). Add `nextTransactionId()` → `TXN-YYYYMMDD-NNN`.
**Acceptance:** Transactions list + detail render live records; ids validate `^(OFR|TXN)-\d{8}-\d{3}$` (shared regex).

## T11 — Implement `useConvertOfferToTransaction` (Accept → Transaction, 1:1 guarded)
**Gap:** G8. `AGENT_DB_GUIDE.md §5.2`, `ASSOCIATIONS_REGISTRY.md §5`.
**Files:** new `src/features/offers/hooks/use-convert-offer.ts` (or `src/lib/ghl/lifecycle.ts`)
**Do (idempotent):**
- assert `offer.status === 'accepted'`; `findRelation('transaction_offer', offerId)` must be empty (1:1 guard).
- create Transaction (`transaction_id` from T10, `status: 'under_contract'`, `contract_price = offer.purchase_price`, `deposit_escrow = offer.deposit_amount`, `closing_date = offer.closing_date`).
- `linkRecords('transaction_offer', …)`; copy `offer_buyer→transaction_buyer`, `offer_seller→transaction_seller`, agents→`transaction_{listing,selling}_agent`.
- if parent opp: guard + `linkRecords('transaction_opportunity', …)`, set opp `status='won'`. If linked my_listing: guard + `my_listings_transactions`.
- Invalidate the offer/transaction/opp `detail`+`list` keys and the touched `['ghl','relations',id]` keys.
**Acceptance:** accepting an offer creates exactly one linked Transaction; re-running is a no-op (guard holds); a vitest covers the guard logic with mocked services.

## T12 — Close-transaction propagation (status → closed)
**Gap:** lifecycle. `AGENT_DB_GUIDE.md §5.3`.
**Files:** `src/features/transactions/**`, `src/lib/ghl/lifecycle.ts`
**Do (idempotent, app-side mirror of the workflow):** on `transactions.status → closed`: set linked `my_listings.listing_status = 'sold'` (via `my_listings_transactions`), `properties.property_status = 'sold'` + `sold_price = contract_price` + `sold_date = closing_date` (via `transaction_property`), and `contact.closing_anniversary = closing_date` for buyer + seller. Re-check each before writing.
**Acceptance:** closing a transaction updates the linked listing/property/contacts once; re-run changes nothing.

## T13 — Validation layer + soft-FK & id guards
**Gap:** G9 follow-through. `AGENT_DB_GUIDE.md §7`.
**Files:** `src/lib/ghl/validation.ts` (new), form resolvers under `features/**`
**Do:** generate Zod validators from T4 enums; add regexes — `offer_id`/`transaction_id` `^(OFR|TXN)-\d{8}-\d{3}$`, `mls` board format (uppercase-normalize), Canadian postal `^[A-Z]\d[A-Z] ?\d[A-Z]\d$`; money nonnegative-or-null; dates ISO-or-null (reject epoch). On any `mls_number` write, verify a `properties.mls` exists (warn-but-allow if MLS sync hasn't ingested yet).
**Acceptance:** offer/listing/transaction forms reject malformed ids/enums/dates; soft-FK writes warn on orphan MLS.

---

# WORKSTREAM 4 — Optional / follow-on

## T14 — Business/Company object (if PRD requires it)
**Gap:** G10. No feature/service for `business`. Add `businessService` + minimal directory + `BUSINESSES_CONTACTS_ASSOCIATION` linking on the Contact detail. **Confirm against PRD before building** — may be out of scope for v1.

## T15 — Note `relations[]` multi-object linking in the Notes UI
Wire `note.relations[]` so a note created from an opportunity/offer/property/transaction detail carries `{ objectKey, recordId }`, surfacing it in that object's timeline. Files: `src/features/notes/**`, `notesService`.

## T16 — Task object associations (link tasks to any object)
Use the 7 SYSTEM_DEFINED task associations (`ENTITY_BREAKDOWN.md §9.1`) so a task created from an object detail links to it. Files: `src/features/tasks/**`, `tasksGlobal`.

---

## Verification checklist (run after the workstream lands)

- [ ] `grep -rE "offer_price|irrevocable_until|listing_stage|buyer_budget|public_remarks|properties\.mls_number|offer_to_contact|listing_to_contact" src` returns **nothing**.
- [ ] `OBJECT_KEYS` has 4 custom keys; bootstrap loads 4 schemas + an association-key→ID map.
- [ ] Offer/Transaction ids match `^(OFR|TXN)-\d{8}-\d{3}$`.
- [ ] Accept-offer round-trip (create → associate → convert) works against a sandbox record and is idempotent.
- [ ] `bun run typecheck && bun run lint && bunx vitest run && bun run build` all green.

*Source of truth for every key/enum/association referenced above: `/docs/database/` (v2.0.0). If this file and the canonical package ever disagree, the canonical package wins.*
