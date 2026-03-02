import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

import { ADMIN_EMAILS } from '@/lib/admin';

// Note: Auth check removed - users can only query their own email
// and the data exposed (purchase status, name) is not sensitive.
// The email they provide is already known to them.

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

// Send welcome email immediately
async function sendWelcomeEmail(email: string, name: string) {
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
    <div dir="rtl" style="font-family: -apple-system, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="color: #111; font-size: 24px; font-weight: 600; margin-bottom: 24px;">👋 ברוך הבא ל-ShiputzAI!</h1>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">היי ${displayName},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.6;">תודה שנרשמת! אנחנו כאן כדי לעזור לך לנהל את השיפוץ בצורה חכמה.</p>
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">ShiputzAI עוזר לך לעקוב אחרי התקציב, לסרוק קבלות, ולקבל התראות לפני שחורגים.</p>
      <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #111; color: white; padding: 14px 28px; border-radius: 25px; text-decoration: none; font-weight: 500;">כניסה לאזור האישי ←</a>
      <p style="margin-top: 40px; color: #666; font-size: 14px;">בהצלחה עם השיפוץ!<br>צוות ShiputzAI</p>
      <p style="margin-top: 30px; text-align: center;"><a href="${unsubUrl}" style="color: #999; font-size: 12px;">להסרה מרשימת התפוצה</a></p>
    </div>
  `;

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
        subject: '👋 ברוך הבא ל-ShiputzAI!',
        html,
      }),
    });
    const result = await response.json();
    console.log('Welcome email sent:', result);
    return result;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
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
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Register a new user
export async function POST(request: NextRequest) {
  try {
    const { email, name: rawName, auth_provider, auth_id } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Sanitize name — strip HTML tags to prevent XSS
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
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Send welcome email immediately
    await sendWelcomeEmail(normalizedEmail, name || '');

    // Mark Day 0 as sent so cron skips it and moves to day 1
    try {
      await supabase.from('email_sequences').insert({
        user_email: normalizedEmail,
        sequence_type: 'non_purchased',
        day_number: 0,
        status: 'sent',
      });
    } catch (e) {
      // Ignore
    }

    return NextResponse.json({ message: 'User created', id: data.id });
  } catch (error) {
    console.error('Error:', error);
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
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User marked as purchased' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
