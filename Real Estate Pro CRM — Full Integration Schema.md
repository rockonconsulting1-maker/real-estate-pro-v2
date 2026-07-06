Auth: All API calls use a private integration token in the header: Authorization: Bearer pit-xxxxx
Base URL: https://services.leadconnectorhq.com
Location ID: jHEaG68TeCsXHXPhrVtU

PART 1 — OBJECT REGISTRY
#	Object	Key	Type	Primary Display	Object ID
1	Contact	contact	SYSTEM_DEFINED	contact.email	6a44a1e5581b923d9e657d3a
2	Opportunity	opportunity	SYSTEM_DEFINED	opportunity.name	6a44a1e5581b9214c0657d3b
3	Company (Business)	business	SYSTEM_DEFINED	business.name	6a44a1e5581b920951657d3c
4	Offers	custom_objects.real_estate_offer	USER_DEFINED	real_estate_offer.offer_id	6a44a1e75fd80c971d76b5f0
5	Properties (MLS)	custom_objects.properties	USER_DEFINED	properties.mls	6a44a1e75fd80c02ec76b5ef
6	My Listings	custom_objects.my_listings	USER_DEFINED	my_listings.mls_number	6a44b1692c3079662fdd9736
7	Transactions	custom_objects.transactions	USER_DEFINED	transactions.transaction_id	6a44b1696a2c18dc4bd8dd08
System-Native (not in object registry): Appointments, Notes, Tasks, Documents — covered in Part 5.

PART 2 — FIELD SCHEMAS
2.1 — CONTACT (contact)
Required: contact.email · Searchable: name, email, businessName, tags, phone

Standard Fields (STANDARD_FIELD — always present)
Field Key	Name	Type	Notes
contact.first_name	First Name	STANDARD_FIELD	Required on create
contact.last_name	Last Name	STANDARD_FIELD	
contact.email	Email	STANDARD_FIELD	Required
contact.phone	Phone	STANDARD_FIELD	
contact.company_name	Business Name	STANDARD_FIELD	
contact.address1	Street Address	STANDARD_FIELD	
contact.city	City	STANDARD_FIELD	
contact.country	Country	STANDARD_FIELD	
contact.timezone	Timezone	STANDARD_FIELD	
contact.type	Contact Type	STANDARD_FIELD	
contact.tags	Tags	STANDARD_FIELD	Array of tag strings
contact.dnd	Do Not Disturb	STANDARD_FIELD	Group field
Custom Fields — Lead Info Group
Field Key	Name	Type	Options
contact.lead_source	Lead Source	SINGLE_OPTIONS	Zillow · Realtor.com · Open House · Referral · SOI · Website · Social Media · Cold Outreach · Other
contact.lead_temperature	Lead Temperature	SINGLE_OPTIONS	Hot · Warm · Cold · Dead
contact.buyer_seller_type	Buyer Seller Type	SINGLE_OPTIONS	Buyer · Seller · Both · Investor · Renter
contact.lead_timeline	Lead Timeline	SINGLE_OPTIONS	0-1 month · 1-3 months · 3-6 months · 6-12 months · 12+ months
contact.preapproval_status	Pre-Approval Status	SINGLE_OPTIONS	Not Started · In Progress · Conditional Approval · Pre-Approved · Cash Buyer · N/A
contact.property_type_preference	Property Type Preference	MULTIPLE_OPTIONS	Single-family · Condo · Townhouse · Multi-family · Land · Commercial · Investment
Custom Fields — Buyer Preferences Group
Field Key	Name	Type	Notes
contact.temperature	Temperature	TEXT	Legacy text field
contact.bed_min	Bed Min	NUMERICAL	Min bedrooms required
contact.bath_min	Bath Min	NUMERICAL	Min bathrooms required
contact.reason_for_selling	Reason for Selling	LARGE_TEXT	Why selling their property
Custom Fields — SOI / Relationship Group
Field Key	Name	Type	Options
contact.soi_relationship	SOI Relationship	SINGLE_OPTIONS	Family · Friend · Colleague · Past Client · Neighbor · Community · Other
contact.annual_touchpoint_goal	Annual Touchpoint Goal	NUMERICAL	
contact.referral_count	Referral Count	NUMERICAL	
Custom Fields — Dates & Communication Group
Field Key	Name	Type	Notes
contact.last_interaction_date	Last Interaction Date	DATE	
contact.closing_anniversary	Closing Anniversary	DATE	
contact.preferred_communication	Preferred Communication	SINGLE_OPTIONS	Call · Text · Email · WhatsApp
Custom Fields — Vendor Group
Field Key	Name	Type	Options
contact.vendor_priority	Vendor Priority	SINGLE_OPTIONS	A (Preferred) · B (Alternate) · C (Backup)
contact.vendor_service_type	Vendor Service Type	SINGLE_OPTIONS	Lender · Inspector · Title Company · Stager · Photographer · Contractor · Appraiser · Attorney · Moving Company · Insurance Agent · Mortgage Specialist · Other
Custom Fields — Billing Address Group
Field Key	Name	Type
contact.std_billing_address_full_name	Billing Address - Full Name	TEXT
contact.std_billing_address_phone	Billing Address - Phone Number	TEXT
contact.std_billing_address_address1	Billing Address - Full Address	TEXT
2.2 — OPPORTUNITY (opportunity)
Required: opportunity.name · Required on create: contact_id, name, pipeline_id, pipeline_stage_id

Standard Fields
Field Key	Name	Type	Notes
opportunity.name	Opportunity Name	STANDARD_FIELD	Required
opportunity.pipeline_id	Pipeline	STANDARD_FIELD	Required
opportunity.pipeline_stage_id	Stage	STANDARD_FIELD	Required
opportunity.status	Status	STANDARD_FIELD	open · won · lost · abandoned
opportunity.monetary_value	Lead Value	STANDARD_FIELD	Decimal number
opportunity.assigned_to	Opportunity Owner	STANDARD_FIELD	User ID
opportunity.source	Opportunity Source	STANDARD_FIELD	
opportunity.lost_reason	Lost Reason (system)	STANDARD_FIELD	
opportunity.contact_id	Contact (linked)	STANDARD_FIELD	Primary contact
opportunity.tags	Tags	STANDARD_FIELD	Array
opportunity.followers	Followers	STANDARD_FIELD	Array of user IDs
Custom Fields — Deal Details Group
Field Key	Name	Type	Options
opportunity.deal_type	Deal Type	SINGLE_OPTIONS	Buyer Purchase · Seller Listing · Dual Agency · Referral Out
opportunity.financing_type	Financing Type	SINGLE_OPTIONS	Conventional · FHA · VA · Cash · CMHC Insured · Private Lending · Other
opportunity.mls_number	MLS Number	TEXT	
opportunity.other_agent_name	Other Agent Name	TEXT	
opportunity.other_agent_brokerage	Other Agent Brokerage	TEXT	
opportunity.conditions_deadline	Conditions Deadline	DATE	
opportunity.closing_date	Closing Date	DATE	
Custom Fields — Analytics Group
Field Key	Name	Type	Options
opportunity.loss_reason	Loss Reason	SINGLE_OPTIONS	Chose Another Agent · Not Ready · Unresponsive · Budget · Relocated · Timing · Found Property Independently · Market Conditions · Other
opportunity.lead_quality_score	Lead Quality Score	NUMERICAL	
opportunity.follow_up_count	Follow Up Count	NUMERICAL	
opportunity.expected_close_date	Expected Close Date	DATE	
2.3 — COMPANY / BUSINESS (business)
Required: business.name · Searchable: name, email

All fields are standard (no user-defined custom fields exist on this object):

Field Key	Name	Type
business.name	Company Name	TEXT
business.phone	Phone	PHONE
business.email	Email	EMAIL
business.website	Website	TEXT
business.address	Address	TEXT
business.city	City	TEXT
business.state	State / Province	TEXT
business.postalcode	Postal Code	TEXT
business.country	Country	SINGLE_OPTIONS (world countries)
business.description	Description	LARGE_TEXT
2.4 — OFFERS (custom_objects.real_estate_offer)
Required: offer_id · Searchable: offer_id, property_address, mls_number
Object ID: 6a44a1e75fd80c971d76b5f0

Field Key	Name	Type	Options / Notes
…offer_id	Offer ID	TEXT	Required · Primary display
…property_address	Property Address	TEXT	
…mls_number	MLS Number	TEXT	
…offer_type	Offer Type	SINGLE_OPTIONS	buyer_offer · seller_offer · counter_offer
…offer_date	Offer Date	DATE	
…expiry_date	Offer Expiry	DATE	
…status	Offer Status	SINGLE_OPTIONS	pending · accepted · countered · rejected · closed · expired
…purchase_price	Purchase Price	MONETORY	
…counter_price	Counter Offer Price	MONETORY	
…deposit_amount	Deposit Amount	MONETORY	
…additional_deposit	Additional Deposit	MONETORY	
…commission_amount	Commission Amount	MONETORY	
…commission_split	Commission Split	TEXT	
…financing_type	Financing Type	SINGLE_OPTIONS	conventional · cmhc_insured · cash · private · other
…closing_date	Closing Date	DATE	
…possession_date	Possession Date	DATE	
…conditions_deadline	Conditions Deadline	DATE	
…legal_description	Legal Description	LARGE_TEXT	
…conditions	Conditions	LARGE_TEXT	
…contingencies	Contingencies	LARGE_TEXT	
…terms_conditions	Terms & Conditions	LARGE_TEXT	
…included_chattels	Included Chattels	LARGE_TEXT	
…excluded_fixtures	Excluded Fixtures	LARGE_TEXT	
…notes	Notes / Addendums	LARGE_TEXT	
…submitted_by	Offer Submitted By	TEXT	
…documents_ref	Documents Ref	TEXT	Comma-sep Supabase UUIDs
2.5 — PROPERTIES MLS (custom_objects.properties)
Required: properties.mls · Unique: properties.mls
Searchable: mls, full_address, property_name · Object ID: 6a44a1e75fd80c02ec76b5ef

Listing Info Group
Field Key	Name	Type	Options / Notes
…mls	MLS#	TEXT	Required · Unique
…property_name	Property Name	TEXT	
…property_status	Property Status	SINGLE_OPTIONS	active · pending · sold · expired · withdrawn · coming_soon
…listing_date	Listing Date	DATE	
…listing_expiry	Listing Expiry	DATE	
…list_price	List Price	MONETORY	
…sold_price	Sold Price	MONETORY	
…sold_date	Sold Date	DATE	
…days_on_market	Days on Market	NUMERICAL	
…listing_url	Listing URL	TEXT	
…property_notes	Property Notes	LARGE_TEXT	
…feature_highlights	Feature Highlights	LARGE_TEXT	
…documents_ref	Documents Ref	TEXT	Comma-sep Supabase UUIDs
Location Group
Field Key	Name	Type
…full_address	Full Address	TEXT
…city	City	TEXT
…province	Province	TEXT
…postal	Postal Code	TEXT
…latitude	Latitude	NUMERICAL
…longitude	Longitude	NUMERICAL
Property Details Group
Field Key	Name	Type	Options
…property_type	Property Type	SINGLE_OPTIONS	single_family · condo · townhouse · multifamily · land · commercial
…sub_type	Property Sub-type	SINGLE_OPTIONS	detached · semi_detached · row_house · stacked · suite · other
…bedrooms	Bedrooms	NUMERICAL	
…bathrooms	Bathrooms	NUMERICAL	
…square_footage	Square Footage	NUMERICAL	
…lot_size	Lot Size	NUMERICAL	
…year_built	Year Built	NUMERICAL	
…garage	Garage	SINGLE_OPTIONS	none · single_attached · double_attached · triple_attached · single_detached · double_detached
…basement	Basement	SINGLE_OPTIONS	none · unfinished · partially_finished · fully_finished
…heating_type	Heating Type	SINGLE_OPTIONS	forced_air · baseboard · radiant · boiler · geothermal
…condo_fees	HOA/Condo Fees	MONETORY	
…tax_assessment	Tax Assessment	MONETORY	
…property_images	Property Images	FILE_UPLOAD	
…features_amenities	Features / Amenities	LARGE_TEXT	
2.6 — MY LISTINGS (custom_objects.my_listings)
Required: my_listings.mls_number · Object ID: 6a44b1692c3079662fdd9736
Agent's personal active listings synced from Realtor.ca

Listing Info Group
Field Key	Name	Type	Options
…mls_number	MLS Number	TEXT	Required · Primary display
…listing_key	Listing Key	TEXT	
…listing_status	Listing Status	SINGLE_OPTIONS	active · sold · expired · withdrawn · pending
…listing_date	Listing Date	DATE	
…listing_price	Listing Price	MONETORY	
…days_on_market	Days on Market	NUMERICAL	
…realtor_url	Realtor.ca URL	TEXT	
…last_synced	Last Synced	DATE	
…notes	Notes	LARGE_TEXT	
…tags	Tags	TEXT	
Location Group
Field Key	Name	Type
…property_address	Property Address	TEXT
…city	City	TEXT
…province	Province	TEXT
…postal_code	Postal Code	TEXT
Property Details Group
Field Key	Name	Type	Options
…property_type	Property Type	SINGLE_OPTIONS	house · condo · townhouse · land · commercial
…sub_type	Sub-type	SINGLE_OPTIONS	detached · semi_detached · row_house · stacked · suite
…bedrooms	Bedrooms	NUMERICAL	
…bathrooms	Bathrooms	NUMERICAL	
…square_footage	Square Footage	NUMERICAL	
…lot_size	Lot Size	NUMERICAL	
…year_built	Year Built	NUMERICAL	
…photos_url	Photos URL	TEXT	
…agent_name	Agent Name	TEXT	
…brokerage	Brokerage	TEXT	
…open_house_date	Open House Date	DATE	
…listing_description	Listing Description	LARGE_TEXT	
2.7 — TRANSACTIONS (custom_objects.transactions)
Required: transactions.transaction_id · Object ID: 6a44b1696a2c18dc4bd8dd08

Core Info Group
Field Key	Name	Type	Options
…transaction_id	Transaction ID	TEXT	Required · Primary display
…transaction_type	Transaction Type	SINGLE_OPTIONS	sale · purchase · lease · referral
…status	Transaction Status	SINGLE_OPTIONS	under_contract · pending · closed · cancelled · failed
…brokerages	Brokerage(s)	TEXT	
…commission_split_details	Commission Split Details	LARGE_TEXT	
…post_transaction_notes	Post-Transaction Notes	LARGE_TEXT	
…referral_source	Referral Source	TEXT	
…documents_ref	Documents Ref	TEXT	Comma-sep doc UUIDs
Financials Group
Field Key	Name	Type
…contract_price	Contract / Sale Price	MONETORY
…deposit_escrow	Deposit / Escrow	MONETORY
…commission_amount	Commission Amount	MONETORY
…commission_rate	Commission Rate (%)	NUMERICAL
…profit_net	Profit / Net	MONETORY
Key Dates Group
Field Key	Name	Type
…closing_date	Closing Date	DATE
…inspection_deadline	Inspection Deadline	DATE
…appraisal_date	Appraisal Date	DATE
…financing_deadline	Financing Deadline	DATE
…final_walkthrough	Final Walkthrough Date	DATE
PART 3 — ASSOCIATIONS & RELATIONS
24 associations total (22 USER_DEFINED + 2 SYSTEM_DEFINED)
All are MANY_TO_MANY unless noted. Max limit per side: 1000 unless noted.
API to create a relation: POST /associations/relations with associationId + both record IDs.

3.1 — Contact → Custom Object Associations
Association Key	First Object Label	Object A	Cardinality	Object B	Second Object Label
contact	Contact	contact	M:M	custom_objects.properties	(interested)
property_seller	Seller	contact	M:M	custom_objects.properties	Listed Property
offer_buyer	Buyer	contact	M:M	custom_objects.real_estate_offer	Real Estate Offer
offer_seller	Seller	contact	M:M	custom_objects.real_estate_offer	Real Estate Offer
offer_buyer_agent	Buyer Agent	contact	M:M	custom_objects.real_estate_offer	Real Estate Offer
offer_seller_agent	Seller Agent	contact	M:M	custom_objects.real_estate_offer	Real Estate Offer
my_listings_seller	Seller	contact	M:M	custom_objects.my_listings	Listing
my_listings_buyer_lead	Buyer Lead	contact	M:M	custom_objects.my_listings	Listing
transaction_buyer	Buyer	contact	M:M	custom_objects.transactions	Transaction
transaction_seller	Seller	contact	M:M	custom_objects.transactions	Transaction
transaction_listing_agent	Listing Agent	contact	M:M	custom_objects.transactions	Transaction
transaction_selling_agent	Selling Agent	contact	M:M	custom_objects.transactions	Transaction
3.2 — Cross-Custom-Object Associations
Association Key	Object A	Cardinality	Object B	Notes
my_listings_mls_property	custom_objects.my_listings	M:M	custom_objects.properties	Listing → MLS comp
my_listings_offers	custom_objects.my_listings	M:M	custom_objects.real_estate_offer	Listing → Offers
my_listings_transactions	custom_objects.my_listings	M:M	custom_objects.transactions	Listing → TX
my_listings_opportunity	custom_objects.my_listings	M:M	opportunity	Listing → Deal
opportunity	custom_objects.properties	1:1	opportunity	Property → Opp (max 1 each)
offers_property	custom_objects.properties	M:1	custom_objects.real_estate_offer	Many offers per property
transaction_property	custom_objects.properties	M:M	custom_objects.transactions	
offers_opportunity	custom_objects.real_estate_offer	1:M	opportunity	1 opp per offer
transaction_offer	custom_objects.real_estate_offer	M:M	custom_objects.transactions	Accepted offer → TX
transaction_opportunity	custom_objects.transactions	M:M	opportunity	TX → Deal
3.3 — System-Defined Associations
Association Key	Object A	Cardinality	Object B	Max
OPPORTUNITIES_CONTACTS_ASSOCIATION	opportunity	M:M	contact	25 contacts per opp / 1000 opps per contact
BUSINESSES_CONTACTS_ASSOCIATION	business	1:M	contact	1 business per contact / 10000 contacts per business
PART 4 — TAGS & CUSTOM VALUES
4.1 — Tags (56 total — kebab-case namespaced)
Category	Tag Names	Count
General	buyer · client · contact · lead · warm lead · first-time · high priority · investor · follow-up	9
condition:	condition:financing · condition:inspection · condition:sale-of-property	3
data:	data:missing-source · data:missing-type · data:no-contact-info · data:possible-duplicate	4
lifecycle:	lifecycle:active · lifecycle:closed · lifecycle:lost · lifecycle:new-lead · lifecycle:past-client · lifecycle:referral-partner · lifecycle:soi-active · lifecycle:vendor	8
lost-reason:	lost-reason:budget · lost-reason:chose-another-agent · lost-reason:not-ready · lost-reason:relocated · lost-reason:unresponsive	5
needs:	needs:documents · needs:follow-up	2
pipeline:	pipeline:lead-nurture · pipeline:transaction	2
priority:	priority:high · priority:medium · priority:low	3
source:	source:cold-call · source:door-knock · source:openhouse · source:realtor.com · source:referral · source:social-media · source:website · source:zillow	8
status:	status:no-show · status:stale · status:touchpoint-pending	3
temperature:	temperature:cold · temperature:warm · temperature:hot	3
type:	type:agent · type:client · type:lead · type:past-client · type:referral-partner · type:soi · type:vendor	7
API: Tags are applied to Contacts and Opportunities as arrays of strings in the tags field.
List tags: GET /locations/{locationId}/tags
Create tag: POST /locations/{locationId}/tags { "name": "tag-name" }

4.2 — Custom Values
Name	Template Variable	Value Set?
Brokerage Name	{{ custom_values.brokerage_name }}	—
Google Review Link	{{ custom_values.google_review_link }}	—
App Webhook URL	{{ custom_values.app_webhook_url }}	—
Location id	{{ custom_values.location_id }}	—
brevo	{{ custom_values.brevo }}	—
Test API	{{ custom_values.test_api }}	✅ pit-c77f...
Broad Access Token	{{ custom_values.broad_access_calendars_contacts_conversations_funnels_emails_opportunities_locations__more }}	✅ pit-b339...
Users & Business Token	{{ custom_values.users__business }}	✅ pit-56e6...
PART 5 — SYSTEM-NATIVE OBJECTS
These are not in the Object Registry but are fully available via the API and can be associated to records.

5.1 — APPOINTMENTS
Endpoint base: /calendars/events
Primary key: id

Field	Type	Notes
id	string	System-generated UUID
calendarId	string	Required — which calendar
locationId	string	Required
contactId	string	Linked contact ID
title	string	Appointment title
appointmentStatus	enum	new · confirmed · showed · noshow · cancelled · invalid
startTime	ISO 8601	Required — e.g. 2026-07-10T10:00:00-06:00
endTime	ISO 8601	Required
selectedTimezone	string	e.g. America/Edmonton
address	string	Location/address
notes	string	Free-text notes
assignedUserId	string	Assigned CRM user
calendarEventId	string	Google Calendar event ID (if synced)
groupId	string	Calendar group
Associations:

Linked to Contact via contactId (required)
Linked to Opportunity at the pipeline-stage level (via calendar booking workflows)
Contacts have an appointments array returned in the contact detail view
5.2 — NOTES
Endpoint base: /contacts/{contactId}/notes
Primary key: id

Field	Type	Notes
id	string	System-generated UUID
body	string	Required — note content (HTML or plain text)
contactId	string	Required — parent contact
userId	string	Created by user ID
dateAdded	ISO 8601	Auto-set
dateUpdated	ISO 8601	Auto-set
Associations:

Notes are always scoped to a Contact (contactId required)
Notes can be viewed in the Opportunity timeline when that opportunity is linked to the same contact
Notes are not directly linkable to custom objects, Appointments, or other Notes — they surface contextually through the Contact record
5.3 — TASKS
Endpoint base: /contacts/{contactId}/tasks
Primary key: id

Field	Type	Notes
id	string	System-generated UUID
title	string	Required — task name
body	string	Description / details
dueDate	ISO 8601	Due date/time
status	enum	incompleted · completed
assignedTo	string	CRM user ID
contactId	string	Required — parent contact
dateAdded	ISO 8601	Auto-set
dateUpdated	ISO 8601	Auto-set
Associations:

Tasks are always scoped to a Contact (contactId required)
Tasks surface in Opportunity views for contacts linked to that opportunity
Tasks are not directly linkable to custom objects — associate via the shared Contact
5.4 — DOCUMENTS & CONTRACTS
Endpoint base: /documents (Proposals module)
Primary key: id

Field	Type	Notes
id	string	System UUID
name	string	Document name
type	enum	template · document
status	enum	draft · sent · viewed · accepted · declined
contactId	string	Linked contact
createdAt	ISO 8601	
updatedAt	ISO 8601	
Note on custom object documents_ref fields: The Offers, Properties, and Transactions objects each contain a documents_ref TEXT field designed to store comma-separated Supabase Storage UUIDs. This is your bridge to attach external documents to those records — the CRM Documents module links to Contacts, while your Supabase storage UUIDs link to custom objects.

Associations:

Documents link to Contact via contactId
Link to Opportunities via workflow/automation
For custom objects (Offers, Properties, Transactions): use documents_ref field (Supabase UUIDs)
PART 6 — ASSOCIATION GRAPH (Entity Relationship Summary)
CONTACT ──────────────────────────────────────────────────────────┐
  │ SYSTEM: OPPORTUNITIES_CONTACTS_ASSOCIATION (M:M, 25 max)       │
  ├──► OPPORTUNITY ◄──────────────────────────────────────────────┤
  │      │ my_listings_opportunity (M:M)                           │
  │      ├──◄ MY LISTINGS ──────────────────────────────────────── │
  │      │      │ my_listings_mls_property (M:M)                   │
  │      │      ├──► PROPERTIES (MLS)                              │
  │      │      │      │ opportunity (1:1)──────────────────────── │
  │      │      │      │ offers_property (M:1)                     │
  │      │      │      ├──◄ OFFERS ──────────────────────────────── │
  │      │      │      │      │ offers_opportunity (1:M)           │
  │      │      │      │      │ transaction_offer (M:M)            │
  │      │      │      │      └──► TRANSACTIONS                    │
  │      │      │      └── transaction_property (M:M)──► TRANSACTIONS
  │      │      ├── my_listings_offers (M:M)──────────► OFFERS     │
  │      │      └── my_listings_transactions (M:M)──► TRANSACTIONS │
  │      └── transaction_opportunity (M:M)──────────► TRANSACTIONS │
  │                                                                  │
  │ SYSTEM: BUSINESSES_CONTACTS_ASSOCIATION (1:M)                  │
  ├──► BUSINESS (COMPANY)                                          │
  │                                                                  │
  │ offer_buyer / offer_seller / offer_buyer_agent / offer_seller_agent
  ├──► OFFERS                                                       │
  │                                                                  │
  │ property_seller / contact (interested)                          │
  ├──► PROPERTIES (MLS)                                             │
  │                                                                  │
  │ my_listings_seller / my_listings_buyer_lead                     │
  ├──► MY LISTINGS                                                  │
  │                                                                  │
  │ transaction_buyer / transaction_seller                           │
  │ transaction_listing_agent / transaction_selling_agent           │
  └──► TRANSACTIONS                                                 │
                                                                     │
APPOINTMENTS ──── contactId ──────────────────────────────────────┘
NOTES        ──── contactId ──────────────────────────────────────┘
TASKS        ──── contactId ──────────────────────────────────────┘
DOCUMENTS    ──── contactId ──────────────────────────────────────┘
PART 7 — API QUICK REFERENCE FOR INTEGRATION
Objects & Records
Operation	Endpoint
List all objects	GET /objects/?locationId={id}
Get object schema + fields	GET /objects/{key}?locationId={id}&fetchProperties=true
Create custom object record	POST /objects/{key}/records
Get record by ID	GET /objects/{key}/records/{recordId}?locationId={id}
Update record	PUT /objects/{key}/records/{recordId}
Delete record	DELETE /objects/{key}/records/{recordId}
Search records	POST /objects/{key}/records/search
Contacts
Operation	Endpoint
Create contact	POST /contacts/
Get contact	GET /contacts/{contactId}
Update contact	PUT /contacts/{contactId}
Search contacts	POST /contacts/search
Get contact tasks	GET /contacts/{contactId}/tasks
Get contact notes	GET /contacts/{contactId}/notes
Get contact appointments	GET /contacts/{contactId}/appointments
Add/remove tags	POST /contacts/{contactId}/tags / DELETE /contacts/{contactId}/tags
Opportunities
Operation	Endpoint
Create opportunity	POST /opportunities/
Get opportunity	GET /opportunities/{opportunityId}
Update opportunity	PUT /opportunities/{opportunityId}
Search opportunities	GET /opportunities/search?location_id={id}
Associations / Relations
Operation	Endpoint
List all associations	GET /associations/?locationId={id}&skip=0&limit=100
Get association by key pair	GET /associations/by-object-keys?firstObjectKey=contact&secondObjectKey=custom_objects.transactions&locationId={id}
Create a relation (link 2 records)	POST /associations/relations { associationId, firstRecordId, secondRecordId }
Delete a relation	DELETE /associations/relations/{relationId}
Get all relations for a record	GET /associations/relations?recordId={id}&objectKey={key}&locationId={id}
Tags & Custom Values
Operation	Endpoint
List tags	GET /locations/{locationId}/tags
Create tag	POST /locations/{locationId}/tags
List custom values	GET /locations/{locationId}/customValues
Appointments
Operation	Endpoint
Create appointment	POST /calendars/events/appointments
Get appointment	GET /calendars/events/{eventId}
Update appointment	PUT /calendars/events/{eventId}
Delete appointment	DELETE /calendars/events/{eventId}
Notes & Tasks
Operation	Endpoint
Create note	POST /contacts/{contactId}/notes { body }
Update note	PUT /contacts/{contactId}/notes/{noteId}
Delete note	DELETE /contacts/{contactId}/notes/{noteId}
Create task	POST /contacts/{contactId}/tasks { title, dueDate, status }
Update task	PUT /contacts/{contactId}/tasks/{taskId}
Delete task	DELETE /contacts/{contactId}/tasks/{taskId}
