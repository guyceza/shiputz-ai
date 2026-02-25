import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyUserEmail } from '@/lib/server-auth';

// Mark vision trial as used for a user
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Bug #H06 fix: Verify authenticated user owns this email
    const isAuthorized = await verifyUserEmail(email);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('users')
      .update({ vision_trial_used: true })
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error marking trial as used:', error);
      return NextResponse.json({ error: 'Failed to mark trial' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if trial was used
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('users')
      .select('vision_trial_used')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      return NextResponse.json({ trialUsed: false });
    }

    return NextResponse.json({ trialUsed: data?.vision_trial_used || false });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
