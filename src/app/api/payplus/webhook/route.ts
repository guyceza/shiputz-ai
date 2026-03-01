import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PayPlus signature verification (prepared for when Cardcom terminal is connected)
function verifyPayPlusSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = process.env.PAYPLUS_SECRET_KEY;
  
  // If no secret key configured, log warning but allow (graceful degradation)
  // TODO: Set PAYPLUS_SECRET_KEY in Vercel env vars when PayPlus provides it
  if (!secretKey) {
    console.warn('PayPlus signature verification skipped: PAYPLUS_SECRET_KEY not configured');
    return true;
  }
  
  // Secret key is configured — enforce signature check
  if (!signature) {
    console.error('PayPlus webhook: Missing signature header — rejecting');
    return false;
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
    
    // TODO: Re-enable signature verification after confirming PayPlus webhook format
    // Temporarily disabled to debug webhook delivery
    if (signature) {
      const isValid = verifyPayPlusSignature(rawBody, signature);
      console.log(`PayPlus webhook signature ${isValid ? 'valid' : 'INVALID'} (not blocking)`);
    } else {
      console.log('PayPlus webhook: No signature header (not blocking)');
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
            vision_subscription: null,
            refunded_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error revoking access after refund:', updateError);
        } else {
          console.log(`Access revoked for ${email} after refund`);
        }
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
            vision_subscription: 'canceled',
          })
          .eq('email', email.toLowerCase());

        if (updateError) {
          console.error('Error deactivating vision subscription:', updateError);
        } else {
          console.log(`Vision subscription cancelled for ${email}`);
        }
      }

      return NextResponse.json({ received: true, status: 'cancelled' });
    }

    // Check if transaction was successful
    // PayPlus status codes: 0 = success, others = failure
    // Bug #7 fix: Convert to string explicitly to avoid type confusion
    const isSuccess = String(status_code) === '0' || data.status === 'approved';

    if (!isSuccess) {
      console.log('PayPlus transaction failed:', status_description, { email, productType, amount });
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
    // NOTE: DB columns that exist: purchased, purchased_at, vision_subscription,
    //       vision_trial_used, vision_usage_count, vision_usage_month
    if (productType === 'premium' || productType === 'premium_plus') {
      // Mark user as premium
      const upsertData: any = { 
        email: email.toLowerCase(),
        purchased: true,
        purchased_at: new Date().toISOString(),
      };

      // Premium Plus: also activate vision subscription
      if (productType === 'premium_plus') {
        upsertData.vision_subscription = 'active';
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user premium status:', upsertError);
      } else {
        console.log(`User ${email} marked as Premium${productType === 'premium_plus' ? ' Plus (with Vision)' : ''}`);
      }
    }

    if (productType === 'vision' || type === 'recurring_payment') {
      // Mark user as having Vision subscription
      const upsertData: any = { 
        email: email.toLowerCase(),
        vision_subscription: 'active',
      };
      
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(upsertData, { onConflict: 'email' });

      if (upsertError) {
        console.error('Error upserting user vision status:', upsertError);
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

    // Log the transaction (console only — transactions table doesn't exist yet)
    console.log(`✅ PayPlus payment completed: ${email} → ${productType} (₪${amount}, tx: ${transaction_uid || page_request_uid})`);

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

// Also handle GET requests (PayPlus sometimes redirects via GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const data = Object.fromEntries(searchParams);
  
  console.log('PayPlus webhook GET received:', JSON.stringify(data));
  
  // Process directly instead of routing through POST (which reads request.text())
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const email = data.more_info_1 || data.email || data.customer_email;
  const productType = data.more_info || data.product_type;
  const statusCode = data.status_code;
  const isSuccess = String(statusCode) === '0' || data.status === 'approved';
  
  if (!isSuccess || !email) {
    console.log('PayPlus GET webhook: not success or no email', { statusCode, email });
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
    console.log(`GET webhook: ${email} → ${productType} activated`);
  }

  if (productType === 'vision') {
    await supabase.from('users').upsert({ 
      email: email.toLowerCase(),
      vision_subscription: 'active',
    }, { onConflict: 'email' });
    console.log(`GET webhook: ${email} → vision activated`);
  }

  return NextResponse.json({ received: true, status: 'success', product: productType });
}
