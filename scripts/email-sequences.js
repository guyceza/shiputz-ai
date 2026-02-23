#!/usr/bin/env node
/**
 * ShiputzAI Email Sequences
 * Sends automated email sequences based on user registration/purchase status
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

// Base email wrapper - beautiful Base44-style design
const emailWrapper = (content, headerTitle, headerSubtitle, headerGradient = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)') => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header Card with Gradient -->
    <div style="background: ${headerGradient}; border-radius: 20px; padding: 32px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="height: 32px; width: auto;">
      </div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1e293b;">${headerTitle}</h1>
      ${headerSubtitle ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">${headerSubtitle}</p>` : ''}
    </div>
    
    <!-- Main Content -->
    <div style="background: white; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
      <p style="margin: 8px 0 0 0;">
        <a href="https://shipazti.com/unsubscribe" style="color: #94a3b8; text-decoration: underline;">להסרה מרשימת התפוצה</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// Feature card component
const featureCard = (emoji, title, description, gradient = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)') => `
  <div style="background: ${gradient}; border-radius: 16px; padding: 24px; margin: 16px 0;">
    <div style="font-size: 32px; margin-bottom: 12px;">${emoji}</div>
    <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1e293b;">${title}</h3>
    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">${description}</p>
  </div>
`;

// CTA button
const ctaButton = (text, url, emoji = '👉') => `
  <p style="margin: 24px 0 0 0;">
    <a href="${url}" style="color: #0ea5e9; text-decoration: none; font-weight: 500;">${emoji} ${text} ←</a>
  </p>
`;

// Email templates
const TEMPLATES = {
  welcome_purchased: (user) => emailWrapper(
    `
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
        היי ${user.name || 'משפץ יקר'},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 24px 0;">
        תודה שהצטרפת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה ולהישאר בתקציב.
      </p>
      
      <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 32px 0 16px 0;">3 צעדים להתחלה מהירה:</h2>
      
      ${featureCard('📋', 'הגדר את הפרויקט', 'צור פרויקט חדש והגדר את התקציב הכולל שלך.', 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)')}
      ${featureCard('📸', 'סרוק את הקבלה הראשונה', 'צלם קבלה והיא תיכנס אוטומטית למערכת.', 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)')}
      ${featureCard('📊', 'עקוב אחרי ההוצאות', 'ראה בדיוק לאן הולך הכסף בזמן אמת.', 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)')}
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 500; font-size: 16px;">
          כניסה לדשבורד ←
        </a>
      </div>
      
      <p style="font-size: 14px; color: #64748b; margin-top: 32px; text-align: center;">
        בהצלחה עם השיפוץ! 🏠<br>צוות ShiputzAI
      </p>
    `,
    '🎉 ברוך הבא!',
    'הכל מוכן להתחיל',
    'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)'
  ),
  
  reminder: (user) => emailWrapper(
    `
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
        היי ${user.name || 'שם'},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 24px 0;">
        שמנו לב שנרשמת אבל עדיין לא התחלת להשתמש. הנה למה כדאי:
      </p>
      
      ${featureCard('📊', '70% מהשיפוצים חורגים', 'מהתקציב המקורי. ShiputzAI עוזר לך להישאר בשליטה.', 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)')}
      
      <h3 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 24px 0 16px 0;">מה תקבל:</h3>
      <ul style="font-size: 15px; color: #475569; line-height: 2; padding-right: 20px; margin: 0;">
        <li>מעקב אחרי כל הוצאה בזמן אמת</li>
        <li>סריקת קבלות אוטומטית עם AI</li>
        <li>ניתוח הצעות מחיר והשוואה לשוק</li>
        <li>התראות לפני חריגה מהתקציב</li>
      </ul>
      
      ${ctaButton('להתחיל עכשיו בחינם', 'https://shipazti.com/signup')}
    `,
    '👋 שכחת משהו?',
    'יש לנו כלים שיעזרו לך',
    'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
  ),
  
  discount_offer: (user, discountCode) => emailWrapper(
    `
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
        היי ${user.name || 'שם'},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 24px 0;">
        רצינו לתת לך הזדמנות מיוחדת להצטרף אלינו:
      </p>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 32px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e;">קוד הנחה אישי:</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #1e293b; letter-spacing: 2px;">${discountCode}</p>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #92400e;">20% הנחה · תקף ל-48 שעות ⏰</p>
      </div>
      
      <p style="font-size: 14px; color: #64748b; text-align: center;">הקוד הזה מיועד רק לך ולא ניתן להעברה.</p>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="https://shipazti.com/signup?code=${discountCode}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 500; font-size: 16px;">
          לממש את ההנחה ←
        </a>
      </div>
    `,
    '🎁 מתנה בשבילך',
    '20% הנחה מחכה לך',
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)'
  ),

  receipt_scanning: (user) => emailWrapper(
    `
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
        היי ${user.name || 'משפץ יקר'},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 24px 0;">
        הטריק הזה יחסוך לך שעות של עבודה ידנית:
      </p>
      
      ${featureCard('📸', 'צלם → סיים', 'פשוט צלם את הקבלה. ה-AI שלנו יזהה אוטומטית את הסכום, התאריך, והקטגוריה.', 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)')}
      
      <p style="font-size: 15px; color: #475569; line-height: 1.7; margin: 16px 0;">
        <strong>טיפ:</strong> אפשר לצלם עד 3 קבלות בבת אחת! המערכת תעבד את כולן.
      </p>
      
      ${ctaButton('לנסות עכשיו', 'https://shipazti.com/dashboard')}
    `,
    '📸 הטריק שיחסוך לך שעות',
    'סריקת קבלות אוטומטית',
    'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
  ),

  quote_analysis: (user) => emailWrapper(
    `
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 16px 0;">
        היי ${user.name || 'משפץ יקר'},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.7; margin: 0 0 24px 0;">
        קיבלת הצעת מחיר מקבלן? לפני שאתה חותם - בדוק אם המחיר הגיוני:
      </p>
      
      ${featureCard('🔍', 'ניתוח הצעות מחיר', 'העתק את הצעת המחיר והמערכת תשווה אותה למחירי השוק האמיתיים באזור שלך.', 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)')}
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #10b981;">
        <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic;">
          "הקבלן ביקש ₪18,000 על ריצוף. המערכת הראתה לי שזה 30% מעל השוק. חסכתי ₪4,000 רק מזה."
        </p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">— דני, תל אביב</p>
      </div>
      
      ${ctaButton('לנתח הצעת מחיר', 'https://shipazti.com/dashboard')}
    `,
    '🔥 הכלי שרוב המשפצים לא מכירים',
    'ניתוח הצעות מחיר עם AI',
    'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  ),
  
  // Placeholder templates that use the main ones
  getting_started: (user) => TEMPLATES.welcome_purchased(user),
  budget_tips: (user) => TEMPLATES.welcome_purchased(user),
  checkin: (user) => TEMPLATES.reminder(user),
  feedback_request: (user) => TEMPLATES.reminder(user),
  problem_highlight: (user) => TEMPLATES.reminder(user),
  demo: (user) => TEMPLATES.reminder(user),
  testimonials: (user) => TEMPLATES.reminder(user),
  urgency: (user) => TEMPLATES.discount_offer(user, 'LAST24'),
  last_chance: (user) => TEMPLATES.reminder(user),
};

// Generate unique discount code
function generateDiscountCode(email) {
  const prefix = email.split('@')[0].slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SHIP-${prefix}-${random}`;
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

// Create discount code for user
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
            const code = await createDiscountCode(user.email);
            html = TEMPLATES[step.template](user, code);
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
  sendEmail,
};

// Run if called directly
if (require.main === module) {
  processEmailSequences().catch(console.error);
}
