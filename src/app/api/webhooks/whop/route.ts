import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY;
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;

// Verify Whop webhook signature
async function verifyWebhookSignature(request: NextRequest, body: string): Promise<boolean> {
  // If no secret configured, log warning but allow (for dev/testing)
  if (!WHOP_WEBHOOK_SECRET) {
    console.warn('WHOP_WEBHOOK_SECRET not configured - webhook signature not verified!');
    return true;
  }
  
  const signature = request.headers.get('whop-signature');
  if (!signature) {
    console.error('Missing whop-signature header');
    return false;
  }
  
  try {
    // Whop uses HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WHOP_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

// Send Vision AI welcome email
async function sendVisionWelcomeEmail(email: string, name?: string) {
  if (!RESEND_KEY) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }
  
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 24px; font-weight: 600; color: #111; vertical-align: middle;">ShiputzAI</span>
      </div>
      
      <h2 style="color: #111; text-align: center; margin-bottom: 24px;">🎨 ברוך הבא למנוי הדמיות AI!</h2>
      
      <p style="font-size: 16px; color: #333;">היי ${name || 'משפץ יקר'},</p>
      
      <p style="font-size: 16px; color: #333;">
        תודה שהצטרפת למנוי הדמיות AI! עכשיו תוכל לראות איך השיפוץ שלך ייראה לפני שמתחילים.
      </p>
      
      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;">
        <h3 style="color: #0369a1; margin-top: 0;">🎨 מה כלול במנוי:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>10 הדמיות AI בחודש</li>
          <li>עריכת תמונות של חדרים</li>
          <li>הצעות עיצוב אוטומטיות</li>
          <li>הערכת עלויות לפי שינויים</li>
          <li>Shop the Look - קניית מוצרים מהתמונה</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://shipazti.com/visualize" 
           style="display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">
          צור הדמיה ראשונה ←
        </a>
      </div>
      
      <p style="font-size: 16px; color: #333;">
        יש שאלות? פשוט תשלח מייל ל-<a href="mailto:help@shipazti.com" style="color: #111;">help@shipazti.com</a>
      </p>
      
      <p style="font-size: 16px; color: #333;">
        בהצלחה עם השיפוץ! 🏠<br>
        <strong>צוות ShiputzAI</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        ShiputzAI · ניהול שיפוצים חכם
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: '🎨 ברוך הבא למנוי הדמיות AI!',
        html,
      }),
    });
    const result = await response.json();
    console.log(`Vision welcome email sent to ${email}`);
    return result;
  } catch (error) {
    console.error('Failed to send Vision welcome email:', error);
  }
}

// Send Premium welcome email after purchase
async function sendWelcomeEmail(email: string, name?: string) {
  if (!RESEND_KEY) {
    console.error('RESEND_API_KEY not configured');
    return null;
  }
  
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 24px; font-weight: 600; color: #111; vertical-align: middle;">ShiputzAI</span>
      </div>
      
      <h2 style="color: #111; text-align: center; margin-bottom: 24px;">🎉 ברוך הבא ל-ShiputzAI Premium!</h2>
      
      <p style="font-size: 16px; color: #333;">היי ${name || 'משפץ יקר'},</p>
      
      <p style="font-size: 16px; color: #333;">
        תודה רבה על הרכישה! אנחנו שמחים שבחרת ב-ShiputzAI לניהול השיפוץ שלך.
      </p>
      
      <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #111; margin-top: 0;">✅ מה מחכה לך:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>מעקב תקציב חכם בזמן אמת</li>
          <li>סריקת קבלות אוטומטית עם AI</li>
          <li>ניתוח הצעות מחיר</li>
          <li>עוזר AI אישי לכל שאלה</li>
          <li>התראות חכמות לפני חריגות</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://shipazti.com/dashboard" 
           style="display: inline-block; background: #111; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">
          כניסה לדשבורד ←
        </a>
      </div>
      
      <p style="font-size: 16px; color: #333;">
        יש שאלות? פשוט תשלח מייל ל-<a href="mailto:help@shipazti.com" style="color: #111;">help@shipazti.com</a>
      </p>
      
      <p style="font-size: 16px; color: #333;">
        בהצלחה עם השיפוץ! 🏠<br>
        <strong>צוות ShiputzAI</strong>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        ShiputzAI · ניהול שיפוצים חכם
      </p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: '🎉 ברוך הבא ל-ShiputzAI Premium!',
        html,
      }),
    });
    const result = await response.json();
    // Email sent to ${email}:`, result.id);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

// Whop Webhook Handler
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(request, rawBody);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const body = JSON.parse(rawBody);
    
    // Webhook received - action logged for debugging

    const { action, data } = body;

    // Plan IDs
    const PREMIUM_PLANS = ['plan_gtlFi4zoHPy80', 'plan_9kPvCqLkwwmUc']; // One-time premium
    const VISION_PLANS = ['plan_ORVfC8pmG328G', 'plan_786h1Ueozm30s'];  // Monthly Vision AI ($11.99 and $5.99 first month)

    // Handle successful payment / membership activation
    if (action === 'membership.went_valid' || action === 'payment.succeeded' || action === 'membership_went_valid' || action === 'payment_succeeded') {
      const email = data?.user?.email || data?.email;
      const name = data?.user?.name || data?.name;
      const discountCode = data?.promo_code || data?.metadata?.discount_code;
      const planId = data?.plan?.id || data?.plan_id;

      if (email) {
        const supabase = createServiceClient();
        const isVisionPlan = VISION_PLANS.includes(planId);
        const isPremiumPlan = PREMIUM_PLANS.includes(planId);

        if (isVisionPlan) {
          // Vision AI subscription - set vision_subscription to active
          const { error: visionError } = await supabase
            .from('users')
            .update({ vision_subscription: 'active' })
            .eq('email', email.toLowerCase());

          if (visionError) {
            console.error('Error updating vision subscription:', visionError);
          } else {
            console.log(`User ${email} Vision subscription activated`);
          }
          
          // Send Vision welcome email
          await sendVisionWelcomeEmail(email, name);
        } else {
          // Premium one-time purchase (default behavior)
          const { error: userError } = await supabase
            .from('users')
            .update({
              purchased: true,
              purchased_at: new Date().toISOString(),
            })
            .eq('email', email.toLowerCase());

          if (userError) {
            console.error('Error updating user:', userError);
          } else {
            console.log(`User ${email} marked as Premium purchased`);
          }
        }

        // Mark discount code as used (if provided in metadata)
        if (discountCode) {
          const { error: codeError } = await supabase
            .from('discount_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('code', discountCode.toUpperCase());

          if (!codeError) {
            // Discount code ${discountCode} marked as used`);
          }
        } else {
          // Fallback: If user paid with discounted plan, mark any unused code for this email
          const planId = data?.plan?.id || data?.plan_id;
          const DISCOUNTED_PLAN = 'plan_9kPvCqLkwwmUc';
          
          if (planId === DISCOUNTED_PLAN) {
            const { data: unusedCode } = await supabase
              .from('discount_codes')
              .select('code')
              .eq('user_email', email.toLowerCase())
              .is('used_at', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (unusedCode) {
              await supabase
                .from('discount_codes')
                .update({ used_at: new Date().toISOString() })
                .eq('code', unusedCode.code);
              // Discount code ${unusedCode.code} marked as used (fallback by email)`);
            }
          }
        }

        // Send welcome email (only for premium, not vision)
        if (!isVisionPlan) {
          await sendWelcomeEmail(email, name);
          
          // Mark day 0 of purchased sequence as sent (to avoid duplicate from cron)
          try {
            await supabase.from('email_sequences').insert({
              user_email: email.toLowerCase(),
              sequence_type: 'purchased',
              day_number: 0,
            });
          } catch (e: any) {
            // Only ignore duplicate key errors (already exists)
            if (!e?.code?.includes('23505')) {
              console.error('Failed to record email sequence:', e);
            }
          }
        }
      }
    }

    // Handle membership cancellation/expiration (for Vision subscription)
    if (action === 'membership.went_invalid' || action === 'membership_went_invalid' || 
        action === 'membership.cancelled' || action === 'membership_cancelled') {
      const email = data?.user?.email || data?.email;
      const planId = data?.plan?.id || data?.plan_id;
      
      if (email && VISION_PLANS.includes(planId)) {
        const supabase = createServiceClient();
        
        // Deactivate Vision subscription
        const { error } = await supabase
          .from('users')
          .update({ vision_subscription: null })
          .eq('email', email.toLowerCase());

        if (!error) {
          console.log(`User ${email} Vision subscription cancelled`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Whop sends GET to verify webhook URL
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ShiputzAI Whop Webhook' });
}
