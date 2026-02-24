import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

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
      .select('vision_subscription, vision_credits')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return NextResponse.json({ hasSubscription: false });
    }

    // User has vision if they have active subscription (string 'active' or boolean true) OR vision credits
    const hasSubscription = user.vision_subscription === 'active' || user.vision_subscription === true || (user.vision_credits && user.vision_credits > 0);

    return NextResponse.json({ 
      hasSubscription,
      visionSubscription: user.vision_subscription,
      visionCredits: user.vision_credits || 0
    });
  } catch (error: any) {
    console.error('Check vision error:', error);
    return NextResponse.json({ hasSubscription: false, error: 'Internal error' });
  }
}
