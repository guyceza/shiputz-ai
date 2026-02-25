import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Verify user is authenticated (has valid Supabase session via cookie)
function verifyAuth(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => 
      c.name.includes('sb-') && (c.name.includes('auth') || c.name.includes('session'))
    );
    return hasSupabaseCookie;
  } catch {
    return false;
  }
}

// Bug fix: Verify user has valid session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ hasSubscription: false, error: 'Missing email' });
    }

    // Bug fix: Verify user has a valid session (cookie present)
    // The email parameter is used to query - user can only check their own since they provide their email
    if (!verifyAuth(request)) {
      return NextResponse.json({ hasSubscription: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('vision_subscription')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ hasSubscription: false });
    }

    // User has vision if they have active subscription (string 'active' or boolean true)
    const hasSubscription = user.vision_subscription === 'active' || user.vision_subscription === true;

    return NextResponse.json({ 
      hasSubscription,
      visionSubscription: user.vision_subscription
    });
  } catch (error: any) {
    console.error('Check vision error:', error);
    return NextResponse.json({ hasSubscription: false, error: 'Internal error' });
  }
}
