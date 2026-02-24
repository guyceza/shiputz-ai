import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';

// Send welcome email immediately
async function sendWelcomeEmail(email: string, name: string) {
  if (!RESEND_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping welcome email');
    return null;
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
      <p style="margin-top: 30px; text-align: center;"><a href="https://shipazti.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; font-size: 12px;">להסרה מרשימת התפוצה</a></p>
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
    const { email, name, auth_provider, auth_id } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

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
    await sendWelcomeEmail(normalizedEmail, name);

    // Mark Day 0 as sent (ignore errors if table doesn't exist)
    try {
      await supabase.from('email_sequences').insert({
        user_email: normalizedEmail,
        sequence_type: 'non_purchased',
        day_number: 0,
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
export async function PATCH(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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
