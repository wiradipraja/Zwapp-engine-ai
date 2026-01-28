-- Generated Outputs table for gallery + landing page
create table if not exists public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  task_id text unique,
  model text,
  prompt text,
  output_url text,
  output_type text check (output_type in ('image', 'video', 'text')),
  metadata jsonb default '{}'::jsonb,
  credits_cost integer default 0,
  featured boolean default false,
  featured_order bigint default 0,
  created_at timestamptz not null default now()
);

create index if not exists generated_outputs_user_id_idx on public.generated_outputs (user_id);
create index if not exists generated_outputs_featured_idx on public.generated_outputs (featured, featured_order);

alter table public.generated_outputs enable row level security;

create policy if not exists "Outputs are private to owner"
  on public.generated_outputs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: allow public read for featured outputs on landing page
create policy if not exists "Featured outputs are public"
  on public.generated_outputs
  for select
  using (featured = true);
