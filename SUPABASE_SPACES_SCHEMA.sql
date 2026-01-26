-- Spaces table for node-based workspace persistence
create table if not exists public.spaces (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spaces_user_id_idx on public.spaces (user_id);

alter table public.spaces enable row level security;

create policy if not exists "Spaces are private to owner"
  on public.spaces
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
