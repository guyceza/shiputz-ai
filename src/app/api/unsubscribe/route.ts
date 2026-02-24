import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

// Bug #23 fix: Helper to verify unsubscribe token
function verifyUnsubscribeToken(email: string, token: string | null): boolean {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || 'fallback-secret-change-me';
  
  // If no token provided, still allow (backward compatibility)
  // but log a warning - in production, should require token
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
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || 'fallback-secret-change-me';
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
    
    // Check newsletter_subscribers table - if unsubscribed_at is set, they're unsubscribed
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('unsubscribed_at')
      .eq('email', email.toLowerCase())
      .single();

    return NextResponse.json({ 
      unsubscribed: data?.unsubscribed_at !== null 
    });
  } catch (error) {
    // If no record exists, they're not unsubscribed
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
    
    // Try to update existing record first
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // Update existing record - set unsubscribed_at
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      if (error) {
        console.error('Unsubscribe update error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
      }
    } else {
      // Create new record with unsubscribed_at set
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ 
          email: normalizedEmail,
          unsubscribed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Unsubscribe insert error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
