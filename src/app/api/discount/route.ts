import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

// Validate discount code
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 attempts per minute to prevent brute force
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        valid: false,
        reason: 'יותר מדי ניסיונות. נסה שוב בעוד דקה.' 
      }, { status: 429 });
    }

    const { code, email } = await request.json();

    if (!code || !email) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'קוד ואימייל נדרשים' 
      }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    // Bug #11 fix: Use generic error message for all failures to prevent enumeration
    const genericError = { valid: false, reason: 'קוד לא תקין' };

    if (error || !data) {
      return NextResponse.json(genericError);
    }

    // Check if code belongs to this email
    if (data.user_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(genericError);
    }

    // Check if already used
    if (data.used_at) {
      return NextResponse.json(genericError);
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json(genericError);
    }

    return NextResponse.json({ 
      valid: true, 
      discount: data.discount_percent 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark code as used
export async function PATCH(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('discount_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('code', code.toUpperCase());

    if (error) {
      console.error('Error marking code as used:', error);
      return NextResponse.json({ error: 'Failed to update code' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Code marked as used' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
