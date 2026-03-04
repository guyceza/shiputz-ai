import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_PAGE_UID = process.env.PAYPLUS_PAGE_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PayPlusRequest {
  productType: 'pro_monthly' | 'pro_annual' | 'pack_10' | 'pack_30' | 'pack_100' | 'premium' | 'vision' | 'premium_plus';
  email: string;
  userId?: string;
  discountCode?: string;
}

// Pricing configuration (in ILS)
// Purim sale: first month ₪19, then ₪29/month
const PURIM_SALE = true; // Toggle off after Purim
const PURIM_FIRST_MONTH = 19;

const PRICING: Record<string, { amount: number; chargeMethod: number; recurring?: boolean; credits?: number }> = {
  // NEW pricing model
  pro_monthly: { amount: 29, chargeMethod: 3, recurring: true },
  pro_annual: { amount: 228, chargeMethod: 1 }, // one-time annual = ₪19/month
  // Visualization packs (one-time, never expire)
  pack_10: { amount: 29, chargeMethod: 1, credits: 10 },
  pack_30: { amount: 69, chargeMethod: 1, credits: 30 },
  pack_100: { amount: 149, chargeMethod: 1, credits: 100 },
  // LEGACY (keep for existing customers)
  premium: { amount: 299.99, chargeMethod: 1 },
  vision: { amount: 39.99, chargeMethod: 3, recurring: true },
  premium_plus: { amount: 349.99, chargeMethod: 1 },
};

export async function POST(request: NextRequest) {
  try {
    const body: PayPlusRequest = await request.json();
    const { productType, email, userId, discountCode } = body;

    if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_PAGE_UID) {
      console.error('PayPlus credentials not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    if (!productType || !email) {
      return NextResponse.json({ error: 'Missing required fields: productType, email' }, { status: 400 });
    }

    const pricing = PRICING[productType];
    if (!pricing) {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // Apply discount if code provided
    let finalAmount = pricing.amount;
    let discountPercent = 0;
    
    if (discountCode) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Validate discount code
      const { data: codeData, error: codeError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode.toUpperCase())
        .single();
      
      if (!codeError && codeData) {
        // Check if code belongs to this email
        if (codeData.user_email.toLowerCase() === email.toLowerCase()) {
          // Check if not used
          if (!codeData.used_at) {
            // Check if not expired
            if (!codeData.expires_at || new Date(codeData.expires_at) > new Date()) {
              // Apply discount!
              discountPercent = codeData.discount_percent || 30;
              const rawAmount = pricing.amount * (100 - discountPercent) / 100;
              // For subscription (≤₪100): round to whole number. For one-time: .99 pricing
              finalAmount = pricing.amount <= 100 
                ? Math.round(rawAmount) 
                : Math.floor(rawAmount / 10) * 10 + 9.99;
              // Minimum ₪1 — PayPlus doesn't accept ₪0
              if (finalAmount < 1) finalAmount = 1;
              console.log(`Discount applied: ${discountPercent}% off, final amount: ${finalAmount}`);
            } else {
              console.log('Discount code expired');
            }
          } else {
            console.log('Discount code already used');
          }
        } else {
          console.log('Discount code belongs to different email');
        }
      } else {
        console.log('Discount code not found:', discountCode);
      }
    }

    // Build PayPlus request
    const payPlusBody: any = {
      payment_page_uid: PAYPLUS_PAGE_UID,
      charge_method: pricing.chargeMethod,
      amount: finalAmount,
      currency_code: 'ILS',
      sendEmailApproval: true,
      sendEmailFailure: false,
      
      // Customer info
      customer: {
        customer_name: email.split('@')[0],
        email: email,
      },

      // Callbacks — per PayPlus docs, refURL_callback MUST be in the API call
      refURL_success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-success?product=${productType}`,
      refURL_failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-failed`,
      refURL_callback: `https://shipazti.com/api/payplus/webhook?secret=${process.env.PAYPLUS_WEBHOOK_SECRET || ''}`,

      // Custom data to identify the transaction
      // Normalize product type for webhook processing
      more_info: productType === 'pro_monthly' || productType === 'pro_annual' ? productType : productType,
      more_info_1: email,
      more_info_2: userId || '',
      more_info_3: discountCode || '',

      // Invoice generation
      initial_invoice: true,

      // Hebrew language
      language_code: 'he',
    };

    // Add recurring settings for subscription products (Vision)
    // Per PayPlus docs: charge_method 3 requires recurring_settings object
    if ((pricing as any).recurring) {
      // Purim sale: first month at intro price, then regular price
      const isProMonthly = productType === 'pro_monthly';
      const usePurimPrice = PURIM_SALE && isProMonthly && finalAmount === pricing.amount; // Only if no other discount applied
      
      if (usePurimPrice) {
        payPlusBody.amount = PURIM_FIRST_MONTH; // First charge = ₪19
      }
      
      payPlusBody.recurring_settings = {
        instant_first_payment: true,       // Charge immediately on signup
        recurring_type: 2,                 // 0=daily, 1=weekly, 2=monthly
        recurring_range: 1,                // Every 1 month
        number_of_charges: 0,              // 0 = unlimited (until cancelled)
        start_date_on_payment_date: true,  // Start recurring on payment date
        start_date: new Date().getDate(),  // Day of month for recurring
        jump_payments: 0,                  // No free trial period
        successful_invoice: true,          // Auto-generate invoice after each charge
        customer_failure_email: true,      // Email customer on failed charge
        send_customer_success_email: true, // Email customer on successful charge
        // Recurring charges at full price (₪29), first charge is the amount above
        ...(usePurimPrice ? { recurring_amount: pricing.amount } : {}),
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
        error: result.message || result.results?.description || 'Payment service error' 
      }, { status: 400 });
    }

    console.log('PayPlus response:', result);

    const pageRequestUid = result.data?.page_request_uid;

    // Save pending payment for cron verification (safety net if user closes browser)
    if (pageRequestUid) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('pending_payments').upsert({
        page_request_uid: pageRequestUid,
        email: email.toLowerCase(),
        product_type: productType,
        amount: finalAmount,
        status: 'pending',
      }, { onConflict: 'page_request_uid' }).then(({ error }) => {
        if (error) console.error('Error saving pending payment:', error);
      });
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
