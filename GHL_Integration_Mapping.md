# Real Estate Pro CRM — GoHighLevel (GHL) Integration Mapping

This document provides a comprehensive mapping of every screen, UI component, and action in the Real Estate Pro CRM (Desktop & Mobile) to the GoHighLevel (GHL) API and Database Schema.

---

## 1. Global Navigation & Layout
**Goal:** Authenticate the user and provide access to core CRM modules.

### Desktop Shell & Mobile TabBar
```json
{
  "Module": "Global Navigation",
  "GHL_Authentication": {
    "Method": "OAuth 2.0 / Private Integration Token (PIT)",
    "Scopes": [
      "contacts.readonly", "contacts.write",
      "opportunities.readonly", "opportunities.write",
      "objects.readonly", "objects.write",
      "conversations.readonly", "conversations.write",
      "calendars.readonly", "calendars.write"
    ]
  },
  "Mappings": [
    { "Label": "Dashboard", "Route": "dash", "GHL_Scope": "location.readonly" },
    { "Label": "Leads", "Route": "leads", "GHL_Pipeline": "Lead Nurture Pipeline" },
    { "Label": "Clients", "Route": "clients", "GHL_Pipeline": ["Buyer Pipeline", "Seller Pipeline"] },
    { "Label": "Contacts", "Route": "contacts", "GHL_Object": "contact" },
    { "Label": "My Listings", "Route": "myListings", "GHL_CustomObject": "custom_objects.my_listings" },
    { "Label": "Offers", "Route": "offers", "GHL_CustomObject": "custom_objects.real_estate_offer" },
    { "Label": "MLS Properties", "Route": "mlsProps", "GHL_CustomObject": "custom_objects.properties" },
    { "Label": "Calendar", "Route": "calendar", "GHL_Endpoint": "GET /calendars/events" },
    { "Label": "Conversations", "Route": "conversations", "GHL_Endpoint": "GET /conversations" }
  ]
}
```

---

## 2. Dashboard
**Goal:** Immediate business visibility and actionable tasks.

```json
{
  "Screen": "Dashboard",
  "Desktop_Components": {
    "Now_Ribbon": {
      "UI": "Upcoming Appointment + Map",
      "GHL_Endpoint": "GET /calendars/events",
      "Filter": { "startTime": "gte.{{now}}", "limit": 3 },
      "Fields": {
        "Title": "appointment.title",
        "Time": "appointment.startTime",
        "Address": "appointment.address (Geocoded for map)",
        "Client": "appointment.contactId -> GET /contacts/{id}"
      }
    }
  },
  "Mobile_Components": {
    "Now_Card": "Single primary stack of upcoming events (same data source as Ribbon)"
  },
  "Shared_Data": {
    "KPI_Stats": [
      { "Label": "Volume", "Logic": "SUM(opportunity.monetaryValue) WHERE status='won'" },
      { "Label": "Active Leads", "Logic": "COUNT(opportunity) WHERE pipelineId='{{lead_id}}'" },
      { "Label": "Active Clients", "Logic": "COUNT(opportunity) WHERE pipelineId IN ['{{buyer_id}}','{{seller_id}}']" },
      { "Label": "Conversions", "Logic": "COUNT(events) WHERE type='opportunity_pipeline_change'" }
    ],
    "Needs_Attention": [
      { "Label": "Overdue", "Source": "POST /locations/{id}/tasks/search", "Query": { "status": "incompleted", "dueDate": "lt.{{now}}" } },
      { "Label": "New Leads", "Source": "POST /opportunities/search", "Query": { "pipelineStageId": "{{new_id}}", "createdAt": "gt.{{48h_ago}}" } },
      { "Label": "Expiring Offers", "Source": "POST /objects/custom_objects.real_estate_offer/records/search", "Query": { "properties.irrevocable_until": "lt.{{tomorrow}}" } }
    ],
    "Pending_Offers": {
      "Object": "custom_objects.real_estate_offer",
      "Filter": { "properties.status": "pending" },
      "Fields": ["properties.offer_price", "properties.closing_date"]
    },
    "Recent_Activity": {
      "Source": "Merged Feed: GET /contacts/{id}/notes + GET /conversations/messages + GET /opportunities/{id}/status_changes"
    }
  }
}
```

---

## 3. Global Search (Desktop Cmd+K / Mobile Search Screen)
**Goal:** Quick access to any record in the CRM.

```json
{
  "Screen": "Search",
  "Logic": "Multi-threaded search across core and custom objects",
  "Sources": [
    { "Category": "Leads", "Endpoint": "POST /opportunities/search?pipelineId={{lead_id}}&query={q}" },
    { "Category": "Clients", "Endpoint": "POST /opportunities/search?pipelineId={{buyer_id}},{{seller_id}}&query={q}" },
    { "Category": "Properties", "Endpoint": "POST /objects/custom_objects.properties/records/search?query={q}" },
    { "Category": "Offers", "Endpoint": "POST /objects/custom_objects.real_estate_offer/records/search?query={q}" }
  ],
  "Recent_Searches": "Persisted in local storage or GHL custom values (per user)"
}
```

---

## 4. Leads Management
**Goal:** Track inquiries and convert them to active clients.

```json
{
  "Screen": "Leads",
  "View_Modes": ["List", "Kanban"],
  "Data_Source": "POST /opportunities/search",
  "Required_Params": { "pipelineId": "{{lead_pipeline_id}}" },
  "UI_Mapping": {
    "Card_Title": "opportunity.contact.name",
    "Stage_Indicator": "opportunity.pipelineStageId (Map to Stage Label)",
    "Budget_Display": "contact.customFields['contact.buyer_budget']",
    "Temperature_Badge": {
      "Hot": "Tags: temperature:hot",
      "Warm": "Tags: temperature:warm",
      "Cold": "Tags: temperature:cold"
    },
    "Age": "opportunity.createdAt"
  },
  "Filters": {
    "Buyer_Leads": "contact.customFields['contact.type']='buyer'",
    "Seller_Leads": "contact.customFields['contact.type']='seller'",
    "Hot_Leads": "tags=temperature:hot"
  },
  "Actions": {
    "Convert": "Move Opportunity to Buyer/Seller Pipeline (PUT /opportunities/{id})",
    "Mobile_Swipe_Done": "Update status to 'won' (PUT /opportunities/{id}/status)",
    "Mobile_Swipe_Delete": "DELETE /opportunities/{id}"
  }
}
```

---

## 5. Lead Detail
**Goal:** Full profile view of a prospect including all history.

```json
{
  "Screen": "Lead Detail",
  "Primary_Data": "GET /contacts/{id} + GET /opportunities/{id}",
  "Header": {
    "Identity": {
      "Name": "contact.name",
      "Avatar": "contact.profilePhoto",
      "Last_Contact": "contact.lastActivity",
      "Role": "contact.tags (role:lead)"
    }
  },
  "Tabs": {
    "Overview": {
      "Core_Fields": ["contact.phone", "contact.email", "contact.source", "contact.assignedTo"],
      "Custom_Fields": ["contact.buyer_budget", "contact.pre_approval_lender"]
    },
    "Activity": "Opportunity Audit Logs + GET /contacts/{id}/notes + GET /conversations/{id}/messages",
    "Notes": "CRUD: GET/POST/PUT/DELETE /contacts/{id}/notes",
    "Tasks": "CRUD: GET/POST/PUT/DELETE /contacts/{id}/tasks",
    "Appointments": "GET /contacts/{id}/appointments"
  }
}
```

---

## 6. Clients (Active Transaction Pipeline)
**Goal:** Manage high-intent buyers and sellers through to closing.

```json
{
  "Screen": "Clients",
  "Context": "Switcher for 'Buyer Pipeline' vs 'Seller Pipeline'",
  "Data_Mapping": {
    "List_View": {
      "Name": "contact.name",
      "Stage": "opportunity.pipelineStageId",
      "Status_Tag": "opportunity.tags (e.g., 'Firm', 'Under Contract')",
      "Value": "opportunity.monetaryValue",
      "DOM": "custom_objects.my_listings.days_on_market (via Association)"
    },
    "Kanban": {
      "Lanes": "GET /opportunities/pipelines/{id} -> stages[]",
      "Cards": "Opportunities with denormalized Contact info"
    }
  },
  "Associations": {
    "Listing": "GET /associations/relations?recordId={oppId}&objectKey=custom_objects.my_listings",
    "MLS_Property": "GET /associations/relations?recordId={oppId}&objectKey=custom_objects.properties"
  }
}
```

---

## 7. Client Detail (Buyer/Seller/Both)
**Goal:** The deal hub for active transactions.

```json
{
  "Screen": "Client Detail",
  "Variants": {
    "Buyer": "Opportunity in Buyer Pipeline",
    "Seller": "Opportunity in Seller Pipeline",
    "Both": "Side-by-side (Desktop) or Tabbed (Mobile) view of two Opportunities for same Contact ID"
  },
  "Mapping": {
    "Pipeline_Steps": "opportunity.pipelineStageId (Visual mapping to progress bar)",
    "Metric_Grid": {
      "Budget": "contact.customFields['contact.buyer_budget']",
      "Pre_Approval": "contact.customFields['contact.pre_approval_lender']",
      "Target_Price": "contact.customFields['contact.target_list_price']",
      "Active_Offer": "Related custom_objects.real_estate_offer WHERE properties.status='submitted'"
    },
    "Tabs": {
      "Overview": "Contact Core + Custom Fields (Buyer Must-haves, Seller Listing Address)",
      "Properties": "Associated custom_objects.properties (MLS)",
      "Offers": "Associated custom_objects.real_estate_offer",
      "Appointments": "GET /contacts/{id}/appointments",
      "Conversations": "GET /conversations/{id}/messages",
      "Activity": "Combined Timeline"
    }
  }
}
```

---

## 8. Properties & My Listings
**Goal:** Inventory management and market data search.

```json
{
  "Screen": "My Listings",
  "GHL_CustomObject": "custom_objects.my_listings",
  "Endpoint": "POST /objects/custom_objects.my_listings/records/search",
  "Fields": {
    "Address": "properties.address",
    "MLS_ID": "properties.mls_number",
    "Price": "properties.list_price",
    "Stage": "properties.listing_stage",
    "Beds_Baths": "properties.bedrooms / properties.bathrooms",
    "Views": "properties.listing_views",
    "Docs": "properties.documents_ref (Supabase UUIDs)"
  },
  "Screen": "MLS Properties",
  "GHL_CustomObject": "custom_objects.properties",
  "Endpoint": "POST /objects/custom_objects.properties/records/search",
  "Filters": ["properties.city", "properties.list_price", "properties.bedrooms", "properties.property_type"]
}
```

---

## 9. Property Detail
**Goal:** Comprehensive listing record with history.

```json
{
  "Screen": "Property Detail",
  "DataSource": "GET /objects/custom_objects.properties/records/{id}",
  "Mapping": {
    "Images": "properties.image_urls (CDN)",
    "Pricing": "properties.list_price",
    "Status": "properties.listing_status",
    "Specs": "properties.bedrooms, properties.bathrooms, properties.sqft",
    "Description": "properties.public_remarks"
  },
  "Sections": {
    "Offers": "Associated custom_objects.real_estate_offer",
    "Showings": "GET /calendars/events (Filter by Property ID custom field)",
    "Documents": "properties.documents_ref"
  }
}
```

---

## 10. Offers Management
**Goal:** Track and manage all active negotiations.

```json
{
  "Screen": "Offers",
  "GHL_CustomObject": "custom_objects.real_estate_offer",
  "Endpoint": "POST /objects/custom_objects.real_estate_offer/records/search",
  "Fields": {
    "Offer_Price": "properties.offer_price",
    "Deposit": "properties.deposit_amount",
    "Status": "properties.status (Pending, Accepted, Declined, Countered)",
    "Closing_Date": "properties.closing_date",
    "Irrevocable": "properties.irrevocable_until",
    "Conditions": "properties.conditions"
  },
  "Associations": {
    "Property": "associationId: offer_to_property",
    "Buyer": "associationId: offer_to_contact (Role: Buyer)",
    "Seller": "associationId: offer_to_contact (Role: Seller)"
  }
}
```

---

## 11. Contacts & Directory
**Goal:** Global person database.

```json
{
  "Screen": "Contacts",
  "DataSource": "GET /contacts/",
  "Mapping": {
    "Name": "contact.name",
    "Phone": "contact.phone",
    "Email": "contact.email",
    "Role": "contact.tags (vendor, partner, agent, lead, client)",
    "Source": "contact.source"
  },
  "Filters": {
    "Vendors": "tags=type:vendor",
    "Partners": "tags=type:referral-partner",
    "Past_Clients": "tags=lifecycle:past-client"
  }
}
```

---

## 12. Conversations & Messaging
**Goal:** Unified communication inbox.

```json
{
  "Screen": "Conversations",
  "Thread_List": {
    "Endpoint": "GET /conversations/",
    "Fields": {
      "Contact": "fullName",
      "Channel": "type (sms/email/fb)",
      "Preview": "lastMessageBody",
      "Time": "lastMessageDate",
      "Unread": "unreadCount"
    }
  },
  "Message_History": "GET /conversations/{id}/messages",
  "Actions": {
    "Send_SMS": "POST /conversations/messages { \"type\": \"sms\" }",
    "Send_Email": "POST /conversations/messages { \"type\": \"email\" }",
    "Log_Call": "POST /conversations/messages { \"type\": \"call\" }"
  }
}
```

---

## 13. Calendar & Activity
**Goal:** Time management.

```json
{
  "Screen": "Calendar",
  "View_Modes": ["Day", "Week", "Month", "Agenda"],
  "GHL_Object": "Appointment",
  "Mapping": {
    "Title": "appointment.title",
    "Start": "appointment.startTime",
    "End": "appointment.endTime",
    "Status": "appointment.appointmentStatus (confirmed, showed, noshow)",
    "Type": "appointment.tags (Showing, Consult, Call)"
  }
}
```

---

## 14. Tasks & Notes (Global Lists)
**Goal:** Manage action items across all records.

```json
{
  "Screen": "Tasks",
  "Endpoint": "POST /locations/{locationId}/tasks/search",
  "Mapping": {
    "Title": "task.title",
    "Due": "task.dueDate",
    "Status": "task.status (completed, incompleted)",
    "Priority": "task.tags (priority:high)",
    "Link": "task.contactId"
  },
  "Screen": "Notes",
  "Endpoint": "GET /contacts/{id}/notes (Iterate for global view)",
  "Mapping": {
    "Body": "note.body",
    "Tag": "note.tags",
    "Author": "note.userId"
  }
}
```

---

## 15. Settings & Profile
**Goal:** Personal and account configuration.

```json
{
  "Screen": "Settings",
  "Sections": {
    "Profile": "GET /users/{userId}",
    "Brokerage": "GET /locations/{locationId}",
    "Custom_Fields": "GET /locations/{locationId}/customFields",
    "Tags": "GET /locations/{locationId}/tags",
    "Calendars": "GET /calendars"
  }
}
```

---

## 16. Documents & Contracts (Mobile Screen)
**Goal:** Access to listing and client files.

```json
{
  "Screen": "Documents",
  "GHL_Module": "Proposals",
  "Data": {
    "Docs": "GET /proposals/documents",
    "Templates": "GET /proposals/templates"
  },
  "Categories": [
    { "Label": "Listing Agreements", "Filter": "tags:agreement" },
    { "Label": "Offer Documents", "Filter": "tags:offer" }
  ]
}
```

---

## 17. Authentication Screens (Desktop/Mobile)
**Goal:** Log in and sign up.

```json
{
  "Screen": "Auth",
  "Flow": "GHL Marketplace OAuth 2.0 redirection",
  "Login": "GET /oauth/authorize -> Callback -> POST /oauth/token",
  "Identity": "JWT 'sub' claim maps to GHL User ID"
}
```

---

## 18. Modals & Data Entry (Full Field Mapping)
**Goal:** Map UI input fields to GHL Database properties.

| Component | UI Field | GHL Key | Type |
| :--- | :--- | :--- | :--- |
| **New Lead** | Full Name | `contact.firstName`, `contact.lastName` | TEXT |
| | Role | `contact.tags` ('role:buyer', 'role:seller') | ARRAY[TEXT] |
| | Temperature | `contact.tags` ('temperature:hot') | ARRAY[TEXT] |
| | Phone / Email | `contact.phone`, `contact.email` | PHONE / EMAIL |
| | Budget | `contact.customFields['contact.buyer_budget']` | MONETORY |
| **New Offer** | Offer Price | `properties.offer_price` | MONETORY |
| | Deposit | `properties.deposit_amount` | MONETORY |
| | Closing Date | `properties.closing_date` | DATE |
| | Status | `properties.status` | PICKLIST |
| **New Property**| Address | `properties.address` | TEXT |
| | MLS # | `properties.mls_number` | TEXT |
| | List Price | `properties.list_price` | MONETORY |
| **New Task** | Task Name | `task.title` | TEXT |
| | Due | `task.dueDate` | DATETIME |
| | Priority | `task.tags` ('priority:high') | ARRAY[TEXT] |

---

## 19. Association Key Registry (Associations API)
**Required IDs for linking related real estate records:**

| From Object | To Object | Association Key |
| :--- | :--- | :--- |
| Contact | Offer | `offer_to_contact` |
| Property (MLS) | Offer | `offer_to_property` |
| Opportunity | Property | `opportunity_to_property` |
| My Listing | MLS Property | `mls_to_property` |
| Opportunity | Transaction | `opportunity_to_transaction` |
| Contact | Company | `SYSTEM: BUSINESSES_CONTACTS_ASSOCIATION` |

---

## 20. Custom Field Dictionary
**Suggested keys for Real Estate Pro CRM schema in GHL:**

- `contact.buyer_budget`: MONETORY
- `contact.buyer_must_haves`: LARGE_TEXT
- `contact.listing_address`: TEXT
- `contact.target_list_price`: MONETORY
- `contact.representation_start_date`: DATE
- `properties.mls_number`: TEXT
- `properties.days_on_market`: NUMERICAL
- `properties.documents_ref`: TEXT (Comma-separated Supabase Storage UUIDs)

---
**End of Mapping Document**

---

## 21. Transaction Management (Closing Coordination)
**Goal:** Track the deal from accepted offer to funded closing.

```json
{
  "Screen": "Transactions",
  "GHL_CustomObject": "custom_objects.transactions",
  "Fields": {
    "Transaction_ID": "properties.transaction_id",
    "Closing_Date": "properties.closing_date",
    "Commission_Amount": "properties.commission_amount",
    "Status": "properties.transaction_status (Under Contract, Firm, Closed, Funded)"
  },
  "Associations": {
    "Client": "Link to Contact",
    "Offer": "Link to custom_objects.real_estate_offer",
    "Property": "Link to custom_objects.properties"
  }
}
```

---

## 22. Mapping of UI Constants (Enums)
**Lead Source (contact.source):**
- Cold Call, Door Knock, Open House, Realtor.com, Referral, Social Media, Website, Zillow.

**Temperature Tags:**
- `temperature:hot`, `temperature:warm`, `temperature:cold`.

**Lead Type Tags:**
- `type:agent`, `type:client`, `type:lead`, `type:past-client`, `type:referral-partner`, `type:soi`, `type:vendor`.

**Lost Reason (opportunity.lostReason):**
- Budget, Chose another agent, Not ready, Relocated, Unresponsive.

---
**End of Document**
