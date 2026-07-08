# Real Estate Pro CRM — Integration Schema (Consolidated Reference)

> **Replaces** the legacy `Real Estate Pro CRM — Full Integration Schema.md`. Its Part 2/3 field & association tables are **superseded** by the canonical `/docs/database/` package (v2.0.0). This file consolidates the still-authoritative reference material — object registry, tags, custom values, system-native objects, and the API quick reference — and points every field/association question at the canonical package.
>
> **Precedence:** (1) Live GHL API schema → (2) `/docs/database/DATA_DICTIONARY.md` + `ASSOCIATIONS_REGISTRY.md` → (3) `ENTITY_BREAKDOWN.md` + `GHL_INTEGRATION_MAPPING.md` → (4) this file.
> **Auth:** `Authorization: Bearer pit-xxxxx` + `Version` header · **Base URL:** `https://services.leadconnectorhq.com` · **Location:** `jHEaG68TeCsXHXPhrVtU`.

---

## Part 1 — Object registry

| # | Object | Key | Type | Primary display | Object ID |
|---|---|---|---|---|---|
| 1 | Contact | `contact` | SYSTEM_DEFINED | `contact.email` | `6a44a1e5581b923d9e657d3a` |
| 2 | Opportunity | `opportunity` | SYSTEM_DEFINED | `opportunity.name` | `6a44a1e5581b9214c0657d3b` |
| 3 | Company (Business) | `business` | SYSTEM_DEFINED | `business.name` | `6a44a1e5581b920951657d3c` |
| 4 | Offers | `custom_objects.real_estate_offer` | USER_DEFINED | `real_estate_offer.offer_id` | `6a44a1e75fd80c971d76b5f0` |
| 5 | Properties (MLS) | `custom_objects.properties` | USER_DEFINED | `properties.mls` | `6a44a1e75fd80c02ec76b5ef` |
| 6 | My Listings | `custom_objects.my_listings` | USER_DEFINED | `my_listings.mls_number` | `6a44b1692c3079662fdd9736` |
| 7 | Transactions | `custom_objects.transactions` | USER_DEFINED | `transactions.transaction_id` | `6a44b1696a2c18dc4bd8dd08` |

**System-native (not in registry):** `task` (full object type), Appointments/Calendars, Notes, Documents, Conversations/Messages, Users, Pipelines/Stages, Tags — Part 4.

---

## Part 2 — Field schemas → CANONICAL

**Do not maintain field lists here.** The canonical field schema (every key, type, enum option key, required/unique/searchable flag) lives in **`/docs/database/DATA_DICTIONARY.md`**:

| Object | Canonical section |
|---|---|
| Contact | `DATA_DICTIONARY.md §2` (+ `lead_temperature` vs legacy `temperature`) |
| Business | `§3` |
| Opportunity | `§4` |
| Property (MLS) | `§5` (⚠ `postal`, not `postal_code`) |
| My Listing | `§6` (⚠ `property_type` enum differs from Property) |
| Offer | `§7` (`offer_id` = `OFR-YYYYMMDD-NNN`) |
| Transaction | `§8` (`transaction_id` = `TXN-YYYYMMDD-NNN`) |

**Searchable fields** (only these work in search + workflow search):

| Object | Searchable |
|---|---|
| Contact | `name`, `email`, `businessName`, `tags`, `phone` |
| Business | `name`, `email` |
| Opportunity | `name`, `contactName`, `contactPhone`, `contactEmail`, `businessName`, `tags` |
| Property (MLS) | `mls`, `full_address`, `property_name` |
| My Listing | `mls_number` |
| Offer | `offer_id`, `property_address`, `mls_number` |
| Transaction | `transaction_id` |

**Value formats:** currency = raw CAD number (`500000`); date = ISO `YYYY-MM-DD` (`America/Edmonton`); null until known (never `0`/epoch); single-select = snake_case option **keys**, not labels; custom-object fields = full dotted prefix in payloads. Full enum lists: `GHL_INTEGRATION_MAPPING.md §16` and `DATA_DICTIONARY.md`.

---

## Part 3 — Associations → CANONICAL

**24 live keys** (22 USER_DEFINED + 2 SYSTEM_DEFINED). Canonical registry: **`/docs/database/ASSOCIATIONS_REGISTRY.md`**. Key-linking table for screens: `GHL_INTEGRATION_MAPPING.md §15`. Deprecated→canonical: `MIGRATION_MAP.md §1`.

Highlights: role encoded in the key (no relation metadata) · IDs resolved by key at bootstrap · app-enforced 1:1 guards on `transaction_offer` / `transaction_opportunity` / `my_listings_transactions` · soft-FK ↔ association pairing on the three `mls_number` fields.

**Task associations** are 7 SYSTEM_DEFINED internal entries queried via `GET /associations/objectKey/task?includeInternalAssociations=true` (see Part 4.3 and `ENTITY_BREAKDOWN.md §9.1`).

---

## Part 4 — Tags, custom values & system-native objects

### 4.1 Tags (56 total — kebab-case, namespaced)

| Namespace | Tags | Count |
|---|---|---|
| General | `buyer` · `client` · `contact` · `lead` · `warm lead` · `first-time` · `high priority` · `investor` · `follow-up` | 9 |
| `condition:` | `condition:financing` · `condition:inspection` · `condition:sale-of-property` | 3 |
| `data:` | `data:missing-source` · `data:missing-type` · `data:no-contact-info` · `data:possible-duplicate` | 4 |
| `lifecycle:` | `lifecycle:active` · `closed` · `lost` · `new-lead` · `past-client` · `referral-partner` · `soi-active` · `vendor` | 8 |
| `lost-reason:` | `lost-reason:budget` · `chose-another-agent` · `not-ready` · `relocated` · `unresponsive` | 5 |
| `needs:` | `needs:documents` · `needs:follow-up` | 2 |
| `pipeline:` | `pipeline:lead-nurture` · `pipeline:transaction` | 2 |
| `priority:` | `priority:high` · `medium` · `low` | 3 |
| `source:` | `source:cold-call` · `door-knock` · `openhouse` · `realtor.com` · `referral` · `social-media` · `website` · `zillow` | 8 |
| `status:` | `status:no-show` · `stale` · `touchpoint-pending` | 3 |
| `temperature:` | `temperature:hot` · `warm` · `cold` | 3 |
| `type:` | `type:agent` · `client` · `lead` · `past-client` · `referral-partner` · `soi` · `vendor` | 7 |

**Alignment rule:** the **structured field is the source of truth; the tag mirrors it.** When a workflow or mutation updates `contact.lead_temperature`, it must swap the matching `temperature:*` tag in the same operation. API: `GET /locations/{locationId}/tags`, `POST /locations/{locationId}/tags { "name": … }`. Tags apply to Contacts & Opportunities as string arrays.

### 4.2 Custom values

| Name | Template variable | Set? |
|---|---|---|
| Brokerage Name | `{{ custom_values.brokerage_name }}` | — |
| Google Review Link | `{{ custom_values.google_review_link }}` | — |
| App Webhook URL | `{{ custom_values.app_webhook_url }}` | — |
| Location id | `{{ custom_values.location_id }}` | — |
| brevo | `{{ custom_values.brevo }}` | — |
| Test API | `{{ custom_values.test_api }}` | ✅ (`pit-…`) |
| Broad Access Token | `{{ custom_values.broad_access_… }}` | ✅ |
| Users & Business Token | `{{ custom_values.users__business }}` | ✅ |

> ⚠ PIT/token custom values are secrets — never surface them in the client bundle or logs. `GET /locations/{locationId}/customValues`.

### 4.3 System-native objects (summary — full detail in `ENTITY_BREAKDOWN.md §9`)

| Object | Endpoint base | Key fields | Notes |
|---|---|---|---|
| **Task** (`key: task`) | `POST /objects/task/records/search`; `/locations/{id}/tasks/search`; legacy `/contacts/{id}/tasks` | `title`(req), `body`, `dueDate`, `status` (`to_do`/`completed`), `assignedTo`, `contactId` (**optional**), `businessId` | Full object type; **7 SYSTEM_DEFINED task associations** (max 10/side to task) |
| **Note** | `/contacts/{contactId}/notes` | `body`(req), `contactId`(req), `userId`, `title`, `color`, `pinned`, `relations[]`, `attachments[]` | **`relations[]`** links to `contact`/`opportunity`/4 custom objects |
| **Appointment** | `/calendars/events` | `calendarId`,`locationId`,`contactId`(req), `startTime`/`endTime`, `appointmentStatus`, `address`, `assignedUserId` | Deal-aligned calendars by name |
| **Document** | `/proposals/documents` | `name`, `type` (`template`/`document`), `status` (`draft`→`declined`), `contactId` | Custom objects attach via `documents_ref` (Supabase UUIDs) |
| **Conversation/Message** | `/conversations`, `/conversations/{id}/messages` | `type` (sms/email/…), `lastMessageBody`, `unreadCount`, `direction` | 1 conversation per channel per contact |

---

## Part 5 — Deal lifecycle (write algorithms)

Canonical detail: `AGENT_DB_GUIDE.md §5` and `ENTITY_BREAKDOWN.md §11`.

```
CONTACT → OPPORTUNITY (pipeline) → OFFER (negotiation) → TRANSACTION (closing)
Accept Offer (status=accepted, no existing transaction_offer)
  → create Transaction (under_contract; copy price/deposit/closing)
  → link transaction_offer (1:1 guard)
  → copy offer party relations → transaction_* role keys
  → if parent opp: link transaction_opportunity (guard), set opp status=won
  → if linked my_listing: link my_listings_transactions (guard)
Close Transaction (status=closed)
  → my_listings.listing_status=sold; properties.property_status=sold (+sold_price,+sold_date)
  → contact.closing_anniversary (buyer+seller)
```
All transitions must be **idempotent** whether run by GHL Workflow or app mutation (re-check the 1:1 guards; upsert semantics).

---

## Part 6 — API quick reference

**Objects & records**
```
GET    /objects/?locationId={id}
GET    /objects/{key}?locationId={id}&fetchProperties=true      # schema + fields
POST   /objects/{key}/records
GET    /objects/{key}/records/{recordId}?locationId={id}
PUT    /objects/{key}/records/{recordId}
DELETE /objects/{key}/records/{recordId}
POST   /objects/{key}/records/search                            # NOTE: a `filters` body 422s (see objects.ts); filter client-side
```
**Contacts**
```
POST /contacts/  ·  GET/PUT /contacts/{id}  ·  POST /contacts/search
GET /contacts/{id}/tasks|notes|appointments  ·  POST/DELETE /contacts/{id}/tags
```
**Opportunities**
```
POST /opportunities/  ·  GET/PUT /opportunities/{id}  ·  GET /opportunities/search?location_id={id}
GET /opportunities/pipelines                                     # resolve by name at bootstrap
```
**Associations / relations**
```
GET    /associations/?locationId={id}&skip=0&limit=100
GET    /associations/by-object-keys?firstObjectKey=…&secondObjectKey=…&locationId={id}
GET    /associations/objectKey/task?locationId={id}&includeInternalAssociations=true
POST   /associations/relations { associationId, firstRecordId, secondRecordId }
DELETE /associations/relations/{relationId}
GET    /associations/relations?recordId={id}&objectKey={key}&locationId={id}
```
**Tasks (object API)** `POST /objects/task/records/search` · **Tags** `GET/POST /locations/{id}/tags` · **Custom values** `GET /locations/{id}/customValues` · **Appointments** `POST/GET/PUT/DELETE /calendars/events[/appointments][/{id}]` · **Notes/Tasks (legacy)** `…/contacts/{id}/notes|tasks[/{id}]`.

> **Endpoint discipline:** verify any path against the official GHL API 2.0 docs (https://marketplace.gohighlevel.com/docs/) before writing/changing a service call. All calls go through `ghlFetch` (`src/lib/ghl/client.ts`) with the mandatory rate-limiter + dedupe + 429 backoff — never raw `fetch`.

---

*Companion docs: `/docs/database/` (canonical fields & associations) · `ENTITY_BREAKDOWN.md` (entities + code ownership + gaps) · `GHL_INTEGRATION_MAPPING.md` (screens → endpoints/components/hooks) · `SCHEMA_ALIGNMENT_TASKS.md` (remediation task list).*
