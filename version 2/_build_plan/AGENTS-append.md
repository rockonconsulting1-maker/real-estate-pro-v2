# Append this section to the bottom of AGENTS.md in the repo root

## `_build_plan/`

The `_build_plan/` folder contains the v2 PRD and per-milestone prompts used to guide the v2 build-out (Edge Function proxy, Supabase mirror, GHL webhooks, GHL Media vault, Documents & Contracts). These files are **temporary** — they exist for documentation and guidance only. They are **not** functional: no code, configuration, or runtime logic in this codebase should import, reference, or depend on anything inside `_build_plan/`.

Do not treat `_build_plan/` as long-living documentation for the codebase. The codebase will evolve past the assumptions and decisions captured here. Once the v2 milestones are complete, this folder is expected to be deleted.

For v2 work, `_build_plan/prd.md` supersedes the v1 `PRD.md` on architecture and scope; `design.md`, `GHL_Integration_Mapping.md`, the schema docs, and `docs/database/` remain authoritative for their domains.
