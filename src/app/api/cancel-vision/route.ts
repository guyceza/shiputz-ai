import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Verify user is authenticated (has valid Supabase session via cookie)
function verifyAuth(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => 
      c.name.startsWith('sb-')
    );
    return hasSupabaseCookie;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    // Bug fix: Verify user has a valid session
    if (!verifyAuth(request)) {
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
