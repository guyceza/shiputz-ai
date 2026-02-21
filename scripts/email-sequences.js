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

// Email templates
const TEMPLATES = {
  welcome_purchased: (user) => `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">🎉 ברוך הבא ל-ShiputzAI!</h1>
      <p>היי ${user.name || 'משפץ יקר'},</p>
      <p>תודה שהצטרפת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
      <p><strong>מה עכשיו?</strong></p>
      <ol>
        <li>היכנס לדשבורד והגדר את הפרויקט הראשון שלך</li>
        <li>הגדר תקציב התחלתי</li>
        <li>התחל לתעד הוצאות</li>
      </ol>
      <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin-top: 16px;">כניסה לדשבורד ←</a>
      <p style="margin-top: 24px; color: #666;">בהצלחה עם השיפוץ!<br>צוות ShiputzAI</p>
    </div>
  `,
  
  reminder: (user) => `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">👋 שכחת משהו?</h1>
      <p>היי ${user.name || 'שם'},</p>
      <p>שמנו לב שנרשמת ל-ShiputzAI אבל עדיין לא התחלת להשתמש.</p>
      <p>ידעת ש-<strong>70% מהשיפוצים בישראל חורגים מהתקציב</strong>?</p>
      <p>ShiputzAI עוזר לך:</p>
      <ul>
        <li>לעקוב אחרי כל הוצאה בזמן אמת</li>
        <li>לסרוק קבלות אוטומטית</li>
        <li>לנתח הצעות מחיר עם AI</li>
      </ul>
      <a href="https://shipazti.com/signup" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin-top: 16px;">להתחיל עכשיו ←</a>
    </div>
  `,
  
  discount_offer: (user, discountCode) => `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #111;">🎁 מתנה בשבילך</h1>
      <p>היי ${user.name || 'שם'},</p>
      <p>רצינו לתת לך הזדמנות אחרונה להצטרף ל-ShiputzAI.</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; color: #666;">קוד הנחה אישי:</p>
        <p style="font-size: 28px; font-weight: bold; color: #111; margin: 8px 0;">${discountCode}</p>
        <p style="margin: 0; color: #666;">20% הנחה · תקף ל-48 שעות</p>
      </div>
      <p>הקוד הזה מיועד רק לך ולא ניתן להעברה.</p>
      <a href="https://shipazti.com/signup?code=${discountCode}" style="display: inline-block; background: #111; color: white; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin-top: 16px;">לממש את ההנחה ←</a>
    </div>
  `,
  
  // Add more templates as needed...
  getting_started: (user) => TEMPLATES.welcome_purchased(user),
  receipt_scanning: (user) => TEMPLATES.welcome_purchased(user),
  budget_tips: (user) => TEMPLATES.welcome_purchased(user),
  checkin: (user) => TEMPLATES.welcome_purchased(user),
  quote_analysis: (user) => TEMPLATES.welcome_purchased(user),
  feedback_request: (user) => TEMPLATES.welcome_purchased(user),
  problem_highlight: (user) => TEMPLATES.reminder(user),
  demo: (user) => TEMPLATES.reminder(user),
  testimonials: (user) => TEMPLATES.reminder(user),
  urgency: (user) => TEMPLATES.reminder(user),
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
