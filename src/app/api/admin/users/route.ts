import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_PRODUCT_ID = 'prod_ymF9Of2pEXLEY'; // ShiputzAI main
const WHOP_VISION_PRODUCT_ID = 'prod_ORVfC8pmG328G'; // Vision add-on
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_NEWSLETTER_AUDIENCE_ID;

// Admin emails
const ADMIN_EMAILS = ['guyceza@gmail.com'];

// GET - Get all users with full data
export async function GET(request: NextRequest) {
  const adminEmail = request.nextUrl.searchParams.get('adminEmail');
  const search = request.nextUrl.searchParams.get('search') || '';
  const filter = request.nextUrl.searchParams.get('filter') || 'all';
  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
  
  // Auth check
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const supabase = createServiceClient();
  
  try {
    // Get users from database
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply search
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    
    // Apply filters
    if (filter === 'premium') {
      query = query.eq('purchased', true);
    } else if (filter === 'free') {
      query = query.eq('purchased', false);
    } else if (filter === 'vision') {
      query = query.eq('vision_subscription', 'active');
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: users, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // Get newsletter subscribers from Resend (if available)
    let newsletterEmails: Set<string> = new Set();
    if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
      try {
        const res = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
        });
        if (res.ok) {
          const data = await res.json();
          newsletterEmails = new Set(data.data?.map((c: { email: string }) => c.email.toLowerCase()) || []);
        }
      } catch (e) {
        console.error('Resend error:', e);
      }
    }
    
    // Get banned users
    const { data: bannedUsers } = await supabase
      .from('banned_users')
      .select('email');
    const bannedEmails = new Set(bannedUsers?.map(b => b.email.toLowerCase()) || []);
    
    // Enrich users with additional data
    const enrichedUsers = users?.map(user => ({
      ...user,
      newsletter: newsletterEmails.has(user.email?.toLowerCase()),
      banned: bannedEmails.has(user.email?.toLowerCase()),
    })) || [];
    
    // Get stats
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: premiumUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('purchased', true);
    const { count: visionUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('vision_subscription', 'active');
    const { count: trialUsed } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('vision_trial_used', true);
    
    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        total: totalUsers || 0,
        premium: premiumUsers || 0,
        vision: visionUsers || 0,
        trialUsed: trialUsed || 0,
        newsletter: newsletterEmails.size,
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const { adminEmail, userEmail, updates } = await request.json();
    
    // Auth check
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    
    if (updates.purchased !== undefined) {
      updateData.purchased = updates.purchased;
      updateData.purchased_at = updates.purchased ? new Date().toISOString() : null;
    }
    
    if (updates.vision_subscription !== undefined) {
      updateData.vision_subscription = updates.vision_subscription;
    }
    
    if (updates.vision_trial_used !== undefined) {
      updateData.vision_trial_used = updates.vision_trial_used;
    }
    
    // Update in database
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', userEmail.toLowerCase());
    
    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
