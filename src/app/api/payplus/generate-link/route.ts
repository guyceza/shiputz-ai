import { NextRequest, NextResponse } from 'next/server';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_PAGE_UID = process.env.PAYPLUS_PAGE_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

interface PayPlusRequest {
  productType: 'premium' | 'vision' | 'bundle';
  email: string;
  userId?: string;
  discountCode?: string;
}

// Pricing configuration (in ILS)
const PRICING = {
  premium: { amount: 149, chargeMethod: 1 }, // One-time charge
  vision: { amount: 39.99, chargeMethod: 3 }, // Recurring monthly
  bundle: { amount: 169, chargeMethod: 1 }, // One-time (Premium + first month Vision)
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
    if (discountCode) {
      // TODO: Validate discount code and apply discount
      // For now, we'll handle this later
    }

    // Build PayPlus request
    const payPlusBody = {
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

    return NextResponse.json({
      success: true,
      payment_url: result.data?.payment_page_link,
      transaction_uid: result.data?.page_request_uid,
    });

  } catch (error) {
    console.error('PayPlus generate-link error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
