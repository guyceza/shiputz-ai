import { NextRequest, NextResponse } from "next/server";

import { ADMIN_EMAILS } from '@/lib/admin';
// Bug #3 fix: Never use hardcoded API keys - use env var only
const RESEND_KEY = process.env.RESEND_API_KEY;

// Template subjects
const TEMPLATE_SUBJECTS: Record<string, string> = {
  welcome_purchased: '🎉 ברוך הבא ל-ShiputzAI Premium!',
  getting_started: '💡 3 דברים לעשות עכשיו',
  vision_upsell: '🏠 איך השיפוץ שלך יראה? (50% הנחה)',
  budget_tips: '💰 איך לא לחרוג מהתקציב',
  checkin: '❓ איך הולך?',
  quote_analysis: '🔥 הכלי שרוב המשפצים לא מכירים',
  feedback_request: '⭐ 30 שניות מזמנך?',
  reminder: '👋 שכחת משהו?',
  discount_offer: '🎁 מתנה בשבילך — 20% הנחה',
  problem_highlight: '😱 70% מהשיפוצים חורגים מהתקציב',
  testimonials: '💬 "חסכתי ₪15,000" — סיפור אמיתי',
  urgency: '⏰ נשארו 24 שעות להנחה!',
  demo: '📊 ראה איך זה עובד (1 דקה)',
  last_chance: '🤝 נפרדים כחברים?',
};

// Generate HTML for template (simplified version for testing)
const generateHtml = (templateId: string, userEmail?: string): string => {
  const user = { name: 'משתמש טסט' };
  
  const baseWrapper = (content: string, headerGradient: string, headerTitle: string, headerSubtitle: string, titleColor: string, subtitleColor: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body dir="rtl" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; direction: rtl;">
  <div dir="rtl" style="max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
    <div style="background: ${headerGradient}; border-radius: 20px; padding: 32px; margin-bottom: 24px;">
      <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="height: 32px; width: auto; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: ${titleColor}; text-align: right;">${headerTitle}</h1>
      ${headerSubtitle ? `<p style="margin: 8px 0 0 0; font-size: 16px; color: ${subtitleColor}; text-align: right;">${headerSubtitle}</p>` : ''}
    </div>
    <div style="background: white; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0;">
      ${content}
    </div>
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
      <p style="margin: 8px 0 0 0;"><a href="https://shipazti.com/unsubscribe?email=${encodeURIComponent(userEmail || '')}" style="color: #94a3b8;">להסרה מרשימת התפוצה</a></p>
    </div>
  </div>
</body>
</html>`;

  const ctaButton = (text: string, url: string, bgColor: string = '#111827') => `
    <div style="text-align: center; margin-top: 28px;">
      <a href="${url}" style="display: inline-block; background: ${bgColor}; color: #ffffff; padding: 18px 48px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 17px;">${text}</a>
    </div>`;

  const templates: Record<string, () => string> = {
    welcome_purchased: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right; margin-bottom: 24px;">תודה שהצטרפת ל-ShiputzAI Premium! 🎉</p>
       <div style="background: #f0f9ff; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #0ea5e9;">
         <h3 style="margin: 0 0 12px 0; color: #0c4a6e; text-align: right;"><span style="color: #0ea5e9;">①</span> הגדר את הפרויקט</h3>
         <p style="margin: 0; color: #475569; text-align: right;">צור פרויקט חדש והגדר תקציב.</p>
       </div>
       <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #22c55e;">
         <h3 style="margin: 0 0 12px 0; color: #166534; text-align: right;"><span style="color: #22c55e;">②</span> סרוק קבלה ראשונה</h3>
         <p style="margin: 0; color: #475569; text-align: right;">צלם קבלה והמערכת תזהה הכל אוטומטית.</p>
       </div>
       <div style="background: #fffbeb; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #f59e0b;">
         <h3 style="margin: 0 0 12px 0; color: #92400e; text-align: right;"><span style="color: #f59e0b;">③</span> עקוב אחרי ההוצאות</h3>
         <p style="margin: 0; color: #475569; text-align: right;">ראה בדיוק לאן הולך הכסף.</p>
       </div>
       ${ctaButton('כניסה לדשבורד ←', 'https://shipazti.com/dashboard')}`,
      'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
      'ברוך הבא!', 'הכל מוכן להתחיל', '#166534', '#15803d'
    ),

    vision_upsell: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right; margin-bottom: 24px;">יש לך Premium - מעולה! 🎉 עכשיו אפשר לקחת את זה צעד קדימה:</p>
       <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 20px; padding: 28px; margin-bottom: 24px; text-align: center;">
         <p style="font-size: 48px; margin: 0 0 16px 0;">🏠</p>
         <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #000000;">איך השיפוץ שלך יראה?</h3>
         <p style="margin: 0; font-size: 16px; color: #000000;">העלה תמונה של החדר → תאר מה אתה רוצה → קבל הדמיה של התוצאה</p>
       </div>
       <p style="font-size: 16px; color: #1e293b; text-align: right;"><strong>מה כלול ב-Pro:</strong></p>
       <ul style="font-size: 15px; color: #475569; text-align: right;">
         <li>הדמיות AI של השיפוץ שלך</li>
         <li>הערכת עלויות אוטומטית</li>
         <li>10 הדמיות בחודש</li>
       </ul>
       <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin: 24px 0; text-align: center;">
         <p style="font-size: 14px; color: #92400e;">🎁 הנחה מיוחדת לחברי Premium:</p>
         <p style="font-size: 40px; font-weight: 700; color: #1e293b; letter-spacing: 3px;">VIS-TEST-123</p>
         <p style="font-size: 16px; color: #92400e;"><strong>50% הנחה</strong> על החודש הראשון!<br><s>₪29</s> → <strong>₪20</strong></p>
       </div>
       ${ctaButton('לנסות Pro ←', 'https://shipazti.com/checkout', '#a855f7')}`,
      'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
      'איך השיפוץ שלך יראה? 🏠', 'הדמיות AI + הערכת עלויות', '#000000', '#000000'
    ),

    discount_offer: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right; margin-bottom: 24px;">רצינו לתת לך הזדמנות מיוחדת להצטרף אלינו:</p>
       <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; text-align: center;">
         <p style="font-size: 14px; color: #92400e;">קוד הנחה אישי:</p>
         <p style="font-size: 40px; font-weight: 700; color: #1e293b; letter-spacing: 3px;">SHIP-TEST-123</p>
         <p style="font-size: 16px; color: #92400e;"><strong>20% הנחה</strong> · תקף ל-48 שעות ⏰</p>
       </div>
       <p style="font-size: 15px; color: #64748b; text-align: center;">הקוד הזה מיועד רק לך.</p>
       ${ctaButton('לממש את ההנחה ←', 'https://shipazti.com/signup', '#f59e0b')}`,
      'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
      'מתנה בשבילך 🎁', '20% הנחה מחכה לך', '#92400e', '#a16207'
    ),
  };

  // Default for templates not yet implemented
  const defaultTemplate = () => baseWrapper(
    `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
     <p style="font-size: 15px; color: #475569; text-align: right;">זהו מייל טסט לתבנית: <strong>${templateId}</strong></p>
     ${ctaButton('לדשבורד ←', 'https://shipazti.com/dashboard')}`,
    'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    TEMPLATE_SUBJECTS[templateId] || templateId, 'מייל טסט', '#334155', '#64748b'
  );

  return (templates[templateId] || defaultTemplate)();
};

export async function POST(request: NextRequest) {
  try {
    // Bug #3 fix: Fail gracefully if API key not configured
    if (!RESEND_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const { template, email } = await request.json();

    if (!template || !email) {
      return NextResponse.json({ error: 'Missing template or email' }, { status: 400 });
    }

    // Bug #4 fix: Verify admin consistently
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const subject = `🧪 טסט: ${TEMPLATE_SUBJECTS[template] || template}`;
    const html = generateHtml(template, email);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (result.id) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json({ success: false, error: result.message || 'Failed to send' }, { status: 500 });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
