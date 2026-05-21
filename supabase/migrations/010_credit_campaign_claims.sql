create table if not exists public.credit_campaign_claims (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  campaign_key text not null,
  credits integer not null,
  trigger_action text,
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_email, campaign_key)
);

alter table public.credit_campaign_claims enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_campaign_claims'
      and policyname = 'credit_campaign_claims_service_role_only'
  ) then
    create policy credit_campaign_claims_service_role_only
      on public.credit_campaign_claims
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

create or replace function public.claim_credit_campaign_gift(
  p_user_email text,
  p_campaign_key text,
  p_credits integer,
  p_trigger_action text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_user_email));
  v_inserted boolean := false;
  v_current_credits integer := 0;
  v_current_purchased_credits integer := 0;
  v_new_balance integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    return jsonb_build_object('claimed', false, 'reason', 'unauthorized');
  end if;

  if v_email = '' or p_user_email is null then
    return jsonb_build_object('claimed', false, 'reason', 'missing_email');
  end if;

  if p_campaign_key <> 'shavuot_2026' or p_credits <> 20 then
    return jsonb_build_object('claimed', false, 'reason', 'invalid_campaign');
  end if;

  insert into public.credit_campaign_claims (
    user_email,
    campaign_key,
    credits,
    trigger_action
  )
  values (
    v_email,
    p_campaign_key,
    p_credits,
    p_trigger_action
  )
  on conflict (user_email, campaign_key) do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    return jsonb_build_object('claimed', false, 'reason', 'already_claimed');
  end if;

  select
    coalesce(viz_credits, 0),
    coalesce(purchased_credits, 0)
  into
    v_current_credits,
    v_current_purchased_credits
  from public.users
  where lower(email) = v_email
  for update;

  if not found then
    delete from public.credit_campaign_claims
    where user_email = v_email
      and campaign_key = p_campaign_key;
    return jsonb_build_object('claimed', false, 'reason', 'user_not_found');
  end if;

  v_new_balance := v_current_credits + p_credits;

  update public.users
  set
    viz_credits = v_new_balance,
    purchased_credits = v_current_purchased_credits + p_credits
  where lower(email) = v_email;

  insert into public.credit_transactions (
    user_email,
    action,
    amount,
    balance_after,
    created_at
  )
  values (
    v_email,
    'gift_' || p_campaign_key,
    p_credits,
    v_new_balance,
    now()
  );

  return jsonb_build_object(
    'claimed', true,
    'campaignKey', p_campaign_key,
    'credits', p_credits,
    'balanceAfter', v_new_balance
  );
end;
$$;

revoke all on function public.claim_credit_campaign_gift(text, text, integer, text) from public;
revoke all on function public.claim_credit_campaign_gift(text, text, integer, text) from anon;
revoke all on function public.claim_credit_campaign_gift(text, text, integer, text) from authenticated;
grant execute on function public.claim_credit_campaign_gift(text, text, integer, text) to service_role;
