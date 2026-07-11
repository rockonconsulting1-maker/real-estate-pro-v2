# MASTER_TASK_ORDER.md — v2 Build Order (all agents)

All 48 tasks in dependency order. Work top to bottom; parallelism is allowed where a task's **Waiting on** column is already satisfied. Full task definitions live in `_build_plan/tasks/` (TASKS_GHL.md, TASKS_SUPABASE.md, TASKS_FRONTEND.md).

**Owners:** GHL = Ask AI (dev snapshot sub-account) · SB = Claude AI / Jules (Supabase) · FE = Vibe AI (frontend)

## Milestone 1 — Proxy Foundation

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 1 | GHL-1.1 Dev PIT + scope verification | Ask AI | — |
| 2 | GHL-1.2 Baseline schema audit | Ask AI | GHL-1.1 |
| 3 | SB-1.2 Credentials hardening | Claude/Jules | GHL-1.1 |
| 4 | SB-1.1 ghl-proxy Edge Function *(Contract)* | Claude/Jules | SB-1.2 |
| 5 | SB-1.3 Credentials + test-connection endpoints *(Contract)* | Claude/Jules | SB-1.1 |
| 6 | SB-1.4 Sentry on Edge Functions | Claude/Jules | SB-1.1 |
| 7 | FE-1.3 Frontend Sentry | Vibe AI | — |
| 8 | FE-1.1 Repoint GHL client to proxy | Vibe AI | SB-1.1, SB-1.3 |
| 9 | FE-1.2 Settings ▸ Integrations updates | Vibe AI | SB-1.3, FE-1.1 |

## Milestone 2 — Mirror & Backfill

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 10 | GHL-2.1 Dev test dataset at scale | Ask AI | — |
| 11 | GHL-2.2 Pagination + rate-limit confirmation | Ask AI | GHL-2.1 |
| 12 | SB-2.1 Mirror schema migrations | Claude/Jules | GHL-1.2 |
| 13 | SB-2.2 Backfill engine *(Contract)* | Claude/Jules | SB-2.1, GHL-2.2 |
| 14 | SB-2.3 Sync trigger endpoint *(Contract)* | Claude/Jules | SB-2.2 |
| 15 | FE-2.1 Backfill progress screen | Vibe AI | SB-2.2, SB-2.3 |
| 16 | FE-2.2 Sync status card in Settings | Vibe AI | SB-2.2, SB-2.3 |

## Milestone 3 — Webhooks & Live Sync

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 17 | GHL-3.1 Webhook event coverage matrix | Ask AI | — |
| 18 | GHL-3.2 Custom-object webhook verification | Ask AI | GHL-3.1 |
| 19 | GHL-3.3 Signature verification material | Ask AI | GHL-3.1 |
| 20 | SB-3.1 Webhook receiver Edge Function | Claude/Jules | GHL-3.1, GHL-3.3 |
| 21 | SB-3.2 Automatic webhook registration | Claude/Jules | SB-3.1, GHL-3.1 |
| 22 | SB-3.3 Conversation refetch-nudge channel *(Contract)* | Claude/Jules | SB-3.1 |
| 23 | SB-3.4 Reconciliation scheduled function | Claude/Jules | SB-3.1, GHL-3.2 |
| 24 | FE-3.1 Conversation refetch-nudge wiring | Vibe AI | SB-3.3 |
| 25 | GHL-3.4 Live-sync test protocol | Ask AI | SB-3.1, SB-3.2 |

## Milestone 4 — Fast Reads & Realtime

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 26 | SB-4.1 Read-path verification | Claude/Jules | SB-2.1 |
| 27 | SB-4.2 Enable Realtime on mirror tables | Claude/Jules | SB-2.1 |
| 28 | FE-4.1 Mirror-read data layer | Vibe AI | SB-4.1 |
| 29 | FE-4.2 Optimistic writes + webhook confirmation | Vibe AI | FE-4.1 |
| 30 | FE-4.3 Realtime UI updates | Vibe AI | SB-4.2, FE-4.1 |
| 31 | FE-4.4 App-shell sync-health indicator | Vibe AI | FE-2.2 |

## Milestone 5 — Docs Vault on GHL Media

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 32 | GHL-5.1 Media Library folder conventions | Ask AI | — |
| 33 | GHL-5.2 documents_ref field format | Ask AI | GHL-5.1 |
| 34 | GHL-5.3 Media API edge-case verification | Ask AI | GHL-5.1 |
| 35 | SB-5.1 Media proxy routes *(Contract)* | Claude/Jules | GHL-5.1, GHL-5.3 |
| 36 | SB-5.2 Documents mirror + freshness | Claude/Jules | SB-5.1 |
| 37 | SB-5.3 Storage → Media migration function *(Contract)* | Claude/Jules | SB-5.1, GHL-5.2 |
| 38 | FE-5.1 Docs vault on GHL Media | Vibe AI | SB-5.1, SB-5.2 |
| 39 | FE-5.2 Document links on record pages | Vibe AI | GHL-5.2, FE-5.1 |
| 40 | FE-5.3 Migration summary UI | Vibe AI | SB-5.3 |

## Milestone 6 — Documents & Contracts (e-sign)

| # | Task | Owner | Waiting on |
|---|------|-------|------------|
| 41 | GHL-6.1 Build the template library | Ask AI | — |
| 42 | GHL-6.2 Stage → template mapping | Ask AI | GHL-6.1 |
| 43 | GHL-6.3 E-sign lifecycle verification | Ask AI | GHL-6.1 |
| 44 | SB-6.1 Templates + send proxy routes *(Contract)* | Claude/Jules | GHL-6.1 |
| 45 | SB-6.2 Sent-documents mirror + status webhooks | Claude/Jules | SB-6.1, GHL-6.3 |
| 46 | FE-6.1 Send-document flow | Vibe AI | SB-6.1, GHL-6.2 |
| 47 | FE-6.2 Status tracking UI | Vibe AI | SB-6.2, FE-6.1 |
| 48 | GHL-6.4 End-to-end acceptance data | Ask AI | SB-6.2, FE-6.2 |

## Parallelism notes

- Within each milestone the pattern is **Ask AI first → Supabase next → Vibe AI last**, but the *first* Ask AI task of milestones 2, 3, 5, and 6 (GHL-2.1, GHL-3.1, GHL-5.1, GHL-6.1) has no upstream dependency and can start early while the previous milestone finishes.
- FE-1.3 (Frontend Sentry) has no dependencies and can be done any time.
- Contract-marked SB tasks must publish their endpoint contract to `supabase/edge-functions.md` before their dependent FE task starts.
