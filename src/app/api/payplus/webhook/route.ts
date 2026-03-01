import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// HTML escape to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    console.log('PayPlus webhook headers:', JSON.stringify(headerObj));
    
    // Verify webhook authenticity — block unauthorized requests
    if (WEBHOOK_SECRET) {
      // Method 1: Check our custom webhook secret (added as query param or header)
      const urlSecret = new URL(request.url).searchParams.get('secret');
      const headerSecret = request.headers.get('x-webhook-secret');
      if (urlSecret !== WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET) {
        // Method 2: Check PayPlus signature (Hash header)
        if (signature) {
          const isValid = verifyPayPlusSignature(rawBody, signature);
          if (!isValid) {
            console.error('PayPlus webhook: INVALID signature — rejecting');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
          }
          console.log('PayPlus webhook: signature valid ✅');
        } else {
          console.error('PayPlus webhook: No auth — rejecting');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } else {
        console.log('PayPlus webhook: secret token valid ✅');
      }
    } else if (signature) {
      // No webhook secret configured, try PayPlus signature
      const isValid = verifyPayPlusSignature(rawBody, signature);
      console.log(`PayPlus webhook signature ${isValid ? 'valid' : 'INVALID'} (WEBHOOK_SECRET not set, allowing)`);
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

    console.log('PayPlus webhook received:', JSON.stringify(data, null, 2));

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

    // Extract email from various possible fields (check both tx and root data)
    // For recurring callbacks, PayPlus uses "extra_info" instead of "more_info"
    // and may not include email — try customer_uid lookup as fallback
    let email = more_info_1 || tx.email || tx.customer_email || data.email || data.customer_email || data.more_info_1;
    const productType = more_info || tx.extra_info || data.extra_info || tx.product_type || data.product_type;

    // Fallback: if no email found but we have customer_uid, look up customer in PayPlus
    if (!email && (tx.customer_uid || data.customer_uid)) {
      try {
        const customerUid = tx.customer_uid || data.customer_uid;
        console.log('PayPlus webhook: No email found, looking up customer_uid:', customerUid);
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
          console.log('PayPlus customer lookup result:', email);
        }
      } catch (e) {
        console.error('PayPlus customer lookup failed:', e);
      }
    }

    // Bug #39: Handle refund webhooks
    if (type === 'refund' || tx.action === 'refund' || tx.status === 'refunded' || data.action === 'refund' || data.status === 'refunded') {
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
    if (type === 'recurring_cancel' || tx.action === 'cancel' || tx.status === 'cancelled' || tx.subscription_status === 'cancelled' || data.action === 'cancel' || data.status === 'cancelled') {
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
    // PayPlus status codes: '000' = success (from WooCommerce plugin), or 0 = success
    // Bug #7 fix: Convert to string explicitly to avoid type confusion
    const isSuccess = String(status_code) === '000' || String(status_code) === '0' || tx.status === 'approved' || data.status === 'approved';

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

    // Send welcome/purchase confirmation email via Resend (fire-and-forget)
    if (email && (productType === 'premium' || productType === 'premium_plus')) {
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
          const isPlus = productType === 'premium_plus';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'ShiputzAI <help@shipazti.com>',
              to: email,
              subject: '🎉 ברוך הבא ל-ShiputzAI Premium!',
              html: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #111; margin: 0;">🎉 ברוך הבא ל-ShiputzAI Premium${isPlus ? ' Plus' : ''}!</h1>
                </div>
                <p style="font-size: 16px; color: #333;">היי ${displayName},</p>
                <p style="font-size: 16px; color: #333;">תודה רבה! אנחנו שמחים שבחרת ב-ShiputzAI לניהול השיפוץ שלך.</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #111; margin-top: 0;">✅ מה מחכה לך:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li>מעקב תקציב חכם בזמן אמת</li>
                    <li>סריקת קבלות אוטומטית עם AI</li>
                    <li>ניתוח הצעות מחיר</li>
                    <li>עוזר AI אישי לכל שאלה</li>
                    <li>התראות חכמות לפני חריגות</li>
                    ${isPlus ? '<li>4 הדמיות AI Vision</li><li>Shop the Look</li>' : ''}
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">כניסה לדשבורד ←</a>
                </div>
                <p style="color: #888; font-size: 14px;">בהצלחה עם השיפוץ!<br>צוות ShiputzAI</p>
              </div>`,
            }),
          });
          console.log(`Welcome email sent to ${email}`);

          // Mark day 0 as sent to avoid duplicate from cron
          try {
            await supabase.from('email_sequences').insert({
              user_email: email.toLowerCase(),
              sequence_type: 'purchased',
              day_number: 0,
            });
          } catch { /* ignore duplicates */ }
        }
      } catch (emailErr) {
        console.error('Failed to send welcome email (non-blocking):', emailErr);
      }
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

// Also handle GET requests (PayPlus sometimes redirects via GET)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Verify auth for GET webhook too
  if (WEBHOOK_SECRET) {
    const urlSecret = searchParams.get('secret');
    if (urlSecret !== WEBHOOK_SECRET) {
      console.error('PayPlus GET webhook: No valid secret — rejecting');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }
  
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
