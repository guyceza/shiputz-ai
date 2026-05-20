-- Store first-touch acquisition data for users and payment attempts.
-- Service-role API routes write these records; do not expose them publicly.

create table if not exists public.user_attribution (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  email text not null unique,
  first_source text,
  first_medium text,
  first_referrer text,
  first_landing_page text,
  first_landing_path text,
  first_query text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  msclkid text,
  user_agent text,
  ip_address text,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_attribution (
  id uuid primary key default gen_random_uuid(),
  page_request_uid text not null unique,
  email text not null,
  product_type text,
  amount numeric,
  first_source text,
  first_medium text,
  first_referrer text,
  first_landing_page text,
  first_landing_path text,
  first_query text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  msclkid text,
  user_agent text,
  ip_address text,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_attribution_user_id on public.user_attribution(user_id);
create index if not exists idx_user_attribution_email on public.user_attribution(email);
create index if not exists idx_payment_attribution_email on public.payment_attribution(email);
create index if not exists idx_payment_attribution_page_request_uid on public.payment_attribution(page_request_uid);

alter table public.user_attribution enable row level security;
alter table public.payment_attribution enable row level security;

drop policy if exists "Service role manages user attribution" on public.user_attribution;
create policy "Service role manages user attribution"
  on public.user_attribution
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages payment attribution" on public.payment_attribution;
create policy "Service role manages payment attribution"
  on public.payment_attribution
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
