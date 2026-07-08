# Data Dictionary — Real Estate Pro CRM (Canonical)

**Version:** 2.0.0 | Generated from live API: 2026-07-07 | Location ID: `jHEaG68TeCsXHXPhrVtU`
**Supersedes:** `Real Estate Pro CRM — Full Integration Schema.md` Part 2 · `GHL_Integration_Mapping.md` §18/§20/§22
**Companion docs:** `ASSOCIATIONS_REGISTRY.md` (relationships) · `MIGRATION_MAP.md` (old → new keys) · `AGENT_DB_GUIDE.md` (usage rules)

> **Treat as authoritative for field keys, object IDs, types, and enum option keys.**
> To update: change fields in GHL Settings → Objects → [Object] → Fields, re-pull the live schema, update this file, bump the version.

---

## 1. Object Inventory

| # | Object Key | Display Name | Type | Object ID | Primary Display | Required Field | Unique Constraint |
|---|---|---|---|---|---|---|---|
| 1 | `contact` | Contact | System | `6a44a1e5581b923d9e657d3a` | `contact.email` | `email` | — |
| 2 | `business` | Company | System | `6a44a1e5581b920951657d3c` | `business.name` | `name` | — |
| 3 | `opportunity` | Opportunity | System | `6a44a1e5581b9214c0657d3b` | `opportunity.name` | `name`, `pipeline_id`, `pipeline_stage_id` (+ `contact_id` on create) | — |
| 4 | `custom_objects.properties` | Property (MLS) | Custom | `6a44a1e75fd80c02ec76b5ef` | `properties.mls` | `mls` | `mls` ✓ (platform-enforced) |
| 5 | `custom_objects.my_listings` | My Listing | Custom | `6a44b1692c3079662fdd9736` | `my_listings.mls_number` | `mls_number` | — |
| 6 | `custom_objects.real_estate_offer` | Offer | Custom | `6a44a1e75fd80c971d76b5f0` | `real_estate_offer.offer_id` | `offer_id` | — |
| 7 | `custom_objects.transactions` | Transaction | Custom | `6a44b1696a2c18dc4bd8dd08` | `transactions.transaction_id` | `transaction_id` | — |

**System-native (not in the object registry):** Appointments, Notes, Tasks, Conversations/Messages, Documents, Users, Calendars, Pipelines/Stages, Tags, Workflows. Field references for these live in `GHL_Integration_Mapping.md` (screens) and `schema.dbml` (structure).

### Type reference

`Text` = TEXT · `Long Text` = LARGE_TEXT · `Number` = NUMERICAL · `Currency` = MONETORY (platform spelling; CAD)
`Date` = DATE · `Single Select` = SINGLE_OPTIONS · `Multi-Select` = MULTIPLE_OPTIONS · `File` = FILE_UPLOAD
`Standard` = STANDARD_FIELD · `Phone` = PHONE · `Email` = EMAIL

### Searchable fields (usable in CRM search & Workflow search actions)

| Object | Searchable Fields |
|---|---|
| Contact | `name`, `email`, `businessName`, `tags`, `phone` |
| Business | `name`, `email` |
| Opportunity | `name`, `contactPhone`, `contactEmail`, `businessName`, `tags`, `contactName` |
| Property (MLS) | `mls`, `full_address`, `property_name` |
| My Listing | `mls_number` |
| Offer | `offer_id`, `property_address`, `mls_number` |
| Transaction | `transaction_id` |

---

## 2. CONTACT (`contact`)

**Multi-role object.** One Contact record represents a person across all roles — Lead, Buyer, Seller, Past Client, Vendor. Role segmentation uses `buyer_seller_type` + `vendor_service_type` + tags. Transaction-side roles (buyer vs seller on a specific deal) are carried by the **association key**, not by duplicating contacts (see `ASSOCIATIONS_REGISTRY.md` §2). Do NOT create separate custom objects for vendor types.

### 2.1 Standard fields

| Field Key | Display Name | Type | Req | Notes |
|---|---|---|---|---|
| `contact.first_name` | First Name | Standard | ✓ (UI) | Required at UI creation |
| `contact.last_name` | Last Name | Standard | — | |
| `contact.email` | Email | Standard | ✓ | Platform-required; primary display; searchable |
| `contact.phone` | Phone | Standard | — | Searchable |
| `contact.company_name` | Business Name | Standard | — | Pairs with Business association |
| `contact.address1` | Street Address | Standard | — | |
| `contact.city` | City | Standard | — | |
| `contact.country` | Country | Standard | — | |
| `contact.timezone` | Timezone | Standard | — | Default `America/Edmonton` |
| `contact.type` | Contact Type | Standard | — | `lead` · `customer` · `prospect` · `past_client` |
| `contact.tags` | Tags | Standard | — | Array of tag strings (kebab-case, namespaced — see §9.4) |
| `contact.dnd` | Do Not Disturb | Standard | — | Per-channel DND group field |

### 2.2 Lead classification group

| Field Key | Display Name | Type | Options |
|---|---|---|---|
| `contact.lead_source` | Lead Source | Single Select | `Zillow` · `Realtor.com` · `Open House` · `Referral` · `SOI` · `Website` · `Social Media` · `Cold Outreach` · `Other` |
| `contact.lead_temperature` | Lead Temperature | Single Select | `Hot` · `Warm` · `Cold` · `Dead` — **canonical temperature field** |
| `contact.temperature` | Temperature | Text | ⚠ Legacy free-text; written by "Lead Temperature Update" workflow (v4, draft). Read-only in app code; migrate consumers to `lead_temperature` |
| `contact.buyer_seller_type` | Buyer/Seller Type | Single Select | `Buyer` · `Seller` · `Both` · `Investor` · `Renter` |
| `contact.lead_timeline` | Lead Timeline | Single Select | `0-1 month` · `1-3 months` · `3-6 months` · `6-12 months` · `12+ months` |
| `contact.preapproval_status` | Pre-Approval Status | Single Select | `Not Started` · `In Progress` · `Conditional Approval` · `Pre-Approved` · `Cash Buyer` · `N/A` |
| `contact.lead_score` | Lead Score | Number | Integer scoring value |

### 2.3 Buyer preferences group

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `contact.property_type_preference` | Property Type Preference | Multi-Select | `Single-family` · `Condo` · `Townhouse` · `Multi-family` · `Land` · `Commercial` · `Investment` |
| `contact.bed_min` | Bed Min | Number | Integer ≥ 0 |
| `contact.bath_min` | Bath Min | Number | Decimal ≥ 0 |
| `contact.budget_max` | Budget Max | Currency | Buyer's max budget (CAD) |
| `contact.monthly_budget` | Monthly Budget | Currency | For renters / payment-based buyers |
| `contact.desired_possession_date` | Desired Possession Date | Date | |
| `contact.current_mortgage_status` | Current Mortgage Status | Text | |
| `contact.target_roi` | Target ROI | Text | Investor contacts; e.g. `8% cap rate` |

### 2.4 Seller fields

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `contact.reason_for_selling` | Reason for Selling | Long Text | Seller contacts only |
| `contact.current_address` | Current Address | Text | Property being sold / current residence |
| `contact.closing_date` | Closing Date | Date | Contact-level closing date (deal-level lives on Opportunity/Transaction) |

### 2.5 Vendor profile group

| Field Key | Display Name | Type | Options |
|---|---|---|---|
| `contact.vendor_service_type` | Vendor Service Type | Single Select | `Lender` · `Inspector` · `Title Company` · `Stager` · `Photographer` · `Contractor` · `Appraiser` · `Attorney` · `Moving Company` · `Insurance Agent` · `Mortgage Specialist` · `Other` |
| `contact.vendor_priority` | Vendor Priority | Single Select | `A (Preferred)` · `B (Alternate)` · `C (Backup)` |

### 2.6 Relationship & SOI group

| Field Key | Display Name | Type | Options / Notes |
|---|---|---|---|
| `contact.soi_relationship` | SOI Relationship | Single Select | `Family` · `Friend` · `Colleague` · `Past Client` · `Neighbor` · `Community` · `Other` |
| `contact.preferred_communication` | Preferred Communication | Single Select | `Call` · `Text` · `Email` · `WhatsApp` — drives Workflow channel routing |
| `contact.annual_touchpoint_goal` | Annual Touchpoint Goal | Number | Integer ≥ 0 |
| `contact.referral_count` | Referral Count | Number | Incremented by Workflow |
| `contact.referral_source_contact` | Referral Source Contact | Text | Name/ID of referring contact |
| `contact.vip_status` | VIP Status | Boolean-style | Flag for VIP treatment automations |
| `contact.review_received` | Review Received | Boolean-style | Post-close review tracking |

### 2.7 Dates & tracking group

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `contact.last_interaction_date` | Last Interaction Date | Date | Updated by Workflow on each meaningful touchpoint |
| `contact.last_contact_date` | Last Contact Date | Date | Last outbound contact by agent |
| `contact.closing_anniversary` | Closing Anniversary | Date | Triggers annual follow-up Workflow |
| `contact.notes_summary` | Notes Summary | Long Text | Rolling summary field |

### 2.8 Billing address group

| Field Key | Display Name | Type |
|---|---|---|
| `contact.std_billing_address_full_name` | Billing Address - Full Name | Text |
| `contact.std_billing_address_phone` | Billing Address - Phone | Text |
| `contact.std_billing_address_address1` | Billing Address - Full Address | Text |

---

## 3. BUSINESS / COMPANY (`business`)

**Usage:** organizations only — lenders, brokerages, title companies, law firms. Individual vendors are Contacts with `vendor_service_type` set. Native association: 1 Business per Contact, up to 10,000 Contacts per Business.

| Field Key | Display Name | Type | Req | Notes |
|---|---|---|---|---|
| `business.name` | Company Name | Text | ✓ | Primary display; searchable |
| `business.phone` | Phone | Phone | — | |
| `business.email` | Email | Email | — | Searchable |
| `business.website` | Website | Text | — | |
| `business.address` | Address | Text | — | |
| `business.city` | City | Text | — | |
| `business.state` | Province/State | Text | — | Canadian abbreviation: `AB`, `BC`, … |
| `business.postalcode` | Postal Code | Text | — | Format `T1A 2B3` |
| `business.country` | Country | Single Select | — | Default `Canada` |
| `business.description` | Description | Long Text | — | Services / notes |

---

## 4. OPPORTUNITY (`opportunity`)

**Deal-tracking engine.** Moves through pipeline stages. Naming convention: `[Contact Last Name] — [Property Address or Deal Type]` (e.g. `Smith — 123 Main St`). A **Won** Opportunity triggers exactly one Transaction (1:1, workflow-enforced).

### 4.1 Standard fields

| Field Key | Display Name | Type | Req | Notes |
|---|---|---|---|---|
| `opportunity.name` | Opportunity Name | Standard | ✓ | Primary display |
| `opportunity.pipeline_id` | Pipeline | Standard | ✓ | Resolve by name at bootstrap (§9.6) |
| `opportunity.pipeline_stage_id` | Stage | Standard | ✓ | Stage within pipeline |
| `opportunity.contact_id` | Contact (linked) | Standard | ✓ create | Primary contact |
| `opportunity.status` | Status | Standard | — | `open` · `won` · `lost` · `abandoned` (system-managed) |
| `opportunity.monetary_value` | Lead Value | Standard | — | Estimated deal value, CAD |
| `opportunity.assigned_to` | Opportunity Owner | Standard | — | GHL User ID |
| `opportunity.source` | Opportunity Source | Standard | — | |
| `opportunity.lost_reason` | Lost Reason (system) | Standard | — | System field; custom `loss_reason` below carries the picklist |
| `opportunity.tags` | Tags | Standard | — | Array |
| `opportunity.followers` | Followers | Standard | — | Array of User IDs |

### 4.2 Deal details group

| Field Key | Display Name | Type | Options / Notes |
|---|---|---|---|
| `opportunity.deal_type` | Deal Type | Single Select | `Buyer Purchase` · `Seller Listing` · `Dual Agency` · `Referral Out` |
| `opportunity.mls_number` | MLS Number | Text | **Soft-FK → `properties.mls`**; auto-populated by Workflow on property association |
| `opportunity.financing_type` | Financing Type | Single Select | `Conventional` · `CMHC Insured` · `FHA` · `VA` · `Cash` · `Private Lending` · `Other` |
| `opportunity.other_agent_name` | Other Agent Name | Text | Cooperating/competing agent |
| `opportunity.other_agent_brokerage` | Other Agent Brokerage | Text | |
| `opportunity.loss_reason` | Loss Reason | Single Select | `Chose Another Agent` · `Not Ready` · `Unresponsive` · `Budget` · `Timing` · `Relocated` · `Found Property Independently` · `Market Conditions` · `Other` |

### 4.3 Dates group

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `opportunity.closing_date` | Closing Date | Date | Expected close/possession date |
| `opportunity.expected_close_date` | Expected Close Date | Date | Agent's forecast date |
| `opportunity.conditions_deadline` | Conditions Deadline | Date | Mirrors `real_estate_offer.conditions_deadline` for pipeline views |

### 4.4 Scoring & tracking group

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `opportunity.lead_quality_score` | Lead Quality Score | Number | Manual 0–10 |
| `opportunity.follow_up_count` | Follow Up Count | Number | Incremented by Workflow |

---

## 5. PROPERTY (MLS) (`custom_objects.properties`)

**Read-heavy MLS reference table** — the full market universe for comps, buyer matching, and analysis. Records created/updated by **API sync only** (not manual entry). `properties.mls` is the system-wide natural key and the anchor for all soft-FKs. **Unique constraint on `mls` is platform-enforced.**

### 5.1 Identification & status

| Field Key | Display Name | Type | Req | Unique | Searchable | Options / Notes |
|---|---|---|---|---|---|---|
| `properties.mls` | MLS# | Text | ✓ | ✓ | ✓ | Natural key; MLS board format e.g. `A2123456` |
| `properties.property_name` | Property Name | Text | — | — | ✓ | e.g. `Smith Family Home` |
| `properties.full_address` | Full Address | Text | — | — | ✓ | Complete street address |
| `properties.property_status` | Property Status | Single Select | — | — | — | `active` · `pending` · `sold` · `expired` · `withdrawn` · `coming_soon` |
| `properties.property_type` | Property Type | Single Select | — | — | — | `single_family` · `condo` · `townhouse` · `multifamily` · `land` · `commercial` |
| `properties.sub_type` | Property Sub-type | Single Select | — | — | — | `detached` · `semi_detached` · `row_house` · `stacked` · `suite` · `other` |

### 5.2 Pricing & market data

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `properties.list_price` | List Price | Currency | Original MLS list price |
| `properties.sold_price` | Sold Price | Currency | Null until `property_status = sold` |
| `properties.tax_assessment` | Tax Assessment | Currency | Municipal assessed value |
| `properties.condo_fees` | HOA/Condo Fees | Currency | Monthly |
| `properties.days_on_market` | Days on Market | Number | Calculated from `listing_date`; updated by sync |

### 5.3 Physical attributes

| Field Key | Display Name | Type | Options / Notes |
|---|---|---|---|
| `properties.bedrooms` | Bedrooms | Number | Integer |
| `properties.bathrooms` | Bathrooms | Number | Decimal (e.g. 2.5) |
| `properties.square_footage` | Square Footage | Number | Above-grade sq ft |
| `properties.lot_size` | Lot Size | Number | sq ft or acres — unit noted in field description |
| `properties.year_built` | Year Built | Number | 4-digit year |
| `properties.garage` | Garage | Single Select | `none` · `single_attached` · `double_attached` · `triple_attached` · `single_detached` · `double_detached` |
| `properties.basement` | Basement | Single Select | `none` · `unfinished` · `partially_finished` · `fully_finished` |
| `properties.heating_type` | Heating Type | Single Select | `forced_air` · `baseboard` · `radiant` · `boiler` · `geothermal` |
| `properties.features_amenities` | Features / Amenities | Long Text | Freeform amenity list |
| `properties.feature_highlights` | Feature Highlights | Long Text | Marketing-ready bullets |

### 5.4 Location

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `properties.city` | City | Text | e.g. `Lethbridge` |
| `properties.province` | Province | Text | e.g. `AB` |
| `properties.postal` | Postal Code | Text | `T1A 2B3` — ⚠ note key is `postal`, not `postal_code` |
| `properties.latitude` | Latitude | Number | Decimal degrees — map display |
| `properties.longitude` | Longitude | Number | Decimal degrees — map display |

### 5.5 Dates

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `properties.listing_date` | Listing Date | Date | |
| `properties.listing_expiry` | Listing Expiry | Date | MLS contract expiry |
| `properties.sold_date` | Sold Date | Date | Null until sold |

### 5.6 Media & documents

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `properties.listing_url` | Listing URL | Text | External MLS / Realtor.ca link |
| `properties.property_images` | Property Images | File Upload | |
| `properties.property_notes` | Property Notes | Long Text | Internal notes |
| `properties.documents_ref` | Documents Ref | Text | Comma-separated Supabase Storage UUIDs (§9.5) |

---

## 6. MY LISTING (`custom_objects.my_listings`)

**Personal inventory layer** on top of the MLS universe — listings the agent actively manages and markets. Source for Realtor.ca sync, open-house scheduling, and seller-side automations. Every My Listing should have a corresponding Property (MLS) record linked via the `mls_number` soft-FK **and** the `my_listings_mls_property` association.

### 6.1 Identification & status

| Field Key | Display Name | Type | Req | Searchable | Options / Notes |
|---|---|---|---|---|---|
| `my_listings.mls_number` | MLS Number | Text | ✓ | ✓ | **Soft-FK → `properties.mls`**; primary display |
| `my_listings.listing_key` | Listing Key | Text | — | — | External Realtor.ca API key |
| `my_listings.listing_status` | Listing Status | Single Select | — | — | `active` · `pending` · `sold` · `expired` · `withdrawn` |

### 6.2 Location

| Field Key | Display Name | Type |
|---|---|---|
| `my_listings.property_address` | Property Address | Text |
| `my_listings.city` | City | Text |
| `my_listings.province` | Province | Text |
| `my_listings.postal_code` | Postal Code | Text |

### 6.3 Property details

| Field Key | Display Name | Type | Options / Notes |
|---|---|---|---|
| `my_listings.property_type` | Property Type | Single Select | `house` · `condo` · `townhouse` · `land` · `commercial` — ⚠ option set differs from `properties.property_type` |
| `my_listings.sub_type` | Sub-type | Single Select | `detached` · `semi_detached` · `row_house` · `stacked` · `suite` |
| `my_listings.bedrooms` | Bedrooms | Number | Integer |
| `my_listings.bathrooms` | Bathrooms | Number | Decimal |
| `my_listings.square_footage` | Square Footage | Number | |
| `my_listings.lot_size` | Lot Size | Number | |
| `my_listings.year_built` | Year Built | Number | 4-digit |

### 6.4 Listing details

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `my_listings.listing_price` | Listing Price | Currency | |
| `my_listings.listing_date` | Listing Date | Date | |
| `my_listings.days_on_market` | Days on Market | Number | |
| `my_listings.realtor_url` | Realtor.ca URL | Text | Public listing link |
| `my_listings.open_house_date` | Open House Date | Date | Next scheduled open house |
| `my_listings.listing_description` | Listing Description | Long Text | Public-facing copy |

### 6.5 Agent & marketing

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `my_listings.agent_name` | Agent Name | Text | Listing agent |
| `my_listings.brokerage` | Brokerage | Text | |
| `my_listings.photos_url` | Photos URL | Text | External gallery URL |
| `my_listings.tags` | Tags | Text | Comma-separated marketing tags |
| `my_listings.notes` | Notes | Long Text | Internal |
| `my_listings.last_synced` | Last Synced | Date | Last Realtor.ca/MLS sync — feed-freshness indicator |

---

## 7. OFFER (`custom_objects.real_estate_offer`)

**Negotiation ledger.** Multiple Offer records per deal are expected (initial, counters, revisions). Only one Offer per deal should ever reach `accepted` — that Offer triggers exactly one Transaction (1:1, workflow-enforced). The Offer freezes all legal/financial terms at the moment of writing.
**`offer_id` convention:** `OFR-YYYYMMDD-NNN` (e.g. `OFR-20260701-001`).

### 7.1 Identification & property reference

| Field Key | Display Name | Type | Req | Searchable | Notes |
|---|---|---|---|---|---|
| `real_estate_offer.offer_id` | Offer ID | Text | ✓ | ✓ | Primary display |
| `real_estate_offer.property_address` | Property Address | Text | — | ✓ | Denormalized copy for fast lookup |
| `real_estate_offer.mls_number` | MLS Number | Text | — | ✓ | **Soft-FK → `properties.mls`**; auto-populated by Workflow |

### 7.2 Offer terms

| Field Key | Display Name | Type | Options |
|---|---|---|---|
| `real_estate_offer.offer_type` | Offer Type | Single Select | `buyer_offer` (Buyer Offer — Sent) · `seller_offer` (Seller Offer — Received) · `counter_offer` |
| `real_estate_offer.status` | Offer Status | Single Select | `pending` · `accepted` · `countered` · `rejected` · `closed` · `expired` |
| `real_estate_offer.financing_type` | Financing Type | Single Select | `conventional` · `cmhc_insured` · `cash` · `private` · `other` |

### 7.3 Prices & deposits

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `real_estate_offer.purchase_price` | Purchase Price | Currency | Offered price |
| `real_estate_offer.deposit_amount` | Deposit Amount | Currency | Initial trust deposit |
| `real_estate_offer.additional_deposit` | Additional Deposit | Currency | Second deposit if applicable |
| `real_estate_offer.counter_price` | Counter Offer Price | Currency | Counter-response price |
| `real_estate_offer.commission_amount` | Commission Amount | Currency | Agreed total commission |
| `real_estate_offer.commission_split` | Commission Split | Text | e.g. `2.5% / 2.5%` |

### 7.4 Key dates

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `real_estate_offer.offer_date` | Offer Date | Date | Date submitted |
| `real_estate_offer.expiry_date` | Offer Expiry | Date | Irrevocability expiry |
| `real_estate_offer.conditions_deadline` | Conditions Deadline | Date | Conditions waiver deadline |
| `real_estate_offer.closing_date` | Closing Date | Date | Proposed title transfer |
| `real_estate_offer.possession_date` | Possession Date | Date | Buyer possession |

### 7.5 Legal & terms

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `real_estate_offer.legal_description` | Legal Description | Long Text | Legal land description |
| `real_estate_offer.conditions` | Conditions | Long Text | Financing/inspection/etc. |
| `real_estate_offer.contingencies` | Contingencies | Long Text | |
| `real_estate_offer.terms_conditions` | Terms & Conditions | Long Text | Additional terms |
| `real_estate_offer.included_chattels` | Included Chattels | Long Text | |
| `real_estate_offer.excluded_fixtures` | Excluded Fixtures | Long Text | |
| `real_estate_offer.notes` | Notes / Addendums | Long Text | |
| `real_estate_offer.submitted_by` | Offer Submitted By | Text | Submitting agent / brokerage |
| `real_estate_offer.documents_ref` | Documents Ref | Text | Comma-separated Supabase UUIDs (§9.5) |

---

## 8. TRANSACTION (`custom_objects.transactions`)

**Deal-close record.** Created once fully contracted; consolidates financials, commission, and key dates. **One Transaction per deal** — source of truth for commission reporting and post-close automations.
**`transaction_id` convention:** `TXN-YYYYMMDD-NNN` (e.g. `TXN-20260707-001`).

### 8.1 Identification & type

| Field Key | Display Name | Type | Req | Options / Notes |
|---|---|---|---|---|
| `transactions.transaction_id` | Transaction ID | Text | ✓ | Primary display; searchable |
| `transactions.transaction_type` | Transaction Type | Single Select | — | `sale` · `purchase` · `lease` · `referral` |
| `transactions.status` | Transaction Status | Single Select | — | `under_contract` · `pending` · `closed` · `cancelled` · `failed` |
| `transactions.brokerages` | Brokerage(s) | Text | — | e.g. `9% Realty / RE/MAX` |
| `transactions.referral_source` | Referral Source | Text | — | If `transaction_type = referral` |

### 8.2 Financials

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `transactions.contract_price` | Contract / Sale Price | Currency | Final agreed price |
| `transactions.deposit_escrow` | Deposit / Escrow | Currency | Trust deposit held |
| `transactions.commission_amount` | Commission Amount | Currency | Total gross commission |
| `transactions.commission_rate` | Commission Rate (%) | Number | e.g. `5.0` |
| `transactions.commission_split_details` | Commission Split Details | Long Text | Buyer/seller agent breakdown |
| `transactions.profit_net` | Profit / Net | Currency | Agent net after splits/fees |

### 8.3 Key dates

| Field Key | Display Name | Type |
|---|---|---|
| `transactions.closing_date` | Closing Date | Date |
| `transactions.inspection_deadline` | Inspection Deadline | Date |
| `transactions.appraisal_date` | Appraisal Date | Date |
| `transactions.financing_deadline` | Financing Deadline | Date |
| `transactions.final_walkthrough` | Final Walkthrough Date | Date |

### 8.4 Notes & documents

| Field Key | Display Name | Type | Notes |
|---|---|---|---|
| `transactions.post_transaction_notes` | Post-Transaction Notes | Long Text | |
| `transactions.documents_ref` | Documents Ref | Text | Comma-separated Supabase UUIDs (§9.5) |

---

## 9. Field Standards & Conventions

### 9.1 Naming

| Convention | Rule | Example |
|---|---|---|
| Field key prefix | `{object_key}.{snake_case}`; custom objects require the **full** dotted prefix via API | `custom_objects.properties.mls` |
| Display names | Title Case in UI | `Listing Status` |
| Identifier fields | End in `_id` or canonical abbreviation | `offer_id`, `mls` |
| Date fields | Suffix `_date`, `_deadline`, `_anniversary`, `_expiry` | `conditions_deadline` |
| Monetary fields | Descriptive; no currency suffix (CAD assumed) | `profit_net` |
| Document refs | Always `documents_ref`; comma-separated UUIDs | `"uuid1,uuid2"` |

### 9.2 Status lifecycles (transitions occur via Workflow for audit integrity)

```
properties.property_status:   coming_soon → active → pending → sold | expired | withdrawn
my_listings.listing_status:   active → pending → sold | expired | withdrawn
real_estate_offer.status:     pending → accepted → closed
                                      → countered ⇄ pending (negotiation cycle)
                                      → rejected | expired
transactions.status:          under_contract → pending → closed | cancelled | failed
opportunity.status (system):  open → won | lost | abandoned
```

### 9.3 Value formats

- **Currency:** CAD; platform type `MONETORY` (spelling is by design). API accepts raw numbers: `500000`.
- **Dates:** ISO 8601 `YYYY-MM-DD`; timezone `America/Edmonton`.
- **Null vs zero:** leave null until known — never `0` or `1970-01-01` placeholders.
- **Single-select:** send option **keys** (snake_case), never labels — `"cmhc_insured"` not `"CMHC Insured"`. (Contact/Opportunity legacy picklists whose keys are Title Case per §2/§4 remain as documented; verify against live schema when writing.)

### 9.4 Tags

56 tags, kebab-case, namespaced by category (see Full Integration Schema Part 4 for the complete list). Core namespaces used by the app: `temperature:*` (`temperature:hot|warm|cold`), `type:*` (`type:agent|client|lead|past-client|referral-partner|soi|vendor`), `priority:*` for tasks, plus lifecycle and marketing tags.

### 9.5 Documents pattern

Objects with document links use `documents_ref` = comma-separated **Supabase Storage UUIDs** (Property MLS, Offer, Transaction). Contact-level documents use the native GHL Documents module via `contactId`. The app resolves UUID → signed URL through Supabase.

### 9.6 Pipelines (IDs resolved by name at bootstrap — never hard-coded)

| Pipeline | Stages | Purpose |
|---|---|---|
| Buyer Transaction | 10: Needs Analysis → Property Search → Offer Preparation → Offer Submitted → Under Contract → Inspection & Due Diligence → Conditions Removal → Financing Confirmation → Clear to Close → Closed | Full buyer lifecycle |
| Seller Transaction | 9: Pre-Listing → Listing Agreement Signed → Listing Prep → Active on Market → Showings & Open Houses → Offer Review → Under Contract → Conditions & Closing Prep → Closed | Full seller lifecycle |
| Lead Nurture Pipeline | 8: New Lead → Contacted → Engaged → Nurturing (Long-term) → Appointment Set → Appointment Completed → Proposal/Listing Presentation → Agreement Signed | Long-term cultivation |

Stage `win_probability` powers weighted forecast: `SUM(monetary_value × win_probability / 100)`.

### 9.7 Record ID conventions

| Object | Format | Example |
|---|---|---|
| Property (MLS) | MLS board format | `A2123456` |
| My Listing | Matches Property MLS `mls` | `A2123456` |
| Offer | `OFR-YYYYMMDD-NNN` | `OFR-20260701-001` |
| Transaction | `TXN-YYYYMMDD-NNN` | `TXN-20260707-001` |

### 9.8 Calendars (deal-stage aligned)

| Calendar | Deal Stage | Slot Config |
|---|---|---|
| Open House | Seller: Active on Market | 30-min slots, 2/day max |
| Final Walkthrough | Buyer: Clear to Close | 30-min slots, 3/day max |
| Key Exchange | Both: Closed | 30-min slots, no daily cap |

All three: personal type, 30-min buffers, auto-confirm, 2-way Google Calendar sync.

---

## Changelog

| Version | Date | Description |
|---|---|---|
| 2.0.0 | 2026-07-07 | Reconciled live-API schema with v1 project docs. Added: `contact.lead_temperature`, `contact.closing_anniversary`, `opportunity.expected_close_date`, `opportunity.loss_reason`, `opportunity.lead_quality_score`, `opportunity.follow_up_count`, `properties.latitude/longitude/tax_assessment/condo_fees/sold_date/listing_url/property_images/features_amenities/feature_highlights`, `real_estate_offer.offer_type/offer_date/commission_amount/commission_split/contingencies/terms_conditions/submitted_by/documents_ref`, `my_listings.open_house_date/listing_description/agent_name/brokerage`. Normalized custom-object enums to snake_case option keys. Deprecated §18/§20/§22 keys of `GHL_Integration_Mapping.md` — see `MIGRATION_MAP.md`. |
| 1.0.0 | — | Original field tables in `Real Estate Pro CRM — Full Integration Schema.md` Part 2. |
