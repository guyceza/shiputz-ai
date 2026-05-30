import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// HTML escape to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function brandedEmail(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ef; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Arial, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 52px 18px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 28px; font-weight: 600; color: #1d1d1f; vertical-align: middle;">ShiputzAI</span>
            </td>
          </tr>
          <tr>
            <td style="background: #fffaf0; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 42px rgba(30, 56, 38, 0.14); border: 1px solid #efe2c6;" dir="rtl">
              <div style="height: 12px; background: linear-gradient(90deg, #14b875 0%, #8bd86f 48%, #f0c75d 100%);"></div>
              <div style="padding: 48px 42px 44px; text-align: right;" dir="rtl">
                <h1 style="font-size: 34px; font-weight: 800; color: #142018; margin: 0 0 28px; text-align: center; direction: rtl;">${title}</h1>
                ${body}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 20px; text-align: center;">
              <p style="font-size: 12px; color: #86868b; margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

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

// Shared secret for webhook authentication
const WEBHOOK_SECRET = process.env.PAYPLUS_WEBHOOK_SECRET;

// PayPlus signature verification using Hash header (base64 HMAC-SHA256)
function verifyPayPlusSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = process.env.PAYPLUS_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('PayPlus signature verification skipped: PAYPLUS_SECRET_KEY not configured');
    return true;
  }
  
  if (!signature) {
    return false;
  }
  
  // PayPlus sends base64-encoded HMAC-SHA256 (from WooCommerce plugin)
  const expectedBase64 = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('base64');
  
  // Also compute hex for compatibility
  const expectedHex = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');
  
  // Compare both formats (PayPlus may use either)
  return signature === expectedBase64 || signature === expectedHex;
}

export async function POST(request: NextRequest) {
  try {
    // Clone request to read raw body for signature verification
    const rawBody = await request.text();
    // PayPlus sends signature in "Hash" header (base64 HMAC-SHA256)
    const signature = request.headers.get('hash') || request.headers.get('x-payplus-signature');
    
    // Log all headers for debugging
    const headerObj: Record<string, string> = {};
    request.headers.forEach((value, key) => { headerObj[key] = key.toLowerCase().includes('key') ? '***' : value; });
    
    // Verify webhook authenticity - block unauthorized requests
    if (WEBHOOK_SECRET) {
      // Method 1: Check our custom webhook secret (added as query param or header)
      const urlSecret = new URL(request.url).searchParams.get('secret');
      const headerSecret = request.headers.get('x-webhook-secret');
      if (urlSecret !== WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET) {
        // Method 2: Check PayPlus signature (Hash header)
        if (signature) {
          const isValid = verifyPayPlusSignature(rawBody, signature);
          if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } else {
      }
    } else if (signature) {
      // No webhook secret configured, try PayPlus signature
      const isValid = verifyPayPlusSignature(rawBody, signature);
    } else {
      console.warn('PayPlus webhook: No auth configured (set PAYPLUS_WEBHOOK_SECRET to secure)');
    }
    
    // PayPlus sends callback data as JSON or form-urlencoded
    const contentType = request.headers.get('content-type') || '';
    let data: any;

    // Parse the raw body we already read
    if (contentType.includes('application/json')) {
      data = JSON.parse(rawBody);
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(rawBody);
      data = Object.fromEntries(params);
    } else {
      // Try to parse as JSON anyway
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = { raw: rawBody };
      }
    }


    // PayPlus wraps transaction data inside a "transaction" object
    // Support both flat (root-level) and nested (data.transaction) formats
    const tx = data.transaction || data;

    // Extract transaction details
    const {
      transaction_uid,
      page_request_uid,
      status_code,
      status_description,
      amount,
      more_info,      // productType
      more_info_1,    // email
      more_info_2,    // userId
      more_info_3,    // discountCode
      approval_num,
      voucher_num,
      type,           // For recurring: 'recurring_payment', 'recurring_cancel', etc.
      recurring_id,
    } = tx;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const markPendingCompleted = async () => {
      if (!page_request_uid) return;
      await supabase
        .from('pending_payments')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('page_request_uid', page_request_uid);
    };

    // Extract email from various possible fields (check both tx and root data)
    // For recurring callbacks, PayPlus uses "extra_info" instead of "more_info"
    // and may not include email - try customer_uid lookup as fallback
    let email = more_info_1 || tx.email || tx.customer_email || data.email || data.customer_email || data.more_info_1;
    const productType = more_info || tx.extra_info || data.extra_info || tx.product_type || data.product_type;
    const recurringUid = tx.recurring_uid || tx.recurring_id || recurring_id || data.recurring_uid || data.recurring_id || null;
    const customerUid = tx.customer_uid || data.customer_uid || null;

    // Fallback: if no email found but we have customer_uid, look up customer in PayPlus
    if (!email && (tx.customer_uid || data.customer_uid)) {
      try {
        const customerUid = tx.customer_uid || data.customer_uid;
        const customerRes = await fetch(
          `${process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0'}/Customers/${customerUid}`,
          {
            headers: {
              'api-key': process.env.PAYPLUS_API_KEY || '',
              'secret-key': process.env.PAYPLUS_SECRET_KEY || '',
            },
          }
        );
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          email = customerData.data?.email || customerData.email;
        }
      } catch (e) {
        console.error('PayPlus customer lookup failed:', e);
      }
    }

    // Bug #39: Handle refund webhooks
    if (type === 'refund' || tx.action === 'refund' || tx.status === 'refunded' || data.action === 'refund' || data.status === 'refunded') {
      
      if (email) {
        // Revoke premium/vision access on refund
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            purchased: false,
            vision_subscription: null,
            refunded_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error revoking access after refund:', updateError);
        } else {
        }
      }

      return NextResponse.json({ received: true, status: 'refunded' });
    }

    // Handle recurring subscription cancellation
    // Bug #38: Added more specific field checks based on PayPlus documentation
    if (type === 'recurring_cancel' || tx.action === 'cancel' || tx.status === 'cancelled' || tx.subscription_status === 'cancelled' || data.action === 'cancel' || data.status === 'cancelled') {
      
      if (email) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('payplus_recurring_uid, plan_billing_cycle, plan_period_end, subscription_cancel_at_period_end')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (recurringUid && currentUser?.payplus_recurring_uid && currentUser.payplus_recurring_uid !== recurringUid) {
          return NextResponse.json({ received: true, status: 'ignored_stale_recurring_cancel' });
        }

        if (
          currentUser?.plan_billing_cycle === 'annual' &&
          currentUser.subscription_cancel_at_period_end &&
          currentUser.plan_period_end &&
          new Date(currentUser.plan_period_end) > new Date()
        ) {
          await supabase
            .from('users')
            .update({
              payplus_subscription_status: 'canceled',
              payplus_last_checked_at: new Date().toISOString(),
            })
            .eq('email', email.toLowerCase());

          return NextResponse.json({ received: true, status: 'annual_cancel_at_period_end' });
        }

        // Deactivate Vision subscription
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            vision_subscription: 'canceled',
            vision_canceled_at: new Date().toISOString(),
            payplus_recurring_uid: recurringUid,
            payplus_customer_uid: customerUid,
            payplus_subscription_status: 'canceled',
            plan_billing_cycle: null,
            plan_period_end: null,
            scheduled_plan: null,
            scheduled_billing_cycle: null,
            scheduled_plan_change_at: null,
            scheduled_plan_change_created_at: null,
            scheduled_plan_change_status: null,
            subscription_cancel_at_period_end: false,
            payplus_last_checked_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error deactivating vision subscription:', updateError);
        } else {
        }
      }

      return NextResponse.json({ received: true, status: 'cancelled' });
    }

    // Check if transaction was successful
    // PayPlus status codes: '000' = success (from WooCommerce plugin), or 0 = success
    // Bug #7 fix: Convert to string explicitly to avoid type confusion
    const isSuccess = String(status_code) === '000' || String(status_code) === '0' || tx.status === 'approved' || data.status === 'approved';

    if (!isSuccess) {
      return NextResponse.json({ received: true, status: 'failed' });
    }

    // Extract our custom data
    const userId = more_info_2 || data.user_id;
    const discountCode = more_info_3 || data.discount_code;

    if (!email) {
      return NextResponse.json({ received: true, error: 'No email provided' });
    }

    if (page_request_uid) {
      const { data: existingPayment } = await supabase
        .from('pending_payments')
        .select('status')
        .eq('page_request_uid', page_request_uid)
        .maybeSingle();

      if (existingPayment?.status === 'completed') {
        return NextResponse.json({ received: true, status: 'already_processed' });
      }
    }

    await notifyDiscordPurchase({
      email,
      productType,
      amount,
      source: 'payplus_webhook',
      transactionUid: transaction_uid || voucher_num || approval_num || null,
      pageRequestUid: page_request_uid || null,
      statusDescription: status_description || null,
      supabase,
    });

    // Update user in database based on product type
    // NOTE: DB columns: purchased, purchased_at, vision_subscription,
    //       viz_credits, plan, plan_started_at + credit_transactions table

    // ====== NEW CREDIT SYSTEM ======

    const monthlyToAnnualMatch = productType?.match?.(/^switch_(starter|pro|business)_monthly_to_(starter|pro|business)_annual$/);
    if (monthlyToAnnualMatch) {
      const fromPlan = monthlyToAnnualMatch[1] as PlanId;
      const planId = monthlyToAnnualMatch[2] as PlanId;
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
        try {
          await cancelPayPlusRecurring(oldRecurringUid);
        } catch (error) {
          console.error('Failed to cancel old monthly recurring after annual switch:', error);
          return NextResponse.json({ received: false, error: 'Old recurring cancellation failed' }, { status: 500 });
        }
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

      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `switch_${fromPlan}_monthly_to_${planId}_annual`,
        amount: credits,
        balance_after: newCredits,
        created_at: nowIso,
      });

      await sendPlanEmail(email, planId, credits, supabase);
      await markPendingCompleted();

      return NextResponse.json({
        received: true,
        status: 'success',
        product: productType,
        plan: planId,
        billing_cycle: 'annual',
        period_end: periodEnd.toISOString(),
      });
    }

    // Plan upgrades: charge the current-period price difference now, then update the PayPlus recurring order for the next charge.
    const upgradeMatch = productType?.match?.(/^upgrade_(starter|pro|business)_to_(starter|pro|business)_(monthly|annual)$/);
    if (upgradeMatch) {
      const fromPlan = upgradeMatch[1] as PlanId;
      const planId = upgradeMatch[2] as PlanId;
      const cycle = upgradeMatch[3] as BillingCycle;
      const credits = PLAN_PRICING[planId].credits;

      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, subscription_credits, purchased_credits, payplus_recurring_uid, payplus_customer_uid, plan_billing_cycle, plan_period_start, plan_period_end')
        .eq('email', email.toLowerCase())
        .single();

      if (!currentUser?.payplus_recurring_uid) {
        console.error('PayPlus upgrade missing existing recurring UID', { email, fromPlan, planId });
        return NextResponse.json({ received: false, error: 'Missing existing recurring subscription' }, { status: 500 });
      }

      let recurringUpdate;
      try {
        const nextChargeDate = cycle === 'annual' && currentUser.plan_period_end
          ? new Date(currentUser.plan_period_end)
          : getNextChargeDate(cycle);
        recurringUpdate = await updatePayPlusRecurringPlan(currentUser.payplus_recurring_uid, planId, cycle, {
          startDate: nextChargeDate,
        });
      } catch (error) {
        console.error('PayPlus recurring update failed after upgrade payment:', error);
        return NextResponse.json({ received: false, error: 'Recurring update failed' }, { status: 500 });
      }

      const now = new Date();
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

      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `upgrade_${fromPlan}_to_${planId}_${cycle}`,
        amount: credits,
        balance_after: newCredits,
        created_at: nowIso,
      });

      await sendPlanEmail(email, planId, credits, supabase);
      await markPendingCompleted();

      return NextResponse.json({
        received: true,
        status: 'success',
        product: productType,
        billing_cycle: cycle,
        recurring_next_amount: recurringUpdate.amount,
        recurring_next_charge_date: recurringUpdate.nextChargeDate,
      });
    }

    // Plan subscriptions: plan_starter_monthly, plan_pro_annual, etc.
    const planMatch = productType?.match?.(/^plan_(starter|pro|business)_(monthly|annual)$/);
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

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `plan_${planId}_${cycle}`,
        amount: credits,
        balance_after: newCredits,
        created_at: nowIso,
      });


      // Send plan welcome email
      await sendPlanEmail(email, planId, credits, supabase);
      await markPendingCompleted();

      return NextResponse.json({ received: true, status: 'success', product: productType });
    }

    // Credit slider purchases: credits_50, credits_100, etc.
    const creditsMatch = productType?.match?.(/^credits_(\d+)$/);
    if (creditsMatch) {
      const boughtCredits = parseInt(creditsMatch[1]);

      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, subscription_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();

      const { total: currentCredits, purchasedCredits } = getCreditBuckets(currentUser);
      const newCredits = currentCredits + boughtCredits;
      const newPurchasedCredits = purchasedCredits + boughtCredits;

      await supabase.from('users').update({
        viz_credits: newCredits,
        purchased_credits: newPurchasedCredits,
      }).eq('email', email.toLowerCase());

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `purchase_credits`,
        amount: boughtCredits,
        balance_after: newCredits,
        created_at: new Date().toISOString(),
      });


      // Send credits purchase email
      await sendCreditsEmail(email, boughtCredits, newCredits, supabase);
      await markPendingCompleted();

      return NextResponse.json({ received: true, status: 'success', product: productType });
    }

    // ====== LEGACY HANDLERS ======
    
    // NEW: Pro one-time purchase (₪99 = 4 viz + all tools)
    if (productType === 'pro' || productType === 'pro_monthly' || productType === 'pro_annual') {
      // Get current credits
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();
      
      const currentCredits = currentUser?.viz_credits || 0;
      const proCredits = productType === 'pro' ? 4 : 0; // Pro gives 4 viz credits
      
      const upsertData: any = { 
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: new Date().toISOString(),
        vision_subscription: 'active', // Pro includes everything
        payplus_recurring_uid: recurringUid,
        payplus_customer_uid: customerUid,
        payplus_subscription_status: productType === 'pro_monthly' ? 'active' : null,
        payplus_last_checked_at: new Date().toISOString(),
        ...(proCredits > 0 ? { viz_credits: currentCredits + proCredits } : {}),
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user Pro status:', upsertError);
      } else {
      }
    }
    
    // Visualization pack purchases - add credits
    const PACK_CREDITS: Record<string, number> = { pack_10: 10, pack_30: 30, pack_100: 100 };
    if (PACK_CREDITS[productType]) {
      const credits = PACK_CREDITS[productType];
      // First get current credits
      const { data: currentUser } = await supabase
        .from('users')
        .select('viz_credits, purchased_credits')
        .eq('email', email.toLowerCase())
        .single();
      
      const currentCredits = currentUser?.viz_credits || 0;
      const currentPurchasedCredits = currentUser?.purchased_credits || 0;
      
      const { error: creditError } = await supabase
        .from('users')
        .update({
          viz_credits: currentCredits + credits,
          purchased_credits: currentPurchasedCredits + credits,
        })
        .eq('email', email.toLowerCase());

      if (creditError) {
        console.error('Error adding viz credits:', creditError);
      } else {
      }
    }
    
    // LEGACY: Keep support for old premium/premium_plus purchases
    if (productType === 'premium' || productType === 'premium_plus') {
      const upsertData: any = { 
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: new Date().toISOString(),
      };

      if (productType === 'premium_plus') {
        upsertData.vision_subscription = 'active';
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user premium status:', upsertError);
      } else {
      }
    }

    if (productType === 'vision' || type === 'recurring_payment') {
      const upsertData: any = { 
        email: email.toLowerCase(),
        vision_subscription: 'active',
        payplus_recurring_uid: recurringUid,
        payplus_customer_uid: customerUid,
        payplus_subscription_status: 'active',
        payplus_last_checked_at: new Date().toISOString(),
      };
      
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user vision status:', upsertError);
      } else {
      }
    }

    // Mark discount code as used if provided
    if (discountCode) {
      const { error: discountError } = await supabase
        .from('discount_codes')
        .update({ 
          used_at: new Date().toISOString(),
        })
        .eq('code', discountCode)
        .is('used_at', null);

      if (discountError) {
        console.error('Error marking discount code as used:', discountError);
      }
    }

    // Log the transaction (console only - transactions table doesn't exist yet)

    // Send welcome/purchase confirmation email via Resend (fire-and-forget)
    if (email && (productType === 'pro' || productType === 'pro_monthly' || productType === 'pro_annual' || productType === 'premium' || productType === 'premium_plus')) {
      try {
        const RESEND_KEY = process.env.RESEND_API_KEY;
        if (RESEND_KEY) {
          // Get user name from DB
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('email', email.toLowerCase())
            .single();
          const displayName = escapeHtml(userData?.name || 'משפץ יקר');
          const isPro = productType === 'pro' || productType === 'pro_monthly' || productType === 'pro_annual';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'ShiputzAI <help@shipazti.com>',
              to: email,
              subject: '🎉 ברוך הבא ל-ShiputzAI Pro!',
              html: brandedEmail('ברוך הבא ל-ShiputzAI Pro!', `
                <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${displayName},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">תודה רבה! אנחנו שמחים שבחרת ב-ShiputzAI לניהול השיפוץ שלך.</p>
                <div style="background: #ffffff; border-radius: 18px; padding: 20px; margin: 24px 0; border: 1px solid #eee5d7;">
                  <h3 style="color: #111; margin-top: 0;">✅ מה מחכה לך:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li>מעקב תקציב חכם בזמן אמת</li>
                    <li>סריקת קבלות אוטומטית עם AI</li>
                    <li>ניתוח הצעות מחיר</li>
                    <li>עוזר AI אישי לכל שאלה</li>
                    <li>התראות חכמות לפני חריגות</li>
                    ${isPro ? '<li>4 הדמיות AI + חבילות נוספות</li><li>Shop the Look</li>' : ''}
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">כניסה לדשבורד</a>
                </div>
                <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0; text-align: right;">בהצלחה עם השיפוץ!</p>
              `),
            }),
          });

          // Mark day 0 of purchased sequence as sent to avoid duplicate from cron
          try {
            const welcomeResendId = 'webhook-inline'; // Sentinel: sent inline by webhook
            await supabase.from('email_sequences').upsert({
              user_email: email.toLowerCase(),
              sequence_type: 'purchased',
              day_number: 0,
              status: 'sent',
              sent_at: new Date().toISOString(),
              resend_id: welcomeResendId,
              run_id: 'payplus-webhook',
            }, { onConflict: 'user_email,sequence_type,day_number' });
          } catch (e) { console.error('Failed to mark day 0 as sent:', e); }
        }
      } catch (emailErr) {
        console.error('Failed to send welcome email (non-blocking):', emailErr);
      }
    }

    await markPendingCompleted();

    return NextResponse.json({ 
      received: true, 
      status: 'success',
      email: email,
      product: productType,
    });

  } catch (error) {
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 });
  }
}

// ====== Email helpers for new credit system ======

async function sendPlanEmail(email: string, planId: string, credits: number, supabase: any) {
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return;

    const { data: userData } = await supabase.from('users').select('name').eq('email', email.toLowerCase()).single();
    const name = escapeHtml(userData?.name || 'משפץ יקר');
    const planNames: Record<string, string> = Object.fromEntries(
      Object.entries(PLAN_PRICING).map(([id, plan]) => [id, plan.name])
    );

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: `ברוך הבא לתוכנית ${planNames[planId] || planId}!`,
        html: brandedEmail(`ברוך הבא לתוכנית ${planNames[planId]}!`, `
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">התוכנית הופעלה בהצלחה. קיבלת <strong>${credits} קרדיטים</strong> לחשבון שלך.</p>
          <div style="background: #ffffff; border-radius: 18px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #eee5d7;">
            <div style="font-size: 48px; font-weight: bold; color: #10b981;">${credits}</div>
            <div style="color: #666;">קרדיטים זמינים</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/visualize" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">התחל להדמות</a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0; text-align: right;">קרדיטי המנוי מתאפסים ומתחדשים כל חודש. קרדיטים שנרכשו בנפרד לא מתאפסים. בהצלחה!</p>
        `),
      }),
    });
    const result = await response.json();

    await supabase.from('email_sequences').upsert({
      user_email: email.toLowerCase(),
      sequence_type: 'post_purchase',
      day_number: 0,
      status: result.id ? 'sent' : 'failed',
      sent_at: result.id ? new Date().toISOString() : null,
      resend_id: result.id || null,
      run_id: 'payplus-plan-webhook',
      reason: `plan_${planId}_confirmed`,
      error: result.id ? null : (result.message || 'Failed to send plan welcome email'),
    }, { onConflict: 'user_email,sequence_type,day_number' });

    return result;
  } catch (e) { console.error('Failed to send plan email:', e); }
}

async function sendCreditsEmail(email: string, purchased: number, total: number, supabase: any) {
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return;

    const { data: userData } = await supabase.from('users').select('name').eq('email', email.toLowerCase()).single();
    const name = escapeHtml(userData?.name || 'משפץ יקר');

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: `${purchased} קרדיטים נוספו לחשבון שלך`,
        html: brandedEmail('הקרדיטים נוספו בהצלחה!', `
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">רכשת <strong>${purchased} קרדיטים</strong>. הם זמינים לשימוש מיידי.</p>
          <div style="background: #ffffff; border-radius: 18px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #eee5d7;">
            <div style="font-size: 48px; font-weight: bold; color: #10b981;">${total}</div>
            <div style="color: #666;">סה"כ קרדיטים בחשבון</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/visualize" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">התחל להדמות</a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0; text-align: right;">הקרדיטים לא פגים. בהצלחה עם השיפוץ!</p>
        `),
      }),
    });
  } catch (e) { console.error('Failed to send credits email:', e); }
}

// Also handle GET requests (PayPlus sometimes redirects via GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Verify auth for GET webhook too
  if (WEBHOOK_SECRET) {
    const urlSecret = searchParams.get('secret');
    if (urlSecret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }
  
  const data = Object.fromEntries(searchParams);
  
  // Process directly instead of routing through POST (which reads request.text())
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const email = data.more_info_1 || data.email || data.customer_email;
  const productType = data.more_info || data.product_type;
  const statusCode = data.status_code;
  const isSuccess = String(statusCode) === '0' || data.status === 'approved';
  
  if (!isSuccess || !email) {
    return NextResponse.json({ received: true, status: 'ignored' });
  }

  if (productType === 'premium' || productType === 'premium_plus') {
    const upsertData: any = { 
      email: email.toLowerCase(),
      purchased: true,
      purchased_at: new Date().toISOString(),
    };
    if (productType === 'premium_plus') {
      upsertData.vision_subscription = 'active';
    }
    await supabase.from('users').upsert(upsertData, { onConflict: 'email' });
  }

  if (productType === 'vision') {
    await supabase.from('users').upsert({ 
      email: email.toLowerCase(),
      vision_subscription: 'active',
    }, { onConflict: 'email' });
  }

  return NextResponse.json({ received: true, status: 'success', product: productType });
}
