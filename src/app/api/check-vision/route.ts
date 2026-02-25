import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/server-auth';

// Bug fix: Verify authenticated user is checking their own subscription
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ hasSubscription: false, error: 'Missing email' });
    }

    // Bug fix: Verify authenticated user is checking their own email
    const authUser = await getAuthUser();
    if (!authUser || authUser.email?.toLowerCase() !== email.toLowerCase()) {
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
