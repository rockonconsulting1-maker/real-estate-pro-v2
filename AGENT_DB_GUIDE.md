# Agent & Developer DB Guide — Real Estate Pro CRM

**Version:** 2.0.0 | Date: 2026-07-07
**Audience:** AI coding agents and developers writing anything that reads or writes CRM data.
**Pairs with:** `DATA_DICTIONARY.md` (fields) · `ASSOCIATIONS_REGISTRY.md` (relationships) · `MIGRATION_MAP.md` (old→new) · `PRD.md` §6–7 (architecture & caching) · `GHL_Integration_Mapping.md` (screen→endpoint).

---

## 1. System topology

```
React 18 + TS (Vite) ──► GHL REST API (PIT bearer, Version header)
        │                      └── system of record: all 7 objects, associations, pipelines
        └────────────────────► Supabase
                               ├── Auth (user sessions)
                               └── Storage (documents; UUIDs stored in *.documents_ref)
Base URL: https://services.leadconnectorhq.com
Location : jHEaG68TeCsXHXPhrVtU (scopes every request)
```

Rate limits per sub-account: reads ~100/s, writes ~40/s, bulk ~10/s, search ~50/s. The client's token-bucket limiter + dedupe + 429 backoff is mandatory transport; never bypass it with raw `fetch`.

## 2. Bootstrap registry (resolve once, cache 24h)

On login, one parallel batch resolves the slow-changing spine before the shell renders:

| Registry | Source | Resolved By |
|---|---|---|
| Pipelines + stages | `GET /opportunities/pipelines` | **Name** (`Buyer Transaction`, `Seller Transaction`, `Lead Nurture Pipeline`) → IDs, stage maps, `win_probability` |
| Object schemas (4 custom) | `GET /objects/{key}?fetchProperties=true` | Object key → field definitions (validate local types against live) |
| Custom-field definitions | `GET /locations/{id}/customFields` | Field key → field ID |
| **Association keys (24)** | Associations API list | **Key** (see `ASSOCIATIONS_REGISTRY.md`) → association ID |
| Calendars | `GET /calendars` | Name (`Open House`, `Final Walkthrough`, `Key Exchange`) → IDs |
| Users, tags | `GET /users`, `GET /locations/{id}/tags` | — |

**Rule:** any code needing a pipeline ID, stage ID, association ID, or custom-field ID gets it from this registry. Hard-coded IDs are defects.

## 3. Query-key & hook conventions (TanStack Query)

Query keys mirror object keys so cache invalidation maps 1:1 to the schema:

```
['contacts', 'list', filters]            ['contacts', 'detail', contactId]
['opportunities', 'list', pipelineId]    ['opportunities', 'detail', oppId]
['objects', 'properties', 'list', f]     ['objects', 'properties', 'detail', id]
['objects', 'my_listings', ...]          ['objects', 'real_estate_offer', ...]
['objects', 'transactions', ...]
['associations', assocKey, recordId]     // relations for one record via one key
['conversations', ...] ['appointments', ...] ['tasks', ...] ['notes', contactId]
['registry', 'pipelines' | 'schemas' | 'associations' | 'calendars' | 'tags' | 'users']
```

staleTime tiers (PRD §7): registry/schema 24h · lists 60s · detail 30s · conversations 15s (+refetchInterval while open).

**Hook ↔ object map** (canonical names; one hook family per object):

| Hook family | Object | Notes |
|---|---|---|
| `useContacts` / `useContact(id)` | `contact` | search via `POST /contacts/search` |
| `useOpportunities(pipeline)` / `useOpportunity(id)` | `opportunity` | stage moves = optimistic update + invalidate list |
| `useProperties` / `useProperty(id)` | `custom_objects.properties` | `POST /objects/custom_objects.properties/records/search` |
| `useMyListings` / `useMyListing(id)` | `custom_objects.my_listings` | |
| `useOffers` / `useOffer(id)` | `custom_objects.real_estate_offer` | |
| `useTransactions` / `useTransaction(id)` | `custom_objects.transactions` | |
| `useRelations(assocKey, recordId)` | Associations API | returns related record IDs; compose with detail hooks |
| `useConvertOfferToTransaction(offerId)` | mutation | implements §5 conversion algorithm |
| `useRegistry()` | bootstrap spine | pipelines, schemas, association IDs, calendars |

**Mutation invalidation rule:** a mutation invalidates its own object's `detail` + `list` keys **plus** the `['associations', key, id]` keys of every record it linked/unlinked, **plus** any soft-FK counterpart it wrote.

## 4. Read/write payload rules (apply to every request)

1. **Full dotted prefix for custom-object fields:** payload key `custom_objects.real_estate_offer.purchase_price`. Bare keys silently miss or hit wrong fields.
2. **Option keys, not labels**, for single/multi-selects: `"under_contract"`, `"cmhc_insured"`.
3. **Money = raw number** (`500000`), **date = `YYYY-MM-DD`**, timezone `America/Edmonton`.
4. **Null until known** — never write `0`, `""`, or epoch placeholders.
5. **Primary display fields must always be populated** on create (`email`, `name`, `mls`, `mls_number`, `offer_id`, `transaction_id`) — association panels render these.
6. **Record ID generation:** `offer_id = OFR-YYYYMMDD-NNN`, `transaction_id = TXN-YYYYMMDD-NNN`; NNN = zero-padded daily sequence (search existing records for the date prefix before assigning).
7. **Workflow-owned fields are read-only in app code:** `contact.temperature`, `contact.referral_count`, `opportunity.follow_up_count`, `properties.days_on_market`, `my_listings.last_synced`. Display them; never write them.
8. **API-sync-owned object:** `custom_objects.properties` records are created/updated by the MLS sync only. App code may read and associate, never create/edit (exception: `documents_ref`, `property_notes`).
9. **Tag mirroring:** when writing `contact.lead_temperature`, swap the matching `temperature:*` tag in the same mutation.

## 5. Deal-lifecycle write algorithms (the core chain)

`CONTACT → OPPORTUNITY (pipeline) → OFFER (negotiation) → TRANSACTION (closing)`

### 5.1 Create Offer
1. Require parent Opportunity → link via `offers_opportunity`.
2. If a Property (MLS) is chosen → link via `offers_property` AND write `real_estate_offer.mls_number = properties.mls` + denormalize `property_address`.
3. Link parties with role keys (`offer_buyer`, `offer_seller`, agents as applicable).
4. Status starts `pending`.

### 5.2 Accept Offer → Transaction (1:1 guarded)
```
assert offer.status == 'accepted'
assert no existing relation on transaction_offer for this offer      // 1:1 guard
tx = create transactions { transaction_id: next TXN id, status: 'under_contract',
                           contract_price: offer.purchase_price,
                           deposit_escrow: offer.deposit_amount,
                           closing_date: offer.closing_date }
link transaction_offer(offer, tx)
copy contact relations:  offer_buyer → transaction_buyer, offer_seller → transaction_seller,
                         offer_*_agent → transaction_{listing|selling}_agent
if parent opportunity: link transaction_opportunity (guard: none exists), set opportunity.status = 'won'
if linked my_listing:  link my_listings_transactions (guard: none exists)
```

### 5.3 Close Transaction
```
transactions.status → 'closed'
  → my_listings.listing_status = 'sold' (via my_listings_transactions link)
  → properties.property_status = 'sold'; properties.sold_price = contract_price; properties.sold_date = closing_date
  → contact.closing_anniversary = closing_date (buyer + seller contacts)
```

These transitions may be executed by GHL Workflows or app mutations — **whichever runs must be idempotent** (re-check guards; upsert semantics).

## 6. Component ↔ field alignment (canonical bindings)

Screen→endpoint detail lives in `GHL_Integration_Mapping.md`; the bindings below override its deprecated keys (see `MIGRATION_MAP.md`).

| Component | Binding (canonical) |
|---|---|
| Lead card / Leads kanban | `contact.first_name/last_name`, `lead_temperature` (badge), `lead_source`, `lead_score`, `buyer_seller_type`; pipeline = Lead Nurture stages |
| Client Detail metric grid | Budget → `contact.budget_max` · Pre-approval → `contact.preapproval_status` · Active Offer → related offer where `status = 'pending'` via `offers_opportunity` |
| Buyer match filters | `contact.bed_min/bath_min/budget_max/property_type_preference` vs `properties.bedrooms/bathrooms/list_price/property_type` |
| My Listings table | `my_listings.property_address`, `listing_price`, `listing_status` (badge), `bedrooms/bathrooms`, `days_on_market`, `open_house_date`, docs count from `documents_ref` |
| MLS Property detail | header `properties.full_address` + `mls`; specs `bedrooms/bathrooms/square_footage/year_built/garage/basement/heating_type`; map `latitude/longitude`; money `list_price/sold_price/tax_assessment/condo_fees`; copy `feature_highlights` |
| Offer card / Offers board | `real_estate_offer.offer_id`, `purchase_price`, `counter_price`, `status` (badge), countdown on `expiry_date` + `conditions_deadline`, parties via role associations |
| Transaction detail | `transactions.transaction_id`, `status`, financials block (`contract_price/commission_amount/commission_rate/profit_net`), deadline countdowns (`inspection_deadline/financing_deadline/final_walkthrough/closing_date`) |
| Countdown chips (global) | any `*_deadline`, `*_date`, `expiry_date` field — time is first-class per design.md |
| Documents panel | `documents_ref` UUIDs → Supabase signed URLs; contact docs via native Documents module (`contactId`) |
| Weighted pipeline widget | `SUM(opportunity.monetary_value × stage.win_probability / 100)` per pipeline |

## 7. Validation layer (Zod or equivalent — generate from the dictionary)

- Enum schemas per field, using option keys from `DATA_DICTIONARY.md`.
- `mls` / `mls_number`: `^[A-Z]\d{7}$`-style board format (confirm per board); uppercase-normalize on input.
- `offer_id` / `transaction_id`: `^(OFR|TXN)-\d{8}-\d{3}$`.
- Money: nonnegative number or null. Dates: ISO string or null; reject epoch.
- Soft-FK writes: when setting any `mls_number`, verify a `properties.mls` record exists (search by `mls`); warn-but-allow if the MLS sync hasn't ingested it yet.
- Postal codes: `^[A-Z]\d[A-Z] ?\d[A-Z]\d$` (Canadian).

## 8. Search patterns (only searchable fields work in search endpoints & workflow search)

| Need | Do |
|---|---|
| Find property by MLS# | `POST /objects/custom_objects.properties/records/search` on `mls` (exact) |
| Find a transaction | search `transaction_id` — the only searchable TX field |
| Find offers on an address | search `property_address` or `mls_number` on the offer object |
| Contact lookup | `POST /contacts/search` on name/email/phone/tags |
| Anything non-searchable | traverse associations from a searchable anchor record |

## 9. Failure & edge handling

- **404 on relation create** → association ID stale; re-resolve the registry, retry once.
- **409/duplicate on `properties.mls`** → record exists; switch to update-by-search, never duplicate.
- **1:1 guard race** (two agents accept simultaneously) → re-query the relation after create; if two exist, keep the earliest, delete the later, alert.
- **Soft-FK orphan** (`mls_number` with no `properties.mls` match) → render with a "not in MLS index" badge; queue for the sync job; do not block the deal.
- **Legacy `contact.temperature` ≠ `lead_temperature`** → display `lead_temperature`; show legacy value only in a debug/inspector view.

## Changelog

| Version | Date | Description |
|---|---|---|
| 2.0.0 | 2026-07-07 | Initial guide aligned to the 2.0.0 canonical schema |
