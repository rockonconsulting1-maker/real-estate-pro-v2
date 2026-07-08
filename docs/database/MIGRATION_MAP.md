# Migration Map — Deprecated → Canonical Keys

**Version:** 2.0.0 | Date: 2026-07-07
**Purpose:** Every field key, association key, and enum value that changed between the v1 docs (`GHL_Integration_Mapping.md` §18–22, `Real Estate Pro CRM — Full Integration Schema.md` Part 2/3) and the canonical 2.0.0 schema. Use this to update hooks, components, filters, workflow definitions, and seed scripts.

> **Agent instruction:** grep the codebase for every key in the "Deprecated" columns below. Replace with the canonical key, then re-run type checks and the API smoke tests. Anything in this file that still appears in code after migration is a defect.

---

## 1. Association keys (`GHL_Integration_Mapping.md` §19 + PRD §6.4 — DEPRECATED)

The §19 keys were placeholder names that never matched the live sub-account. Canonical keys are in `ASSOCIATIONS_REGISTRY.md`.

| Deprecated Key | Canonical Key(s) | Notes |
|---|---|---|
| `offer_to_contact` (Role: Buyer) | `offer_buyer` | Role now encoded in the key |
| `offer_to_contact` (Role: Seller) | `offer_seller` | Also available: `offer_buyer_agent`, `offer_seller_agent` |
| `offer_to_property` | `offers_property` | M:1 — many offers per property |
| `opportunity_to_property` | `opportunity` | ⚠ counter-intuitive live key name; 1:1 (max 1 each side) |
| `mls_to_property` | `my_listings_mls_property` | Pair with `my_listings.mls_number` soft-FK |
| `opportunity_to_transaction` | `transaction_opportunity` | App-enforced 1:1 |
| *(missing in v1)* | `transaction_offer`, `my_listings_offers`, `my_listings_transactions`, `my_listings_opportunity`, `my_listings_seller`, `my_listings_buyer_lead`, `transaction_buyer`, `transaction_seller`, `transaction_listing_agent`, `transaction_selling_agent`, `property_seller`, `contact`, `transaction_property` | Add to bootstrap registry |
| `SYSTEM: BUSINESSES_CONTACTS_ASSOCIATION` | `BUSINESSES_CONTACTS_ASSOCIATION` | Unchanged (drop the `SYSTEM:` prefix in code) |
| *(missing in v1)* | `OPPORTUNITIES_CONTACTS_ASSOCIATION` | System M:M; 25 contacts/opp |

## 2. Offer field keys (`GHL_Integration_Mapping.md` §10/§18 — DEPRECATED)

The old mapping used a generic `properties.*` prefix for Offer fields. Offers use the `real_estate_offer` object prefix (full dotted prefix `custom_objects.real_estate_offer.*` in API payloads).

| Deprecated Key | Canonical Key |
|---|---|
| `properties.offer_price` | `real_estate_offer.purchase_price` |
| `properties.deposit_amount` (on Offer screen) | `real_estate_offer.deposit_amount` |
| `properties.status` (on Offer screen) | `real_estate_offer.status` |
| `properties.closing_date` (on Offer screen) | `real_estate_offer.closing_date` |
| `properties.irrevocable_until` | `real_estate_offer.expiry_date` |
| `properties.conditions` (on Offer screen) | `real_estate_offer.conditions` |

**Enum change:** Offer status `Pending, Accepted, Declined, Countered` → option keys `pending · accepted · countered · rejected · closed · expired` (`Declined` → `rejected`; `closed`/`expired` added).

## 3. Transaction field keys (`GHL_Integration_Mapping.md` §21 — DEPRECATED)

| Deprecated Key | Canonical Key |
|---|---|
| `properties.transaction_id` | `transactions.transaction_id` |
| `properties.closing_date` (on TX screen) | `transactions.closing_date` |
| `properties.commission_amount` | `transactions.commission_amount` |
| `properties.transaction_status` | `transactions.status` |

**Enum change:** `Under Contract, Firm, Closed, Funded` → `under_contract · pending · closed · cancelled · failed` (`Firm` → `pending`; `Funded` folds into `closed`; `cancelled`/`failed` added).

## 4. Property / My Listing field keys (`GHL_Integration_Mapping.md` §8/§9/§18 — DEPRECATED)

| Deprecated Key | Canonical Key | Object |
|---|---|---|
| `properties.address` | `properties.full_address` | Property (MLS) |
| `properties.mls_number` | `properties.mls` | Property (MLS) — `mls_number` belongs to My Listing / Offer / Opportunity soft-FKs only |
| `properties.sqft` | `properties.square_footage` | Property (MLS) |
| `properties.public_remarks` | `properties.feature_highlights` (marketing) / `properties.property_notes` (internal) | Property (MLS) |
| `properties.image_urls` | `properties.property_images` (File Upload) + `properties.listing_url` | Property (MLS) |
| `properties.listing_stage` | `my_listings.listing_status` | My Listing |
| `properties.listing_views` | *(no live field — remove from UI or back with Supabase analytics)* | My Listing |
| `properties.address` (My Listings screen) | `my_listings.property_address` | My Listing |
| `properties.list_price` (My Listings screen) | `my_listings.listing_price` | My Listing |
| `properties.postal_code` | `properties.postal` | Property (MLS) — ⚠ key really is `postal` |

## 5. Contact field keys (`GHL_Integration_Mapping.md` §18/§20 — DEPRECATED / RECONCILED)

| Deprecated / v1 Key | Canonical Key | Notes |
|---|---|---|
| `contact.buyer_budget` | `contact.budget_max` | Currency |
| `contact.buyer_must_haves` | `contact.property_type_preference` (structured) + `contact.notes_summary` (freeform) | Old LARGE_TEXT split into structured + notes |
| `contact.listing_address` | `contact.current_address` | Seller's property |
| `contact.target_list_price` | *(no live field — track on `opportunity.monetary_value` or add field before use)* | |
| `contact.representation_start_date` | *(no live field — add before use)* | |
| `contact.pre_approval_lender` | `contact.preapproval_status` (status) + lender as Business/Contact association | |
| `contact.source` | `contact.lead_source` | §22 enum superseded by canonical option list |
| `contact.temperature` (text) | `contact.lead_temperature` (Single Select) | Legacy text field remains, workflow-written; app reads/writes `lead_temperature` |

**Lead Source enum:** §22's `Cold Call, Door Knock, …` → canonical `Zillow · Realtor.com · Open House · Referral · SOI · Website · Social Media · Cold Outreach · Other`. Map `Cold Call`/`Door Knock` → `Cold Outreach`; `Realtor.com` stays.

**Lost Reason:** `opportunity.lostReason` free values → `opportunity.loss_reason` picklist (`Chose Another Agent · Not Ready · Unresponsive · Budget · Timing · Relocated · Found Property Independently · Market Conditions · Other`).

## 6. Tag taxonomy (§22 — retained, clarified)

`temperature:*`, `type:*`, `priority:*` tag namespaces remain valid and coexist with the structured fields. Rule of alignment: **structured field is the source of truth; the tag mirrors it for workflow/filter convenience.** Workflows that update `contact.lead_temperature` must also swap the `temperature:*` tag.

## 7. New fields (no v1 equivalent — add to types, forms, and detail views)

- **Contact:** `lead_temperature`, `lead_timeline`, `soi_relationship`, `closing_anniversary`, `vendor_service_type`, `std_billing_address_*`
- **Opportunity:** `deal_type`, `expected_close_date`, `loss_reason`, `lead_quality_score`, `follow_up_count`, `other_agent_name`, `other_agent_brokerage`
- **Property (MLS):** `latitude`, `longitude`, `tax_assessment`, `condo_fees`, `sold_date`, `listing_url`, `property_images`, `features_amenities`, `feature_highlights`, `property_notes`, `documents_ref`, `garage`, `basement`, `heating_type`
- **My Listing:** `open_house_date`, `listing_description`, `agent_name`, `brokerage`, `tags`, `notes`
- **Offer:** `offer_type`, `offer_date`, `counter_price`, `commission_amount`, `commission_split`, `contingencies`, `terms_conditions`, `submitted_by`, `documents_ref`
- **Transaction:** *(schema unchanged from v1 Full Schema; keys confirmed)*

## 8. Migration checklist (dependency-ordered)

1. Update the bootstrap association registry to resolve the 24 canonical keys; remove the 6 legacy keys.
2. Regenerate TypeScript types for all 7 objects from `DATA_DICTIONARY.md` (or live `fetchProperties=true` pulls).
3. Grep-replace deprecated field keys per §2–§5 above (search both `properties.offer_price`-style strings and any camelCase variants).
4. Update enum constants/maps: offer status, transaction status, lead source, loss reason, property/sub types (snake_case option keys).
5. Update Zod/validation schemas and form components to the canonical enums; ensure selects submit option keys, not labels.
6. Update workflow definitions (GHL side) that reference legacy keys; re-verify the 1:1 guard workflows.
7. Add the "new fields" of §7 to detail views and search filters where the PRD requires them.
8. Run API smoke tests: create → associate → convert (Offer accepted → Transaction) round-trip against a sandbox record.

## Changelog

| Version | Date | Description |
|---|---|---|
| 2.0.0 | 2026-07-07 | Initial migration map for the v1 → v2 schema reconciliation |
