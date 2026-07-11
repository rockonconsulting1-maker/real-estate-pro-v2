# Edge Function Contracts — Milestone 1 (Proxy Foundation)

> Deployed to project `xdenkkphnhjjpdirvsii` (`https://xdenkkphnhjjpdirvsii.supabase.co`).
> All endpoints require **both** headers from the browser:
> `Authorization: Bearer <supabase user access token>` and `apikey: <publishable key>`.
> Platform `verify_jwt` is ON; the function additionally resolves the user via `auth.getUser()`.
> The PIT never appears in any response, log, or Sentry event.

---

## SB-1.1 — `ghl-proxy` (Contract)

**Base:** `POST|GET|PUT|PATCH|DELETE {SUPABASE_URL}/functions/v1/ghl-proxy/<ghl-path>?<query>`

The `<ghl-path>` and query string are forwarded verbatim to `GHL_BASE_URL` with the
caller's PIT attached server-side. Examples the v1 service layer maps to directly:

| v1 `ghlFetch` call | proxy URL |
|---|---|
| `GET /contacts/?locationId=…&limit=20` | `GET /functions/v1/ghl-proxy/contacts/?locationId=…&limit=20` |
| `GET /opportunities/pipelines?locationId=…` | `GET /functions/v1/ghl-proxy/opportunities/pipelines?locationId=…` |
| `POST /objects/custom_objects.properties/records` | `POST /functions/v1/ghl-proxy/objects/custom_objects.properties/records` |
| `GET /associations/relations/{recordId}` | `GET /functions/v1/ghl-proxy/associations/relations/{recordId}` |

**Frontend repoint (FE-1.1):** in `src/lib/ghl/client.ts`, change the base URL from
`https://services.leadconnectorhq.com` to `{SUPABASE_URL}/functions/v1/ghl-proxy`, replace the
PIT Authorization header with the Supabase session token + `apikey`, and delete all
browser-side PIT loading. The browser-side token-bucket limiter can be removed (rate
limiting is now central) — keep the 429-retry handling and map it to `error.retryAfter`.

- **Version header:** the proxy sends `Version: <GHL_API_VERSION secret>` (currently `v3`).
  A request may override per-call with `x-ghl-version` (useful while migrating any
  endpoint still expecting `2021-07-28`).
- **Body passthrough:** raw, including `multipart/form-data` for `/medias` uploads
  (Content-Type forwarded verbatim).
- **Path allowlist (403 otherwise):** `contacts`, `opportunities`, `objects`,
  `associations`, `conversations`, `calendars`, `locations`, `users`, `businesses`,
  `companies`, `medias`, `documents`, `proposals`.
- **Rate limiting:** central, per user, fixed window 90 requests / 10s enforced in
  Postgres (`public.ghl_proxy_gate`), plus a per-isolate first-line throttle. GHL 429s
  are retried inside the proxy up to 2 times honoring `Retry-After` (max 8s backoff).
- **Credential resolution:** the user's row in `ghl_credentials` (service-role read);
  falls back to the `GHL_PIT` / `GHL_LOCATION_ID` project secrets when no row exists
  (dev bootstrap). Response field `credentialSource` on the test endpoint tells you which.

**Success:** GHL's response is passed through with its original status and JSON body.

**Normalized error shape (all non-2xx from the proxy itself):**

```json
{ "error": { "type": "<type>", "status": 401, "message": "…", "details": {}, "retryAfter": 4, "ghlStatus": 422 } }
```

| `error.type` | status | meaning / frontend handling |
|---|---|---|
| `auth` | 401 | Missing/expired Supabase session → redirect to sign-in |
| `credentials_missing` | 412 | No PIT saved → show credentials banner / first-run gate |
| `forbidden_path` | 403 | Path not on allowlist (programming error) |
| `rate_limited` | 429 | Central limit or GHL 429 after retries → back off `retryAfter` seconds |
| `ghl` | GHL's status | GHL rejected the request; original body under `details`, status under `ghlStatus` |
| `network` | 502 | Could not reach GHL after retries |
| `validation` | 400/405 | Malformed request to the function itself |
| `internal` | 500 | Unexpected; reported to Sentry |

---

## SB-1.3 — `ghl-credentials` (Contract)

### Save / rotate

`POST {SUPABASE_URL}/functions/v1/ghl-credentials`

```json
{ "pitToken": "pit-…", "locationId": "jHEaG68TeCsXHXPhrVtU", "defaultCalendarId": "optional" }
```

Validates the pair against GHL (`GET /locations/{id}`) **before** saving; on success
upserts `ghl_credentials` via service role (rotation = same call with a new token).

**200:** `{ "ok": true, "locationId": "…", "locationName": "…", "savedAt": "ISO" }`

**Errors (credentials-banner mapping):**

| `error.type` | status | banner copy suggestion |
|---|---|---|
| `invalid_token` | 400 | "GHL rejected the token — check the PIT and its scopes" (`ghlStatus` 401/403) |
| `invalid_location` | 400 | "That Location ID doesn't match this token" (`ghlStatus` 404/400/422) |
| `validation` | 400 | Missing `pitToken`/`locationId` |
| `network` | 502 | "Couldn't reach GHL — try again" |
| `ghl` | 502 | Unexpected GHL error during validation |

### Test connection

`POST {SUPABASE_URL}/functions/v1/ghl-credentials/test` (no body)

Loads the caller's **stored** credentials and exercises the full proxy path.

**200:**
```json
{ "ok": true, "locationId": "…", "locationName": "…", "credentialSource": "user|env", "checkedAt": "ISO" }
```

**Errors:** same table as above, plus `credentials_missing` (412) when nothing is stored
and no env fallback exists.

---

## SB-1.2 — `ghl_credentials` client access (changed)

- `anon`: **no access**.
- `authenticated` (owner-scoped by existing RLS):
  - `SELECT` — `user_id, location_id, default_calendar_id, connected, updated_at` only.
    **`select('*')` now fails with a column permission error** — select explicit columns.
  - `INSERT` / `UPDATE` — allowed incl. `pit_token` (but prefer the `ghl-credentials`
    endpoint, which validates before saving). `RETURNING pit_token` is denied.
  - `DELETE` — allowed (disconnect).
- `service_role`: full access (proxy + credentials function only).

## Supporting objects (SB-1.1)

- `public.ghl_proxy_rate` — per-user fixed-window counters; no client access.
- `public.ghl_proxy_gate(p_user_id, p_max=90, p_window_ms=10000)` — SECURITY INVOKER,
  executable by `service_role` only (it returns the PIT). One call = rate check +
  credential load.

## SB-1.4 — Sentry

Both functions call `initSentry(<function name>)` from `_shared.ts`:
tags `source=edge-function`, `function=<name>`, `environment=<ENVIRONMENT secret>`,
`region=<SB_REGION>`; `beforeSend` strips request headers/cookies/data so no secret can
leak. Errors captured: unexpected exceptions, GHL 5xx, network failures, credential
upsert failures.

**Required secrets to activate:** `SENTRY_DSN` (backend project DSN) and optionally
`ENVIRONMENT` (`development` default). Without `SENTRY_DSN` the integration no-ops.

## Project secrets in use

`GHL_BASE_URL` · `GHL_API_VERSION` (= `v3`) · `GHL_PIT` + `GHL_LOCATION_ID` (dev
fallback credentials) · `SENTRY_DSN` (pending) · `ENVIRONMENT` (optional) ·
`ALLOWED_ORIGIN` (optional CORS lock-down; defaults to `*`).
