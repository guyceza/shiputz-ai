import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';
import crypto from 'crypto';

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
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const displayName = name || 'משפץ יקר';
    
    // Generate unsubscribe token
    const unsubSecret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || '';
    const unsubToken = unsubSecret 
      ? crypto.createHmac('sha256', unsubSecret).update(email.toLowerCase()).digest('hex').substring(0, 16)
      : '';
    const unsubUrl = `https://shipazti.com/unsubscribe?email=${encodeURIComponent(email)}${unsubToken ? `&token=${unsubToken}` : ''}`;
    
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ef; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 52px 18px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 28px; font-weight: 600; color: #1d1d1f; vertical-align: middle;">ShiputzAI</span>
            </td>
          </tr>
          <tr>
            <td style="background: #fffaf0; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 42px rgba(30, 56, 38, 0.14); border: 1px solid #efe2c6;" dir="rtl">
              <div style="height: 12px; background: linear-gradient(90deg, #14b875 0%, #8bd86f 48%, #f0c75d 100%);"></div>
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td style="padding: 48px 42px 44px; text-align: right;" dir="rtl">
                    <h1 style="font-size: 34px; font-weight: 800; color: #142018; margin: 0 0 12px; text-align: center; direction: rtl;">ברוך הבא!</h1>
                    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 22px; text-align: right;">היי ${displayName},</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 22px; text-align: right;">תודה שנרשמת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
                    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 32px; text-align: right;">ShiputzAI עוזר לך לעקוב אחרי התקציב, לסרוק קבלות, ולקבל התראות לפני שחורגים.</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 700; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">כניסה לאזור האישי</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <p style="font-size: 12px; color: #86868b; margin: 0 0 8px;">בהצלחה עם השיפוץ!</p>
              <p style="font-size: 12px; color: #86868b; margin: 0 0 16px;">ShiputzAI · ניהול שיפוצים חכם</p>
              <p style="font-size: 11px; color: #aeaeb2; margin: 0;"><a href="${unsubUrl}" style="color: #aeaeb2; text-decoration: underline;">להסרה מרשימת התפוצה</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
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

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
