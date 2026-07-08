# Real Estate Pro CRM — GHL Integration Mapping (Dev-Aligned)

> **Replaces** the legacy `GHL_Integration_Mapping.md`. That file's §18 (field map), §19 (association keys), §20 (field dictionary) and §22 (enums) used **placeholder/deprecated keys** that never matched the live sub-account. This version maps every screen to its **canonical** GHL object/field/association keys **and** to the actual `src/` component, hook, and service that own it.
>
> **Canonical field/association truth:** `/docs/database/DATA_DICTIONARY.md` + `ASSOCIATIONS_REGISTRY.md`. Deprecated→canonical: `/docs/database/MIGRATION_MAP.md`. Entity + code ownership: `ENTITY_BREAKDOWN.md`.
> **Base URL:** `https://services.leadconnectorhq.com` · PIT bearer + `Version` header · `locationId: jHEaG68TeCsXHXPhrVtU`.
> **Transport rule:** UI never calls `fetch`. All GHL calls go through `src/lib/ghl/client.ts` (`ghlFetch`) + typed services in `src/lib/ghl/services/*`. Query keys live in `src/lib/queryKeys.ts` as `['ghl', resource, params]`.

---

## 0. How to read this doc

Each screen lists: **Route** · **Code** (`src/features/*` files) · **Data source** (endpoint + service) · **Field bindings** (canonical keys). Where the current code uses a deprecated key, it's flagged **⚠ code uses `<old>` → `<canonical>`** and tracked in `SCHEMA_ALIGNMENT_TASKS.md`.

**Services quick reference** (`src/lib/ghl/services/`): `contactsService` · `opportunitiesService` · `objectsService` (+ `myListingsService`, `mlsPropertiesService`, `offersService`; **`transactionsService` missing**) · `associationsService` · `conversationsService` · `calendarsService` · `tasksGlobal` · `notesService` · `usersService` · `customFieldsService`/`tagsService` (misc).

**Hook conventions (target):** one hook family per object — `useContacts`/`useContact`, `useOpportunities`/`useOpportunity`, `useProperties`/`useProperty`, `useMyListings`/`useMyListing`, `useOffers`/`useOffer`, `useTransactions`/`useTransaction`, `useRelations(assocKey, recordId)`, `useRegistry()`. Today most features call services directly inside `useQuery`; the bootstrap spine is `useBootstrap()`.

---

## 1. Global navigation & shell

- **Code:** `src/components/desktop/shell.tsx`, `src/components/mobile/shell.tsx`, `src/lib/navigation.ts`, `src/app/router.tsx`.
- **Auth:** Supabase email/password (`src/app/auth-provider.tsx`); PIT + `locationId` loaded server-side (`use-ghl-credentials.ts`), held in memory only.
- **Bootstrap:** `useBootstrap()` resolves pipelines, custom-object schemas, custom fields, association keys, calendars, users, tags (24h cache).

| Nav label | Route | Object / pipeline | Feature dir |
|---|---|---|---|
| Dashboard | `dash` | aggregate | `features/dashboard` |
| Leads | `leads` | Lead Nurture Pipeline opps | `features/leads` |
| Clients | `clients` | Buyer + Seller Transaction opps | `features/clients` |
| Contacts | `contacts` | `contact` | `features/contacts` |
| My Listings | `myListings` | `custom_objects.my_listings` | `features/listings` |
| Offers | `offers` | `custom_objects.real_estate_offer` | `features/offers` |
| MLS Properties | `mlsProps` | `custom_objects.properties` | `features/mls` |
| Transactions | `transactions` | `custom_objects.transactions` | `features/transactions` |
| Calendar | `calendar` | Appointments | `features/calendar` |
| Conversations | `conversations` | Conversations | `features/conversations` |
| Tasks / Notes / Reports / Team / Docs / Settings | — | see §12–16 | respective dirs |

**PIT scopes:** `contacts.*`, `opportunities.*`, `objects.*`, `conversations.*`, `calendars.*`, `users.readonly`, `locations.readonly` (read/write as needed).

---

## 2. Dashboard

- **Code:** `features/dashboard/{desktop,mobile}-view.tsx` + `widgets/{kpi-grid,needs-attention,pending-offers,new-leads,next-up,activity-feed}.tsx`.

| Widget | Source | Canonical bindings |
|---|---|---|
| Now / Next-Up | `GET /calendars/events` (`startTime gte now`, limit 3) | `appointment.title`, `startTime`, `address`, `contactId → contact` |
| KPI grid | opps search | Volume = `SUM(opportunity.monetary_value)` where `status=won` · Active Leads = `COUNT(opp)` in Lead Nurture · Active Clients = `COUNT(opp)` in Buyer+Seller · Conversions = stage-change events |
| Needs Attention | tasks + opps + offers | Overdue = `POST /objects/task/records/search` (`status=to_do`, `dueDate < now`) · New Leads = opps at New Lead stage `< 48h` · **Expiring Offers = offers where `expiry_date < tomorrow`** ⚠ code uses `properties.irrevocable_until` → `real_estate_offer.expiry_date` |
| Pending Offers | offers search | filter `status = pending`; show `purchase_price`, `closing_date`, `offer_id` ⚠ code uses `offer_price`/`properties.status` → `purchase_price`/`status` |
| Activity feed | merged notes + messages + opp status changes | `note.body`, `message.body`, opp stage transitions |

---

## 3. Global search (Cmd+K / mobile search)

- **Code:** `features/**` via `components/shared/global-search.tsx`, `components/desktop/search-overlay.tsx`.
- **Only searchable fields work.** Multi-threaded across:

| Category | Endpoint | Searchable keys |
|---|---|---|
| Leads/Clients | `GET /opportunities/search?pipelineId=…&q=` | `name`, `contactName`, `contactEmail`, `contactPhone`, `tags` |
| Contacts | `POST /contacts/search` | `name`, `email`, `phone`, `businessName`, `tags` |
| Properties | `POST /objects/custom_objects.properties/records/search` | `mls`, `full_address`, `property_name` |
| My Listings | `POST /objects/custom_objects.my_listings/records/search` | `mls_number` |
| Offers | `POST /objects/custom_objects.real_estate_offer/records/search` | `offer_id`, `property_address`, `mls_number` |
| Transactions | `POST /objects/custom_objects.transactions/records/search` | `transaction_id` |

> For non-searchable fields, traverse associations from a searchable anchor record.

---

## 4. Leads (list + kanban)

- **Code:** `features/leads/{desktop,mobile}-view.tsx`, `components/{list-view,kanban-board,new-lead-sheet,convert-lead-dialog,desktop-detail}.tsx`, `mobile-detail.tsx`.
- **Data:** `GET /opportunities/search` with `pipelineId = Lead Nurture` (resolved via `PipelineRegistry.byName('lead')`).

| UI element | Canonical binding |
|---|---|
| Card title | `opportunity.name` (or linked `contact` first/last name) |
| Stage | `opportunity.pipeline_stage_id` → `PipelineRegistry.stageLabel()` |
| Temperature badge | **`contact.lead_temperature`** (mirror tag `temperature:*`) ⚠ code reads `temperature:*` tags only → read `lead_temperature`, keep tag as mirror |
| Budget | `contact.budget_max` ⚠ code uses `contact.buyer_budget` → `budget_max` |
| Source | `contact.lead_source` ⚠ code/tag `contact.source` → `lead_source` |
| Age | `opportunity.createdAt` |

**New Lead modal** (`new-lead-sheet.tsx`): `first_name`,`last_name`,`email`(req),`phone`,`lead_source`,`lead_temperature`,`buyer_seller_type`,`budget_max`,`property_type_preference`, tags. On create also set `type` + mirror `temperature:*`/`type:*` tags.
**Convert** (`convert-lead-dialog.tsx`): move opp to Buyer/Seller Transaction Pipeline (`PUT /opportunities/{id}`), set `deal_type`.

---

## 5. Lead / Client detail

- **Code:** `features/leads/{desktop,mobile}-detail.tsx`; `features/clients/components/{desktop,mobile}-{buyer,seller,dual,client}-detail.tsx` + `{buyer,seller}-tabs.tsx`.
- **Data:** `GET /contacts/{id}` + `GET /opportunities/{id}` + associations.

| Section | Canonical binding |
|---|---|
| Identity header | `contact.first_name/last_name`, `email`, `phone`, `last_interaction_date`, role from `type`/tags |
| Metric grid | Budget → `contact.budget_max` · Pre-approval → `contact.preapproval_status` · Active Offer → related offer where `status = pending` via `offers_opportunity` ⚠ code: `buyer_budget`/`pre_approval_lender`/`target_list_price`/offer `status='submitted'` |
| Overview | contact core + custom fields (buyer prefs / seller `reason_for_selling`,`current_address`) |
| Properties tab | associated `custom_objects.properties` via `contact`/`opportunity` keys |
| Offers tab | associated `custom_objects.real_estate_offer` via `offers_opportunity` |
| Appointments | `GET /contacts/{id}/appointments` |
| Conversations | `GET /conversations/{id}/messages` |
| Tasks | `POST /objects/task/records/search` filtered to contact/opp (or legacy `/contacts/{id}/tasks`) |
| Notes | `GET/POST /contacts/{id}/notes` (+ `relations[]` to the opp/property/offer in view) |

---

## 6. Clients (buyer/seller pipelines)

- **Code:** `features/clients/{desktop,mobile}-view.tsx`, `components/{kanban-board,mobile-kanban,list-view,new-client-sheet}.tsx`.
- **Data:** `GET /opportunities/search` with `pipelineId` = Buyer or Seller Transaction (context switcher).

| UI | Canonical binding |
|---|---|
| Kanban lanes | `PipelineRegistry.getPipeline(id).stages[]` |
| Card | `opportunity.name`, `monetary_value`, stage, `contact` denormalized |
| Status tag | `opportunity.status` + stage; DOM via associated `my_listings.days_on_market` |
| Listing assoc | `useRelations('my_listings_opportunity', oppId)` |
| MLS property assoc | `useRelations('opportunity', oppId)` (Property↔Opp 1:1) |

---

## 7. My Listings + MLS Properties

- **My Listings code:** `features/listings/{desktop,mobile}-view.tsx`, `components/{new-listing-sheet,listing-edit-modal,listing-actions,listing-tabs,desktop-listing-detail,mobile-listing-detail}.tsx`. Service `myListingsService`.
- **MLS code:** `features/mls/{desktop,mobile}-view.tsx`, `components/{property-tabs,desktop-property-detail,mobile-property-detail}.tsx`. Service `mlsPropertiesService` (**read-only** — MLS sync owns writes).

**My Listings table/detail bindings (canonical):** `my_listings.property_address`, `mls_number` (primary), `listing_price`, `listing_status` (badge), `bedrooms`/`bathrooms`, `square_footage`, `days_on_market`, `open_house_date`, `listing_description`, docs from `documents_ref`.

> ⚠ **Code uses deprecated keys** (`new-listing-sheet.tsx`): `address`→`property_address`, `list_price`→`listing_price`, `listing_stage`→`listing_status`, `beds`→`bedrooms`, `baths`→`bathrooms`, `sqft`→`square_footage`, `property_type:'Single Family'`→ option key (`house`/`condo`/…). Also missing `my_listings_mls_property` link + `mls_number` soft-FK on create.

**MLS Property detail bindings:** header `properties.full_address` + `mls`; specs `bedrooms/bathrooms/square_footage/year_built/garage/basement/heating_type`; map `latitude/longitude`; money `list_price/sold_price/tax_assessment/condo_fees`; marketing `feature_highlights`; media `property_images`/`listing_url`.
**MLS filters:** `city`, `list_price`, `bedrooms`, `property_type` (client-side — the search endpoint rejects a `filters` body per `objects.ts`).
> ⚠ `address`→`full_address`, `mls_number`→`mls`, `sqft`→`square_footage`, `public_remarks`→`feature_highlights`/`property_notes`, `postal_code`→`postal`, `image_urls`→`property_images`+`listing_url`.

---

## 8. Offers

- **Code:** `features/offers/{desktop,mobile}-view.tsx`, `components/{new-offer-sheet,desktop-offer-detail,mobile-offer-detail}.tsx`. Service `offersService` (object key `custom_objects.real_estate_offer`).

| UI | Canonical binding |
|---|---|
| Offer card / board | `offer_id`, `purchase_price`, `counter_price`, `status` (badge), countdown on `expiry_date` + `conditions_deadline`, parties via role associations |
| Status filter | `status` ∈ `pending`/`accepted`/`countered`/`rejected`/`closed`/`expired` |
| Parties | `offer_buyer`/`offer_seller`/`offer_buyer_agent`/`offer_seller_agent` |

**New Offer modal (`new-offer-sheet.tsx`) — target canonical payload** (custom fields carry full dotted prefix; option keys not labels):

```
custom_objects.real_estate_offer.offer_id           = OFR-YYYYMMDD-NNN   (generated)
custom_objects.real_estate_offer.property_address   = <denormalized>
custom_objects.real_estate_offer.mls_number         = properties.mls     (soft-FK, if property chosen)
custom_objects.real_estate_offer.purchase_price     = <number CAD>
custom_objects.real_estate_offer.deposit_amount     = <number CAD>
custom_objects.real_estate_offer.financing_type     = "conventional" | "cmhc_insured" | "cash" | "private" | "other"
custom_objects.real_estate_offer.closing_date       = "YYYY-MM-DD"
custom_objects.real_estate_offer.expiry_date        = "YYYY-MM-DD"
custom_objects.real_estate_offer.conditions_deadline= "YYYY-MM-DD"
custom_objects.real_estate_offer.status             = "pending"
```
Then link `offers_opportunity` (parent, required), `offers_property` (+ write `mls_number`), and party role keys — all via resolved `associationId`.

> ⚠ **Current code defects (G2/G3/G5 in `ENTITY_BREAKDOWN.md §12`):** object key `'real_estate_offer'` (no `custom_objects.` prefix), fields `offer_price`/`irrevocable_until`, `status:'submitted'`, no dotted prefix, no `offer_id`, no opportunity link, broken `createRelation({fromRecordId,fromObjectKey,…})`.

---

## 9. Transactions

- **Code:** `features/transactions/{desktop,mobile}-view.tsx`, `components/{desktop,mobile}-transaction-detail.tsx`. **Service missing — see `SCHEMA_ALIGNMENT_TASKS.md` T2.**
- **Data (target):** `POST /objects/custom_objects.transactions/records/search` via a new `transactionsService`.

| UI | Canonical binding |
|---|---|
| Header | `transaction_id`, `status` (`under_contract`/`pending`/`closed`/`cancelled`/`failed`) |
| Financials block | `contract_price`, `commission_amount`, `commission_rate`, `profit_net`, `deposit_escrow` |
| Deadline countdowns | `inspection_deadline`, `financing_deadline`, `appraisal_date`, `final_walkthrough`, `closing_date` |
| Parties | `transaction_buyer/seller/listing_agent/selling_agent` |
| Source links | `transaction_offer` (1:1), `transaction_opportunity` (1:1), `transaction_property`, `my_listings_transactions` (1:1) |

> ⚠ Legacy `GHL_Integration_Mapping.md §21` used `properties.transaction_id`/`properties.transaction_status`/`properties.commission_amount` and enum `Under Contract, Firm, Closed, Funded` → canonical `transactions.*` keys + `under_contract·pending·closed·cancelled·failed` (`Firm`→`pending`, `Funded`→`closed`).

---

## 10. Contacts directory

- **Code:** `features/contacts/{desktop,mobile}-view.tsx`, `components/{desktop,mobile}-contact-detail.tsx`, `contact-modals.tsx`. Service `contactsService`.
- **Data:** `POST /contacts/search` (or `GET /contacts/`).

| UI | Canonical binding |
|---|---|
| Row | `first_name`/`last_name`, `phone`, `email`, role from `type`/tags, `lead_source` |
| Role filters | tags `type:vendor` / `type:referral-partner` / `lifecycle:past-client`; vendors also `vendor_service_type` |
| Detail | full field groups (§2 of `ENTITY_BREAKDOWN.md`); Business via `BUSINESSES_CONTACTS_ASSOCIATION` |

---

## 11. Conversations & Calendar

- **Conversations** (`features/conversations`): thread list `GET /conversations/` (`fullName`, `type`, `lastMessageBody`, `lastMessageDate`, `unreadCount`); history `GET /conversations/{id}/messages`; send `POST /conversations/messages` (`type: sms|email|call`).
- **Calendar** (`features/calendar`, `components/event-modals.tsx`): `GET /calendars/events`; fields `title`, `startTime`, `endTime`, `appointmentStatus`, `address`, `contactId`, `calendarId`, `assignedUserId`. Deal-aligned calendars resolved by name (Open House / Final Walkthrough / Key Exchange).

---

## 12. Tasks & Notes (global)

- **Tasks** (`features/tasks`, `components/task-modals.tsx`, service `tasksGlobal`): `POST /objects/task/records/search` or `POST /locations/{locationId}/tasks/search`. Fields `title`, `dueDate`, `status` (`to_do`/`completed`), `assignedTo`, `contactId` (optional), `body`. Priority via `priority:*` tags. Link to any object via SYSTEM_DEFINED task associations (`ENTITY_BREAKDOWN.md §9.1`).
- **Notes** (`features/notes`, `components/note-modals.tsx`, service `notesService`): `GET/POST/PUT/DEL /contacts/{contactId}/notes`; multi-object linking via `relations[]` (`objectKey` ∈ contact/opportunity/4 custom objects).

---

## 13. Settings, Docs, Reports, Team

- **Settings** (`features/settings`, tabs `profile/display/data/notifications/integrations`): `GET /users/{id}`, `GET /locations/{id}`, `GET /locations/{id}/customFields`, `GET /locations/{id}/tags`, `GET /calendars`. PIT stored server-side (Supabase RLS).
- **Docs** (`features/docs`): GHL Proposals (`/proposals/documents`) for contacts; Supabase Storage UUIDs via `documents_ref` for custom objects; helpers `src/lib/supabase/storage.ts`.
- **Reports** (`features/reports`): aggregates over opportunities (weighted pipeline) + transactions (commission from `commission_amount`/`profit_net`).
- **Team** (`features/team`): `GET /users`.

---

## 14. Modal / data-entry field map (canonical)

| Modal (component) | UI field | Canonical key | Type |
|---|---|---|---|
| New Lead (`leads/.../new-lead-sheet.tsx`) | Name | `contact.first_name` + `last_name` | Text |
| | Phone/Email | `contact.phone` / `contact.email` | Phone/Email |
| | Temperature | `contact.lead_temperature` (+ mirror `temperature:*` tag) | Single Select |
| | Source | `contact.lead_source` | Single Select |
| | Budget | `contact.budget_max` | Currency |
| New Offer (`offers/.../new-offer-sheet.tsx`) | Price | `real_estate_offer.purchase_price` | Currency |
| | Deposit | `real_estate_offer.deposit_amount` | Currency |
| | Irrevocable/Expiry | `real_estate_offer.expiry_date` | Date |
| | Status | `real_estate_offer.status` (`pending`…) | Single Select |
| New Listing (`listings/.../new-listing-sheet.tsx`) | Address | `my_listings.property_address` | Text |
| | MLS # | `my_listings.mls_number` | Text (soft-FK) |
| | Price | `my_listings.listing_price` | Currency |
| | Status | `my_listings.listing_status` | Single Select |
| New Task (`tasks/.../task-modals.tsx`) | Name | `task.title` | Text |
| | Due | `task.dueDate` | DateTime |
| | Priority | `priority:*` tag | Tag |

---

## 15. Association key registry (canonical — for linking screens)

Resolve every key to its `associationId` at bootstrap; call `POST /associations/relations` with `{ associationId, firstRecordId, secondRecordId, locationId }`. **Do not hard-code IDs.**

| Link | Canonical key(s) |
|---|---|
| Contact ↔ Offer | `offer_buyer` · `offer_seller` · `offer_buyer_agent` · `offer_seller_agent` |
| Contact ↔ Transaction | `transaction_buyer` · `transaction_seller` · `transaction_listing_agent` · `transaction_selling_agent` |
| Contact ↔ My Listing | `my_listings_seller` · `my_listings_buyer_lead` |
| Contact ↔ Property | `contact` (interested) · `property_seller` |
| Offer ↔ Property | `offers_property` |
| Offer ↔ Opportunity | `offers_opportunity` |
| Offer ↔ Transaction | `transaction_offer` (1:1*) |
| Opportunity ↔ Property | `opportunity` (1:1) |
| Opportunity ↔ Transaction | `transaction_opportunity` (1:1*) |
| My Listing ↔ {Property, Offer, Transaction, Opportunity} | `my_listings_mls_property` (1:1) · `my_listings_offers` · `my_listings_transactions` (1:1*) · `my_listings_opportunity` |
| Property ↔ Transaction | `transaction_property` |
| Contact ↔ Business | `BUSINESSES_CONTACTS_ASSOCIATION` |
| Contact ↔ Opportunity | `OPPORTUNITIES_CONTACTS_ASSOCIATION` |

`*` app-enforced 1:1 (check for existing relation first).
**Deprecated (do not use):** `offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`, `listing_to_contact` → map via `MIGRATION_MAP.md §1`.

---

## 16. Enums (canonical option keys — snake_case, send keys not labels)

| Field | Option keys |
|---|---|
| `real_estate_offer.status` | `pending` · `accepted` · `countered` · `rejected` · `closed` · `expired` |
| `real_estate_offer.offer_type` | `buyer_offer` · `seller_offer` · `counter_offer` |
| `real_estate_offer.financing_type` | `conventional` · `cmhc_insured` · `cash` · `private` · `other` |
| `transactions.status` | `under_contract` · `pending` · `closed` · `cancelled` · `failed` |
| `transactions.transaction_type` | `sale` · `purchase` · `lease` · `referral` |
| `properties.property_status` | `active` · `pending` · `sold` · `expired` · `withdrawn` · `coming_soon` |
| `properties.property_type` | `single_family` · `condo` · `townhouse` · `multifamily` · `land` · `commercial` |
| `my_listings.listing_status` | `active` · `pending` · `sold` · `expired` · `withdrawn` |
| `my_listings.property_type` | `house` · `condo` · `townhouse` · `land` · `commercial` |
| `contact.lead_temperature` | `Hot` · `Warm` · `Cold` · `Dead` (Contact picklists are Title-Case per live schema — verify) |
| `contact.lead_source` | `Zillow` · `Realtor.com` · `Open House` · `Referral` · `SOI` · `Website` · `Social Media` · `Cold Outreach` · `Other` |
| `opportunity.loss_reason` | `Chose Another Agent` · `Not Ready` · `Unresponsive` · `Budget` · `Timing` · `Relocated` · `Found Property Independently` · `Market Conditions` · `Other` |

> **Enum rule:** custom-object selects submit **snake_case option keys**. Contact/Opportunity legacy picklists whose live keys are Title-Case remain as documented — verify against the bootstrap schema before writing.

---

*Companion docs: `ENTITY_BREAKDOWN.md` (entities + code ownership) · `INTEGRATION_SCHEMA.md` (tags, custom values, API quick reference, system-native objects) · `/docs/database/` (canonical) · `SCHEMA_ALIGNMENT_TASKS.md` (remediation).*
