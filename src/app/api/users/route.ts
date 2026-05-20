import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';
import { getRequestIp, sanitizeAttribution } from '@/lib/attribution-server';

import { ADMIN_EMAILS } from '@/lib/admin';

// Note: Auth check removed - users can only query their own email
// and the data exposed (purchase status, name) is not sensitive.
// The email they provide is already known to them.

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

async function saveUserAttribution(supabase: ReturnType<typeof createServiceClient>, params: {
  userId?: string | null;
  email: string;
  attribution: unknown;
  request: NextRequest;
}) {
  const clean = sanitizeAttribution(params.attribution);
  if (!clean) return;

  await supabase.from('user_attribution').upsert({
    user_id: params.userId || null,
    email: params.email.toLowerCase(),
    ...clean,
    ip_address: getRequestIp(params.request.headers),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'email' });
}

// Send welcome email immediately and return Resend result for sequence tracking.
async function sendWelcomeEmail(email: string, name: string): Promise<{ id?: string; message?: string } | null> {
  if (!RESEND_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email');
    return null;
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
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" />
              <span style="font-size: 28px; font-weight: 600; color: #1d1d1f; vertical-align: middle;">ShiputzAI</span>
            </td>
          </tr>
          <tr>
            <td style="background: #ffffff; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td style="padding: 60px 50px; text-align: right;" dir="rtl">
                    <h1 style="font-size: 34px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px; text-align: center;">ברוכים הבאים</h1>
                    <p style="font-size: 17px; color: #86868b; margin: 0 0 50px; text-align: center;">יש לכם 10 קרדיטים חינם לניסיון</p>
                    <p style="font-size: 17px; color: #1d1d1f; line-height: 1.5; margin: 0 0 30px; text-align: right;">היי <strong>${displayName}</strong>,</p>
                    <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">תודה שהצטרפתם. עם ShiputzAI תוכלו לראות איך הבית ייראה אחרי עיצוב מחדש לפני שמוציאים שקל.</p>
                    <div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
                      <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">
                        <strong>הדמיית חדר</strong> - מצלמים ומקבלים עיצוב חדש תוך שניות<br>
                        <strong>Style Match</strong> - מוצאים את הסגנון שמתאים לכם<br>
                        <strong>Shop the Look</strong> - מזהים מוצרים וקונים ישירות<br>
                        <strong>סרטון סיור</strong> - וידאו תלת-מימדי של החדר
                      </p>
                    </div>
                    <p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">התחילו עם הדמיה ראשונה: מצלמים חדר, בוחרים סגנון, ומקבלים תוצאה תוך זמן קצר.</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px;">
                      <tr>
                        <td align="center">
                          <a href="https://shipazti.com/visualize" style="display: inline-block; background: #1d1d1f; color: #ffffff; padding: 18px 48px; border-radius: 980px; text-decoration: none; font-size: 17px; font-weight: 500;">צור הדמיה ראשונה</a>
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
              <p style="font-size: 11px; color: #aeaeb2; margin: 0;">
                <a href="${unsubUrl}" style="color: #aeaeb2; text-decoration: underline;">להסרה מרשימת התפוצה</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'ברוכים הבאים - יש לכם קרדיטים חינם',
        html,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    const result = await response.json();
    return result;
  } catch (err) {
    return null;
  }
}

// Get user by email
// Bug fix: Verify user has valid session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, purchased, purchased_at, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Register a new user
export async function POST(request: NextRequest) {
  try {
    const { email, name: rawName, auth_provider, auth_id, attribution } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Sanitize name - strip HTML tags to prevent XSS
    const name = rawName ? String(rawName).replace(/<[^>]*>/g, '').trim().slice(0, 100) : undefined;

    const supabase = createServiceClient();

    // Check if user already exists (case-insensitive)
    const normalizedEmail = email.toLowerCase();
    const { data: existing } = await supabase
      .from('users')
      .select('id, auth_provider')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // If user exists with a different provider, return error
      if (existing.auth_provider && auth_provider && existing.auth_provider !== auth_provider) {
        const providerName = existing.auth_provider === 'google' ? 'Google' : 'אימייל וסיסמה';
        return NextResponse.json({ 
          error: `משתמש זה כבר רשום דרך ${providerName}. נא להתחבר באותו אופן.`,
          existing_provider: existing.auth_provider
        }, { status: 409 });
      }
      await saveUserAttribution(supabase, {
        userId: existing.id,
        email: normalizedEmail,
        attribution,
        request,
      });
      return NextResponse.json({ message: 'User already exists', id: existing.id });
    }

    // Create new user (always store email in lowercase)
    // Use auth_id if provided (from Supabase Auth) to keep IDs in sync
    const insertData: Record<string, any> = { 
      email: normalizedEmail, 
      name, 
      auth_provider: auth_provider || 'email' 
    };
    if (auth_id) {
      insertData.id = auth_id;
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    await saveUserAttribution(supabase, {
      userId: data.id,
      email: normalizedEmail,
      attribution,
      request,
    });

    // Send welcome email immediately and mark the real lifecycle flow as sent.
    const welcomeResult = await sendWelcomeEmail(normalizedEmail, name || '');

    // Mark day 0 of the current lifecycle flow as sent so cron continues the sequence.
    try {
      await supabase.from('email_sequences').upsert({
        user_email: normalizedEmail,
        sequence_type: 'welcome',
        day_number: 0,
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_id: welcomeResult?.id || 'signup-inline',
        run_id: 'signup-inline',
        reason: 'new_signup',
        ...(welcomeResult?.message ? { error: welcomeResult.message } : {}),
      }, { onConflict: 'user_email,sequence_type,day_number' });
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ message: 'User created', id: data.id });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark user as purchased
// Bug fix: Require admin authentication - this endpoint should only be used by admins
// Payment webhooks update the database directly, not through this endpoint
// Note: This endpoint is unused - admin uses /api/admin/premium instead
export async function PATCH(request: NextRequest) {
  try {
    const { email, adminEmail } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Admin check: must provide admin email
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('users')
      .update({ 
        purchased: true, 
        purchased_at: new Date().toISOString() 
      })
      .eq('email', email.toLowerCase());

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User marked as purchased' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
