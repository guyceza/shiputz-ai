import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Mark vision trial as used for a user
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const normalizedEmail = email.toLowerCase();

    // First verify user exists and trial isn't already used
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('vision_trial_used')
      .eq('email', normalizedEmail)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Already used - no-op, return success
    if (user.vision_trial_used) {
      return NextResponse.json({ success: true, alreadyUsed: true });
    }

    const { error } = await supabase
      .from('users')
      .update({ vision_trial_used: true })
      .eq('email', normalizedEmail);

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
