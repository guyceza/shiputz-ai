import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_NEWSLETTER_AUDIENCE_ID; // Create in Resend dashboard

// Add contact to Resend audience
async function addToResendAudience(email: string) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    // Resend audience not configured
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
      // Added to Resend audience
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
    
    let supabaseSuccess = false;
    let resendSuccess = false;

    // Try to add to Supabase
    try {
      const supabase = createServiceClient();
      
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({
            email: normalizedEmail,
            subscribed_at: new Date().toISOString(),
          });

        if (!error) {
          supabaseSuccess = true;
        } else {
          console.error('Supabase insert error:', error);
        }
      } else {
        supabaseSuccess = true; // Already exists
      }
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
    }

    // Try to add to Resend audience
    try {
      const result = await addToResendAudience(normalizedEmail);
      if (result) {
        resendSuccess = true;
      }
    } catch (resendError) {
      console.error('Resend error:', resendError);
    }

    // Return success if at least one succeeded
    return NextResponse.json({ 
      success: supabaseSuccess || resendSuccess,
      supabase: supabaseSuccess,
      resend: resendSuccess
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
