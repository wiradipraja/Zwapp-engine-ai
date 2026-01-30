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

-- ================================
-- Model Catalog (Image / Video / Text)
-- ================================

-- Admin list (seed with service role for first admin)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create policy if not exists "Admins can view admin list"
  on public.admin_users
  for select
  using (public.is_admin());

create policy if not exists "Admins can manage admin list"
  on public.admin_users
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Model catalog table
create table if not exists public.ai_models (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  family text not null,
  provider text,
  api_model text not null,
  app_module text not null,
  model_type text not null check (model_type in ('image', 'video', 'text')),
  short_description text,
  price_per_output numeric(10,2) default 0,
  price_currency text default 'IDR',
  thumbnail_url text,
  sample_urls text[] not null default '{}',
  capabilities jsonb default '{}'::jsonb,
  active boolean default true,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_models_type_active_idx on public.ai_models (model_type, active, display_order);
create index if not exists ai_models_family_idx on public.ai_models (family);

alter table public.ai_models enable row level security;

create policy if not exists "Model catalog is public"
  on public.ai_models
  for select
  using (active = true);

create policy if not exists "Admins can read all models"
  on public.ai_models
  for select
  using (public.is_admin());

create policy if not exists "Admins manage model catalog"
  on public.ai_models
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Optional linkage from outputs to catalog
alter table public.generated_outputs
  add column if not exists model_id uuid references public.ai_models (id);

create index if not exists generated_outputs_model_id_idx on public.generated_outputs (model_id);
