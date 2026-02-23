#!/usr/bin/env node
/**
 * ShiputzAI Email Sequences
 * Sends automated email sequences based on user registration/purchase status
 * Updated: 2026-02-23 - New beautiful Base44-style templates
 */

const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://vghfcdtzywbmlacltnjp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGZjZHR6eXdibWxhY2x0bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MTcxNywiZXhwIjoyMDg3MjM3NzE3fQ.HO-ka0H8J0hH1pCHgzDGiiH0ajOKeyFXaDSKJb8LUog';
const RESEND_KEY = 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Email sequences
const PURCHASED_SEQUENCE = [
  { day: 0, subject: '🎉 ברוך הבא ל-ShiputzAI Premium!', template: 'welcome_purchased' },
  { day: 1, subject: '💡 3 דברים לעשות עכשיו', template: 'getting_started' },
  { day: 3, subject: '🏠 איך השיפוץ שלך יראה? (50% הנחה)', template: 'vision_upsell' },
  { day: 5, subject: '💰 איך לא לחרוג מהתקציב', template: 'budget_tips' },
  { day: 7, subject: '❓ איך הולך?', template: 'checkin' },
  { day: 10, subject: '🔥 הכלי שרוב המשפצים לא מכירים', template: 'quote_analysis' },
  { day: 14, subject: '⭐ 30 שניות מזמנך?', template: 'feedback_request' },
];

const NON_PURCHASED_SEQUENCE = [
  { day: 1, subject: '👋 שכחת משהו?', template: 'reminder' },
  { day: 3, subject: '🎁 מתנה בשבילך — 20% הנחה', template: 'discount_offer' },
  { day: 5, subject: '😱 70% מהשיפוצים חורגים מהתקציב', template: 'problem_highlight' },
  { day: 7, subject: '💬 "חסכתי ₪15,000" — סיפור אמיתי', template: 'testimonials' },
  { day: 9, subject: '⏰ נשארו 24 שעות להנחה!', template: 'urgency' },
  { day: 11, subject: '📊 ראה איך זה עובד (1 דקה)', template: 'demo' },
  { day: 14, subject: '🤝 נפרדים כחברים?', template: 'last_chance' },
];

// ===========================================
// EMAIL TEMPLATE HELPERS
// ===========================================

const baseWrapper = (content, headerGradient, headerTitle, headerSubtitle, headerTitleColor, headerSubtitleColor) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body dir="rtl" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl;">
  <div dir="rtl" style="max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
    
    <!-- Header Card -->
    <div dir="rtl" style="background: ${headerGradient}; border-radius: 20px; padding: 32px; margin-bottom: 24px; direction: rtl;">
      <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="height: 32px; width: auto; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: ${headerTitleColor}; text-align: right;">${headerTitle}</h1>
      ${headerSubtitle ? `<p style="margin: 8px 0 0 0; font-size: 16px; color: ${headerSubtitleColor}; text-align: right;">${headerSubtitle}</p>` : ''}
    </div>
    
    <!-- Main Content -->
    <div dir="rtl" style="background: white; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; direction: rtl;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
      <p style="margin: 8px 0 0 0;"><a href="https://shipazti.com/unsubscribe" style="color: #94a3b8;">להסרה מרשימת התפוצה</a></p>
    </div>
  </div>
</body>
</html>
`;

const ctaButton = (text, url, bgColor = '#111827') => `
<div style="text-align: center; margin-top: 28px;">
  <a href="${url}" style="display: inline-block; background: ${bgColor}; color: #ffffff; padding: 18px 48px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 17px;">
    ${text}
  </a>
</div>
`;

const signOff = (extraText = '') => `
<p style="font-size: 15px; color: #64748b; margin-top: 32px; text-align: center; line-height: 1.6;">
  ${extraText ? extraText + '<br><br>' : ''}
  בהצלחה עם השיפוץ!<br>
  <strong style="color: #334155;">צוות ShiputzAI</strong>
</p>
`;

// ===========================================
// PURCHASED USER TEMPLATES (7 emails)
// ===========================================

const TEMPLATES = {
  // ===== DAY 0: WELCOME =====
  welcome_purchased: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      תודה שהצטרפת ל-ShiputzAI! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה, לעקוב אחרי כל שקל, ולהישאר בתקציב.
    </p>
    
    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #334155; text-align: right;">3 צעדים להתחלה מהירה</h2>
    </div>
    
    <div dir="rtl" style="background: #f0f9ff; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #0ea5e9; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0c4a6e; text-align: right;">
        <span style="color: #0ea5e9; margin-left: 8px;">①</span>
        הגדר את הפרויקט
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        צור פרויקט חדש, תן לו שם, והגדר את התקציב הכולל. זה יעזור לנו להתריע לפני חריגות.
      </p>
    </div>
    
    <div dir="rtl" style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #22c55e; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #166534; text-align: right;">
        <span style="color: #22c55e; margin-left: 8px;">②</span>
        סרוק את הקבלה הראשונה
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        צלם קבלה והמערכת תזהה אוטומטית את הסכום, התאריך, והקטגוריה.
      </p>
    </div>
    
    <div dir="rtl" style="background: #fffbeb; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #f59e0b; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #92400e; text-align: right;">
        <span style="color: #f59e0b; margin-left: 8px;">③</span>
        עקוב אחרי ההוצאות
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        ראה בדיוק כמה הוצאת, על מה, וכמה נשאר. גרפים ברורים ושליטה מלאה.
      </p>
    </div>
    
    ${ctaButton('כניסה לדשבורד ←', 'https://shipazti.com/dashboard')}
    ${signOff('שאלות? פשוט תשלח לנו הודעה.')}
  `,
    'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
    'ברוך הבא!',
    'הכל מוכן להתחיל את השיפוץ',
    '#166534',
    '#15803d'
  ),

  // ===== DAY 1: GETTING STARTED =====
  getting_started: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      יום שני עם ShiputzAI! הנה 3 דברים שכדאי לעשות עכשיו כדי להפיק את המקסימום:
    </p>
    
    <div dir="rtl" style="background: #fdf4ff; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #a855f7; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #6b21a8; text-align: right;">
        הגדר תקציב לכל קטגוריה
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        במקום תקציב כולל בלבד, חלק אותו לקטגוריות: חשמל, אינסטלציה, ריצוף וכו׳. ככה תזהה חריגות ספציפיות.
      </p>
    </div>
    
    <div dir="rtl" style="background: #fff7ed; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #f97316; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #9a3412; text-align: right;">
        הוסף את הספקים שלך
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        שמור את פרטי הקבלנים והספקים במקום אחד. טלפון, מקצוע, דירוג - הכל זמין כשתצטרך.
      </p>
    </div>
    
    <div dir="rtl" style="background: #ecfeff; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #06b6d4; direction: rtl;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #155e75; text-align: right;">
        צלם את המצב הנוכחי
      </h3>
      <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7; text-align: right;">
        לפני שמתחילים - צלם תמונות של המצב הקיים. תודה לעצמך אחר כך כשתראה את ההתקדמות.
      </p>
    </div>
    
    ${ctaButton('לדשבורד שלי ←', 'https://shipazti.com/dashboard', '#7c3aed')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
    '3 דברים לעשות עכשיו',
    'טיפים להתחלה מוצלחת',
    '#3730a3',
    '#4338ca'
  ),

  // ===== DAY 3: VISION UPSELL (50% discount) =====
  vision_upsell: (user, visionCode) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      יש לך Premium - מעולה! 🎉 עכשיו אפשר לקחת את זה צעד קדימה:
    </p>
    
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 20px; padding: 28px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 16px 0;">🏠</p>
      <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #000000;">איך השיפוץ שלך יראה?</h3>
      <p style="margin: 0; font-size: 16px; color: #000000; line-height: 1.6;">
        העלה תמונה של החדר → תאר מה אתה רוצה → קבל הדמיה של התוצאה
      </p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>מה כלול ב-AI Vision:</strong>
    </p>
    
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>הדמיות AI של השיפוץ שלך</li>
      <li>הערכת עלויות אוטומטית לכל הדמיה</li>
      <li>השוואת סגנונות שונים</li>
      <li>שמירת היסטוריה של כל ההדמיות</li>
      <li>10 הדמיות בחודש (במקום 1 ניסיון בלבד)</li>
    </ul>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0;">🎁 הנחה מיוחדת לחברי Premium:</p>
      <p style="font-size: 40px; font-weight: 700; color: #1e293b; margin: 0; letter-spacing: 3px;">${visionCode || 'VIS-SPECIAL'}</p>
      <p style="font-size: 16px; color: #92400e; margin: 16px 0 0 0;">
        <strong>50% הנחה</strong> על החודש הראשון!<br>
        <span style="text-decoration: line-through;">₪39.99</span> → <strong>₪19.99</strong> בלבד
      </p>
      <p style="font-size: 13px; color: #a16207; margin: 8px 0 0 0;">תקף ל-7 ימים</p>
    </div>
    
    ${ctaButton('לנסות AI Vision ←', 'https://shipazti.com/checkout-vision?code=' + (visionCode || ''), '#a855f7')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    'איך השיפוץ שלך יראה? 🏠',
    'הדמיות AI + הערכת עלויות',
    '#000000',
    '#000000'
  ),

  // ===== DAY 5: BUDGET TIPS =====
  budget_tips: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      70% מהשיפוצים בישראל חורגים מהתקציב. הנה איך להיות ב-30% האחרים:
    </p>
    
    <div style="background: #fef2f2; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #991b1b; text-align: right;">
        ❌ הטעויות הנפוצות
      </h3>
      <ul style="font-size: 15px; color: #7f1d1d; line-height: 1.9; padding-right: 20px; margin: 0; text-align: right;">
        <li>לא משאירים רזרבה לבלת״מים</li>
        <li>לא מתעדים הוצאות קטנות</li>
        <li>לא בודקים הצעות מחיר לפני שחותמים</li>
      </ul>
    </div>
    
    <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #166534; text-align: right;">
        ✅ מה לעשות במקום
      </h3>
      <ul style="font-size: 15px; color: #15803d; line-height: 1.9; padding-right: 20px; margin: 0; text-align: right;">
        <li><strong>רזרבה של 15%</strong> - תמיד יש הפתעות</li>
        <li><strong>תעד הכל</strong> - גם קפה לפועלים זה הוצאה</li>
        <li><strong>השווה מחירים</strong> - השתמש בניתוח הצעות מחיר שלנו</li>
      </ul>
    </div>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 16px; color: #92400e; text-align: center; font-weight: 500;">
        📊 עקוב אחרי ההוצאות שלך בזמן אמת בדשבורד
      </p>
    </div>
    
    ${ctaButton('לצפות בתקציב שלי ←', 'https://shipazti.com/dashboard', '#ca8a04')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
    'איך לא לחרוג מהתקציב',
    'טיפים מניסיון של אלפי משפצים',
    '#92400e',
    '#a16207'
  ),

  // ===== DAY 7: CHECK-IN =====
  checkin: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      עבר שבוע מאז שהתחלת להשתמש ב-ShiputzAI. איך הולך?
    </p>
    
    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155; text-align: right;">
        <strong>רצינו לשאול:</strong>
      </p>
      <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0; text-align: right;">
        <li>הצלחת להגדיר את הפרויקט שלך?</li>
        <li>סרקת כבר קבלות?</li>
        <li>יש משהו שלא ברור או שאפשר לשפר?</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
      אם נתקלת בבעיה או שיש לך שאלה - פשוט תשלח לנו הודעה. אנחנו כאן בשבילך.
    </p>
    
    <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <p style="margin: 0; font-size: 15px; color: #5b21b6; text-align: center;">
        💬 השב למייל הזה עם כל שאלה - נענה תוך 24 שעות
      </p>
    </div>
    
    ${ctaButton('לדשבורד שלי ←', 'https://shipazti.com/dashboard', '#7c3aed')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
    'איך הולך? 👋',
    'רצינו לבדוק שהכל בסדר',
    '#5b21b6',
    '#6d28d9'
  ),

  // ===== DAY 10: QUOTE ANALYSIS =====
  quote_analysis: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      קיבלת הצעת מחיר מקבלן? לפני שאתה חותם - בוא נבדוק אם המחיר הגיוני.
    </p>
    
    <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 20px; padding: 28px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 16px 0;">🔍</p>
      <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #166534;">ניתוח הצעות מחיר</h3>
      <p style="margin: 0; font-size: 16px; color: #15803d; line-height: 1.6;">
        העתק את ההצעה → קבל השוואה למחירי השוק
      </p>
    </div>
    
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #22c55e;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-style: italic; text-align: right;">
        "הקבלן ביקש ₪18,000 על ריצוף. המערכת הראתה לי שזה 30% מעל השוק. ניהלתי מו״מ וחסכתי ₪4,000."
      </p>
      <p style="margin: 0; font-size: 13px; color: #15803d; text-align: right;">— דני, תל אביב</p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>איך זה עובד?</strong>
    </p>
    <ol style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 20px 0; text-align: right;">
      <li>העתק את הצעת המחיר (או צלם אותה)</li>
      <li>המערכת משווה למחירי מידרג - 2.8 מיליון ביקורות</li>
      <li>מקבל הערכה: מציאה / סביר / יקר / יקר מדי</li>
    </ol>
    
    ${ctaButton('לנתח הצעת מחיר ←', 'https://shipazti.com/dashboard', '#16a34a')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)',
    'הכלי שרוב המשפצים לא מכירים',
    'ניתוח הצעות מחיר עם AI',
    '#065f46',
    '#047857'
  ),

  // ===== DAY 14: FEEDBACK REQUEST =====
  feedback_request: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'משפץ יקר'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      עברו שבועיים מאז שהצטרפת. נשמח לשמוע מה אתה חושב!
    </p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 28px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 48px; margin: 0 0 16px 0;">⭐</p>
      <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #92400e;">30 שניות מזמנך</h3>
      <p style="margin: 0; font-size: 16px; color: #a16207; line-height: 1.6;">
        המשוב שלך עוזר לנו להשתפר
      </p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
      נשמח לדעת:
    </p>
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>מה עובד טוב?</li>
      <li>מה אפשר לשפר?</li>
      <li>איזה פיצ׳ר היית רוצה לראות?</li>
    </ul>
    
    <p style="font-size: 15px; color: #64748b; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
      פשוט השב למייל הזה עם התשובות שלך, או לחץ על הכפתור למילוי טופס קצר.
    </p>
    
    ${ctaButton('למלא משוב (30 שניות) ←', 'https://shipazti.com/feedback', '#f59e0b')}
    ${signOff('תודה רבה מראש!')}
  `,
    'linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)',
    'מה דעתך? ⭐',
    'נשמח לשמוע את המשוב שלך',
    '#854d0e',
    '#a16207'
  ),

  // ===========================================
  // NON-PURCHASED USER TEMPLATES (7 emails)
  // ===========================================

  // ===== DAY 1: REMINDER =====
  reminder: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      שמנו לב שנרשמת ל-ShiputzAI אבל עדיין לא התחלת להשתמש.
    </p>
    
    <div style="background: #fef2f2; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 36px; font-weight: 700; color: #dc2626; margin: 0;">70%</p>
      <p style="font-size: 16px; color: #991b1b; margin: 8px 0 0 0;">מהשיפוצים בישראל חורגים מהתקציב</p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>ShiputzAI עוזר לך:</strong>
    </p>
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>לעקוב אחרי כל הוצאה בזמן אמת</li>
      <li>לסרוק קבלות אוטומטית עם AI</li>
      <li>לנתח הצעות מחיר ולהשוות לשוק</li>
      <li>לקבל התראות לפני שחורגים</li>
    </ul>
    
    ${ctaButton('להתחיל עכשיו ←', 'https://shipazti.com/signup')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    'שכחת משהו? 👋',
    'יש לנו כלים שיעזרו לך בשיפוץ',
    '#0c4a6e',
    '#0369a1'
  ),

  // ===== DAY 3: DISCOUNT OFFER =====
  discount_offer: (user, discountCode) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      רצינו לתת לך הזדמנות מיוחדת להצטרף אלינו:
    </p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0;">קוד הנחה אישי:</p>
      <p style="font-size: 40px; font-weight: 700; color: #1e293b; margin: 0; letter-spacing: 3px;">${discountCode}</p>
      <p style="font-size: 16px; color: #92400e; margin: 16px 0 0 0;">
        <strong>20% הנחה</strong> · תקף ל-48 שעות ⏰
      </p>
    </div>
    
    <p style="font-size: 15px; color: #64748b; line-height: 1.8; margin: 0 0 24px 0; text-align: center;">
      הקוד הזה מיועד רק לך ולא ניתן להעברה.
    </p>
    
    ${ctaButton('לממש את ההנחה ←', `https://shipazti.com/signup?code=${discountCode}`, '#f59e0b')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
    'מתנה בשבילך 🎁',
    '20% הנחה מחכה לך',
    '#92400e',
    '#a16207'
  ),

  // ===== DAY 5: PROBLEM HIGHLIGHT =====
  problem_highlight: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      בואו נדבר על מה שמפחיד הכי הרבה משפצים:
    </p>
    
    <div style="background: #1e293b; border-radius: 20px; padding: 28px; margin-bottom: 24px;">
      <p style="font-size: 18px; color: #f8fafc; margin: 0 0 20px 0; text-align: right; line-height: 1.7;">
        😱 <strong>הסיפור הקלאסי:</strong>
      </p>
      <p style="font-size: 15px; color: #cbd5e1; margin: 0; text-align: right; line-height: 1.8;">
        "התחלתי עם תקציב של ₪150,000. אחרי חודש גיליתי שכבר הוצאתי ₪180,000 ועוד לא סיימתי. איפה הכסף הלך? אין לי מושג."
      </p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>למה זה קורה?</strong>
    </p>
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>לא מתעדים הוצאות קטנות (שמצטברות)</li>
      <li>לא יודעים מה המחיר האמיתי בשוק</li>
      <li>אין תמונה ברורה של ההוצאות בזמן אמת</li>
    </ul>
    
    <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 16px; color: #166534; text-align: center; font-weight: 500;">
        ✅ ShiputzAI פותר בדיוק את הבעיות האלה
      </p>
    </div>
    
    ${ctaButton('להתחיל בחינם ←', 'https://shipazti.com/signup')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)',
    '70% חורגים מהתקציב 😱',
    'למה זה קורה ואיך למנוע',
    '#991b1b',
    '#b91c1c'
  ),

  // ===== DAY 7: TESTIMONIALS =====
  testimonials: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      הנה מה שמשתמשים אחרים אומרים על ShiputzAI:
    </p>
    
    <div style="background: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #22c55e;">
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #166534; text-align: right; line-height: 1.7;">
        "חסכתי ₪15,000 רק בזכות ניתוח הצעות המחיר. הקבלן רצה ₪45,000 על המטבח - המערכת הראתה שזה 30% מעל השוק. ניהלתי מו״מ וירדנו ל-₪30,000."
      </p>
      <p style="margin: 0; font-size: 14px; color: #15803d; text-align: right;"><strong>— יעל מ.</strong>, תל אביב</p>
    </div>
    
    <div style="background: #eff6ff; border-radius: 16px; padding: 24px; margin-bottom: 16px; border-right: 4px solid #3b82f6;">
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af; text-align: right; line-height: 1.7;">
        "סוף סוף אני יודע בדיוק לאן הולך הכסף. סריקת הקבלות עובדת מעולה - מצלם ומסיים."
      </p>
      <p style="margin: 0; font-size: 14px; color: #2563eb; text-align: right;"><strong>— אורי כ.</strong>, הרצליה</p>
    </div>
    
    <div style="background: #fdf4ff; border-radius: 16px; padding: 24px; margin-bottom: 24px; border-right: 4px solid #a855f7;">
      <p style="margin: 0 0 12px 0; font-size: 16px; color: #6b21a8; text-align: right; line-height: 1.7;">
        "ההתראות על חריגה מהתקציב הצילו אותי. גיליתי שאני עומד לחרוג עוד לפני שזה קרה."
      </p>
      <p style="margin: 0; font-size: 14px; color: #7c3aed; text-align: right;"><strong>— דני ר.</strong>, רמת גן</p>
    </div>
    
    ${ctaButton('להצטרף אליהם ←', 'https://shipazti.com/signup', '#16a34a')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
    'סיפורי הצלחה 💬',
    'מה אומרים המשתמשים שלנו',
    '#166534',
    '#15803d'
  ),

  // ===== DAY 9: URGENCY =====
  urgency: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      רק רצינו להזכיר - ההנחה שלך עומדת לפוג:
    </p>
    
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; text-align: center;">
      <p style="font-size: 64px; margin: 0;">⏰</p>
      <p style="font-size: 28px; font-weight: 700; color: #dc2626; margin: 16px 0 8px 0;">נשארו 24 שעות</p>
      <p style="font-size: 16px; color: #991b1b; margin: 0;">20% הנחה על ShiputzAI Premium</p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>מה תקבל:</strong>
    </p>
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>ניהול פרויקטים ללא הגבלה</li>
      <li>סריקת קבלות אוטומטית</li>
      <li>ניתוח הצעות מחיר עם AI</li>
      <li>התראות חכמות על חריגה מהתקציב</li>
      <li>ייצוא דוחות ל-Excel</li>
    </ul>
    
    ${ctaButton('לממש את ההנחה עכשיו ←', 'https://shipazti.com/signup', '#dc2626')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)',
    'נשארו 24 שעות! ⏰',
    'ההנחה שלך עומדת לפוג',
    '#991b1b',
    '#b91c1c'
  ),

  // ===== DAY 11: DEMO =====
  demo: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      רוצה לראות איך ShiputzAI עובד בפועל? הנה סיכום של דקה:
    </p>
    
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; padding: 24px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1e40af; text-align: right;">
        ① יוצרים פרויקט
      </h3>
      <p style="margin: 0; font-size: 15px; color: #1e40af; line-height: 1.6; text-align: right;">
        שם + תקציב. זה הכל. לוקח 30 שניות.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 16px; padding: 24px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #166534; text-align: right;">
        ② מצלמים קבלות
      </h3>
      <p style="margin: 0; font-size: 15px; color: #166534; line-height: 1.6; text-align: right;">
        AI מזהה סכום, תאריך וקטגוריה אוטומטית.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 24px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #92400e; text-align: right;">
        ③ רואים את התמונה המלאה
      </h3>
      <p style="margin: 0; font-size: 15px; color: #92400e; line-height: 1.6; text-align: right;">
        גרפים, התקדמות, התראות - הכל במקום אחד.
      </p>
    </div>
    
    <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #5b21b6; text-align: right;">
        ④ מנתחים הצעות מחיר
      </h3>
      <p style="margin: 0; font-size: 15px; color: #5b21b6; line-height: 1.6; text-align: right;">
        בודקים אם המחיר שמציעים הגיוני לפני שחותמים.
      </p>
    </div>
    
    ${ctaButton('לנסות בעצמי ←', 'https://shipazti.com/signup', '#3b82f6')}
    ${signOff()}
  `,
    'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
    'איך זה עובד? (1 דקה) 📊',
    'סיור מהיר ב-ShiputzAI',
    '#0c4a6e',
    '#0369a1'
  ),

  // ===== DAY 14: LAST CHANCE =====
  last_chance: (user) => baseWrapper(`
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      היי ${user.name || 'שם'},
    </p>
    <p style="font-size: 17px; color: #1e293b; line-height: 1.8; margin: 0 0 28px 0; text-align: right;">
      זה המייל האחרון שלנו. לא רצינו להפריע יותר מדי.
    </p>
    
    <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
      <p style="font-size: 16px; color: #334155; margin: 0; text-align: right; line-height: 1.8;">
        אם ShiputzAI לא מתאים לך - זה בסדר גמור. כל אחד והדרך שלו לנהל שיפוץ.
      </p>
    </div>
    
    <p style="font-size: 16px; color: #1e293b; line-height: 1.8; margin: 0 0 16px 0; text-align: right;">
      <strong>אבל אם רק לא הספקת להתחיל</strong> - הנה תזכורת למה כדאי:
    </p>
    
    <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0 0 24px 0; text-align: right;">
      <li>70% מהשיפוצים חורגים מהתקציב</li>
      <li>משתמשים שלנו חוסכים בממוצע ₪8,000</li>
      <li>סריקת קבלות לוקחת 3 שניות</li>
      <li>ניתוח הצעות מחיר - בחינם לחברי פרימיום</li>
    </ul>
    
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 16px; color: #1e40af; text-align: center; font-weight: 500;">
        🤝 הדלת תמיד פתוחה - נשמח לראות אותך בעתיד
      </p>
    </div>
    
    ${ctaButton('לתת צ׳אנס אחרון ←', 'https://shipazti.com/signup', '#6366f1')}
    ${signOff('מאחלים לך שיפוץ מוצלח!')}
  `,
    'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
    'נפרדים כחברים? 🤝',
    'המייל האחרון שלנו',
    '#3730a3',
    '#4338ca'
  ),
};

// ===========================================
// EMAIL SENDING FUNCTIONS
// ===========================================

// Generate unique Premium discount code (SHIP-)
function generateDiscountCode(email) {
  const prefix = email.split('@')[0].slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SHIP-${prefix}-${random}`;
}

// Generate unique Vision discount code (VIS-)
function generateVisionCode(email) {
  const prefix = email.split('@')[0].slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIS-${prefix}-${random}`;
}

// Send email via Resend
async function sendEmail(to, subject, html) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });
  return response.json();
}

// Check if email was already sent
async function wasEmailSent(email, sequenceType, dayNumber) {
  const { data } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('user_email', email)
    .eq('sequence_type', sequenceType)
    .eq('day_number', dayNumber)
    .single();
  return !!data;
}

// Record sent email
async function recordEmail(email, sequenceType, dayNumber) {
  await supabase.from('email_sequences').insert({
    user_email: email,
    sequence_type: sequenceType,
    day_number: dayNumber,
  });
}

// Create Premium discount code for user (20% off, 48h)
async function createDiscountCode(email) {
  const code = generateDiscountCode(email);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
  
  await supabase.from('discount_codes').insert({
    code,
    user_email: email,
    discount_percent: 20,
    expires_at: expiresAt.toISOString(),
  });
  
  return code;
}

// Create Vision discount code for Premium users (50% off first month, 7 days)
async function createVisionCode(email) {
  const code = generateVisionCode(email);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await supabase.from('discount_codes').insert({
    code,
    user_email: email,
    discount_percent: 50,
    expires_at: expiresAt.toISOString(),
    code_type: 'vision', // Mark as vision code
  });
  
  return code;
}

// Main function
async function processEmailSequences() {
  console.log(`[${new Date().toISOString()}] Starting email sequence processing...`);
  
  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log(`Found ${users.length} users`);
  
  for (const user of users) {
    const daysSinceRegistration = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const sequence = user.purchased ? PURCHASED_SEQUENCE : NON_PURCHASED_SEQUENCE;
    const sequenceType = user.purchased ? 'purchased' : 'non_purchased';
    
    for (const step of sequence) {
      if (daysSinceRegistration >= step.day) {
        const alreadySent = await wasEmailSent(user.email, sequenceType, step.day);
        
        if (!alreadySent) {
          console.log(`Sending ${step.template} to ${user.email} (day ${step.day})`);
          
          let html;
          if (step.template === 'discount_offer') {
            // Premium discount for non-purchased users
            const code = await createDiscountCode(user.email);
            html = TEMPLATES[step.template](user, code);
          } else if (step.template === 'vision_upsell') {
            // Vision discount for Premium users
            const visionCode = await createVisionCode(user.email);
            html = TEMPLATES[step.template](user, visionCode);
          } else {
            html = TEMPLATES[step.template](user);
          }
          
          const result = await sendEmail(user.email, step.subject, html);
          
          if (result.id) {
            await recordEmail(user.email, sequenceType, step.day);
            console.log(`✅ Sent successfully: ${result.id}`);
          } else {
            console.error(`❌ Failed to send:`, result);
          }
        }
      }
    }
  }
  
  console.log(`[${new Date().toISOString()}] Done!`);
}

// Validate discount code (for use in checkout)
async function validateDiscountCode(code, userEmail) {
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error || !data) {
    return { valid: false, reason: 'קוד לא קיים' };
  }
  
  if (data.user_email !== userEmail) {
    return { valid: false, reason: 'הקוד לא שייך לחשבון זה' };
  }
  
  if (data.used_at) {
    return { valid: false, reason: 'הקוד כבר נוצל' };
  }
  
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, reason: 'פג תוקף הקוד' };
  }
  
  return { valid: true, discount: data.discount_percent };
}

// Mark code as used
async function markCodeUsed(code) {
  await supabase
    .from('discount_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code', code);
}

// Export for use as module
module.exports = {
  processEmailSequences,
  validateDiscountCode,
  markCodeUsed,
  createDiscountCode,
  createVisionCode,
  sendEmail,
  TEMPLATES,
};

// Run if called directly
if (require.main === module) {
  processEmailSequences().catch(console.error);
}
