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

// GET - Get banned list or check if email is banned
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    const supabase = createServiceClient();
    
    if (!email) {
      // Get all banned users
      const { data, error } = await supabase
        .from('banned_users')
        .select('email, reason, created_at');
      
      if (error) return NextResponse.json({ list: [] });
      return NextResponse.json({ list: data?.map(u => u.email) || [] });
    }
    
    // Check specific user
    const { data } = await supabase
      .from('banned_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    return NextResponse.json({ isBanned: !!data });
  } catch {
    return NextResponse.json({ list: [], isBanned: false });
  }
}

// POST - Ban user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail, reason } = body;
    
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    // Check if already banned
    const { data: existing } = await supabase
      .from('banned_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (!existing) {
      await supabase
        .from('banned_users')
        .insert({ 
          email: email.toLowerCase(),
          reason: reason || 'Banned by admin'
        });
    }
    
    // Get updated list
    const { data } = await supabase
      .from('banned_users')
      .select('email');
    
    return NextResponse.json({ success: true, list: data?.map(u => u.email) || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

// DELETE - Unban user
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
      .from('banned_users')
      .delete()
      .eq('email', email.toLowerCase());
    
    // Get updated list
    const { data } = await supabase
      .from('banned_users')
      .select('email');
    
    return NextResponse.json({ success: true, list: data?.map(u => u.email) || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
