import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY || 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

// Email sequences
const PURCHASED_SEQUENCE = [
  { day: 0, subject: '🎉 ברוך הבא ל-ShiputzAI!', template: 'welcome_purchased' },
  { day: 1, subject: '💡 3 דברים לעשות עכשיו', template: 'getting_started' },
  { day: 3, subject: '🎨 רוצה לראות איך השיפוץ יראה?', template: 'vision_offer' },
  { day: 5, subject: '📸 הטריק שיחסוך לך שעות', template: 'receipt_scanning' },
  { day: 7, subject: '💰 איך לא לחרוג מהתקציב', template: 'budget_tips' },
  { day: 10, subject: '❓ איך הולך?', template: 'checkin' },
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

// Apple-style email wrapper
function wrapEmail(title: string, subtitle: string, content: string, ctaText: string, ctaUrl: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <span style="font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px;">ShiputzAI</span>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td style="padding: 60px 50px; text-align: right;" dir="rtl">
                    
                    <!-- Title -->
                    <h1 style="font-size: 34px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px; letter-spacing: -0.5px; text-align: center;">${title}</h1>
                    ${subtitle ? `<p style="font-size: 17px; color: #86868b; margin: 0 0 50px; text-align: center;">${subtitle}</p>` : '<div style="margin-bottom: 50px;"></div>'}
                    
                    <!-- Content -->
                    ${content}
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px;">
                      <tr>
                        <td align="center">
                          <a href="${ctaUrl}" style="display: inline-block; background: #1d1d1f; color: #ffffff; padding: 18px 48px; border-radius: 980px; text-decoration: none; font-size: 17px; font-weight: 500;">${ctaText}</a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <p style="font-size: 12px; color: #86868b; margin: 0 0 8px;">בהצלחה עם השיפוץ! 🏠</p>
              <p style="font-size: 12px; color: #86868b; margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Generate email HTML based on template
function getEmailHTML(template: string, user: any, discountCode?: string): string {
  const name = user.name || 'משפץ יקר';
  
  const greeting = `<p style="font-size: 17px; color: #1d1d1f; line-height: 1.5; margin: 0 0 30px; text-align: right;">היי <strong>${name}</strong>,</p>`;
  
  const templates: Record<string, { title: string; subtitle: string; content: string; cta: string; url: string }> = {
    
    // === PURCHASED SEQUENCE ===
    
    welcome_purchased: {
      title: '🎉 ברוך הבא ל-ShiputzAI!',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 20px; text-align: right;">
          תודה שהצטרפת! אנחנו כאן כדי לעזור לך <strong>לנהל את השיפוץ בצורה חכמה</strong>.
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          בדשבורד שלך תוכל לעקוב אחרי התקציב, לסרוק קבלות, ולקבל <strong>התראות לפני שחורגים</strong>.
        </p>
      `,
      cta: 'כניסה לדשבורד',
      url: 'https://shipazti.com/dashboard'
    },
    
    getting_started: {
      title: '3 דברים לעשות <span style="color: #0071e3;">עכשיו</span>',
      subtitle: 'כדי להתחיל נכון עם ShiputzAI',
      content: `
        ${greeting}
        <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
          <tr>
            <td style="padding: 24px 0; border-bottom: 1px solid #f5f5f7; text-align: right;" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td width="50" valign="top" style="text-align: right;">
                    <div style="width: 40px; height: 40px; background: #f5f5f7; border-radius: 50%; text-align: center; line-height: 40px; font-size: 17px; font-weight: 600; color: #1d1d1f;">1</div>
                  </td>
                  <td valign="top" style="text-align: right; padding-right: 15px;">
                    <p style="font-size: 17px; font-weight: 700; color: #1d1d1f; margin: 0 0 4px; text-align: right;">צור פרויקט חדש</p>
                    <p style="font-size: 15px; color: #86868b; margin: 0; text-align: right;">תן <strong>שם</strong> והגדר <strong>תקציב התחלתי</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0; border-bottom: 1px solid #f5f5f7; text-align: right;" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td width="50" valign="top" style="text-align: right;">
                    <div style="width: 40px; height: 40px; background: #f5f5f7; border-radius: 50%; text-align: center; line-height: 40px; font-size: 17px; font-weight: 600; color: #1d1d1f;">2</div>
                  </td>
                  <td valign="top" style="text-align: right; padding-right: 15px;">
                    <p style="font-size: 17px; font-weight: 700; color: #1d1d1f; margin: 0 0 4px; text-align: right;">צלם קבלה ראשונה</p>
                    <p style="font-size: 15px; color: #86868b; margin: 0; text-align: right;">ה-AI יזהה את <strong>כל הפרטים</strong> אוטומטית</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0; text-align: right;" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td width="50" valign="top" style="text-align: right;">
                    <div style="width: 40px; height: 40px; background: #f5f5f7; border-radius: 50%; text-align: center; line-height: 40px; font-size: 17px; font-weight: 600; color: #1d1d1f;">3</div>
                  </td>
                  <td valign="top" style="text-align: right; padding-right: 15px;">
                    <p style="font-size: 17px; font-weight: 700; color: #1d1d1f; margin: 0 0 4px; text-align: right;">הגדר התראות</p>
                    <p style="font-size: 15px; color: #86868b; margin: 0; text-align: right;">נודיע לך <strong>לפני שחורגים</strong> מהתקציב</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      cta: 'להתחיל עכשיו',
      url: 'https://shipazti.com/dashboard'
    },
    
    receipt_scanning: {
      title: '📸 הטריק שיחסוך לך <span style="color: #0071e3;">שעות</span>',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          ידעת שאפשר <strong>לסרוק קבלות בשנייה</strong>?
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 1.8; margin: 0;">
            📱 מצלמים את הקבלה<br>
            🤖 ה-AI קורא את כל הפרטים<br>
            ✅ הכל נכנס לרשימה אוטומטית
          </p>
        </div>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          <strong>לא עוד הקלדה ידנית!</strong>
        </p>
      `,
      cta: 'לנסות עכשיו',
      url: 'https://shipazti.com/dashboard'
    },
    
    budget_tips: {
      title: '💰 איך <span style="color: #0071e3;">לא לחרוג</span> מהתקציב',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          <strong>70% מהשיפוצים חורגים מהתקציב.</strong> הנה איך לא להיות חלק מהסטטיסטיקה:
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
            ✅ הגדר <strong>תקציב ריאלי</strong> מראש<br>
            ✅ תעד <strong>כל הוצאה</strong> מיד<br>
            ✅ בדוק את הדשבורד <strong>פעם בשבוע</strong><br>
            ✅ השאר <strong>10-15%</strong> לבלת"מים
          </p>
        </div>
      `,
      cta: 'לצפות בדשבורד',
      url: 'https://shipazti.com/dashboard'
    },
    
    checkin: {
      title: '❓ איך הולך?',
      subtitle: 'עבר שבוע מאז שהתחלת',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          רצינו לבדוק איך הולך!
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          יש שאלות? משהו לא ברור? <strong>פשוט שלח לנו מייל</strong> ונשמח לעזור.
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          אם הכל טוב — מעולה! <strong>תמשיך לתעד</strong> ולעקוב.
        </p>
      `,
      cta: 'לשלוח הודעה',
      url: 'mailto:help@shipazti.com'
    },
    
    quote_analysis: {
      title: '🔥 הכלי שרוב המשפצים <span style="color: #0071e3;">לא מכירים</span>',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          קיבלת הצעת מחיר מקבלן? <strong>לפני שאתה חותם</strong> — תן לנו לבדוק.
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          ה-AI שלנו מנתח הצעות מחיר ובודק:
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
            🔍 האם <strong>המחיר הוגן</strong>?<br>
            📋 מה <strong>חסר</strong> בהצעה?<br>
            ⚠️ אילו סעיפים <strong>צריך לשים לב</strong> אליהם?
          </p>
        </div>
      `,
      cta: 'לנתח הצעת מחיר',
      url: 'https://shipazti.com/dashboard'
    },
    
    feedback_request: {
      title: '⭐ 30 שניות מזמנך?',
      subtitle: 'עברו שבועיים מאז שהתחלת',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          נשמח לשמוע מה אתה חושב!
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          <strong>הפידבק שלך עוזר לנו להשתפר</strong> ולבנות מוצר טוב יותר בשבילך.
        </p>
      `,
      cta: 'לשתף פידבק',
      url: 'mailto:help@shipazti.com?subject=פידבק על ShiputzAI'
    },

    vision_offer: {
      title: '🎨 רוצה לראות איך השיפוץ יראה?',
      subtitle: 'הצצה לעתיד — לפני שמתחילים',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          מתלבט איך לשפץ את הסלון? לא בטוח איזה סגנון מתאים למטבח?
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          עכשיו אפשר <strong>לראות את השיפוץ לפני שמתחילים</strong> — פשוט מעלים תמונה של החדר, וה-AI שלנו מדמיין איך זה יראה אחרי.
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
            ✨ <strong>הדמיות ויזואליות</strong> של איך השיפוץ יראה<br>
            💰 <strong>הערכת עלויות</strong> מדויקת לפי התמונה<br>
            🛒 <strong>Shop the Look</strong> — קנה את הסגנון בקליק
          </p>
        </div>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
          <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0 0 8px;">מחיר מיוחד למנויי ShiputzAI</p>
          <p style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0;">₪30<span style="font-size: 16px; font-weight: 400;">/חודש</span></p>
          <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 8px 0 0; text-decoration: line-through;">במקום ₪40</p>
        </div>
      `,
      cta: 'לנסות עכשיו',
      url: 'https://shipazti.com/checkout-vision'
    },

    // === NON-PURCHASED SEQUENCE ===
    
    reminder: {
      title: '👋 שכחת משהו?',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          שמנו לב שנרשמת ל-ShiputzAI אבל <strong>עדיין לא התחלת</strong>.
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
          <p style="font-size: 24px; font-weight: 700; color: #1d1d1f; margin: 0;">70%</p>
          <p style="font-size: 15px; color: #86868b; margin: 8px 0 0;">מהשיפוצים חורגים מהתקציב</p>
        </div>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          <strong>אנחנו יכולים לעזור.</strong>
        </p>
      `,
      cta: 'להתחיל עכשיו',
      url: 'https://shipazti.com/signup'
    },
    
    discount_offer: {
      title: '🎁 מתנה בשבילך',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          קוד הנחה אישי בשבילך:
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
          <p style="font-size: 32px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: 2px;">${discountCode || 'SHIP-XXXX'}</p>
          <p style="font-size: 15px; color: #86868b; margin: 12px 0 0;"><strong>20% הנחה</strong> · תקף ל-48 שעות</p>
        </div>
      `,
      cta: 'לממש את ההנחה',
      url: `https://shipazti.com/checkout?code=${discountCode || ''}`
    },
    
    problem_highlight: {
      title: '😱 70% מהשיפוצים <span style="color: #e34234;">חורגים</span>',
      subtitle: 'מהתקציב',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          זה לא מקרי. <strong>רוב האנשים מנהלים שיפוץ בלי כלים מתאימים.</strong>
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          ShiputzAI נבנה בדיוק בשביל זה:
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
            ✅ מעקב תקציב <strong>בזמן אמת</strong><br>
            ✅ סריקת קבלות <strong>אוטומטית</strong><br>
            ✅ התראות <strong>לפני חריגות</strong>
          </p>
        </div>
      `,
      cta: 'להתחיל בחינם',
      url: 'https://shipazti.com/signup'
    },
    
    testimonials: {
      title: '💬 מה אומרים משפצים אחרים',
      subtitle: '',
      content: `
        ${greeting}
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 20px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 1.6; margin: 0 0 12px; font-style: italic;">
            "שפצתי דירת 4 חדרים והאפליקציה עזרה לי <strong>לחסוך ₪15,000</strong> בהשוואת הצעות מחיר"
          </p>
          <p style="font-size: 14px; color: #86868b; margin: 0;">— יעל מ., תל אביב</p>
        </div>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; line-height: 1.6; margin: 0 0 12px; font-style: italic;">
            "סוף סוף הצלחתי <strong>לעקוב אחרי כל ההוצאות</strong> במקום אחד. ממליץ בחום!"
          </p>
          <p style="font-size: 14px; color: #86868b; margin: 0;">— אבי כ., רמת גן</p>
        </div>
      `,
      cta: 'להצטרף עכשיו',
      url: 'https://shipazti.com/signup'
    },
    
    urgency: {
      title: '⏰ נשארו <span style="color: #e34234;">24 שעות</span>',
      subtitle: 'להנחה שלך',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          קוד ההנחה שלך <strong>עומד לפוג</strong>.
        </p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
          <p style="font-size: 32px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: 2px;">${discountCode || ''}</p>
          <p style="font-size: 15px; color: #86868b; margin: 8px 0 0;"><strong>20% הנחה</strong> · רק עד מחר</p>
        </div>
      `,
      cta: 'לממש עכשיו',
      url: `https://shipazti.com/checkout?code=${discountCode || ''}`
    },
    
    demo: {
      title: '📊 ראה איך זה עובד',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          רוצה לראות בדיוק <strong>איך ShiputzAI יכול לעזור לך</strong>?
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          באתר שלנו יש הדגמה מלאה — תוכל לראות את <strong>הדשבורד</strong>, <strong>סריקת הקבלות</strong>, וכל הפיצ'רים.
        </p>
      `,
      cta: 'לצפות בהדגמה',
      url: 'https://shipazti.com'
    },
    
    last_chance: {
      title: '🤝 אולי לא בשבילך?',
      subtitle: '',
      content: `
        ${greeting}
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          שלחנו לך כמה מיילים ולא שמענו ממך.
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
          אם ShiputzAI לא מתאים לך — <strong>זה בסדר גמור</strong>. נפסיק לשלוח.
        </p>
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
          אבל אם בכל זאת רוצה לנסות — <strong>הדלת תמיד פתוחה</strong>.
        </p>
      `,
      cta: 'להצטרף',
      url: 'https://shipazti.com/signup'
    },
  };
  
  const t = templates[template] || templates.reminder;
  return wrapEmail(t.title, t.subtitle, t.content, t.cta, t.url);
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
              // Create new discount code
              const code = generateDiscountCode(user.email);
              const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
              
              await supabase.from('discount_codes').insert({
                code,
                user_email: user.email,
                discount_percent: 20,
                expires_at: expiresAt.toISOString(),
              });
              
              html = getEmailHTML(step.template, user, code);
            } else if (step.template === 'urgency') {
              // Fetch existing discount code for urgency reminder
              const { data: discountData } = await supabase
                .from('discount_codes')
                .select('code')
                .eq('user_email', user.email)
                .is('used_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              html = getEmailHTML(step.template, user, discountData?.code);
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
