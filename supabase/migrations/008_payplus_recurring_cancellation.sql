alter table public.users
  add column if not exists vision_canceled_at timestamptz,
  add column if not exists payplus_recurring_uid text,
  add column if not exists payplus_customer_uid text,
  add column if not exists payplus_recurring_number text,
  add column if not exists payplus_subscription_status text,
  add column if not exists payplus_last_checked_at timestamptz;

create index if not exists idx_users_payplus_recurring_uid
  on public.users (payplus_recurring_uid)
  where payplus_recurring_uid is not null;

create index if not exists idx_users_payplus_customer_uid
  on public.users (payplus_customer_uid)
  where payplus_customer_uid is not null;
