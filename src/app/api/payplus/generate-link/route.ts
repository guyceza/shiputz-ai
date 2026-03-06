import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_PAGE_UID = process.env.PAYPLUS_PAGE_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Credit slider pricing — same anchors as frontend
const CREDIT_ANCHORS = [
  { credits: 10, price: 10 },
  { credits: 20, price: 19 },
  { credits: 50, price: 42 },
  { credits: 100, price: 75 },
  { credits: 200, price: 129 },
  { credits: 300, price: 179 },
];

function getCreditPrice(credits: number): number {
  if (credits <= CREDIT_ANCHORS[0].credits) return CREDIT_ANCHORS[0].price;
  const last = CREDIT_ANCHORS[CREDIT_ANCHORS.length - 1];
  if (credits >= last.credits) return Math.round(credits * (last.price / last.credits));
  for (let i = 0; i < CREDIT_ANCHORS.length - 1; i++) {
    if (credits >= CREDIT_ANCHORS[i].credits && credits <= CREDIT_ANCHORS[i + 1].credits) {
      const t = (credits - CREDIT_ANCHORS[i].credits) / (CREDIT_ANCHORS[i + 1].credits - CREDIT_ANCHORS[i].credits);
      return Math.round(CREDIT_ANCHORS[i].price + t * (CREDIT_ANCHORS[i + 1].price - CREDIT_ANCHORS[i].price));
    }
  }
  return 0;
}

// Plan pricing
const PLAN_PRICING: Record<string, { monthly: number; annual: number; credits: number }> = {
  starter: { monthly: 29, annual: 15, credits: 50 },
  pro: { monthly: 79, annual: 39, credits: 200 },
  business: { monthly: 199, annual: 99, credits: 600 },
};

// Legacy pricing (keep for old customers)
const LEGACY_PRICING: Record<string, { amount: number; chargeMethod: number }> = {
  pro: { amount: 99, chargeMethod: 1 },
  pack_10: { amount: 29, chargeMethod: 1 },
  pack_30: { amount: 69, chargeMethod: 1 },
  pack_100: { amount: 149, chargeMethod: 1 },
  premium: { amount: 299.99, chargeMethod: 1 },
  vision: { amount: 39.99, chargeMethod: 1 },
  premium_plus: { amount: 349.99, chargeMethod: 1 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productType, email, billing, discountCode } = body;

    if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_PAGE_UID) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    if (!productType || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let amount = 0;
    let chargeMethod = 1; // 1 = one-time
    let isRecurring = false;
    let description = '';

    // NEW: Plan subscriptions (plan_starter_monthly, plan_pro_annual, etc.)
    const planMatch = productType.match(/^plan_(starter|pro|business)_(monthly|annual)$/);
    if (planMatch) {
      const planId = planMatch[1];
      const cycle = planMatch[2] as 'monthly' | 'annual';
      const plan = PLAN_PRICING[planId];
      
      if (cycle === 'annual') {
        amount = plan.annual * 12; // Charge full year
        description = `תוכנית ${planId} — שנתית (${plan.credits} קרדיטים/חודש)`;
      } else {
        amount = plan.monthly;
        isRecurring = true;
        chargeMethod = 3; // recurring
        description = `תוכנית ${planId} — חודשית (${plan.credits} קרדיטים/חודש)`;
      }
    }

    // NEW: Credit slider purchase (credits_50, credits_100, etc.)
    const creditsMatch = productType.match(/^credits_(\d+)$/);
    if (creditsMatch) {
      const credits = parseInt(creditsMatch[1]);
      if (credits < 10 || credits > 300) {
        return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
      }
      amount = getCreditPrice(credits);
      description = `${credits} קרדיטים`;
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
    const payPlusBody: any = {
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
      refURL_success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-success?product=${productType}`,
      refURL_failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-failed`,
      refURL_callback: `https://shipazti.com/api/payplus/webhook?secret=${process.env.PAYPLUS_WEBHOOK_SECRET || ''}`,
      more_info: productType,
      more_info_1: email,
      more_info_2: billing || '',
      more_info_3: discountCode || '',
      initial_invoice: true,
      language_code: 'he',
    };

    if (description) {
      payPlusBody.product_name = description;
    }

    // Recurring settings for monthly plans
    if (isRecurring) {
      payPlusBody.recurring_settings = {
        instant_first_payment: true,
        recurring_type: 2,
        recurring_range: 1,
        number_of_charges: 0,
        start_date_on_payment_date: true,
        start_date: new Date().getDate(),
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
        start_date_on_payment_date: true,
        start_date: new Date().getDate(),
      };
    }

    console.log('PayPlus request:', JSON.stringify(payPlusBody, null, 2));

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
      console.error('PayPlus error:', result);
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
        product_type: productType,
        amount,
        status: 'pending',
      }, { onConflict: 'page_request_uid' });
      // Fire-and-forget, ignore errors
    }

    return NextResponse.json({
      success: true,
      payment_url: result.data?.payment_page_link,
      transaction_uid: pageRequestUid,
    });

  } catch (error) {
    console.error('PayPlus generate-link error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
