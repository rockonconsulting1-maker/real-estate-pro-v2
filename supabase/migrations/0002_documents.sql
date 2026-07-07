-- Create documents metadata table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text,
  linked_record_type text,
  linked_record_id text,
  ghl_contact_id text,
  size bigint,
  mime text,
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "own documents" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);