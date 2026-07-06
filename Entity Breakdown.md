# Real Estate Pro CRM — Detailed Entity Breakdown (v3)
## Contacts · Leads · Clients · Opportunities · My Listings · Properties · Offers · Transactions

> **Sub-Account:** Real Estate Pro CRM - Dev | `locationId: jHEaG68TeCsXHXPhrVtU`  
> **v3 Updated:** 2026-07-02 — CRITICAL: Task object type confirmed (`key: task`), 7 SYSTEM_DEFINED task associations confirmed via `GET /associations/objectKey/task?includeInternalAssociations=true`. Previous v2 "UI panel only / not in API" characterization was incorrect.

---

## Table of Contents
1. [Contacts — Leads & Clients](#1-contacts--leads--clients)
2. [Opportunities](#2-opportunities)
3. [My Listings](#3-my-listings)
4. [Properties MLS](#4-properties-mls)
5. [Offers](#5-offers)
6. [Transactions](#6-transactions)
7. [System-Native Objects: Appointments, Tasks, Notes, Documents](#7-system-native-objects)
8. [Appendix A — Deal Lifecycle Flow](#appendix-a--deal-lifecycle-flow)

---

## 1. Contacts — Leads & Clients

### Overview
**Object Key:** `contact` | **Type:** `SYSTEM_DEFINED` | **ID:** `6a44a1e5581b923d9e657d3a`  
**Primary Display:** `contact.email` | **Required:** `contact.email`  
**Searchable:** `name`, `email`, `businessName`, `tags`, `phone`

**Description:** The Contact is the central hub. Every person — lead, active buyer/seller, past client, referral partner, SOI member, vendor, or agent — is stored as a Contact. Tasks, Notes, Appointments, Conversations, and Documents each carry a `contactId` foreign key (required for Notes/Appointments/Conversations/Documents; **optional** for Tasks as of v3).

---

### 1.1 Contact Types
| Type Value | Description | Typical Tags |
|---|---|---|
| `lead` | New prospect, not yet qualified | `type:lead`, `lifecycle:new-lead`, `temperature:hot/warm/cold` |
| `client` | Active buyer or seller | `type:client`, `lifecycle:active` |
| `past-client` | Previously closed | `type:past-client`, `lifecycle:past-client` |
| `referral-partner` | Refers business | `type:referral-partner` |
| `soi` | Sphere of Influence | `type:soi`, `lifecycle:soi-active` |
| `vendor` | Service provider | `type:vendor`, `lifecycle:vendor` |
| `agent` | Cooperating agent | `type:agent` |

---

### 1.2 Standard Fields
| Field Key | Name | Type | Notes |
|---|---|---|---|
| `contact.first_name` | First Name | STANDARD_FIELD | Required on create |
| `contact.last_name` | Last Name | STANDARD_FIELD | |
| `contact.email` | Email | STANDARD_FIELD | Required; dedup key |
| `contact.phone` | Phone | STANDARD_FIELD | Inbound SMS/call matching |
| `contact.company_name` | Business Name | STANDARD_FIELD | Denorm from Business |
| `contact.address1` | Street Address | STANDARD_FIELD | |
| `contact.city` | City | STANDARD_FIELD | |
| `contact.country` | Country | STANDARD_FIELD | |
| `contact.timezone` | Timezone | STANDARD_FIELD | e.g. `America/Edmonton` |
| `contact.type` | Contact Type | STANDARD_FIELD | See type table |
| `contact.tags` | Tags | STANDARD_FIELD | Array of strings |
| `contact.dnd` | Do Not Disturb | STANDARD_FIELD | Group field |
| `contact.assigned_to` | Assigned To | STANDARD_FIELD | User ID |
| `contact.source` | Lead Source | STANDARD_FIELD | Attribution |
| `contact.followers` | Followers | STANDARD_FIELD | Array of user IDs |

---

### 1.3 Custom Fields

#### Lead Info Group
| Field Key | Name | Type | Options |
|---|---|---|---|
| `contact.lead_source` | Lead Source | SINGLE_OPTIONS | Zillow · Realtor.com · Open House · Referral · SOI · Website · Social Media · Cold Outreach · Other |
| `contact.lead_temperature` | Lead Temperature | SINGLE_OPTIONS | Hot · Warm · Cold · Dead |
| `contact.buyer_seller_type` | Buyer/Seller Type | SINGLE_OPTIONS | Buyer · Seller · Both · Investor · Renter |
| `contact.lead_timeline` | Lead Timeline | SINGLE_OPTIONS | 0–1 month · 1–3 months · 3–6 months · 6–12 months · 12+ months |
| `contact.preapproval_status` | Pre-Approval Status | SINGLE_OPTIONS | Not Started · In Progress · Conditional Approval · Pre-Approved · Cash Buyer · N/A |
| `contact.property_type_preference` | Property Type Preference | MULTIPLE_OPTIONS | Single-family · Condo · Townhouse · Multi-family · Land · Commercial · Investment |

#### Buyer Preferences Group
| Field Key | Name | Type |
|---|---|---|
| `contact.temperature` | Temperature (Legacy) | TEXT |
| `contact.bed_min` | Bed Min | NUMERICAL |
| `contact.bath_min` | Bath Min | NUMERICAL |
| `contact.reason_for_selling` | Reason for Selling | LARGE_TEXT |

#### SOI / Relationship Group
| Field Key | Name | Type | Options |
|---|---|---|---|
| `contact.soi_relationship` | SOI Relationship | SINGLE_OPTIONS | Family · Friend · Colleague · Past Client · Neighbor · Community · Other |
| `contact.annual_touchpoint_goal` | Annual Touchpoint Goal | NUMERICAL | |
| `contact.referral_count` | Referral Count | NUMERICAL | |

#### Dates & Communication Group
| Field Key | Name | Type |
|---|---|---|
| `contact.last_interaction_date` | Last Interaction Date | DATE |
| `contact.closing_anniversary` | Closing Anniversary | DATE |
| `contact.preferred_communication` | Preferred Communication | SINGLE_OPTIONS: Call · Text · Email · WhatsApp |

#### Vendor Group
| Field Key | Name | Type | Options |
|---|---|---|---|
| `contact.vendor_priority` | Vendor Priority | SINGLE_OPTIONS | A (Preferred) · B (Alternate) · C (Backup) |
| `contact.vendor_service_type` | Vendor Service Type | SINGLE_OPTIONS | Lender · Inspector · Title Company · Stager · Photographer · Contractor · Appraiser · Attorney · Moving Company · Insurance Agent · Mortgage Specialist · Other |

#### Billing Address Group
| Field Key | Name | Type |
|---|---|---|
| `contact.std_billing_address_full_name` | Billing Full Name | TEXT |
| `contact.std_billing_address_phone` | Billing Phone | TEXT |
| `contact.std_billing_address_address1` | Billing Address | TEXT |

---

### 1.4 Associations

#### System-Defined (Associations API)
| Association ID | Key | Connects To | Cardinality | Limits |
|---|---|---|---|---|
| `OPPORTUNITIES_CONTACTS_ASSOCIATION` | OPPORTUNITIES_CONTACTS_ASSOCIATION | Opportunity | M:M | 25 opps/contact; 1000 contacts/opp |
| `BUSINESSES_CONTACTS_ASSOCIATION` | BUSINESSES_CONTACTS_ASSOCIATION | Business | 1:M | 1 business/contact; 10000 contacts/business |
| `TASK_CONTACT_ASSOCIATION` | TASK_CONTACT_ASSOCIATION | Task | M:M | 10 tasks/contact; 1000 contacts/task |

> **Note:** `TASK_CONTACT_ASSOCIATION` is a SYSTEM_DEFINED internal association. It is NOT returned by `GET /associations/`. Query it via `GET /associations/objectKey/contact?includeInternalAssociations=true`.

#### User-Defined (Associations API)
| Key | Contact Label | Object | Object Label | Cardinality |
|---|---|---|---|---|
| `contact` | Contact | Properties MLS | (Interested) | M:M |
| `property_seller` | Seller | Properties MLS | Listed Property | M:M |
| `offer_buyer` | Buyer | Offers | Real Estate Offer | M:M |
| `offer_seller` | Seller | Offers | Real Estate Offer | M:M |
| `offer_buyer_agent` | Buyer Agent | Offers | Real Estate Offer | M:M |
| `offer_seller_agent` | Seller Agent | Offers | Real Estate Offer | M:M |
| `my_listings_seller` | Seller | My Listings | Listing | M:M |
| `my_listings_buyer_lead` | Buyer Lead | My Listings | Listing | M:M |
| `transaction_buyer` | Buyer | Transactions | Transaction | M:M |
| `transaction_seller` | Seller | Transactions | Transaction | M:M |
| `transaction_listing_agent` | Listing Agent | Transactions | Transaction | M:M |
| `transaction_selling_agent` | Selling Agent | Transactions | Transaction | M:M |

#### Hard FK Links (contactId on activity objects)
| Object | Field | Required? | Notes |
|---|---|---|---|
| Note | `note.contactId` | Yes | Also has `relations[]` for multi-object linking |
| Appointment | `appointment.contactId` | Yes | |
| Conversation | `conversation.contactId` | Yes | 1 per channel type per contact |
| Document | `document.contactId` | Yes | |
| Task | `task.contactId` | **Optional** | Standalone tasks (no contactId) supported |

---

## 2. Opportunities

### Overview
**Object Key:** `opportunity` | **Type:** `SYSTEM_DEFINED` | **ID:** `6a44a1e5581b9214c0657d3b`  
**Primary Display:** `opportunity.name` | **Required:** `name`, `contact_id`, `pipeline_id`, `pipeline_stage_id`

---

### 2.1 Pipelines

#### Lead Nurture Pipeline — `Q4eAlyD0WM3BLcdZDq0k`
| Stage | Pos | Win% |
|---|---|---|
| New Lead | 0 | 11.11% |
| Contacted | 1 | 22.22% |
| Engaged | 2 | 33.33% |
| Nurturing (Long-term) | 3 | 44.44% |
| Appointment Set | 4 | 55.56% |
| Appointment Completed | 5 | 66.67% |
| Proposal / Listing Presentation | 6 | 77.78% |
| Agreement Signed | 7 | 88.89% |

#### Buyer Transaction Pipeline — `YuJxUg6wXotb8rjfdPnt`
| Stage | Pos | Win% |
|---|---|---|
| Needs Analysis | 0 | 9.09% |
| Property Search | 1 | 18.18% |
| Offer Preparation | 2 | 27.27% |
| Offer Submitted | 3 | 36.36% |
| Under Contract | 4 | 45.45% |
| Inspection & Due Diligence | 5 | 54.55% |
| Conditions Removal | 6 | 63.64% |
| Financing Confirmation | 7 | 72.73% |
| Clear to Close | 8 | 81.82% |
| Closed | 9 | 90.91% |

#### Seller Transaction Pipeline — `bNzCbECMSyZ1ZmSD0QnQ`
| Stage | Pos | Win% |
|---|---|---|
| Pre-Listing | 0 | 10% |
| Listing Agreement Signed | 1 | 20% |
| Listing Prep | 2 | 30% |
| Active on Market | 3 | 40% |
| Showings & Open Houses | 4 | 50% |
| Offer Review | 5 | 60% |
| Under Contract | 6 | 70% |
| Conditions & Closing Prep | 7 | 80% |
| Closed | 8 | 90% |

---

### 2.2 Standard Fields
| Field Key | Name | Type | Notes |
|---|---|---|---|
| `opportunity.name` | Name | STANDARD_FIELD | Required |
| `opportunity.pipeline_id` | Pipeline | STANDARD_FIELD | Required |
| `opportunity.pipeline_stage_id` | Stage | STANDARD_FIELD | Required |
| `opportunity.status` | Status | STANDARD_FIELD | open · won · lost · abandoned |
| `opportunity.monetary_value` | Lead Value | STANDARD_FIELD | Decimal |
| `opportunity.assigned_to` | Owner | STANDARD_FIELD | User ID |
| `opportunity.source` | Source | STANDARD_FIELD | |
| `opportunity.lost_reason` | Lost Reason | STANDARD_FIELD | System reason ID |
| `opportunity.contact_id` | Primary Contact | STANDARD_FIELD | Required FK |
| `opportunity.tags` | Tags | STANDARD_FIELD | Array |
| `opportunity.followers` | Followers | STANDARD_FIELD | Array of user IDs |

### 2.3 Custom Fields

#### Deal Details Group
| Field Key | Name | Type | Options |
|---|---|---|---|
| `opportunity.deal_type` | Deal Type | SINGLE_OPTIONS | Buyer Purchase · Seller Listing · Dual Agency · Referral Out |
| `opportunity.financing_type` | Financing Type | SINGLE_OPTIONS | Conventional · FHA · VA · Cash · CMHC Insured · Private Lending · Other |
| `opportunity.mls_number` | MLS Number | TEXT | |
| `opportunity.other_agent_name` | Other Agent Name | TEXT | |
| `opportunity.other_agent_brokerage` | Other Agent Brokerage | TEXT | |
| `opportunity.conditions_deadline` | Conditions Deadline | DATE | |
| `opportunity.closing_date` | Closing Date | DATE | |

#### Analytics Group
| Field Key | Name | Type | Options |
|---|---|---|---|
| `opportunity.loss_reason` | Loss Reason | SINGLE_OPTIONS | Chose Another Agent · Not Ready · Unresponsive · Budget · Relocated · Timing · Found Property Independently · Market Conditions · Other |
| `opportunity.lead_quality_score` | Lead Quality Score | NUMERICAL | |
| `opportunity.follow_up_count` | Follow Up Count | NUMERICAL | |
| `opportunity.expected_close_date` | Expected Close Date | DATE | |

---

### 2.4 Associations

#### Via Associations API (USER_DEFINED)
| Association Key / ID | Object | Cardinality |
|---|---|---|
| `OPPORTUNITIES_CONTACTS_ASSOCIATION` | Contact | M:M (25 contacts/opp) |
| `opportunity` / `6a44a1e75fd80c947876b5fd` | Properties MLS | 1:1 |
| `offers_opportunity` / `6a44a1e75fd80cf36776b5ff` | Offers | 1:M (1 opp per offer) |
| `my_listings_opportunity` / `6a44bdb8577443c36f858880` | My Listings | M:M |
| `transaction_opportunity` / `6a44bdbb7f183a57bd4d7b4a` | Transactions | M:M |

#### Via SYSTEM_DEFINED Internal Association
| Association ID | Object | Cardinality | Limit |
|---|---|---|---|
| `TASK_OPPORTUNITY_ASSOCIATION` | Task | M:M | 25 tasks/opp; 10 opps/task |

#### Related Objects (UI Panel — from confirmed data)
| Object | Mechanism |
|---|---|
| **Appointments** | Contact FK (`appointment.contactId`) — surfaces in opp view |
| **Notes** | Note `relations[]` array with `{objectKey: "opportunity", recordId: ...}` |
| **Tasks** | `TASK_OPPORTUNITY_ASSOCIATION` (SYSTEM_DEFINED internal, M:M, max 25/opp) |

---

## 3. My Listings (`custom_objects.my_listings`)

### Overview
**Object Key:** `custom_objects.my_listings` | **Type:** `USER_DEFINED` | **ID:** `6a44b1692c3079662fdd9736`  
**Primary Display:** `mls_number` | **Required:** `mls_number` | **Searchable:** `mls_number`

### 3.1 Custom Fields

#### Listing Info Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…mls_number` | MLS Number | TEXT | Required |
| `…listing_key` | Listing Key | TEXT | |
| `…listing_status` | Listing Status | SINGLE_OPTIONS | active · sold · expired · withdrawn · pending |
| `…listing_date` | Listing Date | DATE | |
| `…listing_price` | Listing Price | MONETORY | |
| `…days_on_market` | Days on Market | NUMERICAL | |
| `…realtor_url` | Realtor.ca URL | TEXT | |
| `…last_synced` | Last Synced | DATE | |
| `…notes` | Notes | LARGE_TEXT | |
| `…tags` | Tags | TEXT | |

#### Location Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…property_address` | Property Address | TEXT |
| `…city` | City | TEXT |
| `…province` | Province | TEXT |
| `…postal_code` | Postal Code | TEXT |

#### Property Details Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…property_type` | Property Type | SINGLE_OPTIONS | house · condo · townhouse · land · commercial |
| `…sub_type` | Sub-type | SINGLE_OPTIONS | detached · semi_detached · row_house · stacked · suite |
| `…bedrooms` | Bedrooms | NUMERICAL | |
| `…bathrooms` | Bathrooms | NUMERICAL | |
| `…square_footage` | Square Footage | NUMERICAL | |
| `…lot_size` | Lot Size | NUMERICAL | |
| `…year_built` | Year Built | NUMERICAL | |
| `…photos_url` | Photos URL | TEXT | |
| `…agent_name` | Agent Name | TEXT | |
| `…brokerage` | Brokerage | TEXT | |
| `…open_house_date` | Open House Date | DATE | |
| `…listing_description` | Listing Description | LARGE_TEXT | |

### 3.2 Associations

#### Via USER_DEFINED Associations API
| Key / ID | Object | Label | Cardinality |
|---|---|---|---|
| `my_listings_seller` | Contact | Seller | M:M |
| `my_listings_buyer_lead` | Contact | Buyer Lead | M:M |
| `my_listings_mls_property` | Properties MLS | MLS Property | M:M |
| `my_listings_offers` | Offers | Offer | M:M |
| `my_listings_transactions` | Transactions | Transaction | M:M |
| `my_listings_opportunity` | Opportunity | Opportunity | M:M |

#### Via SYSTEM_DEFINED Internal Association
| Association ID | Object | Cardinality | Limits |
|---|---|---|---|
| `TASK_CUSTOM_OBJECTS.MY_LISTINGS_ASSOCIATION` | Task | M:M | 10 tasks/listing; 1000 listings/task |

#### Via Note `relations[]` Array
| Object | Mechanism |
|---|---|
| Notes | Notes with `{objectKey: "custom_objects.my_listings", recordId: ...}` in `relations[]` appear in listing view |

---

## 4. Properties MLS (`custom_objects.properties`)

### Overview
**Object Key:** `custom_objects.properties` | **Type:** `USER_DEFINED` | **ID:** `6a44a1e75fd80c02ec76b5ef`  
**Primary Display:** `mls` | **Required:** `mls` | **Unique:** `mls` | **Searchable:** `mls`, `full_address`, `property_name`

### 4.1 Custom Fields

#### Listing Info Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…mls` | MLS# | TEXT | Required · Unique |
| `…property_name` | Property Name | TEXT | |
| `…property_status` | Status | SINGLE_OPTIONS | active · pending · sold · expired · withdrawn · coming_soon |
| `…listing_date` | Listing Date | DATE | |
| `…listing_expiry` | Listing Expiry | DATE | |
| `…list_price` | List Price | MONETORY | |
| `…sold_price` | Sold Price | MONETORY | |
| `…sold_date` | Sold Date | DATE | |
| `…days_on_market` | Days on Market | NUMERICAL | |
| `…listing_url` | Listing URL | TEXT | |
| `…property_notes` | Property Notes | LARGE_TEXT | |
| `…feature_highlights` | Feature Highlights | LARGE_TEXT | |
| `…documents_ref` | Documents Ref | TEXT | Comma-sep Supabase UUIDs |

#### Location Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…full_address` | Full Address | TEXT |
| `…city` | City | TEXT |
| `…province` | Province | TEXT |
| `…postal` | Postal Code | TEXT |
| `…latitude` | Latitude | NUMERICAL |
| `…longitude` | Longitude | NUMERICAL |

#### Property Details Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…property_type` | Property Type | SINGLE_OPTIONS | single_family · condo · townhouse · multifamily · land · commercial |
| `…sub_type` | Sub-type | SINGLE_OPTIONS | detached · semi_detached · row_house · stacked · suite · other |
| `…bedrooms` | Bedrooms | NUMERICAL | |
| `…bathrooms` | Bathrooms | NUMERICAL | |
| `…square_footage` | Square Footage | NUMERICAL | |
| `…lot_size` | Lot Size | NUMERICAL | |
| `…year_built` | Year Built | NUMERICAL | |
| `…garage` | Garage | SINGLE_OPTIONS | none · single/double/triple attached/detached |
| `…basement` | Basement | SINGLE_OPTIONS | none · unfinished · partially_finished · fully_finished |
| `…heating_type` | Heating Type | SINGLE_OPTIONS | forced_air · baseboard · radiant · boiler · geothermal |
| `…condo_fees` | HOA/Condo Fees | MONETORY | |
| `…tax_assessment` | Tax Assessment | MONETORY | |
| `…property_images` | Property Images | FILE_UPLOAD | |
| `…features_amenities` | Features / Amenities | LARGE_TEXT | |

### 4.2 Associations

#### Via USER_DEFINED Associations API
| Key / ID | Object | Cardinality |
|---|---|---|
| `contact` | Contact (Interested) | M:M |
| `property_seller` | Contact (Seller) | M:M |
| `offers_property` | Offers | M:1 (many offers; 1 property/offer) |
| `opportunity` | Opportunity | 1:1 |
| `transaction_property` | Transactions | M:M |
| `my_listings_mls_property` | My Listings | M:M |

#### Via SYSTEM_DEFINED Internal Association
| Association ID | Object | Cardinality | Limits |
|---|---|---|---|
| `TASK_CUSTOM_OBJECTS.PROPERTIES_ASSOCIATION` | Task | M:M | 10 tasks/property; 1000 properties/task |

#### Via Note `relations[]` Array
Notes with `{objectKey: "custom_objects.properties", recordId: ...}` appear in property view.

---

## 5. Offers (`custom_objects.real_estate_offer`)

### Overview
**Object Key:** `custom_objects.real_estate_offer` | **Type:** `USER_DEFINED` | **ID:** `6a44a1e75fd80c971d76b5f0`  
**Primary Display:** `offer_id` | **Required:** `offer_id` | **Searchable:** `offer_id`, `property_address`, `mls_number`

### 5.1 Custom Fields

#### Core Offer Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…offer_id` | Offer ID | TEXT | Required |
| `…offer_type` | Offer Type | SINGLE_OPTIONS | Buyer Offer (Sent) · Seller Offer (Received) · Counter-Offer |
| `…offer_date` | Offer Date | DATE | |
| `…expiry_date` | Offer Expiry | DATE | |
| `…status` | Offer Status | SINGLE_OPTIONS | pending · accepted · countered · rejected · closed · expired |
| `…property_address` | Property Address | TEXT | |
| `…mls_number` | MLS Number | TEXT | |
| `…submitted_by` | Submitted By | TEXT | |
| `…documents_ref` | Documents Ref | TEXT | Comma-sep Supabase UUIDs |

#### Financials Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…purchase_price` | Purchase Price | MONETORY |
| `…counter_price` | Counter Offer Price | MONETORY |
| `…deposit_amount` | Deposit Amount | MONETORY |
| `…additional_deposit` | Additional Deposit | MONETORY |
| `…commission_amount` | Commission Amount | MONETORY |
| `…commission_split` | Commission Split | TEXT |
| `…financing_type` | Financing Type | SINGLE_OPTIONS: conventional · cmhc_insured · cash · private · other |

#### Key Dates Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…closing_date` | Closing Date | DATE |
| `…possession_date` | Possession Date | DATE |
| `…conditions_deadline` | Conditions Deadline | DATE |

#### Legal & Terms Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…legal_description` | Legal Description | LARGE_TEXT |
| `…conditions` | Conditions | LARGE_TEXT |
| `…contingencies` | Contingencies | LARGE_TEXT |
| `…terms_conditions` | Terms & Conditions | LARGE_TEXT |
| `…included_chattels` | Included Chattels | LARGE_TEXT |
| `…excluded_fixtures` | Excluded Fixtures | LARGE_TEXT |
| `…notes` | Notes / Addendums | LARGE_TEXT |

### 5.2 Associations

#### Via USER_DEFINED Associations API
| Key / ID | Object | Cardinality |
|---|---|---|
| `offer_buyer` | Contact (Buyer) | M:M |
| `offer_seller` | Contact (Seller) | M:M |
| `offer_buyer_agent` | Contact (Buyer Agent) | M:M |
| `offer_seller_agent` | Contact (Seller Agent) | M:M |
| `offers_property` | Properties MLS | M:1 |
| `my_listings_offers` | My Listings | M:M |
| `offers_opportunity` | Opportunity | 1 per offer |
| `transaction_offer` | Transactions | M:M |

#### Via SYSTEM_DEFINED Internal Association
| Association ID | Object | Cardinality | Limits |
|---|---|---|---|
| `TASK_CUSTOM_OBJECTS.REAL_ESTATE_OFFER_ASSOCIATION` | Task | M:M | 10 tasks/offer; 1000 offers/task |

#### Via Note `relations[]` Array
Notes with `{objectKey: "custom_objects.real_estate_offer", recordId: ...}` appear in offer view.  
**Confirmed live:** Note `RvbtpxzbMGRuUuT2joAG` has this offer (`6a46af451e833951ef82d2af`) in its `relations[]`.

---

## 6. Transactions (`custom_objects.transactions`)

### Overview
**Object Key:** `custom_objects.transactions` | **Type:** `USER_DEFINED` | **ID:** `6a44b1696a2c18dc4bd8dd08`  
**Primary Display:** `transaction_id` | **Required:** `transaction_id` | **Searchable:** `transaction_id`

### 6.1 Custom Fields

#### Core Info Group
| Field Key (suffix) | Name | Type | Options |
|---|---|---|---|
| `…transaction_id` | Transaction ID | TEXT | Required |
| `…transaction_type` | Transaction Type | SINGLE_OPTIONS | sale · purchase · lease · referral |
| `…status` | Status | SINGLE_OPTIONS | under_contract · pending · closed · cancelled · failed |
| `…brokerages` | Brokerage(s) | TEXT | |
| `…commission_split_details` | Commission Split Details | LARGE_TEXT | |
| `…post_transaction_notes` | Post-Transaction Notes | LARGE_TEXT | |
| `…referral_source` | Referral Source | TEXT | |
| `…documents_ref` | Documents Ref | TEXT | Comma-sep UUIDs |

#### Financials Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…contract_price` | Contract / Sale Price | MONETORY |
| `…deposit_escrow` | Deposit / Escrow | MONETORY |
| `…commission_amount` | Commission Amount | MONETORY |
| `…commission_rate` | Commission Rate (%) | NUMERICAL |
| `…profit_net` | Profit / Net | MONETORY |

#### Key Dates Group
| Field Key (suffix) | Name | Type |
|---|---|---|
| `…closing_date` | Closing Date | DATE |
| `…inspection_deadline` | Inspection Deadline | DATE |
| `…appraisal_date` | Appraisal Date | DATE |
| `…financing_deadline` | Financing Deadline | DATE |
| `…final_walkthrough` | Final Walkthrough Date | DATE |

### 6.2 Associations

#### Via USER_DEFINED Associations API
| Key / ID | Object | Cardinality |
|---|---|---|
| `transaction_buyer` | Contact (Buyer) | M:M |
| `transaction_seller` | Contact (Seller) | M:M |
| `transaction_listing_agent` | Contact (Listing Agent) | M:M |
| `transaction_selling_agent` | Contact (Selling Agent) | M:M |
| `transaction_property` | Properties MLS | M:M |
| `my_listings_transactions` | My Listings | M:M |
| `transaction_offer` | Offers | M:M |
| `transaction_opportunity` | Opportunity | M:M |

#### Via SYSTEM_DEFINED Internal Association
| Association ID | Object | Cardinality | Limits |
|---|---|---|---|
| `TASK_CUSTOM_OBJECTS.TRANSACTIONS_ASSOCIATION` | Task | M:M | 10 tasks/transaction; 1000 transactions/task |

#### Via Note `relations[]` Array
Notes with `{objectKey: "custom_objects.transactions", recordId: ...}` appear in transaction view.

---

## 7. System-Native Objects

### 7.1 Appointments

**API Endpoint:** `/calendars/events/appointments` | **Object Key:** *(no object schema key)* | **Primary Key:** `id`

| Field | Type | Required | Notes |
|---|---|---|---|
| `calendarId` | string | Yes | |
| `locationId` | string | Yes | |
| `contactId` | string | Yes | Required FK |
| `title` | string | No | |
| `appointmentStatus` | enum | No | new · confirmed · showed · noshow · cancelled · invalid |
| `startTime` / `endTime` | ISO 8601 | Yes | |
| `selectedTimezone` | string | No | |
| `address` | string | No | |
| `notes` | string | No | |
| `assignedUserId` | string | No | |

**Associations:**
- Contact (via `contactId` FK — required)
- Calendar (via `calendarId` FK — required)
- Can have appointment-scoped Notes via `/calendars/events/appointments/{id}/notes`
- Surfaces in Opportunity view via linked Contact
- No Associations API participation (no object key in associations schema)

---

### 7.2 Tasks — Full Object Type

**Object Key:** `task` | **API Endpoint:** `/objects/task/records/search` (search), `/contacts/{contactId}/tasks` (legacy per-contact)  
**Primary Key:** `id`

> **⚠️ v3 CORRECTION — Tasks are a FULL OBJECT TYPE** with `key: "task"`, accessible via the Objects API at `POST /objects/task/records/search`. Task associations are SYSTEM_DEFINED entries in the Associations API, exposed via `GET /associations/objectKey/task?includeInternalAssociations=true`. They are NOT returned by the standard `GET /associations/` endpoint.

| Field | Type | Required | Notes |
|---|---|---|---|
| `contactId` | string | **Optional** | Standalone tasks (no contact) supported |
| `title` | string | Yes | |
| `body` | string | No | |
| `dueDate` | ISO 8601 | No | |
| `status` | enum | No | `to_do` · `completed` |
| `assignedTo` | string | No | CRM user ID |
| `businessId` | string | No | Business FK |

**Task Associations — 7 SYSTEM_DEFINED (confirmed from live network data):**

| Association ID | Object Key | Object | Task Label | Object Label | Cardinality | Task Max | Object Max |
|---|---|---|---|---|---|---|---|
| `TASK_CONTACT_ASSOCIATION` | `contact` | Contact | TASK_TO_CONTACT | CONTACT_TO_TASK | M:M | 10 | 1,000 |
| `TASK_OPPORTUNITY_ASSOCIATION` | `opportunity` | Opportunity | TASK_TO_OPPORTUNITY | OPPORTUNITY_TO_TASK | M:M | 10 | 25 |
| `TASK_BUSINESS_ASSOCIATION` | `business` | Company | TASK_TO_BUSINESS | BUSINESS_TO_TASK | M:M | 10 | 10,000 |
| `TASK_CUSTOM_OBJECTS.REAL_ESTATE_OFFER_ASSOCIATION` | `custom_objects.real_estate_offer` | Offer | TASK_TO_CUSTOM_OBJECTS.REAL_ESTATE_OFFER | CUSTOM_OBJECTS.REAL_ESTATE_OFFER_TO_TASK | M:M | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.PROPERTIES_ASSOCIATION` | `custom_objects.properties` | Properties MLS | TASK_TO_CUSTOM_OBJECTS.PROPERTIES | CUSTOM_OBJECTS.PROPERTIES_TO_TASK | M:M | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.MY_LISTINGS_ASSOCIATION` | `custom_objects.my_listings` | My Listings | TASK_TO_CUSTOM_OBJECTS.MY_LISTINGS | CUSTOM_OBJECTS.MY_LISTINGS_TO_TASK | M:M | 10 | 1,000 |
| `TASK_CUSTOM_OBJECTS.TRANSACTIONS_ASSOCIATION` | `custom_objects.transactions` | Transactions | TASK_TO_CUSTOM_OBJECTS.TRANSACTIONS | CUSTOM_OBJECTS.TRANSACTIONS_TO_TASK | M:M | 10 | 1,000 |

> The UI "0/10" display for each object type maps directly to `firstObjectToSecondObjectMaxLimit: 10` on each of these associations.

**API Endpoints for Tasks:**
```
# Modern Object API (full search, incl. standalone tasks)
POST /objects/task/records/search
{ "locationId": "...", "page": 1, "pageLimit": 20, "includeTopRelations": true }

# Legacy contact-scoped endpoints
GET  /contacts/{contactId}/tasks
POST /contacts/{contactId}/tasks
GET  /contacts/{contactId}/tasks/{taskId}
PUT  /contacts/{contactId}/tasks/{taskId}
DEL  /contacts/{contactId}/tasks/{taskId}

# Location-level search (all tasks incl. standalone)
POST /locations/{locationId}/tasks/search

# Associations schema for tasks
GET  /associations/objectKey/task?locationId={id}&includeInternalAssociations=true

# Fetch relations for a specific task
GET  /associations/relations/{taskId}?locationId={id}&skip=0&limit=100
```

---

### 7.3 Notes

**API Endpoints:**  
- Contact notes: `/contacts/{contactId}/notes`  
- Appointment notes: `/calendars/events/appointments/{id}/notes`  
**Primary Key:** `id`

| Field | Type | Required | Notes |
|---|---|---|---|
| `contactId` | string | Yes | Required parent anchor |
| `body` | string | Yes | HTML or plain text |
| `userId` | string | No | Author user ID |
| `title` | string | No | |
| `color` | string | No | Hex e.g. `#fef7c3` |
| `pinned` | boolean | No | |
| `relations` | array | No | **Direct multi-object links — confirmed live** |
| `attachments` | array | No | |

**The `relations[]` Array — Confirmed from live API:**
```json
{
  "id": "RvbtpxzbMGRuUuT2joAG",
  "contactId": "D2RJ1AcIqOHbbnTmsS2S",
  "relations": [
    { "objectKey": "contact",                          "recordId": "D2RJ1AcIqOHbbnTmsS2S" },
    { "objectKey": "opportunity",                      "recordId": "Ubqrcu63CqVuxGUFOh4X" },
    { "objectKey": "custom_objects.real_estate_offer", "recordId": "6a46af451e833951ef82d2af" },
    { "objectKey": "custom_objects.properties",        "recordId": "6a46aef1bd3802c746051fd8" },
    { "objectKey": "custom_objects.my_listings",       "recordId": "6a46aec7b91e5cfe535b4ba9" },
    { "objectKey": "custom_objects.transactions",      "recordId": "6a46af67da201e837a673d4e" }
  ]
}
```

**Supported `objectKey` values in `relations[]`:**

| objectKey | Object |
|---|---|
| `contact` | Contact |
| `opportunity` | Opportunity |
| `custom_objects.real_estate_offer` | Offer |
| `custom_objects.properties` | Properties MLS |
| `custom_objects.my_listings` | My Listings |
| `custom_objects.transactions` | Transactions |

**API Reference:**
```
POST /contacts/{contactId}/notes
{ "body": "...", "relations": [ {"objectKey": "opportunity", "recordId": "..."}, ... ] }

GET  /contacts/{contactId}/notes
GET  /contacts/{contactId}/notes/{noteId}
PUT  /contacts/{contactId}/notes/{noteId}
DEL  /contacts/{contactId}/notes/{noteId}

# Appointment-scoped notes
GET/POST/PUT/DEL /calendars/events/appointments/{id}/notes[/{noteId}]
```

---

### 7.4 Documents & Contracts

**API Endpoint:** `/proposals/documents` | **Primary Key:** `id`

| Field | Type | Notes |
|---|---|---|
| `contactId` | string | Required |
| `name` | string | |
| `type` | enum | `template` · `document` |
| `status` | enum | `draft` · `sent` · `viewed` · `accepted` · `declined` |
| `templateId` | string | Optional |

**Associations:**
- Contact (via `contactId` — required)
- Custom Objects (via `documents_ref` TEXT field: Offers, Properties MLS, Transactions)
- Opportunity (via workflow/automation only)

---

## Appendix A — Deal Lifecycle Flow

```
Lead → Contact (type: lead)
    │
    ▼
Opportunity ◄── Lead Nurture Pipeline
    │  Tasks linked via TASK_OPPORTUNITY_ASSOCIATION
    │  Notes linked via note.relations[]{objectKey: "opportunity"}
    │
    ▼ Agreement Signed → Transaction Pipeline
    │
    ├── BUYER:
    │   Opportunity ◄─ Property (1:1) ◄─ My Listing
    │              ◄─ Offer ──► Transaction
    │   Tasks on any object via SYSTEM_DEFINED task associations
    │   Notes on any object via note.relations[]
    │
    └── SELLER:
        My Listing ─► Property ─► Offer ─► Transaction ─► Opportunity
        Tasks on any object via SYSTEM_DEFINED task associations
        Notes on any object via note.relations[]
```

---

*v3 Updated 2026-07-02 — Task object type confirmed, 7 SYSTEM_DEFINED task associations documented from live network capture.*  
*locationId: `jHEaG68TeCsXHXPhrVtU`*