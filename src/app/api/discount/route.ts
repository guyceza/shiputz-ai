import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Validate discount code
export async function POST(request: NextRequest) {
  try {
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

    if (error || !data) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'קוד לא קיים' 
      });
    }

    // Check if code belongs to this email
    if (data.user_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'הקוד לא שייך לחשבון זה' 
      });
    }

    // Check if already used
    if (data.used_at) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'הקוד כבר נוצל' 
      });
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'פג תוקף הקוד' 
      });
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
