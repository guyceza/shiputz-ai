import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_PAGE_UID = process.env.PAYPLUS_PAGE_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PayPlusRequest {
  productType: 'premium' | 'vision' | 'premium_plus';
  email: string;
  userId?: string;
  discountCode?: string;
}

// Pricing configuration (in ILS)
// TEST MODE: ₪1 for all products. Restore real prices before go-live:
// premium=299.99, vision=39.99, premium_plus=349.99
const PRICING = {
  premium: { amount: 1, chargeMethod: 1 }, // One-time charge
  vision: { amount: 1, chargeMethod: 3, recurring: true }, // Recurring monthly
  premium_plus: { amount: 1, chargeMethod: 1 }, // One-time (Premium + Vision)
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
              discountPercent = codeData.discount_percent || 20;
              finalAmount = Math.round(pricing.amount * (100 - discountPercent) / 100);
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

      // Callbacks
      refURL_callback: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/api/payplus/webhook`,
      refURL_success: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-success?product=${productType}`,
      refURL_failure: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shipazti.com'}/payment-failed`,

      // Custom data to identify the transaction
      more_info: productType,
      more_info_1: email,
      more_info_2: userId || '',
      more_info_3: discountCode || '',

      // Invoice generation
      initial_invoice: true,

      // Hebrew language
      language_code: 'he',
    };

    // Add recurring settings for subscription products (Vision)
    if ((pricing as any).recurring) {
      payPlusBody.recurring_settings = {
        recurring_type: 2,        // 0=daily, 1=weekly, 2=monthly
        recurring_range: 1,       // every 1 month
        number_of_charges: 0,     // 0 = unlimited (until cancelled)
        recurring_amount: finalAmount,
        start_date: new Date().getDate(), // day of month for recurring charge
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

    // If we have a page_request_uid, append it to the success URL so the success page
    // can verify the payment via IPN (fallback for when webhook doesn't fire)
    // Note: We already set refURL_success in the request, but PayPlus should pass through params
    
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
