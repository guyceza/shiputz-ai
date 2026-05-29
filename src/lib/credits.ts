import { createServiceClient } from './supabase';
import { inferPlanBillingCycle, PLAN_PRICING, type BillingCycle } from './plan-pricing';
export {
  CREDIT_COSTS,
  CREDIT_PACK_ANCHORS,
  CREDIT_PACK_STEPS,
  getCreditPackPrice,
  type CreditAction,
} from './credit-costs';
import { CREDIT_COSTS, CREDIT_PACK_ANCHORS, type CreditAction } from './credit-costs';

// ====== Plans ======
export const PLANS = {
  free: {
    id: 'free',
    name: 'חינם',
    nameEn: 'Free',
    price: 0,
    monthlyCredits: 0,
    features: [`${CREDIT_COSTS.visualize} קרדיטים לניסיון`, 'הדמיית חדר', 'כתב כמויות'],
    highlighted: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    nameEn: 'Starter',
    price: PLAN_PRICING.starter.monthlyPrice,
    annualPrice: PLAN_PRICING.starter.annualMonthlyPrice,
    monthlyCredits: PLAN_PRICING.starter.credits,
    features: PLAN_PRICING.starter.features,
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    price: PLAN_PRICING.pro.monthlyPrice,
    annualPrice: PLAN_PRICING.pro.annualMonthlyPrice,
    monthlyCredits: PLAN_PRICING.pro.credits,
    features: PLAN_PRICING.pro.features,
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    nameEn: 'Business',
    price: PLAN_PRICING.business.monthlyPrice,
    annualPrice: PLAN_PRICING.business.annualMonthlyPrice,
    monthlyCredits: PLAN_PRICING.business.credits,
    features: PLAN_PRICING.business.features,
    highlighted: false,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ====== Extra credit packs for active subscribers ======
export const CREDIT_ANCHORS = CREDIT_PACK_ANCHORS;

// ====== Admin emails (bypass credits) ======
const ADMIN_EMAILS = ['guyceza@gmail.com'];

// ====== Server-side functions ======

export interface CreditBalance {
  credits: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  plan: string;
  billingCycle: BillingCycle | null;
  monthlyCredits: number;
  nextReset: string | null;
  periodEnd: string | null;
  scheduledPlan: string | null;
  scheduledBillingCycle: BillingCycle | null;
  scheduledChangeAt: string | null;
}

type CreditRow = {
  viz_credits?: number | null;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
};

type ActiveSubscriptionRow = {
  plan?: string | null;
  vision_subscription?: string | boolean | null;
  payplus_subscription_status?: string | null;
  plan_period_end?: string | null;
};

function hasActivePaidPlanSubscription(user: ActiveSubscriptionRow | null | undefined): boolean {
  if (!user) return false;
  const hasPaidPlan = ['starter', 'pro', 'business'].includes(user.plan || '');
  const visionSubscription = String(user.vision_subscription || '').toLowerCase();
  const hasActiveSubscription =
    visionSubscription === 'active' ||
    visionSubscription === 'true' ||
    user.payplus_subscription_status === 'active';
  const periodIsActive =
    !user.plan_period_end || new Date(user.plan_period_end).getTime() >= Date.now();

  return hasPaidPlan && hasActiveSubscription && periodIsActive;
}

export async function hasActiveAiAssistantSubscription(email: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('plan, vision_subscription, payplus_subscription_status, plan_period_end')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return false;
  return hasActivePaidPlanSubscription(data);
}

function splitCreditBalance(user: CreditRow | null | undefined) {
  const total = user?.viz_credits || 0;
  const subscriptionCredits = user?.subscription_credits || 0;
  const explicitPurchasedCredits = user?.purchased_credits;
  const purchasedCredits = explicitPurchasedCredits ?? Math.max(total - subscriptionCredits, 0);
  return { total, subscriptionCredits, purchasedCredits };
}

/**
 * Get user's credit balance
 */
export async function getCredits(email: string): Promise<CreditBalance> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('viz_credits, subscription_credits, purchased_credits, plan, plan_started_at, vision_subscription, payplus_recurring_uid, payplus_subscription_status, plan_billing_cycle, plan_period_end, scheduled_plan, scheduled_billing_cycle, scheduled_plan_change_at, scheduled_plan_change_status')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return { credits: 0, subscriptionCredits: 0, purchasedCredits: 0, plan: 'free', billingCycle: null, monthlyCredits: 0, nextReset: null, periodEnd: null, scheduledPlan: null, scheduledBillingCycle: null, scheduledChangeAt: null };
  }

  const plan = (data.plan || 'free') as PlanId;
  const planConfig = PLANS[plan] || PLANS.free;

  // Calculate next reset date
  let nextReset: string | null = null;
  if (data.plan_started_at && plan !== 'free') {
    const started = new Date(data.plan_started_at);
    const now = new Date();
    const nextResetDate = new Date(started);
    while (nextResetDate <= now) {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    }
    nextReset = nextResetDate.toISOString();
  }

  const { total, subscriptionCredits, purchasedCredits } = splitCreditBalance(data);

  return {
    credits: total,
    subscriptionCredits,
    purchasedCredits,
    plan,
    billingCycle: inferPlanBillingCycle({
      plan,
      planBillingCycle: data.plan_billing_cycle,
      visionSubscription: data.vision_subscription,
      payplusSubscriptionStatus: data.payplus_subscription_status,
      payplusRecurringUid: data.payplus_recurring_uid,
    }),
    monthlyCredits: planConfig.monthlyCredits,
    nextReset,
    periodEnd: data.plan_period_end,
    scheduledPlan: data.scheduled_plan,
    scheduledBillingCycle: data.scheduled_billing_cycle === 'monthly' || data.scheduled_billing_cycle === 'annual'
      ? data.scheduled_billing_cycle
      : null,
    scheduledChangeAt: data.scheduled_plan_change_status === 'pending' ? data.scheduled_plan_change_at : null,
  };
}

/**
 * Check if user can perform an action (has enough credits)
 */
export async function canPerformAction(email: string, action: CreditAction): Promise<{ allowed: boolean; cost: number; balance: number; isAdmin: boolean; subscriptionRequired?: boolean }> {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return { allowed: true, cost: 0, balance: 999, isAdmin: true };
  }

  const cost = CREDIT_COSTS[action];
  const { credits } = await getCredits(email);

  if (action === 'ai-assistant') {
    const allowed = await hasActiveAiAssistantSubscription(email);
    return {
      allowed,
      cost,
      balance: credits,
      isAdmin: false,
      subscriptionRequired: !allowed,
    };
  }

  return {
    allowed: credits >= cost,
    cost,
    balance: credits,
    isAdmin: false,
  };
}

/**
 * Deduct credits for an action. Returns new balance or throws if insufficient.
 */
export async function deductCredits(email: string, action: CreditAction): Promise<{ newBalance: number; cost: number }> {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return { newBalance: 999, cost: 0 };
  }

  const cost = CREDIT_COSTS[action];
  const supabase = createServiceClient();

  // Atomic deduction using RPC or manual check+update
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('viz_credits, subscription_credits, purchased_credits')
    .eq('email', email.toLowerCase())
    .single();

  if (fetchError || !user) {
    throw new Error('משתמש לא נמצא');
  }

  const { total: currentCredits, subscriptionCredits, purchasedCredits } = splitCreditBalance(user);
  if (currentCredits < cost) {
    throw new Error(`אין מספיק קרדיטים (${currentCredits}/${cost})`);
  }

  const subscriptionDeduction = Math.min(subscriptionCredits, cost);
  const purchasedDeduction = cost - subscriptionDeduction;
  const newSubscriptionCredits = subscriptionCredits - subscriptionDeduction;
  const newPurchasedCredits = Math.max(purchasedCredits - purchasedDeduction, 0);
  const newBalance = currentCredits - cost;
  const { error: updateError } = await supabase
    .from('users')
    .update({
      viz_credits: newBalance,
      subscription_credits: newSubscriptionCredits,
      purchased_credits: newPurchasedCredits,
    })
    .eq('email', email.toLowerCase());

  if (updateError) {
    throw new Error('שגיאה בעדכון קרדיטים');
  }

  // Log transaction
  try {
    await supabase.from('credit_transactions').insert({
      user_email: email.toLowerCase(),
      action,
      amount: -cost,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Failed to log credit transaction:', e); }

  return { newBalance, cost };
}

/**
 * Add credits to user (purchase, plan renewal, admin grant)
 */
export async function addCredits(email: string, amount: number, reason: string): Promise<number> {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('viz_credits, purchased_credits')
    .eq('email', email.toLowerCase())
    .single();

  const currentCredits = user?.viz_credits || 0;
  const currentPurchasedCredits = user?.purchased_credits || 0;
  const newBalance = currentCredits + amount;
  const newPurchasedCredits = currentPurchasedCredits + amount;

  const { error } = await supabase
    .from('users')
    .update({
      viz_credits: newBalance,
      purchased_credits: newPurchasedCredits,
    })
    .eq('email', email.toLowerCase());

  if (error) throw new Error('Failed to add credits');

  // Log transaction
  try {
    await supabase.from('credit_transactions').insert({
      user_email: email.toLowerCase(),
      action: reason,
      amount: amount,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Failed to log credit transaction:', e); }

  return newBalance;
}

/**
 * Set user plan and grant monthly credits
 */
export async function setPlan(email: string, planId: PlanId): Promise<void> {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const supabase = createServiceClient();

  // Get current credits
  const { data: user } = await supabase
    .from('users')
    .select('purchased_credits')
    .eq('email', email.toLowerCase())
    .single();

  const purchasedCredits = user?.purchased_credits || 0;
  const newCredits = purchasedCredits + plan.monthlyCredits;

  await supabase
    .from('users')
    .update({
      plan: planId,
      plan_started_at: new Date().toISOString(),
      viz_credits: newCredits,
      subscription_credits: plan.monthlyCredits,
      purchased_credits: purchasedCredits,
      purchased: true,
      purchased_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase());

  // Log
  if (plan.monthlyCredits > 0) {
    try {
      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `plan_${planId}`,
        amount: plan.monthlyCredits,
        balance_after: newCredits,
        created_at: new Date().toISOString(),
      });
    } catch {}
  }
}

/**
 * Grant trial credits to new user (guest or registered)
 */
export async function grantTrialCredits(email: string, amount: number = 10): Promise<number> {
  return addCredits(email, amount, 'trial');
}
