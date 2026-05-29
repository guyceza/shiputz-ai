import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRequestIp, sanitizeAttribution } from '@/lib/attribution-server';
import { verifyUserEmail } from '@/lib/api-auth';
import { CREDIT_PACK_MAX, CREDIT_PACK_MIN, getCreditPackPrice } from '@/lib/credit-costs';
import {
  getBillingCycleMonths,
  getPlanChangeState,
  getPlanCheckoutAmount,
  getNextChargeDate,
  inferPlanBillingCycle,
  PLAN_PRICING,
  toPayPlusDate,
  type BillingCycle,
  type PlanId,
} from '@/lib/plan-pricing';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_PAGE_UID = process.env.PAYPLUS_PAGE_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getNextMonthlyChargeDate(): string {
  return toPayPlusDate(getNextChargeDate('monthly'));
}

type UserSubscriptionState = {
  plan?: string | null;
  vision_subscription?: string | boolean | null;
  plan_period_end?: string | null;
};

function hasActiveSubscriptionForCreditPacks(user: UserSubscriptionState | null | undefined): boolean {
  if (!user?.plan || !(user.plan in PLAN_PRICING)) return false;
  const visionSubscription = String(user.vision_subscription || '').toLowerCase();
  if (visionSubscription !== 'active' && visionSubscription !== 'true') return false;
  if (user.plan_period_end && new Date(user.plan_period_end).getTime() < Date.now()) return false;
  return true;
}

type PayPlusBody = {
  payment_page_uid: string;
  charge_method: number;
  amount: number;
  currency_code: string;
  sendEmailApproval: boolean;
  sendEmailFailure: boolean;
  customer: {
    customer_name: string;
    email: string;
  };
  refURL_success: string;
  refURL_failure: string;
  refURL_callback: string;
  more_info: string;
  more_info_1: string;
  more_info_2: string;
  more_info_3: string;
  initial_invoice: boolean;
  language_code: string;
  product_name?: string;
  recurring_settings?: {
    instant_first_payment: boolean;
    recurring_type: number;
    recurring_range: number;
    number_of_charges: number;
    start_date: string;
    jump_payments?: number;
    successful_invoice?: boolean;
    customer_failure_email?: boolean;
    send_customer_success_email?: boolean;
  };
};

// Legacy pricing (keep for old customers)
const LEGACY_PRICING: Record<string, { amount: number; chargeMethod: number }> = {
  pro: { amount: 99, chargeMethod: 1 },
  premium: { amount: 299.99, chargeMethod: 1 },
  vision: { amount: 39.99, chargeMethod: 1 },
  premium_plus: { amount: 349.99, chargeMethod: 1 },
};

const LEGACY_CREDIT_PACKS: Record<string, number> = {
  pack_10: 10,
  pack_30: 30,
  pack_100: 100,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productType, email, billing, discountCode, attribution } = body;

    if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_PAGE_UID) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    if (!productType || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!(await verifyUserEmail(request, email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let amount = 0;
    let chargeMethod = 1; // 1 = one-time
    let isRecurring = false;
    let description = '';
    let payPlusProductType = productType;

    // NEW: Plan subscriptions (plan_starter_monthly, plan_pro_annual, etc.)
    const planMatch = productType.match(/^plan_(starter|pro|business)_(monthly|annual)$/);
    if (planMatch) {
      const planId = planMatch[1];
      const cycle = planMatch[2] as BillingCycle;
      const plan = PLAN_PRICING[planId as PlanId];

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: currentUser } = await supabase
        .from('users')
        .select('plan, vision_subscription, payplus_subscription_status, payplus_recurring_uid, plan_billing_cycle')
        .eq('email', email.toLowerCase())
        .single();

      const currentVisionSubscription = String(currentUser?.vision_subscription || '').toLowerCase();
      if (currentUser?.plan && currentUser.plan !== 'free' && (currentVisionSubscription === 'active' || currentVisionSubscription === 'true')) {
        const currentPlan = PLAN_PRICING[currentUser.plan as PlanId];
        const currentBillingCycle = inferPlanBillingCycle({
          plan: currentUser.plan,
          planBillingCycle: currentUser.plan_billing_cycle,
          visionSubscription: currentUser.vision_subscription,
          payplusSubscriptionStatus: currentUser.payplus_subscription_status,
          payplusRecurringUid: currentUser.payplus_recurring_uid,
        });
        const changeState = getPlanChangeState({
          currentPlanId: currentUser.plan,
          currentBillingCycle,
          targetPlanId: planId as PlanId,
          targetBillingCycle: cycle,
        });

        if (changeState.current) {
          return NextResponse.json({ error: 'You are already on this plan' }, { status: 409 });
        }

        if (!changeState.available || !currentPlan) {
          return NextResponse.json({
            error: 'This plan change is not available through checkout',
          }, { status: 409 });
        }

        if (currentBillingCycle === 'monthly' && cycle === 'monthly' && changeState.upgrade) {
          amount = Math.max(1, plan.monthlyPrice - currentPlan.monthlyPrice);
          payPlusProductType = `upgrade_${currentUser.plan}_to_${planId}_monthly`;
          description = `שדרוג מ-${currentUser.plan} ל-${planId} - הפרש לחודש הנוכחי`;
        } else if (currentBillingCycle === 'monthly' && cycle === 'annual') {
          amount = getPlanCheckoutAmount(plan.id, 'annual');
          isRecurring = true;
          chargeMethod = 3;
          payPlusProductType = `switch_${currentUser.plan}_monthly_to_${planId}_annual`;
          description = `מעבר מ-${currentUser.plan} חודשי ל-${planId} שנתי`;
        } else if (currentBillingCycle === 'annual' && cycle === 'annual' && changeState.upgrade) {
          amount = Math.max(1, plan.annualTotalPrice - currentPlan.annualTotalPrice);
          payPlusProductType = `upgrade_${currentUser.plan}_to_${planId}_annual`;
          description = `שדרוג שנתי מ-${currentUser.plan} ל-${planId} - הפרש לתקופה הנוכחית`;
        } else {
          return NextResponse.json({
            error: 'This plan change is not available through checkout',
          }, { status: 409 });
        }
      } else if (cycle === 'annual') {
        amount = getPlanCheckoutAmount(plan.id, 'annual');
        isRecurring = true;
        chargeMethod = 3;
        description = `תוכנית ${planId} - שנתית (${plan.credits} קרדיטים/חודש)`;
      } else {
        amount = plan.monthlyPrice;
        isRecurring = true;
        chargeMethod = 3; // recurring
        description = `תוכנית ${planId} - חודשית (${plan.credits} קרדיטים/חודש)`;
      }
    }

    // NEW: Credit slider purchase (credits_50, credits_100, etc.)
    const creditsMatch = productType.match(/^credits_(\d+)$/);
    if (creditsMatch) {
      const credits = parseInt(creditsMatch[1]);
      if (credits < CREDIT_PACK_MIN || credits > CREDIT_PACK_MAX) {
        return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: currentUser } = await supabase
        .from('users')
        .select('plan, vision_subscription, plan_period_end')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!hasActiveSubscriptionForCreditPacks(currentUser)) {
        return NextResponse.json({
          error: 'Extra credits are available only for active subscribers',
        }, { status: 403 });
      }

      amount = getCreditPackPrice(credits);
      description = `${credits} קרדיטים נוספים למנוי`;
    }

    if (!amount && LEGACY_CREDIT_PACKS[productType]) {
      const credits = LEGACY_CREDIT_PACKS[productType];
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: currentUser } = await supabase
        .from('users')
        .select('plan, vision_subscription, plan_period_end')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!hasActiveSubscriptionForCreditPacks(currentUser)) {
        return NextResponse.json({
          error: 'Extra credits are available only for active subscribers',
        }, { status: 403 });
      }

      amount = getCreditPackPrice(credits);
      description = `${credits} קרדיטים נוספים למנוי`;
    }

    // LEGACY support
    if (!amount && LEGACY_PRICING[productType]) {
      const legacy = LEGACY_PRICING[productType];
      amount = legacy.amount;
      chargeMethod = legacy.chargeMethod;
    }

    if (!amount) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // Apply discount code if provided
    let discountPercent = 0;
    if (discountCode) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: codeData } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .single();

      if (codeData && !codeData.used_at && codeData.user_email?.toLowerCase() === email.toLowerCase()) {
        if (!codeData.expires_at || new Date(codeData.expires_at) > new Date()) {
          discountPercent = codeData.discount_percent || 30;
          amount = Math.max(1, Math.round(amount * (100 - discountPercent) / 100));
        }
      }
    }

    // Build PayPlus request
    const payPlusBody: PayPlusBody = {
      payment_page_uid: PAYPLUS_PAGE_UID,
      charge_method: chargeMethod,
      amount,
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: false,
      customer: {
        customer_name: email.split('@')[0],
        email,
      },
      refURL_success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-success?product=${payPlusProductType}`,
      refURL_failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-failed`,
      refURL_callback: `https://shipazti.com/api/payplus/webhook?secret=${process.env.PAYPLUS_WEBHOOK_SECRET || ''}`,
      more_info: payPlusProductType,
      more_info_1: email,
      more_info_2: billing || '',
      more_info_3: discountCode || '',
      initial_invoice: true,
      language_code: 'he',
    };

    if (description) {
      payPlusBody.product_name = description;
    }

    // Recurring settings for monthly and annual plans.
    if (isRecurring) {
      const recurringCycle = payPlusProductType.endsWith('_annual') ? 'annual' : 'monthly';
      payPlusBody.recurring_settings = {
        instant_first_payment: true,
        recurring_type: 2,
        recurring_range: getBillingCycleMonths(recurringCycle),
        number_of_charges: 0,
        start_date: toPayPlusDate(getNextChargeDate(recurringCycle)),
        jump_payments: 0,
        successful_invoice: true,
        customer_failure_email: true,
        send_customer_success_email: true,
      };
    }

    // Legacy vision recurring
    if (productType === 'vision') {
      payPlusBody.charge_method = 3;
      payPlusBody.recurring_settings = {
        instant_first_payment: true,
        recurring_type: 2,
        recurring_range: 1,
        number_of_charges: 0,
        start_date: getNextMonthlyChargeDate(),
      };
    }


    const response = await fetch(`${PAYPLUS_BASE_URL}/PaymentPages/generateLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': PAYPLUS_API_KEY,
        'secret-key': PAYPLUS_SECRET_KEY,
      },
      body: JSON.stringify(payPlusBody),
    });

    const result = await response.json();

    if (!response.ok || result.results?.status === 'error') {
      return NextResponse.json({
        error: result.message || result.results?.description || 'Payment service error',
      }, { status: 400 });
    }

    const pageRequestUid = result.data?.page_request_uid;

    // Save pending payment
    if (pageRequestUid) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('pending_payments').upsert({
        page_request_uid: pageRequestUid,
        email: email.toLowerCase(),
        product_type: payPlusProductType,
        amount,
        status: 'pending',
      }, { onConflict: 'page_request_uid' });

      const cleanAttribution = sanitizeAttribution(attribution);
      if (cleanAttribution) {
        await supabase.from('payment_attribution').upsert({
          page_request_uid: pageRequestUid,
          email: email.toLowerCase(),
          product_type: payPlusProductType,
          amount,
          ...cleanAttribution,
          ip_address: getRequestIp(request.headers),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'page_request_uid' });
      }
      // Fire-and-forget, ignore errors
    }

    return NextResponse.json({
      success: true,
      payment_url: result.data?.payment_page_link,
      transaction_uid: pageRequestUid,
    });

  } catch {
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
