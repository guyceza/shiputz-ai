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
      type,           // For recurring: 'recurring_payment', 'recurring_cancel', etc.
      recurring_id,
    } = data;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract email from various possible fields
    const email = more_info_1 || data.email || data.customer_email;
    const productType = more_info || data.product_type;

    // Handle recurring subscription cancellation
    if (type === 'recurring_cancel' || data.action === 'cancel' || data.status === 'cancelled') {
      console.log('PayPlus subscription cancelled for:', email);
      
      if (email) {
        // Deactivate Vision subscription
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            vision_active: false,
            vision_cancelled_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error deactivating vision subscription:', updateError);
        } else {
          console.log(`Vision subscription cancelled for ${email}`);
        }

        // Log the cancellation
        await supabase.from('transactions').insert({
          email: email.toLowerCase(),
          product_type: 'vision',
          amount: 0,
          currency: 'ILS',
          status: 'cancelled',
          payment_provider: 'payplus',
          transaction_id: transaction_uid || recurring_id || page_request_uid,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ received: true, status: 'cancelled' });
    }

    // Check if transaction was successful
    // PayPlus status codes: 0 = success, others = failure
    const isSuccess = status_code === '0' || status_code === 0 || data.status === 'approved';

    if (!isSuccess) {
      console.log('PayPlus transaction failed:', status_description);
      
      // Log failed transaction
      if (email) {
        await supabase.from('transactions').insert({
          email: email.toLowerCase(),
          product_type: productType || 'unknown',
          amount: parseFloat(amount) || 0,
          currency: 'ILS',
          status: 'failed',
          status_description: status_description,
          payment_provider: 'payplus',
          transaction_id: transaction_uid || page_request_uid,
          created_at: new Date().toISOString(),
        });
      }
      
      return NextResponse.json({ received: true, status: 'failed' });
    }

    // Extract our custom data
    const userId = more_info_2 || data.user_id;
    const discountCode = more_info_3 || data.discount_code;

    if (!email) {
      console.error('PayPlus webhook: No email in callback data');
      return NextResponse.json({ received: true, error: 'No email provided' });
    }

    // Update user in database based on product type
    if (productType === 'premium' || productType === 'premium_plus') {
      // Mark user as premium
      const updateData: any = { 
        purchased: true,
        purchase_date: new Date().toISOString(),
        payment_method: 'payplus',
        transaction_id: transaction_uid || page_request_uid,
      };

      // Premium Plus includes 2 bonus Vision credits
      if (productType === 'premium_plus') {
        updateData.vision_credits = 2;
        updateData.vision_credits_source = 'premium_plus_bonus';
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
      } else {
        console.log(`User ${email} marked as Premium${productType === 'premium_plus' ? ' Plus (with 2 Vision credits)' : ''}`);
      }
    }

    if (productType === 'vision' || type === 'recurring_payment') {
      // Mark user as having Vision subscription (or renewal)
      const isRenewal = type === 'recurring_payment';
      
      const updateData: any = { 
        vision_active: true,
        vision_transaction_id: transaction_uid || recurring_id || page_request_uid,
      };
      
      // Only set start date on initial subscription, not renewals
      if (!isRenewal) {
        updateData.vision_start_date = new Date().toISOString();
      }
      
      // Clear any previous cancellation
      updateData.vision_cancelled_at = null;
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Error updating user vision status:', updateError);
      } else {
        console.log(`User ${email} marked as Vision active${isRenewal ? ' (renewal)' : ''}`);
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
