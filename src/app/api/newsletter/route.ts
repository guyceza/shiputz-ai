import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_NEWSLETTER_AUDIENCE_ID; // Create in Resend dashboard

// Add contact to Resend audience
async function addToResendAudience(email: string) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.log('Resend audience not configured, skipping');
    return null;
  }

  try {
    const response = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        unsubscribed: false,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Added to Resend audience:', result);
      return result;
    } else {
      const error = await response.text();
      console.error('Resend audience error:', error);
      return null;
    }
  } catch (err) {
    console.error('Resend audience failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const supabase = createServiceClient();

    // Check if already subscribed in Supabase
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    // Add to Supabase
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        subscribed_at: new Date().toISOString(),
      });

    if (error) {
      // Table might not exist
      if (error.code === '42P01') {
        console.log('Newsletter table does not exist yet');
      } else {
        console.error('Newsletter subscription error:', error);
      }
    }

    // Also add to Resend audience for email broadcasts
    await addToResendAudience(normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
