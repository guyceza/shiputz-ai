import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY || 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';

// Send welcome email after purchase
async function sendWelcomeEmail(email: string, name?: string) {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #111; margin: 0;">🎉 ברוך הבא ל-ShiputzAI Premium!</h1>
      </div>
      
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
    console.log(`✅ Welcome email sent to ${email}:`, result.id);
    return result;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

// Whop Webhook Handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Whop webhook received:', JSON.stringify(body, null, 2));

    const { action, data } = body;

    // Handle successful payment / membership activation
    if (action === 'membership.went_valid' || action === 'payment.succeeded' || action === 'membership_went_valid' || action === 'payment_succeeded') {
      const email = data?.user?.email || data?.email;
      const name = data?.user?.name || data?.name;
      const discountCode = data?.promo_code || data?.metadata?.discount_code;

      if (email) {
        const supabase = createServiceClient();

        // Mark user as purchased
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
          console.log(`✅ User ${email} marked as purchased`);
        }

        // Mark discount code as used (if provided)
        if (discountCode) {
          const { error: codeError } = await supabase
            .from('discount_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('code', discountCode.toUpperCase());

          if (!codeError) {
            console.log(`✅ Discount code ${discountCode} marked as used`);
          }
        }

        // Send welcome email
        await sendWelcomeEmail(email, name);
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
