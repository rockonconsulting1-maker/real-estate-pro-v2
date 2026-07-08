# Associations Registry — Real Estate Pro CRM (Canonical)

**Version:** 2.0.0 | Date: 2026-07-07 | Location ID: `jHEaG68TeCsXHXPhrVtU`
**Supersedes:** `GHL_Integration_Mapping.md` §19 (legacy key list) · reconciles `Real Estate Pro CRM — Full Integration Schema.md` Part 3 (live keys) with the 2026-07-07 Data Dictionary relationship model.

> **Registry of record:** the 24 live association keys below (22 USER_DEFINED + 2 SYSTEM_DEFINED).
> All associations are **bi-directional** with forward + reverse labels. Default max 1000 per side unless noted.
> **Association IDs are resolved at bootstrap by key** — resolve once, cache, never hard-code IDs.
> API: `POST /associations/relations` with `associationId` + both record IDs. Association records are not searchable — traverse via the relations API or association panels.

---

## 1. How roles work (important reconciliation)

The design intent is "Contact ↔ Offer/Transaction is M:M **with a role**." GHL relations do **not** carry role metadata, so **the role is encoded in the association key itself** — one key per role. Agents and code must:

1. Pick the association key that matches the role (`offer_buyer` vs `offer_seller`, etc.).
2. Never model role as a field on the Offer/Transaction record.
3. When converting Offer → Transaction, **copy each contact relation to the corresponding transaction-role key** (buyer → `transaction_buyer`, seller → `transaction_seller`, agents → `transaction_*_agent`).

Roles supported: buyer, co-buyer (second `offer_buyer` relation), seller, co-seller, buyer agent, seller agent, listing agent, selling agent.

---

## 2. Contact → Custom Object associations (12 keys, all M:M)

| Association Key | Role (First Label) | Object A | Object B | Second Label |
|---|---|---|---|---|
| `contact` | Contact (interested) | `contact` | `custom_objects.properties` | (interested) |
| `property_seller` | Seller | `contact` | `custom_objects.properties` | Listed Property |
| `offer_buyer` | Buyer | `contact` | `custom_objects.real_estate_offer` | Real Estate Offer |
| `offer_seller` | Seller | `contact` | `custom_objects.real_estate_offer` | Real Estate Offer |
| `offer_buyer_agent` | Buyer Agent | `contact` | `custom_objects.real_estate_offer` | Real Estate Offer |
| `offer_seller_agent` | Seller Agent | `contact` | `custom_objects.real_estate_offer` | Real Estate Offer |
| `my_listings_seller` | Seller | `contact` | `custom_objects.my_listings` | Listing |
| `my_listings_buyer_lead` | Buyer Lead | `contact` | `custom_objects.my_listings` | Listing |
| `transaction_buyer` | Buyer | `contact` | `custom_objects.transactions` | Transaction |
| `transaction_seller` | Seller | `contact` | `custom_objects.transactions` | Transaction |
| `transaction_listing_agent` | Listing Agent | `contact` | `custom_objects.transactions` | Transaction |
| `transaction_selling_agent` | Selling Agent | `contact` | `custom_objects.transactions` | Transaction |

**Business rules**
- Buyer-interest matching (`contact` key) drives property-alert automations when `properties.property_status → active`.
- A My Listing has 1 primary seller (+ optional co-sellers) via `my_listings_seller`.
- On Offer creation, prompt/require party links with the correct role keys before the offer can advance past `pending`.

## 3. Cross-object associations (10 keys)

| Association Key | Object A | Cardinality | Object B | Business Rule |
|---|---|---|---|---|
| `my_listings_mls_property` | `custom_objects.my_listings` | M:M (use as 1:1) | `custom_objects.properties` | Listing ↔ its MLS comp record; pair with `mls_number` soft-FK |
| `my_listings_offers` | `custom_objects.my_listings` | M:M | `custom_objects.real_estate_offer` | Listing receives competing offers |
| `my_listings_transactions` | `custom_objects.my_listings` | M:M (**app-enforced 1:1**) | `custom_objects.transactions` | One listing closes in exactly one Transaction |
| `my_listings_opportunity` | `custom_objects.my_listings` | M:M | `opportunity` | Listing ↔ seller-side deal |
| `opportunity` | `custom_objects.properties` | **1:1 (platform max 1 each side)** | `opportunity` | Deal's target property |
| `offers_property` | `custom_objects.properties` | M:1 | `custom_objects.real_estate_offer` | Many offers per property |
| `transaction_property` | `custom_objects.properties` | M:M | `custom_objects.transactions` | Property ↔ closed deal |
| `offers_opportunity` | `custom_objects.real_estate_offer` | 1:M | `opportunity` | One Opportunity generates many offer rounds; each Offer has one parent Opportunity |
| `transaction_offer` | `custom_objects.real_estate_offer` | M:M (**app-enforced 1:1**) | `custom_objects.transactions` | Only the `accepted` Offer converts; one accepted Offer = one Transaction |
| `transaction_opportunity` | `custom_objects.transactions` | M:M (**app-enforced 1:1**) | `opportunity` | Only a `won` Opportunity links; enables pipeline→commission reporting without traversing Offer |

## 4. System-defined associations (2 keys)

| Association Key | Object A | Cardinality | Object B | Limits |
|---|---|---|---|---|
| `OPPORTUNITIES_CONTACTS_ASSOCIATION` | `opportunity` | M:M | `contact` | 25 contacts per opp / 1000 opps per contact |
| `BUSINESSES_CONTACTS_ASSOCIATION` | `business` | 1:M | `contact` | 1 business per contact / 10,000 contacts per business |

---

## 5. 1:1 conversion rules (workflow/app-enforced — the platform does NOT enforce these)

| Rule | Guard | Trigger |
|---|---|---|
| Offer → Transaction | `real_estate_offer.status = accepted` AND no existing `transaction_offer` relation | On status → `accepted`: create Transaction, link via `transaction_offer`, copy contact relations to transaction-role keys |
| Opportunity → Transaction | `opportunity.status = won` AND no existing `transaction_opportunity` relation | On status → `won`: create/link Transaction, set `transactions.status = under_contract` |
| My Listing → Transaction | No existing `my_listings_transactions` relation | On `transactions.status → closed`: set `my_listings.listing_status = sold` |

**Every write path (UI, hook, workflow, agent) must check for an existing relation before creating one of these three.**

## 6. Soft-FK ↔ association pairing

Three text fields mirror associations and must be kept in sync (Workflow-enforced; app code should also write both):

| Soft-FK Field | References | Paired Association | Sync Rule |
|---|---|---|---|
| `opportunity.mls_number` | `properties.mls` | `opportunity` (Property↔Opp) | On association created → copy `properties.mls` into field |
| `real_estate_offer.mls_number` | `properties.mls` | `offers_property` | On association created → copy `properties.mls` into field |
| `my_listings.mls_number` | `properties.mls` | `my_listings_mls_property` | Required on record creation; on creation, search Property MLS by `mls` and create the association if found |

## 7. Association graph (summary)

```
CONTACT ─ OPPORTUNITIES_CONTACTS_ASSOCIATION ─► OPPORTUNITY
CONTACT ─ BUSINESSES_CONTACTS_ASSOCIATION ────► BUSINESS
CONTACT ─ contact / property_seller ──────────► PROPERTY (MLS)
CONTACT ─ offer_{buyer|seller|buyer_agent|seller_agent} ─► OFFER
CONTACT ─ my_listings_{seller|buyer_lead} ────► MY LISTING
CONTACT ─ transaction_{buyer|seller|listing_agent|selling_agent} ─► TRANSACTION

OPPORTUNITY ─ opportunity (1:1) ──────────────► PROPERTY (MLS)
OPPORTUNITY ─ offers_opportunity (1:M) ◄─────── OFFER
OPPORTUNITY ─ transaction_opportunity (1:1*) ─► TRANSACTION
OPPORTUNITY ─ my_listings_opportunity ◄──────── MY LISTING

PROPERTY (MLS) ─ offers_property (M:1) ◄─────── OFFER
PROPERTY (MLS) ─ transaction_property ────────► TRANSACTION
PROPERTY (MLS) ─ my_listings_mls_property ◄──── MY LISTING  (+ soft-FK mls_number)

OFFER ─ transaction_offer (1:1*) ─────────────► TRANSACTION
MY LISTING ─ my_listings_offers ──────────────► OFFER
MY LISTING ─ my_listings_transactions (1:1*) ─► TRANSACTION

* app/workflow-enforced 1:1
```

## 8. Workflow automation hooks (association-driven)

| Trigger | Action |
|---|---|
| Offer created | Prompt agent to link parties via role keys (`offer_buyer`, `offer_seller`, …) |
| Offer ↔ Property (MLS) associated | Write `properties.mls` → `real_estate_offer.mls_number` |
| `real_estate_offer.status → accepted` | Create Transaction; link `transaction_offer` (1:1 guard); copy contact relations to transaction-role keys |
| `opportunity.status → won` | Create/link Transaction via `transaction_opportunity` (1:1 guard); set `status = under_contract` |
| Opportunity ↔ Property (MLS) associated | Write `properties.mls` → `opportunity.mls_number` |
| `transactions.status → closed` | Set `my_listings.listing_status = sold` on linked listing; set `properties.property_status = sold` + `sold_price` + `sold_date` |
| My Listing created | Search Property MLS by `mls_number`; create `my_listings_mls_property` if found |
| `contact.closing_anniversary` reached | Anniversary follow-up workflow |
| `real_estate_offer.status → expired` | Update linked Opportunity stage; notify agent |
| Property status → `active` | Buyer-match notification for contacts linked via `contact` (interested) |

## 9. GHL platform constraints

- No platform-enforced cardinality except where the association was configured with max-1 sides (`opportunity` Property↔Opp key).
- Forward/reverse labels render in association panels; the related object's **Primary Display Property** is what appears — ensure those are always populated (`contact.email`, `opportunity.name`, `properties.mls`, `my_listings.mls_number`, `real_estate_offer.offer_id`, `transactions.transaction_id`).
- Keep < 20 associations per record to avoid UI panel clutter.

## Changelog

| Version | Date | Description |
|---|---|---|
| 2.0.0 | 2026-07-07 | Declared the 24 live keys as the registry of record; documented role-via-key pattern; formalized 1:1 guards and soft-FK pairing; deprecated §19 legacy keys (`offer_to_contact`, `offer_to_property`, `opportunity_to_property`, `mls_to_property`, `opportunity_to_transaction`) — see `MIGRATION_MAP.md` |
