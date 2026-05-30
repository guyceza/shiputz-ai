import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY;
import { isAdminRequest } from '@/lib/admin-auth';
import { verifyUserEmail } from '@/lib/api-auth';

// Send welcome premium email
async function sendWelcomePremiumEmail(email: string, name?: string) {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ef; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Arial, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 52px 18px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          <tr>
            <td style="background: #fffaf0; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 42px rgba(30, 56, 38, 0.14); border: 1px solid #efe2c6;" dir="rtl">
              <div style="height: 12px; background: linear-gradient(90deg, #14b875 0%, #8bd86f 48%, #f0c75d 100%);"></div>
              <div style="padding: 48px 42px 44px; text-align: right;" dir="rtl">
                <h1 style="font-size: 34px; font-weight: 800; color: #142018; margin: 0 0 28px; text-align: center; direction: rtl;">ברוך הבא ל-ShiputzAI Premium!</h1>
                <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${name || 'משפץ יקר'},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">תודה רבה! אנחנו שמחים שבחרת ב-ShiputzAI לניהול השיפוץ שלך.</p>
                <div style="background: #ffffff; border-radius: 18px; padding: 20px; margin: 24px 0; border: 1px solid #eee5d7;">
                  <h3 style="color: #111; margin-top: 0;">✅ מה מחכה לך:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li>מעקב תקציב חכם בזמן אמת</li>
                    <li>סריקת קבלות אוטומטית עם AI</li>
                    <li>ניתוח הצעות מחיר</li>
                    <li>עוזר AI אישי לכל שאלה</li>
                    <li>התראות חכמות לפני חריגות</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">כניסה לדשבורד</a>
                </div>
                <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0;">בהצלחה עם השיפוץ!</p>
                <p style="margin-top: 30px; text-align: center;"><a href="https://shipazti.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; font-size: 12px;">להסרה מרשימת התפוצה</a></p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: '🎉 ברוך הבא ל-ShiputzAI Premium!',
        html,
      }),
    });
    return response.json();
  } catch (error) {
    return null;
  }
}

// GET - Get premium users list or check if email has premium
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const supabase = createServiceClient();
  
  if (!email) {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all premium users
    const { data } = await supabase
      .from('users')
      .select('email, name, purchased, purchased_at')
      .eq('purchased', true);
    
    // Transform to expected format for admin panel
    const list = (data || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime', // Premium is permanent
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ list });
  }
  
  // Check specific user
  if (!(await verifyUserEmail(request, email)) && !(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('users')
    .select('purchased, purchased_at, vision_subscription, vision_trial_used')
    .eq('email', email.toLowerCase())
    .single();
    
  const visionSubscription = String(data?.vision_subscription || '').toLowerCase();

  return NextResponse.json({ 
    hasPremium: data?.purchased || false, 
    hasVision: visionSubscription === 'active' || visionSubscription === 'true',
    trialUsed: data?.vision_trial_used || false,
    since: data?.purchased_at 
  });
}

// POST - Add premium to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('name, purchased')
      .eq('email', email.toLowerCase())
      .single();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if already premium
    if (user.purchased) {
      return NextResponse.json({ message: 'User already has premium' });
    }
    
    // Update user to premium
    const { error } = await supabase
      .from('users')
      .update({
        purchased: true,
        purchased_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());
    
    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    // Send welcome premium email
    await sendWelcomePremiumEmail(email, user.name);
    
    // Mark day 0 of purchased sequence as sent (to avoid duplicate welcome email from cron)
    try {
      await supabase.from('email_sequences').insert({
        user_email: email.toLowerCase(),
        sequence_type: 'purchased',
        day_number: 0,
      });
    } catch (e) {
      // Ignore if already exists
    }
    
    // Get updated list for admin panel
    const { data: allPremium } = await supabase
      .from('users')
      .select('email, name, purchased_at')
      .eq('purchased', true);
    
    const list = (allPremium || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime',
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add premium' }, { status: 500 });
  }
}

// DELETE - Remove premium from user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        purchased: false,
        purchased_at: null,
      })
      .eq('email', email.toLowerCase());
    
    if (error) {
      return NextResponse.json({ error: 'Failed to remove premium' }, { status: 500 });
    }
    
    // Get updated list for admin panel
    const { data: allPremium } = await supabase
      .from('users')
      .select('email, name, purchased_at')
      .eq('purchased', true);
    
    const list = (allPremium || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime',
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove premium' }, { status: 500 });
  }
}
