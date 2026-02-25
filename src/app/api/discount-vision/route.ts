import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Bug fix: Add rate limiting to prevent brute force
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 10, 60000); // 10 attempts per minute
    if (!rateLimit.success) {
      return NextResponse.json({ 
        valid: false,
        reason: 'יותר מדי ניסיונות. נסה שוב בעוד דקה.' 
      }, { status: 429 });
    }

    const { code, email } = await request.json();

    if (!code || !email) {
      return NextResponse.json(
        { valid: false, reason: 'חסרים פרטים' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Look up the discount code
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !discountCode) {
      return NextResponse.json({
        valid: false,
        reason: 'קוד לא נמצא'
      });
    }

    // Check if it's a Vision code (starts with VIS-)
    if (!code.toUpperCase().startsWith('VIS-')) {
      return NextResponse.json({
        valid: false,
        reason: 'קוד זה אינו תקף להנחת Vision'
      });
    }

    // Bug #M02 fix: Use generic error message to prevent code ownership enumeration
    // Check if code belongs to this email
    if (discountCode.user_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({
        valid: false,
        reason: 'קוד לא תקין'
      });
    }

    // Check if code has expired
    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: 'פג תוקף הקוד'
      });
    }

    // Check if code was already used
    if (discountCode.used_at) {
      return NextResponse.json({
        valid: false,
        reason: 'הקוד כבר נוצל'
      });
    }

    // Code is valid!
    return NextResponse.json({
      valid: true,
      discount: discountCode.discount_percent || 50
    });

  } catch (error) {
    console.error('Vision discount validation error:', error);
    return NextResponse.json(
      { valid: false, reason: 'שגיאה בבדיקת הקוד' },
      { status: 500 }
    );
  }
}
