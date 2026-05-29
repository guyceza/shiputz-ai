import { NextRequest, NextResponse } from 'next/server';
import { verifyUserEmail } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import {
  getBillingPeriodEnd,
  inferPlanBillingCycle,
  PLAN_PRICING,
  PLAN_RANK,
  toPayPlusDate,
  type BillingCycle,
  type PlanId,
} from '@/lib/plan-pricing';
import {
  findRecurringForUser,
  updatePayPlusRecurringPlan,
} from '@/lib/payplus-recurring';

type CreditBucketRow = {
  viz_credits?: number | null;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
};

function getCreditBuckets(user: CreditBucketRow | null | undefined) {
  const total = user?.viz_credits || 0;
  const subscriptionCredits = user?.subscription_credits || 0;
  const purchasedCredits = user?.purchased_credits ?? Math.max(total - subscriptionCredits, 0);
  return { total, subscriptionCredits, purchasedCredits };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const targetPlanId = body.targetPlanId as PlanId;
    const targetBillingCycle = body.targetBillingCycle as BillingCycle;

    if (!email || !targetPlanId || !targetBillingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!PLAN_PRICING[targetPlanId]) {
      return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 });
    }

    if (!(await verifyUserEmail(request, email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (targetBillingCycle !== 'monthly' && targetBillingCycle !== 'annual') {
      return NextResponse.json({ error: 'Invalid target billing cycle' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan, plan_started_at, vision_subscription, viz_credits, subscription_credits, purchased_credits, payplus_recurring_uid, payplus_customer_uid, payplus_recurring_number, payplus_subscription_status, plan_billing_cycle, plan_period_start, plan_period_end')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentPlanId = (user.plan || 'free') as PlanId | 'free';
    if (currentPlanId === 'free' || !PLAN_RANK[currentPlanId]) {
      return NextResponse.json({ error: 'No active plan to change' }, { status: 409 });
    }

    const currentBillingCycle = inferPlanBillingCycle({
      plan: currentPlanId,
      planBillingCycle: user.plan_billing_cycle,
      visionSubscription: user.vision_subscription,
      payplusSubscriptionStatus: user.payplus_subscription_status,
      payplusRecurringUid: user.payplus_recurring_uid,
    });

    if (!currentBillingCycle) {
      return NextResponse.json({ error: 'Current billing cycle is unknown' }, { status: 409 });
    }

    const currentRank = PLAN_RANK[currentPlanId];
    const targetRank = PLAN_RANK[targetPlanId];
    if (targetPlanId === currentPlanId && targetBillingCycle === currentBillingCycle) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 409 });
    }

    if (currentBillingCycle === 'monthly' && targetBillingCycle === 'annual') {
      return NextResponse.json({
        error: 'Monthly to annual changes must go through checkout',
      }, { status: 409 });
    }

    const recurring = await findRecurringForUser(email, user.payplus_recurring_uid, user.payplus_customer_uid);
    if (!recurring?.uid) {
      return NextResponse.json({
        error: 'Could not find the active PayPlus subscription to change',
      }, { status: 502 });
    }

    if (currentBillingCycle === 'annual') {
      const now = new Date();
      const periodEnd = user.plan_period_end
        ? new Date(user.plan_period_end)
        : getBillingPeriodEnd(new Date(user.plan_period_start || user.plan_started_at || now), 'annual');

      if (periodEnd <= now) {
        return NextResponse.json({
          error: 'Annual period end is not in the future',
        }, { status: 409 });
      }

      if (targetBillingCycle === 'annual' && targetRank > currentRank) {
        return NextResponse.json({
          error: 'Annual upgrades must go through checkout',
        }, { status: 409 });
      }

      const recurringUpdate = await updatePayPlusRecurringPlan(
        recurring.uid,
        targetPlanId,
        targetBillingCycle,
        { startDate: periodEnd }
      );

      const nowIso = now.toISOString();
      const { error: updateError } = await supabase
        .from('users')
        .update({
          scheduled_plan: targetPlanId,
          scheduled_billing_cycle: targetBillingCycle,
          scheduled_plan_change_at: periodEnd.toISOString(),
          scheduled_plan_change_created_at: nowIso,
          scheduled_plan_change_status: 'pending',
          subscription_cancel_at_period_end: false,
          payplus_recurring_uid: recurring.uid,
          payplus_customer_uid: recurring.customer_uid || user.payplus_customer_uid,
          payplus_recurring_number: recurring.number || user.payplus_recurring_number || null,
          payplus_subscription_status: 'active',
          payplus_recurring_interval_months: targetBillingCycle === 'annual' ? 12 : 1,
          payplus_last_checked_at: nowIso,
        })
        .eq('email', email);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      try {
        await supabase.from('credit_transactions').insert({
          user_email: email,
          action: `schedule_${currentPlanId}_${currentBillingCycle}_to_${targetPlanId}_${targetBillingCycle}`,
          amount: 0,
          balance_after: user.viz_credits || 0,
          created_at: nowIso,
        });
      } catch (error) {
        console.error('Failed to log scheduled plan change:', error);
      }

      return NextResponse.json({
        success: true,
        scheduled: true,
        plan: currentPlanId,
        billingCycle: currentBillingCycle,
        scheduledPlan: targetPlanId,
        scheduledBillingCycle: targetBillingCycle,
        scheduledChangeAt: periodEnd.toISOString(),
        recurringNextAmount: recurringUpdate.amount,
        recurringNextChargeDate: recurringUpdate.nextChargeDate,
      });
    }

    if (targetBillingCycle !== 'monthly') {
      return NextResponse.json({ error: 'Unsupported plan change' }, { status: 409 });
    }

    if (targetRank >= currentRank) {
      return NextResponse.json({
        error: 'Monthly upgrades must go through checkout',
      }, { status: 409 });
    }

    const now = new Date();
    const periodEnd = getBillingPeriodEnd(now, 'monthly');
    const recurringUpdate = await updatePayPlusRecurringPlan(recurring.uid, targetPlanId, 'monthly', {
      startDate: periodEnd,
    });
    const targetCredits = PLAN_PRICING[targetPlanId].credits;
    const { subscriptionCredits, purchasedCredits } = getCreditBuckets(user);
    const newSubscriptionCredits = Math.min(subscriptionCredits, targetCredits);
    const newCredits = purchasedCredits + newSubscriptionCredits;

    const nowIso = now.toISOString();
    const { error: updateError } = await supabase
      .from('users')
      .update({
        purchased: true,
        purchased_at: nowIso,
        plan: targetPlanId,
        plan_started_at: nowIso,
        plan_billing_cycle: 'monthly',
        plan_period_start: nowIso,
        plan_period_end: periodEnd.toISOString(),
        vision_subscription: 'active',
        viz_credits: newCredits,
        subscription_credits: newSubscriptionCredits,
        purchased_credits: purchasedCredits,
        payplus_recurring_uid: recurring.uid,
        payplus_customer_uid: recurring.customer_uid || user.payplus_customer_uid,
        payplus_recurring_number: recurring.number || null,
        payplus_subscription_status: 'active',
        payplus_recurring_interval_months: 1,
        payplus_last_checked_at: nowIso,
        scheduled_plan: null,
        scheduled_billing_cycle: null,
        scheduled_plan_change_at: null,
        scheduled_plan_change_created_at: null,
        scheduled_plan_change_status: null,
        subscription_cancel_at_period_end: false,
      })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await supabase.from('credit_transactions').insert({
        user_email: email,
        action: `downgrade_${currentPlanId}_to_${targetPlanId}_monthly`,
        amount: newSubscriptionCredits - subscriptionCredits,
        balance_after: newCredits,
        created_at: nowIso,
      });
    } catch (error) {
      console.error('Failed to log plan downgrade transaction:', error);
    }

    return NextResponse.json({
      success: true,
      plan: targetPlanId,
      billingCycle: 'monthly',
      credits: newCredits,
      subscriptionCredits: newSubscriptionCredits,
      purchasedCredits,
      recurringNextAmount: recurringUpdate.amount,
      recurringNextChargeDate: recurringUpdate.nextChargeDate,
      periodEnd: toPayPlusDate(periodEnd),
    });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to change plan',
    }, { status: 500 });
  }
}
