import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY || 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

// Email sequences
const PURCHASED_SEQUENCE = [
  { day: 0, subject: '🎉 ברוך הבא ל-ShiputzAI!', template: 'welcome_purchased' },
  { day: 1, subject: '💡 3 דברים לעשות עכשיו', template: 'getting_started' },
  { day: 3, subject: '📸 הטריק שיחסוך לך שעות', template: 'receipt_scanning' },
  { day: 5, subject: '💰 איך לא לחרוג מהתקציב', template: 'budget_tips' },
  { day: 7, subject: '❓ איך הולך?', template: 'checkin' },
  { day: 10, subject: '🔥 הכלי שרוב המשפצים לא מכירים', template: 'quote_analysis' },
  { day: 14, subject: '⭐ 30 שניות מזמנך?', template: 'feedback_request' },
];

const NON_PURCHASED_SEQUENCE = [
  { day: 1, subject: '👋 שכחת משהו?', template: 'reminder' },
  { day: 3, subject: '😱 70% מהשיפוצים חורגים מהתקציב', template: 'problem_highlight' },
  { day: 5, subject: '📊 ראה איך זה עובד', template: 'demo' },
  { day: 7, subject: '💬 "חסכתי ₪15,000" — יעל מת"א', template: 'testimonials' },
  { day: 10, subject: '🎁 מתנה בשבילך', template: 'discount_offer' },
  { day: 12, subject: '⏰ נשארו 24 שעות', template: 'urgency' },
  { day: 14, subject: '🤝 אולי לא בשבילך?', template: 'last_chance' },
];

// Generate email HTML based on template
function getEmailHTML(template: string, user: any, discountCode?: string): string {
  const name = user.name || 'משפץ יקר';
  
  const templates: Record<string, string> = {
    welcome_purchased: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">🎉 ברוך הבא ל-ShiputzAI!</h1>
        <p>היי ${name},</p>
        <p>תודה שהצטרפת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">כניסה לדשבורד ←</a>
        <p style="margin-top: 24px; color: #666;">בהצלחה!<br>צוות ShiputzAI</p>
      </div>
    `,
    reminder: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">👋 שכחת משהו?</h1>
        <p>היי ${name},</p>
        <p>שמנו לב שנרשמת ל-ShiputzAI אבל עדיין לא התחלת.</p>
        <p><strong>70% מהשיפוצים חורגים מהתקציב</strong> — אנחנו יכולים לעזור.</p>
        <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">להתחיל עכשיו ←</a>
      </div>
    `,
    discount_offer: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">🎁 מתנה בשבילך</h1>
        <p>היי ${name},</p>
        <p>קוד הנחה אישי:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <p style="font-size: 28px; font-weight: bold; color: #111; margin: 0;">${discountCode}</p>
          <p style="color: #666; margin: 8px 0 0;">20% הנחה · תקף ל-48 שעות</p>
        </div>
        <a href="https://shipazti.com/signup?code=${discountCode}" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לממש את ההנחה ←</a>
      </div>
    `,
  };
  
  return templates[template] || templates.reminder;
}

// Generate unique discount code
function generateDiscountCode(email: string): string {
  const prefix = email.split('@')[0].slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SHIP-${prefix}-${random}`;
}

// Send email via Resend
async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return response.json();
}

export async function GET(request: NextRequest) {
  // Verify cron secret (optional security)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  let sent = 0;
  let errors = 0;

  try {
    // Get all users
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;

    for (const user of users || []) {
      const daysSinceRegistration = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const sequence = user.purchased ? PURCHASED_SEQUENCE : NON_PURCHASED_SEQUENCE;
      const sequenceType = user.purchased ? 'purchased' : 'non_purchased';

      for (const step of sequence) {
        if (daysSinceRegistration >= step.day) {
          // Check if already sent
          const { data: existing } = await supabase
            .from('email_sequences')
            .select('id')
            .eq('user_email', user.email)
            .eq('sequence_type', sequenceType)
            .eq('day_number', step.day)
            .single();

          if (!existing) {
            let html: string;
            
            if (step.template === 'discount_offer') {
              const code = generateDiscountCode(user.email);
              const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
              
              await supabase.from('discount_codes').insert({
                code,
                user_email: user.email,
                discount_percent: 20,
                expires_at: expiresAt.toISOString(),
              });
              
              html = getEmailHTML(step.template, user, code);
            } else {
              html = getEmailHTML(step.template, user);
            }

            const result = await sendEmail(user.email, step.subject, html);

            if (result.id) {
              await supabase.from('email_sequences').insert({
                user_email: user.email,
                sequence_type: sequenceType,
                day_number: step.day,
              });
              sent++;
            } else {
              errors++;
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent, 
      errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Failed to process emails' }, { status: 500 });
  }
}
