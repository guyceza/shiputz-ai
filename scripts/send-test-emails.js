const RESEND_KEY = 're_DUfgFQ4J_KnMvhKXtaDC9g4Q6ZaiEMjEo';
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';
const TO_EMAIL = 'wed4me4@gmail.com';

const testUser = {
  name: 'טסטר יקר',
  email: TO_EMAIL
};

const greeting = `<p style="font-size: 17px; color: #1d1d1f; line-height: 1.5; margin: 0 0 30px; text-align: right;">היי <strong>${testUser.name}</strong>,</p>`;
const discountCode = 'SHIP-TEST-123456';

// Email wrapper function
function wrapEmail(title, subtitle, content, ctaText, ctaUrl) {
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
                    <div style="text-align: center; margin-top: 40px;">
                      <a href="${ctaUrl}" style="display: inline-block; background: #1d1d1f; color: #ffffff; padding: 16px 32px; border-radius: 980px; text-decoration: none; font-size: 17px; font-weight: 500; letter-spacing: -0.2px;">${ctaText}</a>
                    </div>
                    
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

// All 14 email templates
const templates = {
  // === PURCHASED SEQUENCE (7 emails) ===
  
  welcome_purchased: {
    subject: '🎉 ברוך הבא ל-ShiputzAI!',
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
    subject: '💡 3 דברים לעשות עכשיו',
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
                  <p style="font-size: 17px; font-weight: 700; color: #1d1d1f; margin: 0 0 4px; text-align: right;">סרוק קבלה ראשונה</p>
                  <p style="font-size: 15px; color: #86868b; margin: 0; text-align: right;">צלם קבלה — ה-AI יקרא הכל</p>
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
                  <p style="font-size: 17px; font-weight: 700; color: #1d1d1f; margin: 0 0 4px; text-align: right;">בדוק את הדשבורד</p>
                  <p style="font-size: 15px; color: #86868b; margin: 0; text-align: right;">ראה <strong>כמה נשאר</strong> מהתקציב</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
    cta: 'להתחיל',
    url: 'https://shipazti.com/dashboard'
  },
  
  vision_offer: {
    subject: '🎨 רוצה לראות איך השיפוץ יראה?',
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
        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0 0 8px;">🎁 הנחה מיוחדת למנויי ShiputzAI</p>
        <p style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0;">₪19.99<span style="font-size: 16px; font-weight: 400;"> לחודש הראשון</span></p>
        <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 8px 0 0; text-decoration: line-through;">במקום ₪39.99</p>
        <p style="font-size: 12px; color: rgba(255,255,255,0.6); margin: 8px 0 0;">אחר כך ₪39.99/חודש · ביטול בכל עת</p>
      </div>
    `,
    cta: 'לנסות עכשיו בהנחה',
    url: 'https://shipazti.com/checkout-vision'
  },
  
  receipt_scanning: {
    subject: '📸 הטריק שיחסוך לך שעות',
    title: '📸 הטריק שיחסוך לך שעות',
    subtitle: 'סריקת קבלות — מהיר ומדויק',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        במקום לרשום הכל ידנית, פשוט <strong>מצלמים את הקבלה</strong> — וזהו.
      </p>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
        <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
          📷 <strong>צלם</strong> או בחר מהגלריה<br>
          🤖 ה-AI <strong>קורא הכל</strong> — סכום, ספק, תאריך<br>
          ✅ הוצאה <strong>נוספת אוטומטית</strong> לפרויקט
        </p>
      </div>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
        עובד גם עם <strong>קבלות בכתב יד</strong> 🎉
      </p>
    `,
    cta: 'לסרוק קבלה',
    url: 'https://shipazti.com/dashboard'
  },
  
  budget_tips: {
    subject: '💰 איך לא לחרוג מהתקציב',
    title: '💰 איך לא לחרוג',
    subtitle: '5 טיפים מנוסים בשטח',
    content: `
      ${greeting}
      <div style="margin-bottom: 25px;">
        <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; margin: 0;"><strong>1.</strong> השאר <strong>15% רזרבה</strong> — תמיד יש הפתעות</p>
        </div>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; margin: 0;"><strong>2.</strong> קח <strong>3 הצעות מחיר</strong> לפחות</p>
        </div>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; margin: 0;"><strong>3.</strong> תעד <strong>כל הוצאה</strong> — קטנה כגדולה</p>
        </div>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 12px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; margin: 0;"><strong>4.</strong> בדוק שהצעת מחיר כוללת <strong>מע"מ</strong></p>
        </div>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; text-align: right;">
          <p style="font-size: 16px; color: #1d1d1f; margin: 0;"><strong>5.</strong> השתמש ב-ShiputzAI 😉</p>
        </div>
      </div>
    `,
    cta: 'לדשבורד',
    url: 'https://shipazti.com/dashboard'
  },
  
  checkin: {
    subject: '❓ איך הולך?',
    title: '❓ איך הולך?',
    subtitle: '',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        רצינו לבדוק שהכל בסדר עם השיפוץ.
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        <strong>יש שאלות?</strong> פשוט תענה על המייל הזה — אנחנו כאן.
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
        בהצלחה! 🏠
      </p>
    `,
    cta: 'כניסה לדשבורד',
    url: 'https://shipazti.com/dashboard'
  },
  
  feedback_request: {
    subject: '⭐ 30 שניות מזמנך?',
    title: '⭐ 30 שניות מזמנך?',
    subtitle: '',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        אנחנו רוצים להשתפר — וה<strong>פידבק שלך</strong> יעזור לנו.
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        <strong>מה עובד טוב?</strong> מה אפשר לשפר?
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
        פשוט תענה על המייל הזה — נקרא כל מילה 🙏
      </p>
    `,
    cta: 'לשתף פידבק',
    url: 'mailto:help@shipazti.com?subject=פידבק על ShiputzAI'
  },

  // === NON-PURCHASED SEQUENCE (7 emails) ===
  
  reminder: {
    subject: '👋 שכחת משהו?',
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
    subject: '🎁 מתנה בשבילך — 20% הנחה',
    title: '🎁 מתנה בשבילך',
    subtitle: '',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        קוד הנחה אישי בשבילך:
      </p>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
        <p style="font-size: 32px; font-weight: 700; color: #1d1d1f; margin: 0; letter-spacing: 2px;">${discountCode}</p>
        <p style="font-size: 15px; color: #86868b; margin: 12px 0 0;"><strong>20% הנחה</strong> · תקף ל-48 שעות</p>
      </div>
    `,
    cta: 'לממש את ההנחה',
    url: `https://shipazti.com/checkout?code=${discountCode}`
  },
  
  problem_highlight: {
    subject: '😱 70% מהשיפוצים חורגים מהתקציב',
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
          ✅ התראות <strong>לפני שחורגים</strong>
        </p>
      </div>
    `,
    cta: 'להירשם עכשיו',
    url: 'https://shipazti.com/signup'
  },
  
  testimonials: {
    subject: '💬 "חסכתי ₪15,000" — יעל מת"א',
    title: '💬 מה אומרים המשפצים',
    subtitle: '',
    content: `
      ${greeting}
      <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 20px; text-align: right;">
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 15px; font-style: italic;">
          "שפצתי דירת 4 חדרים והאפליקציה עזרה לי לחסוך ₪15,000 בהשוואת הצעות מחיר"
        </p>
        <p style="font-size: 14px; color: #86868b; margin: 0;"><strong>יעל מ.</strong> · תל אביב</p>
      </div>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 20px; text-align: right;">
        <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 15px; font-style: italic;">
          "סוף סוף הצלחתי לעקוב אחרי כל ההוצאות במקום אחד. ממליץ בחום!"
        </p>
        <p style="font-size: 14px; color: #86868b; margin: 0;"><strong>אבי כ.</strong> · רמת גן</p>
      </div>
    `,
    cta: 'להצטרף אליהם',
    url: 'https://shipazti.com/signup'
  },
  
  urgency: {
    subject: '⏰ נשארו 24 שעות להנחה!',
    title: '⏰ נשארו 24 שעות',
    subtitle: 'להנחה שלך',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        הקוד שלך <strong>${discountCode}</strong> עומד לפוג.
      </p>
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 0 0 8px;">⏰ נשארו פחות מ-24 שעות</p>
        <p style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0;">20% הנחה</p>
      </div>
    `,
    cta: 'לממש עכשיו',
    url: `https://shipazti.com/checkout?code=${discountCode}`
  },
  
  demo: {
    subject: '📊 ראה איך זה עובד',
    title: '📊 ראה איך זה עובד',
    subtitle: '3 דקות שישנו את השיפוץ שלך',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        לא בטוח אם ShiputzAI מתאים לך? <strong>הנה איך זה עובד:</strong>
      </p>
      <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
        <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
          📊 <strong>דשבורד חכם</strong> — כל ההוצאות במקום אחד<br>
          📸 <strong>סריקת קבלות</strong> — צלם ותשכח<br>
          🔔 <strong>התראות</strong> — לפני שחורגים מהתקציב<br>
          🎨 <strong>הדמיות AI</strong> — ראה איך זה יראה
        </p>
      </div>
    `,
    cta: 'לנסות בחינם',
    url: 'https://shipazti.com'
  },
  
  last_chance: {
    subject: '🤝 אולי לא בשבילך?',
    title: '🤝 אולי לא בשבילך?',
    subtitle: '',
    content: `
      ${greeting}
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        שמנו לב שלא הצטרפת עדיין. <strong>זה בסדר גמור.</strong>
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">
        אם יש משהו שהפריע לך, נשמח לשמוע — פשוט תענה על המייל הזה.
      </p>
      <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0; text-align: right;">
        ואם תשנה את דעתך — <strong>אנחנו כאן</strong> 🏠
      </p>
    `,
    cta: 'אולי בכל זאת?',
    url: 'https://shipazti.com/signup'
  }
};

// Email sequences in order
const PURCHASED_SEQUENCE = ['welcome_purchased', 'getting_started', 'vision_offer', 'receipt_scanning', 'budget_tips', 'checkin', 'feedback_request'];
const NON_PURCHASED_SEQUENCE = ['reminder', 'discount_offer', 'problem_highlight', 'testimonials', 'urgency', 'demo', 'last_chance'];

async function sendEmail(to, subject, html) {
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

async function main() {
  console.log('שולח 14 מיילים ל-' + TO_EMAIL + '...\n');
  
  console.log('=== PURCHASED SEQUENCE (7 מיילים) ===\n');
  for (let i = 0; i < PURCHASED_SEQUENCE.length; i++) {
    const key = PURCHASED_SEQUENCE[i];
    const t = templates[key];
    const html = wrapEmail(t.title, t.subtitle, t.content, t.cta, t.url);
    
    console.log(`[${i+1}/7] שולח: ${t.subject}`);
    const result = await sendEmail(TO_EMAIL, `[PURCHASED ${i+1}] ${t.subject}`, html);
    console.log(`   → ${result.id ? '✅ נשלח' : '❌ שגיאה: ' + JSON.stringify(result)}`);
    
    // Wait 1 second between emails to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n=== NON-PURCHASED SEQUENCE (7 מיילים) ===\n');
  for (let i = 0; i < NON_PURCHASED_SEQUENCE.length; i++) {
    const key = NON_PURCHASED_SEQUENCE[i];
    const t = templates[key];
    const html = wrapEmail(t.title, t.subtitle, t.content, t.cta, t.url);
    
    console.log(`[${i+1}/7] שולח: ${t.subject}`);
    const result = await sendEmail(TO_EMAIL, `[NON-PURCHASED ${i+1}] ${t.subject}`, html);
    console.log(`   → ${result.id ? '✅ נשלח' : '❌ שגיאה: ' + JSON.stringify(result)}`);
    
    // Wait 1 second between emails
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n✅ סיימתי לשלוח את כל 14 המיילים!');
}

main().catch(console.error);
