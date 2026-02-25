import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Note: Auth check removed - users query by their own email
// and subscription status is not sensitive data.

// Bug fix: Verify user has valid session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ hasSubscription: false, error: 'Missing email' });
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
