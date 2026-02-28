import { NextRequest, NextResponse } from "next/server";

// Import email templates - we'll read from the scripts file
// For now, return a placeholder that tells them to check the actual file

const ADMIN_EMAILS = ['guyceza@gmail.com'];

// Simplified template generator for preview
const generatePreview = (templateId: string): string => {
  const user = { name: 'משתמש לדוגמה' };
  const code = 'TEST-CODE-123';
  
  // Base wrapper
  const baseWrapper = (content: string, headerGradient: string, headerTitle: string, headerSubtitle: string, titleColor: string, subtitleColor: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body dir="rtl" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl;">
  <div dir="rtl" style="max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl;">
    <div dir="rtl" style="background: ${headerGradient}; border-radius: 20px; padding: 32px; margin-bottom: 24px; direction: rtl;">
      <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="height: 32px; width: auto; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: ${titleColor}; text-align: right;">${headerTitle}</h1>
      ${headerSubtitle ? `<p style="margin: 8px 0 0 0; font-size: 16px; color: ${subtitleColor}; text-align: right;">${headerSubtitle}</p>` : ''}
    </div>
    <div dir="rtl" style="background: white; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; direction: rtl;">
      ${content}
    </div>
    <div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
    </div>
  </div>
</body>
</html>`;

  const templates: Record<string, () => string> = {
    welcome_purchased: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right;">תודה שהצטרפת ל-ShiputzAI Premium! 🎉</p>
       <p style="font-size: 15px; color: #475569; text-align: right;">אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>`,
      'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%)',
      'ברוך הבא!', 'הכל מוכן להתחיל', '#166534', '#15803d'
    ),
    
    vision_upsell: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right;">יש לך Premium - מעולה! 🎉</p>
       <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 20px; padding: 28px; margin: 24px 0; text-align: center;">
         <p style="font-size: 48px; margin: 0 0 16px 0;">🏠</p>
         <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #000000;">איך השיפוץ שלך יראה?</h3>
         <p style="margin: 0; font-size: 16px; color: #000000;">העלה תמונה → תאר מה אתה רוצה → קבל הדמיה</p>
       </div>
       <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; text-align: center;">
         <p style="font-size: 14px; color: #92400e;">🎁 הנחה מיוחדת:</p>
         <p style="font-size: 40px; font-weight: 700; color: #1e293b;">VIS-XXXX-XXXX</p>
         <p style="font-size: 16px; color: #92400e;"><strong>50% הנחה</strong> על החודש הראשון!</p>
       </div>`,
      'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
      'איך השיפוץ שלך יראה? 🏠', 'הדמיות AI + הערכת עלויות', '#000000', '#000000'
    ),

    discount_offer: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right;">רצינו לתת לך הזדמנות מיוחדת להצטרף:</p>
       <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin: 24px 0; text-align: center;">
         <p style="font-size: 14px; color: #92400e;">קוד הנחה אישי:</p>
         <p style="font-size: 40px; font-weight: 700; color: #1e293b; letter-spacing: 3px;">SHIP-XXXX-XXXX</p>
         <p style="font-size: 16px; color: #92400e;"><strong>20% הנחה</strong> · תקף ל-48 שעות ⏰</p>
       </div>`,
      'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
      'מתנה בשבילך 🎁', '20% הנחה מחכה לך', '#92400e', '#a16207'
    ),

    // Placeholder for other templates
    getting_started: () => baseWrapper(
      `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
       <p style="font-size: 17px; color: #1e293b; text-align: right;">יום שני עם ShiputzAI! הנה 3 דברים שכדאי לעשות:</p>
       <ul style="font-size: 15px; color: #475569;"><li>הגדר תקציב לכל קטגוריה</li><li>הוסף את הספקים שלך</li><li>צלם את המצב הנוכחי</li></ul>`,
      'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
      '3 דברים לעשות עכשיו', 'טיפים להתחלה מוצלחת', '#3730a3', '#4338ca'
    ),
  };

  // Default template for ones not fully implemented
  const defaultTemplate = () => baseWrapper(
    `<p style="font-size: 17px; color: #1e293b; text-align: right;">היי ${user.name},</p>
     <p style="font-size: 15px; color: #475569; text-align: right;">זוהי תצוגה מקדימה של תבנית: <strong>${templateId}</strong></p>
     <p style="font-size: 14px; color: #94a3b8; text-align: right; margin-top: 24px;">📁 לצפייה בתבנית המלאה, ראה: scripts/email-sequences.js</p>`,
    'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    templateId, 'תצוגה מקדימה', '#334155', '#64748b'
  );

  const templateFn = templates[templateId] || defaultTemplate;
  return templateFn();
};

import { createServiceClient } from '@/lib/supabase';

// Verify admin exists in database
async function verifyAdmin(email: string | null): Promise<boolean> {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    return false;
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();
  return !!data;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template');
    const adminEmail = searchParams.get('adminEmail');

    // Bug #M01 fix: Require admin verification
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Missing template parameter' }, { status: 400 });
    }

    const html = generatePreview(template);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
