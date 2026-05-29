import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyDiscordPurchase } from '@/lib/discord-purchase-alerts';
import {
  getBillingPeriodEnd,
  getNextChargeDate,
  PLAN_PRICING,
  type BillingCycle,
  type PlanId,
} from '@/lib/plan-pricing';
import {
  cancelPayPlusRecurring,
  updatePayPlusRecurringPlan,
} from '@/lib/payplus-recurring';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

/**
 * POST /api/payplus/check
 * 
 * Called from the payment-success page to verify the transaction via PayPlus IPN.
 * This is a fallback for when the webhook callback doesn't fire.
 * 
 * Body: { page_request_uid: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { page_request_uid, email: clientEmail, product: clientProduct } = await request.json();

    if (!page_request_uid) {
      return NextResponse.json({ error: 'Missing page_request_uid' }, { status: 400 });
    }

    if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Call PayPlus IPN endpoint to get transaction status
    const ipnResponse = await fetch(`${PAYPLUS_BASE_URL}/PaymentPages/ipn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': PAYPLUS_API_KEY,
        'secret-key': PAYPLUS_SECRET_KEY,
      },
      body: JSON.stringify({ payment_request_uid: page_request_uid }),
    });

    const ipnData = await ipnResponse.json();

    // Check if IPN call itself succeeded
    if (ipnData.results?.status === 'error') {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        description: ipnData.results?.description || 'Transaction not found',
      });
    }

    // PayPlus IPN returns transaction data directly in ipnData.data
    const tx = ipnData.data || {};
    const statusCode = tx.status_code;
    const isSuccess = String(statusCode) === '000' || String(statusCode) === '0' || tx.status === 'approved';

    if (!isSuccess) {
      return NextResponse.json({ 
        success: false, 
        status: 'pending',
        status_code: statusCode,
        description: tx.status_description || 'Transaction not completed yet',
      });
    }

    // Extract transaction details
    // For recurring, PayPlus uses extra_info instead of more_info and may not include email
    let email = tx.more_info_1 || tx.customer_email || tx.email;
    const productType = tx.more_info || tx.extra_info || tx.product_type || clientProduct;
    const recurringUid = tx.recurring_uid || tx.recurring_id || null;
    const customerUid = tx.customer_uid || null;

    // Fallback: look up customer email via customer_uid
    if (!email && tx.customer_uid) {
      try {
        const custRes = await fetch(
          `${PAYPLUS_BASE_URL}/Customers/${tx.customer_uid}`,
          { headers: { 'api-key': PAYPLUS_API_KEY!, 'secret-key': PAYPLUS_SECRET_KEY! } }
        );
        if (custRes.ok) {
          const custData = await custRes.json();
          email = custData.data?.email || custData.email;
        }
      } catch (e) {
        console.error('IPN check: customer lookup failed:', e);
      }
    }

    // Last fallback: use email/product from client request
    if (!email && clientEmail) {
      email = clientEmail;
    }

    if (!email) {
      return NextResponse.json({ success: true, status: 'success', warning: 'No email found' });
    }

    // Update user in database (same logic as webhook)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: pendingPayment } = await supabase
      .from('pending_payments')
      .select('status, amount, product_type')
      .eq('page_request_uid', page_request_uid)
      .maybeSingle();

    if (pendingPayment?.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'already_processed',
        email,
        product: productType || pendingPayment.product_type,
      });
    }

    const effectiveProductType = productType || pendingPayment?.product_type;
    const markCompleted = async () => {
      if (!page_request_uid) return;
      await supabase
        .from('pending_payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('page_request_uid', page_request_uid);
    };

    const switchMatch = effectiveProductType?.match?.(/^switch_(starter|pro|business)_monthly_to_(starter|pro|business)_annual$/);
    if (switchMatch) {
      const planId = switchMatch[2] as PlanId;
      const credits = PLAN_PRICING[planId].credits;
      const now = new Date();
      const periodEnd = getBillingPeriodEnd(now, 'annual');
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, subscription_credits, purchased_credits, payplus_recurring_uid, payplus_customer_uid')
        .eq('email', email.toLowerCase())
        .single();

      const oldRecurringUid = currentUser?.payplus_recurring_uid;
      if (oldRecurringUid && oldRecurringUid !== recurringUid) {
        await cancelPayPlusRecurring(oldRecurringUid);
      }

      const { purchasedCredits } = getCreditBuckets(currentUser);
      const newCredits = purchasedCredits + credits;
      const nowIso = now.toISOString();
      await supabase.from('users').upsert({
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: nowIso,
        plan: planId,
        plan_started_at: nowIso,
        plan_billing_cycle: 'annual',
        plan_period_start: nowIso,
        plan_period_end: periodEnd.toISOString(),
        vision_subscription: 'active',
        viz_credits: newCredits,
        subscription_credits: credits,
        purchased_credits: purchasedCredits,
        payplus_recurring_uid: recurringUid,
        payplus_customer_uid: customerUid || currentUser?.payplus_customer_uid,
        payplus_subscription_status: 'active',
        payplus_recurring_interval_months: 12,
        payplus_last_checked_at: nowIso,
        scheduled_plan: null,
        scheduled_billing_cycle: null,
        scheduled_plan_change_at: null,
        scheduled_plan_change_created_at: null,
        scheduled_plan_change_status: null,
        subscription_cancel_at_period_end: false,
      }, { onConflict: 'email' });
      await markCompleted();
      return NextResponse.json({ success: true, status: 'success', email, product: effectiveProductType });
    }

    const upgradeMatch = effectiveProductType?.match?.(/^upgrade_(starter|pro|business)_to_(starter|pro|business)_(monthly|annual)$/);
    if (upgradeMatch) {
      const planId = upgradeMatch[2] as PlanId;
      const cycle = upgradeMatch[3] as BillingCycle;
      const credits = PLAN_PRICING[planId].credits;
      const now = new Date();

      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, subscription_credits, purchased_credits, payplus_recurring_uid, payplus_customer_uid, plan_period_start, plan_period_end')
        .eq('email', email.toLowerCase())
        .single();

      if (!currentUser?.payplus_recurring_uid) {
        return NextResponse.json({ error: 'Missing existing recurring subscription' }, { status: 500 });
      }

      const nextChargeDate = cycle === 'annual' && currentUser.plan_period_end
        ? new Date(currentUser.plan_period_end)
        : getNextChargeDate(cycle);
      await updatePayPlusRecurringPlan(currentUser.payplus_recurring_uid, planId, cycle, {
        startDate: nextChargeDate,
      });

      const currentAnnualPeriodEnd = currentUser.plan_period_end ? new Date(currentUser.plan_period_end) : null;
      const periodEnd = cycle === 'annual' && currentAnnualPeriodEnd && currentAnnualPeriodEnd > now
        ? currentAnnualPeriodEnd
        : getBillingPeriodEnd(now, cycle);
      const { purchasedCredits } = getCreditBuckets(currentUser);
      const newCredits = purchasedCredits + credits;
      const nowIso = now.toISOString();
      await supabase.from('users').upsert({
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: nowIso,
        plan: planId,
        plan_started_at: nowIso,
        plan_billing_cycle: cycle,
        plan_period_start: cycle === 'annual' && currentUser.plan_period_start ? currentUser.plan_period_start : nowIso,
        plan_period_end: periodEnd.toISOString(),
        vision_subscription: 'active',
        viz_credits: newCredits,
        subscription_credits: credits,
        purchased_credits: purchasedCredits,
        payplus_recurring_uid: currentUser.payplus_recurring_uid,
        payplus_customer_uid: currentUser.payplus_customer_uid || customerUid,
        payplus_subscription_status: 'active',
        payplus_recurring_interval_months: cycle === 'annual' ? 12 : 1,
        payplus_last_checked_at: nowIso,
        scheduled_plan: null,
        scheduled_billing_cycle: null,
        scheduled_plan_change_at: null,
        scheduled_plan_change_created_at: null,
        scheduled_plan_change_status: null,
        subscription_cancel_at_period_end: false,
      }, { onConflict: 'email' });
      await markCompleted();
      return NextResponse.json({ success: true, status: 'success', email, product: effectiveProductType });
    }

    const planMatch = effectiveProductType?.match?.(/^plan_(starter|pro|business)_(monthly|annual)$/);
    if (planMatch) {
      const planId = planMatch[1] as PlanId;
      const cycle = planMatch[2] as BillingCycle;
      const credits = PLAN_PRICING[planId].credits;
      const now = new Date();
      const periodEnd = getBillingPeriodEnd(now, cycle);
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, subscription_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();
      const { purchasedCredits } = getCreditBuckets(currentUser);
      const newCredits = purchasedCredits + credits;
      const nowIso = now.toISOString();
      await supabase.from('users').upsert({
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: nowIso,
        plan: planId,
        plan_started_at: nowIso,
        plan_billing_cycle: cycle,
        plan_period_start: nowIso,
        plan_period_end: periodEnd.toISOString(),
        vision_subscription: 'active',
        viz_credits: newCredits,
        subscription_credits: credits,
        purchased_credits: purchasedCredits,
        payplus_recurring_uid: recurringUid,
        payplus_customer_uid: customerUid,
        payplus_subscription_status: 'active',
        payplus_recurring_interval_months: cycle === 'annual' ? 12 : 1,
        payplus_last_checked_at: nowIso,
        scheduled_plan: null,
        scheduled_billing_cycle: null,
        scheduled_plan_change_at: null,
        scheduled_plan_change_created_at: null,
        scheduled_plan_change_status: null,
        subscription_cancel_at_period_end: false,
      }, { onConflict: 'email' });
      await markCompleted();
      return NextResponse.json({ success: true, status: 'success', email, product: effectiveProductType });
    }

    const creditsMatch = effectiveProductType?.match?.(/^credits_(\d+)$/);
    if (creditsMatch) {
      const boughtCredits = parseInt(creditsMatch[1]);
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();
      const currentCredits = currentUser?.viz_credits || 0;
      const currentPurchasedCredits = currentUser?.purchased_credits || 0;
      await supabase
        .from('users')
        .update({
          viz_credits: currentCredits + boughtCredits,
          purchased_credits: currentPurchasedCredits + boughtCredits,
        })
        .eq('email', email.toLowerCase());
      await markCompleted();
      return NextResponse.json({ success: true, status: 'success', email, product: effectiveProductType });
    }

    if (productType === 'pro' || productType === 'premium' || productType === 'premium_plus' || productType === 'pro_monthly' || productType === 'pro_annual') {
      const upsertData: any = {
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: new Date().toISOString(),
      };
      if (productType === 'premium_plus' || productType === 'pro_monthly' || productType === 'pro_annual') {
        upsertData.vision_subscription = 'active';
      }
      const { error } = await supabase.from('users').upsert(upsertData, { onConflict: 'email' });
      if (error) {
        console.error('IPN check: Error upserting:', error);
      } else {
      }
    }

    if (productType === 'vision') {
      const { error } = await supabase.from('users').upsert({
        email: email.toLowerCase(),
        vision_subscription: 'active',
      }, { onConflict: 'email' });
      if (error) {
        console.error('IPN check: Error upserting vision:', error);
      } else {
      }
    }

    // Handle pack purchases
    const PACK_CREDITS: Record<string, number> = { pack_10: 10, pack_30: 30, pack_100: 100 };
    if (PACK_CREDITS[productType]) {
      const credits = PACK_CREDITS[productType];
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();
      
      const currentCredits = currentUser?.viz_credits || 0;
      const currentPurchasedCredits = currentUser?.purchased_credits || 0;
      await supabase
        .from('users')
        .update({
          viz_credits: currentCredits + credits,
          purchased_credits: currentPurchasedCredits + credits,
        })
        .eq('email', email.toLowerCase());
      
    }

    if (pendingPayment?.status !== 'completed') {
      await notifyDiscordPurchase({
        email,
        productType: productType || pendingPayment?.product_type,
        amount: tx.amount || tx.amount_pay || pendingPayment?.amount,
        source: 'payplus_check',
        transactionUid: tx.transaction_uid || tx.voucher_num || tx.approval_num || null,
        pageRequestUid: page_request_uid,
        statusDescription: tx.status_description || null,
        supabase,
      });
    }

    // Mark pending payment as completed (so cron doesn't re-process)
    if (page_request_uid) {
      await supabase
        .from('pending_payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('page_request_uid', page_request_uid);
    }

    return NextResponse.json({
      success: true,
      status: 'success',
      email,
      product: productType,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to check payment' }, { status: 500 });
  }
}
