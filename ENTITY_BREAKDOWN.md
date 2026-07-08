# Real Estate Pro CRM — Entity Breakdown (Dev-Aligned)

> **Replaces** the legacy `Entity Breakdown.md` (v3, 2026-07-02).
> **Canonical source of truth:** `/docs/database/` package (v2.0.0). This file is the **entity-level, developer-facing** companion to that package — it adds per-entity *code alignment* (which `src/` feature, hook, service, and component owns each object) on top of the canonical field/association model.
>
> **Precedence (conflict resolution):**
> 1. Live GHL API schema (`GET /objects/{key}?fetchProperties=true`)
> 2. `/docs/database/DATA_DICTIONARY.md` + `/docs/database/ASSOCIATIONS_REGISTRY.md`
> 3. This file (entity + code alignment) and `GHL_INTEGRATION_MAPPING.md` (screens)
> 4. `INTEGRATION_SCHEMA.md` (consolidated reference)
>
> **Sub-Account:** 9% Realty — Southern Alberta · `locationId: jHEaG68TeCsXHXPhrVtU`
> **Base URL:** `https://services.leadconnectorhq.com` (PIT bearer + `Version` header)

---

## Table of Contents

1. [Object inventory & code ownership](#1-object-inventory--code-ownership)
2. [Contact](#2-contact)
3. [Opportunity (+ Pipelines)](#3-opportunity--pipelines)
4. [Property (MLS)](#4-property-mls)
5. [My Listing](#5-my-listing)
6. [Offer](#6-offer)
7. [Transaction](#7-transaction)
8. [Business / Company](#8-business--company)
9. [System-native objects: Tasks, Notes, Appointments, Documents, Conversations](#9-system-native-objects)
10. [Association model (role-via-key)](#10-association-model-role-via-key)
11. [Deal lifecycle flow](#11-deal-lifecycle-flow)
12. [Known code ↔ schema gaps](#12-known-code--schema-gaps)

---

## 1. Object inventory & code ownership

Seven registry objects (3 system + 4 custom). **Custom-object field keys carry the full dotted prefix in API payloads** (`custom_objects.properties.mls`, never bare `mls`).

| # | Object | Object Key | Object ID | Primary Display | Required | `src/` feature | Service (`src/lib/ghl/services`) | Query keys (`src/lib/queryKeys.ts`) |
|---|---|---|---|---|---|---|---|---|
| 1 | Contact | `contact` | `6a44a1e5581b923d9e657d3a` | `email` | `email` | `features/contacts`, `leads`, `clients` | `contacts.ts` | `ghl.contacts`, `ghl.contact(id)` |
| 2 | Opportunity | `opportunity` | `6a44a1e5581b9214c0657d3b` | `name` | `name`,`pipeline_id`,`pipeline_stage_id`,`contact_id` | `features/leads`, `clients`, `dashboard` | `opportunities.ts` | `ghl.opps`, `ghl.opp(id)` |
| 3 | Business | `business` | `6a44a1e5581b920951657d3c` | `name` | `name` | *(none — gap)* | *(none — gap)* | — |
| 4 | Property (MLS) | `custom_objects.properties` | `6a44a1e75fd80c02ec76b5ef` | `mls` | `mls` (unique ✓) | `features/mls` | `objects.ts` → `mlsPropertiesService` | `ghl.records('properties',…)`, `ghl.record` |
| 5 | My Listing | `custom_objects.my_listings` | `6a44b1692c3079662fdd9736` | `mls_number` | `mls_number` | `features/listings` | `objects.ts` → `myListingsService` | `ghl.records('my_listings',…)` |
| 6 | Offer | `custom_objects.real_estate_offer` | `6a44a1e75fd80c971d76b5f0` | `offer_id` | `offer_id` | `features/offers` | `objects.ts` → `offersService` | `ghl.records('real_estate_offer',…)` |
| 7 | Transaction | `custom_objects.transactions` | `6a44b1696a2c18dc4bd8dd08` | `transaction_id` | `transaction_id` | `features/transactions` | **MISSING — see §12** | `ghl.records('transactions',…)` |

**System-native (not in the object registry, but full API objects):** `task` (full object type), Notes, Appointments/Calendars, Conversations/Messages, Documents, Users, Pipelines/Stages, Tags. See §9.

> **Bootstrap rule:** `useBootstrap()` resolves the slow-changing spine once (24h cache): pipelines by name, the 4 custom-object schemas, custom fields, association keys→IDs, calendars, users, tags. Any code needing a pipeline/stage/association/custom-field ID gets it from the registry — **hard-coded IDs are defects.** (Today bootstrap loads only 3 schemas and does not build an association-key→ID map — see §12.)

---

## 2. Contact

**Key:** `contact` · **Type:** SYSTEM_DEFINED · **Primary display:** `contact.email` · **Required:** `contact.email` (UI also requires `first_name`)
**Searchable:** `name`, `email`, `businessName`, `tags`, `phone` · **Search endpoint:** `POST /contacts/search`
**Code:** `features/contacts` (directory), also surfaced as Leads (`features/leads`) and Clients (`features/clients`). Service: `contactsService`.

**Multi-role object.** One Contact represents a person across every role — lead, buyer, seller, past client, vendor, agent, SOI. Role is expressed with fields (`buyer_seller_type`, `vendor_service_type`, `type`) + tags + **deal-side association keys** (`offer_buyer` vs `offer_seller`, …). **Never duplicate a contact to represent a second role, and never model deal-role as a field on the Offer/Transaction.**

### 2.1 Field groups (canonical — full list in `DATA_DICTIONARY.md §2`)

| Group | Key fields |
|---|---|
| Standard | `first_name`, `last_name`, `email`, `phone`, `company_name`, `address1`, `city`, `country`, `timezone`, `type` (`lead`/`customer`/`prospect`/`past_client`), `tags`, `dnd` |
| Lead classification | `lead_source`, **`lead_temperature`** (`Hot`/`Warm`/`Cold`/`Dead` — canonical), `buyer_seller_type`, `lead_timeline`, `preapproval_status`, `lead_score` |
| Buyer preferences | `property_type_preference` (multi), `bed_min`, `bath_min`, `budget_max`, `monthly_budget`, `desired_possession_date`, `current_mortgage_status`, `target_roi` |
| Seller | `reason_for_selling`, `current_address`, `closing_date` |
| Vendor | `vendor_service_type`, `vendor_priority` |
| SOI & relationship | `soi_relationship`, `preferred_communication`, `annual_touchpoint_goal`, `referral_count`, `referral_source_contact`, `vip_status`, `review_received` |
| Dates & tracking | `last_interaction_date`, `last_contact_date`, `closing_anniversary`, `notes_summary` |
| Billing | `std_billing_address_full_name`, `std_billing_address_phone`, `std_billing_address_address1` |

> **⚠ Temperature:** `contact.temperature` is a **legacy free-text** field written by the "Lead Temperature Update" workflow. Read/write **`contact.lead_temperature`** (Single Select) in app code. When you write `lead_temperature`, swap the matching `temperature:*` tag in the same mutation (the structured field is source of truth; the tag mirrors it).
> **Workflow-owned (read-only in app):** `temperature`, `referral_count`.

### 2.2 Associations (canonical keys — full registry in `ASSOCIATIONS_REGISTRY.md`)

| Key | Role | To object | Card. |
|---|---|---|---|
| `contact` | Interested | Property (MLS) | M:M |
| `property_seller` | Seller | Property (MLS) | M:M |
| `offer_buyer` / `offer_seller` / `offer_buyer_agent` / `offer_seller_agent` | Buyer / Seller / Buyer Agent / Seller Agent | Offer | M:M |
| `my_listings_seller` / `my_listings_buyer_lead` | Seller / Buyer Lead | My Listing | M:M |
| `transaction_buyer` / `transaction_seller` / `transaction_listing_agent` / `transaction_selling_agent` | Buyer / Seller / Listing Agent / Selling Agent | Transaction | M:M |
| `OPPORTUNITIES_CONTACTS_ASSOCIATION` | — | Opportunity | M:M (25/opp) |
| `BUSINESSES_CONTACTS_ASSOCIATION` | — | Business | 1:M |
| `TASK_CONTACT_ASSOCIATION` | — | Task | M:M (10 tasks/contact) |

**Hard-FK links (activity objects carry `contactId`):** Note (required), Appointment (required), Conversation (required), Document (required), **Task (optional — standalone tasks supported).**

---

## 3. Opportunity (+ Pipelines)

**Key:** `opportunity` · **Type:** SYSTEM_DEFINED · **Primary display:** `opportunity.name` · **Required:** `name`, `pipeline_id`, `pipeline_stage_id`, `contact_id` (on create)
**Searchable:** `name`, `contactName`, `contactPhone`, `contactEmail`, `businessName`, `tags`
**Code:** Leads board/detail (`features/leads`), Clients pipelines (`features/clients`), Dashboard KPIs (`features/dashboard`). Service: `opportunitiesService`. Registry: `PipelineRegistry` (`src/lib/pipeline-registry.ts`).

**Naming convention:** `[Contact Last Name] — [Property Address or Deal Type]` (e.g. `Smith — 123 Main St`). A **Won** opportunity triggers exactly one Transaction (1:1, workflow/app-enforced).

### 3.1 Field groups (canonical — `DATA_DICTIONARY.md §4`)

| Group | Key fields |
|---|---|
| Standard | `name`, `pipeline_id`, `pipeline_stage_id`, `contact_id`, `status` (`open`/`won`/`lost`/`abandoned`), `monetary_value`, `assigned_to`, `source`, `lost_reason` (system), `tags`, `followers` |
| Deal details | `deal_type`, **`mls_number`** (soft-FK → `properties.mls`), `financing_type`, `other_agent_name`, `other_agent_brokerage`, `loss_reason` (picklist) |
| Dates | `closing_date`, `expected_close_date`, `conditions_deadline` |
| Scoring | `lead_quality_score` (0–10 manual), `follow_up_count` (workflow-incremented, read-only) |

### 3.2 Pipelines (IDs resolve by **name** at bootstrap — never hard-code; snapshot IDs below are reference only)

| Pipeline | Snapshot ID | Stages | Win% range |
|---|---|---|---|
| **Lead Nurture Pipeline** | `Q4eAlyD0WM3BLcdZDq0k` | 8: New Lead → Contacted → Engaged → Nurturing (Long-term) → Appointment Set → Appointment Completed → Proposal/Listing Presentation → Agreement Signed | 11.11% → 88.89% |
| **Buyer Transaction Pipeline** | `YuJxUg6wXotb8rjfdPnt` | 10: Needs Analysis → Property Search → Offer Preparation → Offer Submitted → Under Contract → Inspection & Due Diligence → Conditions Removal → Financing Confirmation → Clear to Close → Closed | 9.09% → 90.91% |
| **Seller Transaction Pipeline** | `bNzCbECMSyZ1ZmSD0QnQ` | 9: Pre-Listing → Listing Agreement Signed → Listing Prep → Active on Market → Showings & Open Houses → Offer Review → Under Contract → Conditions & Closing Prep → Closed | 10% → 90% |

> **Weighted forecast:** `SUM(opportunity.monetary_value × stage.win_probability / 100)` per pipeline. `PipelineRegistry` resolves by name via fuzzy match (`lead` / `buyer` / `seller`). Note: `STAGE_COLORS` has only 6 entries and wraps for 10-stage pipelines (cosmetic).

### 3.3 Associations

| Key | To object | Card. | Notes |
|---|---|---|---|
| `OPPORTUNITIES_CONTACTS_ASSOCIATION` | Contact | M:M (25/opp) | System |
| `opportunity` | Property (MLS) | **1:1** (platform max 1/side) | ⚠ counter-intuitive key name; deal's target property; soft-FK `opportunity.mls_number` |
| `offers_opportunity` | Offer | 1:M | one opp → many offer rounds |
| `transaction_opportunity` | Transaction | M:M (**app-enforced 1:1**) | only a `won` opp links |
| `my_listings_opportunity` | My Listing | M:M | seller-side deal |
| `TASK_OPPORTUNITY_ASSOCIATION` | Task | M:M (25 tasks/opp) | SYSTEM_DEFINED internal |

---

## 4. Property (MLS)

**Key:** `custom_objects.properties` · **Type:** USER_DEFINED · **Primary display:** `mls` · **Required + Unique (platform-enforced):** `mls`
**Searchable:** `mls`, `full_address`, `property_name` · **Search:** `POST /objects/custom_objects.properties/records/search`
**Code:** `features/mls`. Service: `mlsPropertiesService` (read-only wrapper — no create/update).

**Read-heavy MLS reference universe** for comps, buyer matching, analysis. **Records are created/updated by the MLS sync only.** App code may read + associate + write only `documents_ref` / `property_notes`; never create or edit other fields.

### 4.1 Field groups (canonical — `DATA_DICTIONARY.md §5`)

| Group | Key fields |
|---|---|
| Identification & status | `mls`, `property_name`, `full_address`, `property_status` (`active`/`pending`/`sold`/`expired`/`withdrawn`/`coming_soon`), `property_type` (`single_family`/`condo`/`townhouse`/`multifamily`/`land`/`commercial`), `sub_type` |
| Pricing & market | `list_price`, `sold_price`, `tax_assessment`, `condo_fees`, `days_on_market` (sync-calculated, read-only) |
| Physical | `bedrooms`, `bathrooms`, `square_footage`, `lot_size`, `year_built`, `garage`, `basement`, `heating_type`, `features_amenities`, `feature_highlights` |
| Location | `city`, `province`, **`postal`** (⚠ key is `postal`, NOT `postal_code`), `latitude`, `longitude` |
| Dates | `listing_date`, `listing_expiry`, `sold_date` |
| Media & docs | `listing_url`, `property_images` (File), `property_notes`, `documents_ref` |

### 4.2 Associations

`contact` (interested, M:M) · `property_seller` (seller, M:M) · `offers_property` (M:1 — many offers/property) · `opportunity` (1:1) · `transaction_property` (M:M) · `my_listings_mls_property` (use as 1:1; paired with `my_listings.mls_number` soft-FK) · `TASK_CUSTOM_OBJECTS.PROPERTIES_ASSOCIATION` (Task, M:M).

---

## 5. My Listing

**Key:** `custom_objects.my_listings` · **Type:** USER_DEFINED · **Primary display:** `mls_number` · **Required:** `mls_number` (soft-FK → `properties.mls`)
**Searchable:** `mls_number` · **Code:** `features/listings`. Service: `myListingsService`.

**Personal inventory layer** — listings the agent actively manages/markets (Realtor.ca sync, open houses, seller automations). Every My Listing should have a Property (MLS) record linked via `mls_number` soft-FK **and** the `my_listings_mls_property` association.

### 5.1 Field groups (canonical — `DATA_DICTIONARY.md §6`)

| Group | Key fields |
|---|---|
| Identification & status | `mls_number`, `listing_key`, `listing_status` (`active`/`pending`/`sold`/`expired`/`withdrawn`) |
| Location | `property_address`, `city`, `province`, `postal_code` |
| Property details | `property_type` (⚠ enum `house`/`condo`/`townhouse`/`land`/`commercial` — **differs from `properties.property_type`**), `sub_type`, `bedrooms`, `bathrooms`, `square_footage`, `lot_size`, `year_built` |
| Listing details | `listing_price`, `listing_date`, `days_on_market`, `realtor_url`, `open_house_date`, `listing_description` |
| Agent & marketing | `agent_name`, `brokerage`, `photos_url`, `tags`, `notes`, `last_synced` (read-only) |

### 5.2 Associations

`my_listings_seller` / `my_listings_buyer_lead` (Contact) · `my_listings_mls_property` (Property, 1:1) · `my_listings_offers` (Offer, M:M) · `my_listings_transactions` (Transaction, **app-enforced 1:1**) · `my_listings_opportunity` (Opportunity) · `TASK_CUSTOM_OBJECTS.MY_LISTINGS_ASSOCIATION` (Task).

---

## 6. Offer

**Key:** `custom_objects.real_estate_offer` · **Type:** USER_DEFINED · **Primary display:** `offer_id` · **Required:** `offer_id`
**`offer_id` convention:** `OFR-YYYYMMDD-NNN` (daily zero-padded sequence). **Searchable:** `offer_id`, `property_address`, `mls_number`.
**Code:** `features/offers`. Service: `offersService`. Create modal: `features/offers/components/new-offer-sheet.tsx`.

**Negotiation ledger.** Multiple Offer records per deal (initial, counters, revisions). Only one Offer per deal reaches `accepted` → triggers exactly one Transaction (1:1). The Offer freezes legal/financial terms.

### 6.1 Field groups (canonical — `DATA_DICTIONARY.md §7`)

| Group | Key fields |
|---|---|
| Identification & property ref | `offer_id`, `property_address` (denormalized), `mls_number` (soft-FK → `properties.mls`) |
| Offer terms | `offer_type` (`buyer_offer`/`seller_offer`/`counter_offer`), **`status`** (`pending`/`accepted`/`countered`/`rejected`/`closed`/`expired`), `financing_type` (`conventional`/`cmhc_insured`/`cash`/`private`/`other`) |
| Prices & deposits | `purchase_price`, `deposit_amount`, `additional_deposit`, `counter_price`, `commission_amount`, `commission_split` |
| Key dates | `offer_date`, `expiry_date` (irrevocability), `conditions_deadline`, `closing_date`, `possession_date` |
| Legal & terms | `legal_description`, `conditions`, `contingencies`, `terms_conditions`, `included_chattels`, `excluded_fixtures`, `notes`, `submitted_by`, `documents_ref` |

> **⚠ Deprecated → canonical (from `MIGRATION_MAP.md §2`):** `offer_price` → `purchase_price` · `irrevocable_until` → `expiry_date` · offer status label `submitted`/`Declined` → option keys `pending`/`rejected`. These deprecated keys are still live in `features/offers/*` code — see §12 and `SCHEMA_ALIGNMENT_TASKS.md`.

### 6.2 Associations

`offer_buyer` / `offer_seller` / `offer_buyer_agent` / `offer_seller_agent` (Contact, role-via-key) · `offers_property` (Property, M:1; write `mls_number` soft-FK on link) · `offers_opportunity` (Opportunity, 1:M — parent) · `my_listings_offers` (My Listing, M:M) · `transaction_offer` (Transaction, **app-enforced 1:1** — only `accepted` converts) · `TASK_CUSTOM_OBJECTS.REAL_ESTATE_OFFER_ASSOCIATION` (Task).

---

## 7. Transaction

**Key:** `custom_objects.transactions` · **Type:** USER_DEFINED · **Primary display:** `transaction_id` · **Required:** `transaction_id`
**`transaction_id` convention:** `TXN-YYYYMMDD-NNN`. **Searchable:** `transaction_id` (the only searchable TX field).
**Code:** `features/transactions` (views + detail components exist). Service: **MISSING** — no `transactionsService`, not in `OBJECT_KEYS`, not loaded at bootstrap. See §12.

**Deal-close record.** Created once fully contracted; consolidates financials, commission, key dates. **One Transaction per deal** — source of truth for commission reporting and post-close automations.

### 7.1 Field groups (canonical — `DATA_DICTIONARY.md §8`)

| Group | Key fields |
|---|---|
| Identification & type | `transaction_id`, `transaction_type` (`sale`/`purchase`/`lease`/`referral`), **`status`** (`under_contract`/`pending`/`closed`/`cancelled`/`failed`), `brokerages`, `referral_source` |
| Financials | `contract_price`, `deposit_escrow`, `commission_amount`, `commission_rate`, `commission_split_details`, `profit_net` |
| Key dates | `closing_date`, `inspection_deadline`, `appraisal_date`, `financing_deadline`, `final_walkthrough` |
| Notes & docs | `post_transaction_notes`, `documents_ref` |

### 7.2 Associations

`transaction_buyer` / `transaction_seller` / `transaction_listing_agent` / `transaction_selling_agent` (Contact — copied from Offer roles on conversion) · `transaction_property` (Property, M:M) · `transaction_offer` (Offer, 1:1) · `transaction_opportunity` (Opportunity, 1:1) · `my_listings_transactions` (My Listing, 1:1) · `TASK_CUSTOM_OBJECTS.TRANSACTIONS_ASSOCIATION` (Task).

---

## 8. Business / Company

**Key:** `business` · **Type:** SYSTEM_DEFINED · **Primary display:** `name` · **Required:** `name` · **Searchable:** `name`, `email`
**Code:** **no dedicated feature or service (gap).** Organizations only — brokerages, lenders, title companies, law firms. Individual vendors are Contacts with `vendor_service_type` set. Native association: 1 Business/Contact, up to 10,000 Contacts/Business (`BUSINESSES_CONTACTS_ASSOCIATION`).

Fields (all standard, no custom fields): `name`, `phone`, `email`, `website`, `address`, `city`, `state`, `postalcode`, `country`, `description`. Task association: `TASK_BUSINESS_ASSOCIATION` (M:M, 10 tasks/business).

---

## 9. System-native objects

Not in the object registry, but fully available via the API and associable.

### 9.1 Task — **full object type** (`key: task`)

**Code:** `features/tasks`. Service: `tasksGlobal.ts`. **⚠ v3 correction retained:** Tasks are a full object type at `POST /objects/task/records/search`, with SYSTEM_DEFINED internal associations exposed via `GET /associations/objectKey/task?includeInternalAssociations=true` (NOT the standard `GET /associations/`).

Fields: `contactId` (**optional** — standalone tasks supported), `title` (req), `body`, `dueDate`, `status` (`to_do`/`completed`), `assignedTo`, `businessId`.

**7 SYSTEM_DEFINED task associations** (UI "0/10" = `firstObjectToSecondObjectMaxLimit: 10`):

| Association ID | Object | Task Max | Object Max |
|---|---|---|---|
| `TASK_CONTACT_ASSOCIATION` | `contact` | 10 | 1,000 |
| `TASK_OPPORTUNITY_ASSOCIATION` | `opportunity` | 10 | 25 |
| `TASK_BUSINESS_ASSOCIATION` | `business` | 10 | 10,000 |
| `TASK_CUSTOM_OBJECTS.REAL_ESTATE_OFFER_ASSOCIATION` | `custom_objects.real_estate_offer` | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.PROPERTIES_ASSOCIATION` | `custom_objects.properties` | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.MY_LISTINGS_ASSOCIATION` | `custom_objects.my_listings` | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.TRANSACTIONS_ASSOCIATION` | `custom_objects.transactions` | 10 | 1,000 |

Endpoints: `POST /objects/task/records/search` (all, incl. standalone) · `POST /locations/{locationId}/tasks/search` · legacy `GET/POST/PUT/DEL /contacts/{contactId}/tasks[/{taskId}]` · `GET /associations/relations/{taskId}?…`.

### 9.2 Note — with `relations[]` multi-object linking

**Code:** `features/notes`. Service: `notes.ts`. Fields: `id`, `contactId` (req — parent anchor), `body` (req), `userId`, `title`, `color`, `pinned`, `relations[]`, `attachments[]`.

**`relations[]` array (confirmed live)** links one Note to multiple objects directly. Supported `objectKey` values: `contact`, `opportunity`, `custom_objects.real_estate_offer`, `custom_objects.properties`, `custom_objects.my_listings`, `custom_objects.transactions`.

```json
POST /contacts/{contactId}/notes
{ "body": "...", "relations": [ {"objectKey":"opportunity","recordId":"..."}, {"objectKey":"custom_objects.real_estate_offer","recordId":"..."} ] }
```

> A note surfaces in an object's timeline when that object appears in its `relations[]` (or, for opportunities, via the shared contact).

### 9.3 Appointment

**Code:** `features/calendar`. Service: `calendars.ts`. Endpoint base `/calendars/events`. Fields: `calendarId` (req), `locationId` (req), `contactId` (req), `title`, `appointmentStatus` (`new`/`confirmed`/`showed`/`noshow`/`cancelled`/`invalid`), `startTime`/`endTime` (ISO 8601), `selectedTimezone`, `address`, `notes`, `assignedUserId`, `calendarEventId`, `groupId`.

**Deal-aligned calendars** (resolve by name at bootstrap): `Open House` (Seller: Active on Market) · `Final Walkthrough` (Buyer: Clear to Close) · `Key Exchange` (Both: Closed). All personal, 30-min slots + buffers, auto-confirm, 2-way Google sync.

### 9.4 Documents & Contracts

**Code:** `features/docs`; Supabase storage helpers in `src/lib/supabase/storage.ts`. GHL Proposals module (`/proposals/documents`) links to **Contacts** (`contactId`). For custom objects (Property/Offer/Transaction), documents attach via the **`documents_ref`** TEXT field = comma-separated **Supabase Storage UUIDs**; app resolves UUID → signed URL through Supabase.

### 9.5 Conversations / Messages

**Code:** `features/conversations`. Service: `conversations.ts`. Thread list `GET /conversations/`; history `GET /conversations/{id}/messages`; send `POST /conversations/messages` (`type: sms|email|call`). One conversation per channel type per contact.

---

## 10. Association model (role-via-key)

**24 live association keys** (22 USER_DEFINED + 2 SYSTEM_DEFINED). Full registry: `ASSOCIATIONS_REGISTRY.md`.

- **All bi-directional** with forward + reverse labels; the related object's **Primary Display Property** renders in association panels — keep it populated.
- **Role is encoded in the association key** (GHL relations carry no metadata). Pick `offer_buyer` vs `offer_seller`, `transaction_listing_agent` vs `transaction_selling_agent`, etc. Never store role as a field.
- **Association IDs resolve by key at bootstrap** — never hard-code IDs. API: `POST /associations/relations` with `associationId` + `firstRecordId` + `secondRecordId`.
- **App-enforced 1:1 guards** (platform does NOT enforce): `transaction_offer`, `transaction_opportunity`, `my_listings_transactions`. Always check for an existing relation before creating.
- **Soft-FK ↔ association pairing** (keep both in sync): `opportunity.mls_number` ↔ `opportunity` key · `real_estate_offer.mls_number` ↔ `offers_property` · `my_listings.mls_number` ↔ `my_listings_mls_property`. All reference `properties.mls`.

> **⚠ Deprecated association keys (from legacy `GHL_Integration_Mapping.md §19` / old `AGENTS.md §7`):** `offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`, `listing_to_contact`. These never matched the live sub-account. Map to canonical per `MIGRATION_MAP.md §1`.

---

## 11. Deal lifecycle flow

```
Lead (Contact type:lead) ─► Opportunity [Lead Nurture Pipeline]
        │ Agreement Signed → move to Buyer/Seller Transaction Pipeline
        ▼
CONTACT ─► OPPORTUNITY ─► OFFER (negotiation rounds) ─► TRANSACTION (closing)

BUYER path:   Opportunity ─ opportunity(1:1) ─► Property ◄─ offers_property ─ Offer
              Offer ─ transaction_offer(1:1) ─► Transaction ─ transaction_opportunity(1:1) ─► Opportunity(won)
SELLER path:  My Listing ─ my_listings_mls_property ─► Property ─► Offer ─► Transaction
              My Listing ─ my_listings_transactions(1:1) ─► Transaction

Tasks attach to any object via SYSTEM_DEFINED task associations.
Notes attach to any object via note.relations[].
```

**Core write algorithms** (canonical detail in `AGENT_DB_GUIDE.md §5`):

1. **Create Offer:** require parent Opportunity (`offers_opportunity`); if Property chosen, link `offers_property` + write `mls_number` + denormalize `property_address`; link parties with role keys; `status = pending`; generate `offer_id = OFR-YYYYMMDD-NNN`.
2. **Accept Offer → Transaction (1:1 guarded):** assert `status == accepted` and no existing `transaction_offer`; create Transaction (`status = under_contract`, copy price/deposit/closing); link `transaction_offer`; copy contact relations to `transaction_*` role keys; if parent opp, link `transaction_opportunity` + set opp `won`; if linked My Listing, link `my_listings_transactions`.
3. **Close Transaction:** `status → closed` → set `my_listings.listing_status = sold`, `properties.property_status = sold` (+ `sold_price`, `sold_date`), `contact.closing_anniversary` (buyer + seller). Whichever runs (workflow or app) must be **idempotent** (re-check guards).

---

## 12. Known code ↔ schema gaps

These are the entity-level mismatches between this canonical model and current `src/` code. Actionable, file-referenced remediation lives in **`SCHEMA_ALIGNMENT_TASKS.md`**.

| # | Gap | Evidence |
|---|---|---|
| G1 | **Transaction object has no service and no bootstrap schema.** `OBJECT_KEYS` (objects.ts) lists only listings/properties/offers; `useBootstrap()` loads 3 schemas; no `transactionsService`. | `src/lib/ghl/services/objects.ts`, `src/hooks/use-bootstrap.ts` |
| G2 | **Offer create uses deprecated keys + wrong object key.** `objectsService.createRecord('real_estate_offer', …)` (missing `custom_objects.` prefix), fields `offer_price`/`irrevocable_until`, `status:'submitted'`, no dotted prefix, no `offer_id` generation, no `offers_opportunity` link, no `mls_number` soft-FK. | `src/features/offers/components/new-offer-sheet.tsx` |
| G3 | **Offer views read deprecated keys** (`offer_price`, `irrevocable_until`, mixed `status`/`offer_status`). | `src/features/offers/desktop-view.tsx` (+ mobile/detail) |
| G4 | **Listing create uses deprecated keys + non-canonical enum.** `listing_stage`, `beds`, `baths`, `sqft`, `address`, `list_price`, `property_type:'Single Family'`; no `my_listings_mls_property` link. | `src/features/listings/components/new-listing-sheet.tsx` |
| G5 | **Association createRelation is broken/non-canonical.** Two incompatible call shapes (`fromRecordId/fromObjectKey/…`, `relationType/record1Id/record2Id`) — neither matches the service's `associationId/firstRecordId/secondRecordId`, and no key→ID resolution. | `new-offer-sheet.tsx`, `new-listing-sheet.tsx` vs `src/lib/ghl/services/associations.ts` |
| G6 | **No association-key→ID registry.** `associationsService.getKeys()` returns a raw list; no resolver from canonical key (`offer_buyer`, …) to `associationId`. | `src/hooks/use-bootstrap.ts`, `associations.ts` |
| G7 | **Temperature not aligned.** UI reads `temperature:*` tags; canonical is `contact.lead_temperature` (tag mirrors field). | `features/leads/*`, `components/shared/notifications-feed.tsx` |
| G8 | **No deal-lifecycle conversion** (`useConvertOfferToTransaction`) implementing the 1:1-guarded Accept→Transaction algorithm. | (absent) |
| G9 | **Types are generic passthrough.** No per-object field types or Zod enums generated from the Data Dictionary; custom objects are `Record<string, any>`. | `src/types/ghl.ts` |
| G10 | **No Business/Company feature or service** despite the object existing in the registry. | (absent) |

---

*Companion docs: `GHL_INTEGRATION_MAPPING.md` (screens → endpoints/components/hooks) · `INTEGRATION_SCHEMA.md` (consolidated reference: tags, custom values, API quick ref) · `/docs/database/` (canonical field & association source of truth) · `SCHEMA_ALIGNMENT_TASKS.md` (remediation task list).*
