import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyUserEmail } from '@/lib/api-auth';

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
    if (!(await verifyUserEmail(request, email))) {
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

    const visionSubscription = String(user.vision_subscription || '').toLowerCase();
    const hasSubscription = visionSubscription === 'active' || visionSubscription === 'true';

    return NextResponse.json({ 
      hasSubscription,
      visionSubscription: user.vision_subscription
    });
  } catch (error: any) {
    return NextResponse.json({ hasSubscription: false, error: 'Internal error' });
  }
}
