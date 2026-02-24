import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // PayPlus sends callback data as JSON or form-urlencoded
    const contentType = request.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    } else {
      // Try to parse as JSON anyway
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }

    console.log('PayPlus webhook received:', JSON.stringify(data, null, 2));

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
    } = data;

    // Check if transaction was successful
    // PayPlus status codes: 0 = success, others = failure
    const isSuccess = status_code === '0' || status_code === 0 || data.status === 'approved';

    if (!isSuccess) {
      console.log('PayPlus transaction failed:', status_description);
      return NextResponse.json({ received: true, status: 'failed' });
    }

    // Extract our custom data
    const productType = more_info || data.product_type;
    const email = more_info_1 || data.email;
    const userId = more_info_2 || data.user_id;
    const discountCode = more_info_3 || data.discount_code;

    if (!email) {
      console.error('PayPlus webhook: No email in callback data');
      return NextResponse.json({ received: true, error: 'No email provided' });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update user in database based on product type
    if (productType === 'premium' || productType === 'bundle') {
      // Mark user as premium
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          purchased: true,
          purchase_date: new Date().toISOString(),
          payment_method: 'payplus',
          transaction_id: transaction_uid || page_request_uid,
        })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
      } else {
        console.log(`User ${email} marked as Premium`);
      }
    }

    if (productType === 'vision' || productType === 'bundle') {
      // Mark user as having Vision subscription
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          vision_active: true,
          vision_start_date: new Date().toISOString(),
          vision_transaction_id: transaction_uid || page_request_uid,
        })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Error updating user vision status:', updateError);
      } else {
        console.log(`User ${email} marked as Vision active`);
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

    // Log the transaction
    const { error: logError } = await supabase
      .from('transactions')
      .insert({
        email: email.toLowerCase(),
        product_type: productType,
        amount: parseFloat(amount) || 0,
        currency: 'ILS',
        status: 'completed',
        payment_provider: 'payplus',
        transaction_id: transaction_uid || page_request_uid,
        approval_num: approval_num,
        voucher_num: voucher_num,
        discount_code: discountCode || null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      // Table might not exist yet, that's okay
      console.log('Could not log transaction (table may not exist):', logError.message);
    }

    return NextResponse.json({ 
      received: true, 
      status: 'success',
      email: email,
      product: productType,
    });

  } catch (error) {
    console.error('PayPlus webhook error:', error);
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 });
  }
}

// Also handle GET requests (PayPlus sometimes sends GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = Object.fromEntries(searchParams);
  
  console.log('PayPlus webhook GET received:', data);
  
  // Convert to POST-like handling
  const fakeRequest = {
    headers: { get: () => 'application/json' },
    json: async () => data,
  } as any;
  
  return POST({ ...request, json: async () => data } as any);
}
