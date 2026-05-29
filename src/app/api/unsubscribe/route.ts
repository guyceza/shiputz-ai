import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

// Bug fix: Get secret securely - require proper configuration
function getUnsubscribeSecret(): string | null {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
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

async function readUnsubscribeInput(request: NextRequest): Promise<{ email: string; token: string | null }> {
  const { searchParams } = new URL(request.url);
  let email = searchParams.get('email') || '';
  let token = searchParams.get('token');

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body?.email || email;
      token = body?.token ?? token;
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      email = String(formData.get('email') || email);
      token = formData.get('token') ? String(formData.get('token')) : token;
    } else {
      const rawBody = await request.text().catch(() => '');
      if (rawBody) {
        try {
          const body = JSON.parse(rawBody);
          email = body?.email || email;
          token = body?.token ?? token;
        } catch {
          const bodyParams = new URLSearchParams(rawBody);
          email = bodyParams.get('email') || email;
          token = bodyParams.get('token') || token;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse unsubscribe request body, using query params:', error);
  }

  return {
    email: email.trim().toLowerCase(),
    token: token ? token.trim() : null,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper to generate unsubscribe token (for email templates)
export function generateUnsubscribeToken(email: string): string {
  const secret = getUnsubscribeSecret();
  if (!secret) {
    // Return empty string if no secret - emails will still have unsubscribe link but without token
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
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check all tables
    const [newsletterResult, userResult, leadsResult] = await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('unsubscribed_at')
        .eq('email', normalizedEmail)
        .maybeSingle(),
      supabase
        .from('users')
        .select('marketing_unsubscribed_at')
        .eq('email', normalizedEmail)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('unsubscribed_at')
        .eq('email', normalizedEmail)
        .maybeSingle()
    ]);

    const nlUnsub = !!newsletterResult.data?.unsubscribed_at;
    const mktUnsub = !!userResult.data?.marketing_unsubscribed_at;
    const leadUnsub = !!leadsResult.data?.unsubscribed_at;

    return NextResponse.json({ 
      newsletter_unsubscribed: nlUnsub,
      marketing_unsubscribed: mktUnsub,
      leads_unsubscribed: leadUnsub,
      unsubscribed: nlUnsub || mktUnsub || leadUnsub
    });
  } catch {
    return NextResponse.json({ unsubscribed: false });
  }
}

// POST - Unsubscribe user
export async function POST(request: NextRequest) {
  try {
    const { email, token } = await readUnsubscribeInput(request);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // Token verification: if token is provided and valid → auto-unsubscribe
    // If token is missing or invalid → return needs_confirm so frontend shows confirmation UI
    // Unsubscribe must ALWAYS be possible (CAN-SPAM/GDPR compliance)
    const tokenValid = verifyUnsubscribeToken(email, token);
    if (!tokenValid && token) {
      // Bad token provided - don't block, ask for confirmation instead
      return NextResponse.json({ needs_confirm: true }, { status: 200 });
    }

    const supabase = createServiceClient();
    const normalizedEmail = email;
    const now = new Date().toISOString();
    
    const unsubscribedFrom: string[] = [];

    // 1. Try to unsubscribe from users table (marketing emails / 14 email flow)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

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
    const { data: existingNewsletter, error: newsletterLookupError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

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
    } else if (newsletterLookupError) {
      console.error('Newsletter lookup error:', newsletterLookupError);
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
      } else if (error.code === '23505') {
        const { error: updateAfterConflictError } = await supabase
          .from('newsletter_subscribers')
          .update({ unsubscribed_at: now })
          .eq('email', normalizedEmail);
        if (!updateAfterConflictError) {
          unsubscribedFrom.push('newsletter');
        } else {
          console.error('Newsletter unsubscribe conflict update error:', updateAfterConflictError);
        }
      } else {
        console.error('Newsletter unsubscribe insert error:', error);
      }
    }

    // 3. Try to unsubscribe from leads table (cold outreach)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingLead) {
      const { error } = await supabase
        .from('leads')
        .update({ unsubscribed_at: now })
        .eq('email', normalizedEmail);

      if (!error) {
        unsubscribedFrom.push('leads');
        const { error: statusError } = await supabase
          .from('leads')
          .update({ status: 'unsubscribed' })
          .eq('email', normalizedEmail);
        if (statusError) {
          console.error('Lead unsubscribe status update error:', statusError);
        }
      } else {
        console.error('Lead unsubscribe error:', error);
      }
    }

    if (unsubscribedFrom.length === 0) {
      // Even if not found anywhere, create a newsletter record to prevent future emails
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: normalizedEmail, unsubscribed_at: now })
        .single();
      if (!error) {
        unsubscribedFrom.push('newsletter');
      } else if (error.code === '23505') {
        const { error: updateAfterConflictError } = await supabase
          .from('newsletter_subscribers')
          .update({ unsubscribed_at: now })
          .eq('email', normalizedEmail);
        if (!updateAfterConflictError) {
          unsubscribedFrom.push('newsletter');
        } else {
          console.error('Fallback unsubscribe conflict update error:', updateAfterConflictError);
          return NextResponse.json({ error: 'Unable to unsubscribe' }, { status: 500 });
        }
      } else {
        console.error('Fallback unsubscribe insert error:', error);
        return NextResponse.json({ error: 'Unable to unsubscribe' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true,
      unsubscribed_from: unsubscribedFrom
    });
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
