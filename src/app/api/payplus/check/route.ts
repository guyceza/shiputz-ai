import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    const { page_request_uid } = await request.json();

    if (!page_request_uid) {
      return NextResponse.json({ error: 'Missing page_request_uid' }, { status: 400 });
    }

    if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY) {
      console.error('PayPlus check: Missing API credentials');
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
    console.log('PayPlus IPN check response:', JSON.stringify(ipnData, null, 2));

    // Check if transaction was successful
    const result = ipnData.data?.result || ipnData.result || ipnData;
    const statusCode = result?.status_code || result?.transaction?.status_code;
    const isSuccess = String(statusCode) === '000' || String(statusCode) === '0';

    if (!isSuccess) {
      return NextResponse.json({ 
        success: false, 
        status: 'pending',
        status_code: statusCode,
        description: result?.status_description || 'Transaction not completed yet',
      });
    }

    // Extract transaction details
    const tx = result.transaction || result;
    const email = tx.more_info_1 || tx.customer_email || tx.email;
    const productType = tx.more_info || tx.product_type;

    if (!email) {
      console.error('PayPlus IPN check: No email in transaction data');
      return NextResponse.json({ success: true, status: 'success', warning: 'No email found' });
    }

    // Update user in database (same logic as webhook)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (productType === 'premium' || productType === 'premium_plus') {
      const upsertData: any = {
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: new Date().toISOString(),
      };
      if (productType === 'premium_plus') {
        upsertData.vision_subscription = 'active';
      }
      const { error } = await supabase.from('users').upsert(upsertData, { onConflict: 'email' });
      if (error) {
        console.error('IPN check: Error upserting premium:', error);
      } else {
        console.log(`IPN check: ${email} → ${productType} activated`);
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
        console.log(`IPN check: ${email} → vision activated`);
      }
    }

    console.log(`✅ PayPlus IPN check: ${email} → ${productType} (status: ${statusCode})`);

    return NextResponse.json({
      success: true,
      status: 'success',
      email,
      product: productType,
    });

  } catch (error) {
    console.error('PayPlus check error:', error);
    return NextResponse.json({ error: 'Failed to check payment' }, { status: 500 });
  }
}
