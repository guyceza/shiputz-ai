import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

// Note: Auth via rate limiting - 1 request per hour per IP

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Bug #H08 fix: Add strict rate limiting (1 per hour per IP) 
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(`welcome:${clientId}`, 1, 60 * 60 * 1000); // 1 per hour
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const displayName = name || 'משפץ יקר';
    
    const html = `
      <div dir="rtl" style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 24px; font-weight: 600; color: #111; vertical-align: middle;">ShiputzAI</span>
        </div>
        <h2 style="color: #111; font-size: 22px; font-weight: 600; margin-bottom: 24px; text-align: center;">👋 ברוך הבא!</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">היי ${displayName},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">תודה שנרשמת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">ShiputzAI עוזר לך לעקוב אחרי התקציב, לסרוק קבלות, ולקבל התראות לפני שחורגים.</p>
        <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: 500;">כניסה לאזור האישי ←</a>
        <p style="margin-top: 40px; color: #666; font-size: 14px;">בהצלחה עם השיפוץ!<br>צוות ShiputzAI</p>
        <p style="margin-top: 30px; text-align: center;"><a href="https://shipazti.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; font-size: 12px;">להסרה מרשימת התפוצה</a></p>
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
