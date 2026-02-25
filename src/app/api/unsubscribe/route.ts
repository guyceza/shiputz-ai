import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

// Bug fix: Get secret securely - require proper configuration
function getUnsubscribeSecret(): string | null {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    console.error('SECURITY WARNING: UNSUBSCRIBE_SECRET or CRON_SECRET not configured!');
    return null;
  }
  return secret;
}

// Bug #23 fix: Helper to verify unsubscribe token
function verifyUnsubscribeToken(email: string, token: string | null): boolean {
  const secret = getUnsubscribeSecret();
  
  // If no secret configured, allow unsubscribe but log warning (graceful degradation)
  if (!secret) {
    console.warn('Unsubscribe without token verification (no secret configured) for:', email);
    return true;
  }
  
  // If no token provided, still allow (backward compatibility for old emails)
  if (!token) {
    console.warn('Unsubscribe request without token for:', email);
    return true; // Allow for backward compatibility
  }
  
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for shorter URLs
  
  return token === expectedToken;
}

// Helper to generate unsubscribe token (for email templates)
export function generateUnsubscribeToken(email: string): string {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    // Return empty string if no secret - emails will still have unsubscribe link but without token
    console.error('Cannot generate unsubscribe token: no secret configured');
    return '';
  }
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 16);
}

// GET - Check unsubscribe status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const normalizedEmail = email.toLowerCase();
    
    // Check both tables
    const [newsletterResult, userResult] = await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('unsubscribed_at')
        .eq('email', normalizedEmail)
        .single(),
      supabase
        .from('users')
        .select('marketing_unsubscribed_at')
        .eq('email', normalizedEmail)
        .single()
    ]);

    return NextResponse.json({ 
      newsletter_unsubscribed: newsletterResult.data?.unsubscribed_at !== null,
      marketing_unsubscribed: userResult.data?.marketing_unsubscribed_at !== null,
      unsubscribed: newsletterResult.data?.unsubscribed_at !== null || userResult.data?.marketing_unsubscribed_at !== null
    });
  } catch (error) {
    return NextResponse.json({ unsubscribed: false });
  }
}

// POST - Unsubscribe user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Bug #23 fix: Verify token to prevent unauthorized unsubscribes
    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const normalizedEmail = email.toLowerCase();
    const now = new Date().toISOString();
    
    let unsubscribedFrom: string[] = [];

    // 1. Try to unsubscribe from users table (marketing emails / 14 email flow)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      const { error } = await supabase
        .from('users')
        .update({ marketing_unsubscribed_at: now })
        .eq('email', normalizedEmail);

      if (!error) {
        unsubscribedFrom.push('marketing');
      } else {
        console.error('User unsubscribe error:', error);
      }
    }

    // 2. Try to unsubscribe from newsletter_subscribers table
    const { data: existingNewsletter } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingNewsletter) {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ unsubscribed_at: now })
        .eq('email', normalizedEmail);

      if (!error) {
        unsubscribedFrom.push('newsletter');
      } else {
        console.error('Newsletter unsubscribe error:', error);
      }
    } else {
      // Create record to remember they unsubscribed (even if they sign up later)
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ 
          email: normalizedEmail,
          unsubscribed_at: now
        });

      if (!error) {
        unsubscribedFrom.push('newsletter');
      }
    }

    if (unsubscribedFrom.length === 0) {
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      unsubscribed_from: unsubscribedFrom
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
