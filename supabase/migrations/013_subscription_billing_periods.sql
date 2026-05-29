alter table public.users
  add column if not exists plan_billing_cycle text,
  add column if not exists plan_period_start timestamptz,
  add column if not exists plan_period_end timestamptz,
  add column if not exists scheduled_plan text,
  add column if not exists scheduled_billing_cycle text,
  add column if not exists scheduled_plan_change_at timestamptz,
  add column if not exists scheduled_plan_change_created_at timestamptz,
  add column if not exists scheduled_plan_change_status text,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists payplus_recurring_interval_months integer;

alter table public.users
  drop constraint if exists users_plan_billing_cycle_check,
  add constraint users_plan_billing_cycle_check
    check (plan_billing_cycle is null or plan_billing_cycle in ('monthly', 'annual'));

alter table public.users
  drop constraint if exists users_scheduled_billing_cycle_check,
  add constraint users_scheduled_billing_cycle_check
    check (scheduled_billing_cycle is null or scheduled_billing_cycle in ('monthly', 'annual'));

alter table public.users
  drop constraint if exists users_scheduled_plan_check,
  add constraint users_scheduled_plan_check
    check (scheduled_plan is null or scheduled_plan in ('starter', 'pro', 'business'));

alter table public.users
  drop constraint if exists users_scheduled_plan_change_status_check,
  add constraint users_scheduled_plan_change_status_check
    check (scheduled_plan_change_status is null or scheduled_plan_change_status in ('pending', 'applied', 'canceled'));

create index if not exists idx_users_plan_billing_cycle
  on public.users (plan_billing_cycle)
  where plan_billing_cycle is not null;

create index if not exists idx_users_scheduled_plan_change_at
  on public.users (scheduled_plan_change_at)
  where scheduled_plan_change_status = 'pending';

update public.users
set
  plan_billing_cycle = case
    when coalesce(vision_subscription, '') = 'active'
      and plan in ('starter', 'pro', 'business')
      and (payplus_subscription_status = 'active' or payplus_recurring_uid is not null)
      then 'monthly'
    else plan_billing_cycle
  end,
  plan_period_start = coalesce(plan_period_start, plan_started_at),
  plan_period_end = coalesce(
    plan_period_end,
    case
      when plan_started_at is not null
        and coalesce(vision_subscription, '') = 'active'
        and plan in ('starter', 'pro', 'business')
        and (payplus_subscription_status = 'active' or payplus_recurring_uid is not null)
        then plan_started_at + interval '1 month'
      else null
    end
  ),
  payplus_recurring_interval_months = coalesce(
    payplus_recurring_interval_months,
    case
      when coalesce(vision_subscription, '') = 'active'
        and plan in ('starter', 'pro', 'business')
        and (payplus_subscription_status = 'active' or payplus_recurring_uid is not null)
        then 1
      else null
    end
  )
where plan in ('starter', 'pro', 'business');
