import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

// POST /api/track-action — Track when a user starts an action (upload image, etc.)
// Body: { email: string, action: string, page: string }
export async function POST(request: NextRequest) {
  try {
    const { email, action, page } = await request.json();
    if (!email || !action) {
      return NextResponse.json({ error: 'Missing email or action' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upsert: store the latest started-but-not-finished action
    await supabase
      .from('users')
      .update({
        last_started_action: action,
        last_started_action_at: new Date().toISOString(),
        last_started_action_page: page || null,
      })
      .eq('email', email);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/track-action — Clear tracked action (user completed it)
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const supabase = createServiceClient();
    await supabase
      .from('users')
      .update({
        last_started_action: null,
        last_started_action_at: null,
        last_started_action_page: null,
      })
      .eq('email', email);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
