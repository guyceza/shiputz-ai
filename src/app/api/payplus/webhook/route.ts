import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PayPlus signature verification (prepared for when Cardcom terminal is connected)
function verifyPayPlusSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = process.env.PAYPLUS_SECRET_KEY;
  
  // If no secret key configured, log warning but allow (for development/migration period)
  if (!secretKey) {
    console.warn('PayPlus signature verification skipped: PAYPLUS_SECRET_KEY not configured');
    return true;
  }
  
  // If signature header missing, reject in production
  if (!signature) {
    console.warn('PayPlus webhook: Missing signature header');
    // Allow for now since Cardcom terminal not connected yet
    // In production with Cardcom connected: return false;
    return true;
  }
  
  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  try {
    // Clone request to read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-payplus-signature');
    
    // Verify signature (prepared for Cardcom connection)
    if (!verifyPayPlusSignature(rawBody, signature)) {
      console.error('PayPlus webhook: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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

    // Bug #39: Handle refund webhooks
    if (type === 'refund' || data.action === 'refund' || data.status === 'refunded') {
      console.log('PayPlus refund received for:', email);
      
      if (email) {
        // Revoke premium/vision access on refund
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            purchased: false,
            vision_active: false,
            refunded_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error revoking access after refund:', updateError);
        } else {
          console.log(`Access revoked for ${email} after refund`);
        }

        // Log the refund transaction
        await supabase.from('transactions').insert({
          email: email.toLowerCase(),
          product_type: productType || 'unknown',
          amount: parseFloat(amount) || 0,
          currency: 'ILS',
          status: 'refunded',
          payment_provider: 'payplus',
          transaction_id: transaction_uid || page_request_uid,
          created_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({ received: true, status: 'refunded' });
    }

    // Handle recurring subscription cancellation
    // Bug #38: Added more specific field checks based on PayPlus documentation
    if (type === 'recurring_cancel' || data.action === 'cancel' || data.status === 'cancelled' || data.subscription_status === 'cancelled') {
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
    // Bug #7 fix: Convert to string explicitly to avoid type confusion
    const isSuccess = String(status_code) === '0' || data.status === 'approved';

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
      // Mark user as premium - use upsert to handle users who pay before signing up
      // Bug #8 fix: Use upsert to avoid race condition
      const upsertData: any = { 
        email: email.toLowerCase(),
        purchased: true,
        purchase_date: new Date().toISOString(),
        payment_method: 'payplus',
        transaction_id: transaction_uid || page_request_uid,
      };

      // Premium Plus includes 4 bonus Vision credits
      if (productType === 'premium_plus') {
        upsertData.vision_credits = 4;
        upsertData.vision_credits_source = 'premium_plus_bonus';
      }

      // Use upsert with conflict on email
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user premium status:', upsertError);
      } else {
        console.log(`User ${email} marked as Premium${productType === 'premium_plus' ? ' Plus (with 4 Vision credits)' : ''}`);
      }
    }

    if (productType === 'vision' || type === 'recurring_payment') {
      // Mark user as having Vision subscription (or renewal)
      // Bug #8 fix: Use upsert to avoid race condition
      const isRenewal = type === 'recurring_payment';
      
      const upsertData: any = { 
        email: email.toLowerCase(),
        vision_active: true,
        vision_transaction_id: transaction_uid || recurring_id || page_request_uid,
        vision_cancelled_at: null, // Clear any previous cancellation
      };
      
      // Only set start date on initial subscription, not renewals
      if (!isRenewal) {
        upsertData.vision_start_date = new Date().toISOString();
      }
      
      // Use upsert with conflict on email
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user vision status:', upsertError);
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
      // Bug #35: Alert when transaction logging fails (important audit trail)
      console.error('CRITICAL: Failed to log transaction:', logError.message, { email, productType, transaction_uid });
      // In production, this should send an alert to admin
      // The transaction still succeeded, but we lost audit trail
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
