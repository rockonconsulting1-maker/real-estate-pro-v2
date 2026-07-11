-- 0008_ghl_proxy_rate_gate.sql
-- SB-1.1 Central per-user rate limiting for the ghl-proxy Edge Function
-- (applied to xdenkkphnhjjpdirvsii on 2026-07-09, incl. service_role grant fix)
-- One RPC both enforces a fixed 10s window AND returns the caller's PIT +
-- location, so the proxy makes a single DB roundtrip per request.
-- Callable by service_role ONLY (it returns the PIT).

create table public.ghl_proxy_rate (
  user_id uuid primary key references auth.users on delete cascade,
  window_start timestamptz not null,
  count integer not null
);
alter table public.ghl_proxy_rate enable row level security;
revoke all on table public.ghl_proxy_rate from anon, authenticated;
comment on table public.ghl_proxy_rate is
  'Fixed-window request counters for ghl-proxy. Service-role access only; no client policies.';

create or replace function public.ghl_proxy_gate(
  p_user_id uuid,
  p_max integer default 90,
  p_window_ms integer default 10000
)
returns table (allowed boolean, retry_after integer, pit_token text, location_id text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.ghl_proxy_rate;
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
begin
  insert into public.ghl_proxy_rate as r (user_id, window_start, count)
  values (p_user_id, v_now, 1)
  on conflict (user_id) do update set
    count = case when v_now - r.window_start >= v_window then 1 else r.count + 1 end,
    window_start = case when v_now - r.window_start >= v_window then v_now else r.window_start end
  returning * into v_row;

  if v_row.count > p_max then
    allowed := false;
    retry_after := greatest(
      1,
      ceil(extract(epoch from (v_row.window_start + v_window - v_now)))::integer
    );
  else
    allowed := true;
    retry_after := 0;
  end if;

  select c.pit_token, c.location_id
    into pit_token, location_id
  from public.ghl_credentials c
  where c.user_id = p_user_id;

  return next;
end;
$$;

revoke execute on function public.ghl_proxy_gate(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.ghl_proxy_gate(uuid, integer, integer) to service_role;
grant all on table public.ghl_proxy_rate to service_role;
