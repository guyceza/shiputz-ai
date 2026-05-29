-- Anonymous acquisition events for ad traffic before signup.
-- Written only by service-role API routes; used to understand what paid visitors do before they identify.

create table if not exists public.acquisition_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  event_type text not null,
  event_name text,
  page_path text,
  page_url text,
  target_url text,
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
  created_at timestamptz not null default now()
);

create index if not exists idx_acquisition_events_created_at on public.acquisition_events(created_at desc);
create index if not exists idx_acquisition_events_session_id on public.acquisition_events(session_id);
create index if not exists idx_acquisition_events_gclid on public.acquisition_events(gclid) where gclid is not null;
create index if not exists idx_acquisition_events_utm_campaign on public.acquisition_events(utm_campaign) where utm_campaign is not null;
create index if not exists idx_acquisition_events_event_type on public.acquisition_events(event_type);

alter table public.acquisition_events enable row level security;

drop policy if exists "Service role manages acquisition events" on public.acquisition_events;
create policy "Service role manages acquisition events"
  on public.acquisition_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
