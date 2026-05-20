alter table public.users
  add column if not exists subscription_credits integer not null default 0,
  add column if not exists purchased_credits integer not null default 0;

with plan_limits as (
  select
    email,
    coalesce(viz_credits, 0) as current_credits,
    case
      when plan = 'starter' then 50
      when plan = 'pro' then 200
      when plan = 'business' then 600
      else 0
    end as plan_credits
  from public.users
)
update public.users u
set
  subscription_credits = case
    when p.plan_credits > 0 and coalesce(u.vision_subscription, '') = 'active'
      then least(p.current_credits, p.plan_credits)
    else 0
  end,
  purchased_credits = case
    when p.plan_credits > 0 and coalesce(u.vision_subscription, '') = 'active'
      then greatest(p.current_credits - p.plan_credits, 0)
    else p.current_credits
  end
from plan_limits p
where u.email = p.email
  and (coalesce(u.subscription_credits, 0) = 0 and coalesce(u.purchased_credits, 0) = 0);
