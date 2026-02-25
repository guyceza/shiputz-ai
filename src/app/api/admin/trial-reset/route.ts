import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const ADMIN_EMAILS = ['guyceza@gmail.com'];

// Verify admin exists in database (not just string match)
async function verifyAdmin(email: string | null): Promise<boolean> {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    return false;
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();
  return !!data;
}

// GET - Check if email should have trial reset
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const adminEmail = request.nextUrl.searchParams.get('adminEmail');
    const supabase = createServiceClient();
    
    if (!email) {
      // Bug #H05 fix: Require admin auth to get full reset list
      const isAdmin = await verifyAdmin(adminEmail);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Get all pending resets
      const { data, error } = await supabase
        .from('trial_resets')
        .select('email, created_at')
        .eq('used', false);
      
      if (error) return NextResponse.json({ list: [] });
      return NextResponse.json({ list: data?.map(r => r.email) || [] });
    }
    
    // Check specific user
    const { data } = await supabase
      .from('trial_resets')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .single();
    
    if (data) {
      // Mark as used in trial_resets table
      await supabase
        .from('trial_resets')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', data.id);
      
      // Also reset the vision_trial_used flag in users table
      await supabase
        .from('users')
        .update({ vision_trial_used: false })
        .eq('email', email.toLowerCase());
      
      return NextResponse.json({ shouldReset: true });
    }
    
    return NextResponse.json({ shouldReset: false });
  } catch {
    return NextResponse.json({ list: [], shouldReset: false });
  }
}

// POST - Add email to reset list (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('trial_resets')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .single();
    
    if (!existing) {
      await supabase
        .from('trial_resets')
        .insert({ email: email.toLowerCase() });
    }
    
    // Get updated list
    const { data } = await supabase
      .from('trial_resets')
      .select('email')
      .eq('used', false);
    
    return NextResponse.json({ success: true, list: data?.map(r => r.email) || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add email' }, { status: 500 });
  }
}

// DELETE - Remove email from reset list
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = createServiceClient();
    
    await supabase
      .from('trial_resets')
      .delete()
      .eq('email', email.toLowerCase());
    
    // Get updated list
    const { data } = await supabase
      .from('trial_resets')
      .select('email')
      .eq('used', false);
    
    return NextResponse.json({ success: true, list: data?.map(r => r.email) || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove email' }, { status: 500 });
  }
}
