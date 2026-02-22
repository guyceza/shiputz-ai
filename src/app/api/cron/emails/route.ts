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
  { day: 3, subject: '🎁 מתנה בשבילך — 20% הנחה', template: 'discount_offer' },
  { day: 5, subject: '😱 70% מהשיפוצים חורגים מהתקציב', template: 'problem_highlight' },
  { day: 7, subject: '💬 "חסכתי ₪15,000" — יעל מת"א', template: 'testimonials' },
  { day: 9, subject: '⏰ נשארו 24 שעות להנחה!', template: 'urgency' },
  { day: 11, subject: '📊 ראה איך זה עובד', template: 'demo' },
  { day: 14, subject: '🤝 אולי לא בשבילך?', template: 'last_chance' },
];

// Generate email HTML based on template
function getEmailHTML(template: string, user: any, discountCode?: string): string {
  const name = user.name || 'משפץ יקר';
  
  const templates: Record<string, string> = {
    // === PURCHASED SEQUENCE ===
    welcome_purchased: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">🎉 ברוך הבא ל-ShiputzAI!</h1>
        <p>היי ${name},</p>
        <p>תודה שהצטרפת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">כניסה לדשבורד ←</a>
        <p style="margin-top: 24px; color: #666;">בהצלחה!<br>צוות ShiputzAI</p>
      </div>
    `,
    getting_started: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">💡 3 דברים לעשות עכשיו</h1>
        <p>היי ${name},</p>
        <p>כדי להתחיל נכון עם ShiputzAI, הנה 3 צעדים פשוטים:</p>
        <ol style="line-height: 1.8; color: #333;">
          <li><strong>צור פרויקט חדש</strong> — תן שם והגדר תקציב</li>
          <li><strong>צלם קבלה ראשונה</strong> — ה-AI יזהה את הפרטים אוטומטית</li>
          <li><strong>הגדר התראות</strong> — נודיע לך לפני שחורגים</li>
        </ol>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">להתחיל ←</a>
        <p style="margin-top: 24px; color: #666;">בהצלחה!<br>צוות ShiputzAI</p>
      </div>
    `,
    receipt_scanning: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">📸 הטריק שיחסוך לך שעות</h1>
        <p>היי ${name},</p>
        <p>ידעת שאפשר לסרוק קבלות בשנייה?</p>
        <p>פשוט מצלמים את הקבלה → ה-AI קורא את כל הפרטים → והכל נכנס לרשימה אוטומטית.</p>
        <p><strong>לא עוד הקלדה ידנית!</strong></p>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לנסות עכשיו ←</a>
        <p style="margin-top: 24px; color: #666;">צוות ShiputzAI</p>
      </div>
    `,
    budget_tips: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">💰 איך לא לחרוג מהתקציב</h1>
        <p>היי ${name},</p>
        <p>70% מהשיפוצים חורגים מהתקציב. הנה איך לא להיות חלק מהסטטיסטיקה:</p>
        <ul style="line-height: 1.8; color: #333;">
          <li>✅ הגדר תקציב ריאלי מראש</li>
          <li>✅ תעד כל הוצאה מיד</li>
          <li>✅ בדוק את הדשבורד פעם בשבוע</li>
          <li>✅ השאר 10-15% לבלת"מים</li>
        </ul>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לצפות בדשבורד ←</a>
        <p style="margin-top: 24px; color: #666;">צוות ShiputzAI</p>
      </div>
    `,
    checkin: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">❓ איך הולך?</h1>
        <p>היי ${name},</p>
        <p>עבר שבוע מאז שהתחלת. רצינו לבדוק איך הולך!</p>
        <p>יש שאלות? משהו לא ברור? פשוט תשלח לנו מייל ונשמח לעזור.</p>
        <p>אם הכל טוב — מעולה! תמשיך לתעד ולעקוב.</p>
        <a href="mailto:help@shipazti.com" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לשלוח הודעה ←</a>
        <p style="margin-top: 24px; color: #666;">צוות ShiputzAI</p>
      </div>
    `,
    quote_analysis: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">🔥 הכלי שרוב המשפצים לא מכירים</h1>
        <p>היי ${name},</p>
        <p>קיבלת הצעת מחיר מקבלן? <strong>לפני שאתה חותם</strong> — תן לנו לבדוק.</p>
        <p>ה-AI שלנו מנתח הצעות מחיר ובודק:</p>
        <ul style="line-height: 1.8; color: #333;">
          <li>האם המחיר הוגן?</li>
          <li>מה חסר בהצעה?</li>
          <li>אילו סעיפים צריך לשים לב אליהם?</li>
        </ul>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לנתח הצעת מחיר ←</a>
        <p style="margin-top: 24px; color: #666;">צוות ShiputzAI</p>
      </div>
    `,
    feedback_request: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">⭐ 30 שניות מזמנך?</h1>
        <p>היי ${name},</p>
        <p>עברו שבועיים מאז שהתחלת להשתמש ב-ShiputzAI.</p>
        <p>נשמח לשמוע מה אתה חושב! הפידבק שלך עוזר לנו להשתפר.</p>
        <a href="mailto:help@shipazti.com?subject=פידבק על ShiputzAI" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לשתף פידבק ←</a>
        <p style="margin-top: 24px; color: #666;">תודה! 🙏<br>צוות ShiputzAI</p>
      </div>
    `,

    // === NON-PURCHASED SEQUENCE ===
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
    problem_highlight: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">😱 70% מהשיפוצים חורגים מהתקציב</h1>
        <p>היי ${name},</p>
        <p>זה לא מקרי. רוב האנשים מנהלים שיפוץ בלי כלים מתאימים.</p>
        <p>ShiputzAI נבנה בדיוק בשביל זה:</p>
        <ul style="line-height: 1.8; color: #333;">
          <li>✅ מעקב תקציב בזמן אמת</li>
          <li>✅ סריקת קבלות אוטומטית</li>
          <li>✅ התראות לפני חריגות</li>
        </ul>
        <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">להתחיל בחינם ←</a>
      </div>
    `,
    testimonials: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">💬 מה אומרים משפצים אחרים</h1>
        <p>היי ${name},</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-style: italic; color: #333;">"שפצתי דירת 4 חדרים והאפליקציה עזרה לי לחסוך ₪15,000 בהשוואת הצעות מחיר"</p>
          <p style="color: #666; margin: 0;">— יעל מ., תל אביב</p>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-style: italic; color: #333;">"סוף סוף הצלחתי לעקוב אחרי כל ההוצאות במקום אחד. ממליץ בחום!"</p>
          <p style="color: #666; margin: 0;">— אבי כ., רמת גן</p>
        </div>
        <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">להצטרף עכשיו ←</a>
      </div>
    `,
    urgency: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">⏰ נשארו 24 שעות להנחה!</h1>
        <p>היי ${name},</p>
        <p>קוד ההנחה שלך עומד לפוג.</p>
        <p><strong>20% הנחה</strong> — רק עד מחר.</p>
        <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לממש עכשיו ←</a>
      </div>
    `,
    demo: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">📊 ראה איך זה עובד</h1>
        <p>היי ${name},</p>
        <p>רוצה לראות בדיוק איך ShiputzAI יכול לעזור לך?</p>
        <p>באתר שלנו יש הדגמה מלאה — תוכל לראות את הדשבורד, סריקת הקבלות, וכל הפיצ'רים.</p>
        <a href="https://shipazti.com" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">לצפות בהדגמה ←</a>
      </div>
    `,
    last_chance: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #111;">🤝 אולי לא בשבילך?</h1>
        <p>היי ${name},</p>
        <p>שלחנו לך כמה מיילים ולא שמענו ממך.</p>
        <p>אם ShiputzAI לא מתאים לך — זה בסדר גמור. נפסיק לשלוח.</p>
        <p>אבל אם בכל זאת רוצה לנסות — הדלת תמיד פתוחה:</p>
        <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none;">להצטרף ←</a>
        <p style="margin-top: 24px; color: #666;">בהצלחה עם השיפוץ! 🏠<br>צוות ShiputzAI</p>
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
