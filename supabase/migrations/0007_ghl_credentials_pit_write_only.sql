-- 0007_ghl_credentials_pit_write_only.sql
-- SB-1.2 (Milestone 1) Proxy auth + credentials hardening.
-- Make pit_token write-only from the client's perspective:
--   * anon: no access at all
--   * authenticated: may SELECT every column EXCEPT pit_token,
--     may INSERT/UPDATE (incl. pit_token) and DELETE own row (RLS owner-scoped)
--   * service_role: unchanged (proxy reads the token server-side)
--
-- Applied to the live project (xdenkkphnhjjpdirvsii) on 2026-07-09. Committed here
-- (renumbered from the Milestone 1 staging file 0002_sb_1_2_*) so the repo migration
-- history is self-consistent.

-- `connected` column: written by the ghl-credentials Edge Function (upsertCredentials)
-- and exposed to client SELECT below. It is not present in 0001, so add it here before
-- granting on it.
alter table public.ghl_credentials
  add column if not exists connected boolean not null default false;

revoke all on table public.ghl_credentials from anon;
revoke all on table public.ghl_credentials from authenticated;

grant select (user_id, location_id, default_calendar_id, connected, updated_at)
  on public.ghl_credentials to authenticated;
grant insert (user_id, pit_token, location_id, default_calendar_id, connected, updated_at)
  on public.ghl_credentials to authenticated;
grant update (pit_token, location_id, default_calendar_id, connected, updated_at)
  on public.ghl_credentials to authenticated;
grant delete on public.ghl_credentials to authenticated;

comment on column public.ghl_credentials.pit_token is
  'Write-only for client roles. Column-level SELECT revoked from anon/authenticated; readable by service_role only (ghl-proxy Edge Function).';
