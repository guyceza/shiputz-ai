import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyUserEmail } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Bug #C01 fix: Verify authenticated user owns this email
    const isAuthorized = await verifyUserEmail(email);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('users')
      .update({ 
        vision_subscription: 'canceled',
        vision_canceled_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Cancel vision error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel vision error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
