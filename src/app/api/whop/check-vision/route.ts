import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET - Check if user has active Vision subscription via Whop
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ hasSubscription: false });
  }
  
  try {
    const supabase = createServiceClient();
    
    const { data } = await supabase
      .from('users')
      .select('vision_subscription')
      .eq('email', email.toLowerCase())
      .single();
    
    return NextResponse.json({ 
      hasSubscription: data?.vision_subscription === 'active'
    });
  } catch (error) {
    console.error('Error checking vision subscription:', error);
    return NextResponse.json({ hasSubscription: false });
  }
}
