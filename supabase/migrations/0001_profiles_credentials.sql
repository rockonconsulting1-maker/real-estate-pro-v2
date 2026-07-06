-- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text, last_name text, brokerage text, phone text,
  avatar_url text, gci_goal numeric, created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, brokerage, phone)
  values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name',
          new.raw_user_meta_data->>'brokerage', new.raw_user_meta_data->>'phone');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- GHL credentials (v1: browser reads these to call GHL directly; v2 moves to Edge Function proxy)
create table public.ghl_credentials (
  user_id uuid primary key references auth.users on delete cascade,
  pit_token text not null, location_id text not null,
  default_calendar_id text, updated_at timestamptz default now()
);
alter table public.ghl_credentials enable row level security;
create policy "own creds" on public.ghl_credentials for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
