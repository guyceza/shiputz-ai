import { NextRequest, NextResponse } from 'next/server';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const displayName = name || 'משפץ יקר';
    
    const html = `
      <div dir="rtl" style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #111; font-size: 24px; font-weight: 600; margin-bottom: 24px;">👋 ברוך הבא ל-ShiputzAI!</h1>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">היי ${displayName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">תודה שנרשמת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">ShiputzAI עוזר לך לעקוב אחרי התקציב, לסרוק קבלות, ולקבל התראות לפני שחורגים.</p>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: 500;">כניסה לאזור האישי ←</a>
        <p style="margin-top: 40px; color: #666; font-size: 14px;">בהצלחה עם השיפוץ!<br>צוות ShiputzAI</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: '👋 ברוך הבא ל-ShiputzAI!',
        html,
      }),
    });

    const result = await response.json();
    console.log('Welcome email sent:', result);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
