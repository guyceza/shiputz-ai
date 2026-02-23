import { NextRequest, NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const ADMIN_EMAILS = ['guyceza@gmail.com'];

// GET - Get Whop data for a user
export async function GET(request: NextRequest) {
  const adminEmail = request.nextUrl.searchParams.get('adminEmail');
  const userEmail = request.nextUrl.searchParams.get('email');
  
  // Auth check
  if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  if (!userEmail) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  
  if (!WHOP_API_KEY) {
    return NextResponse.json({ error: 'Whop not configured' }, { status: 500 });
  }
  
  try {
    // Get all memberships for this email
    const res = await fetch(
      `https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(userEmail)}`,
      {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Whop API error:', error);
      return NextResponse.json({ memberships: [] });
    }
    
    const data = await res.json();
    
    // Format memberships
    const memberships = data.data?.map((m: any) => ({
      id: m.id,
      product: m.product?.name || m.product_id,
      productId: m.product_id,
      plan: m.plan?.name || m.plan_id,
      planId: m.plan_id,
      status: m.status,
      createdAt: m.created_at ? new Date(m.created_at * 1000).toISOString() : null,
      renewalPeriodEnd: m.renewal_period_end ? new Date(m.renewal_period_end * 1000).toISOString() : null,
      cancelAtPeriodEnd: m.cancel_at_period_end || false,
      canceledAt: m.canceled_at ? new Date(m.canceled_at * 1000).toISOString() : null,
      totalSpent: m.total_spent_usd || 0,
      paymentProcessor: m.payment_processor,
    })) || [];
    
    // Calculate total revenue
    const totalRevenue = memberships.reduce((sum: number, m: any) => sum + (m.totalSpent || 0), 0);
    
    return NextResponse.json({
      memberships,
      totalRevenue,
      hasActiveSubscription: memberships.some((m: any) => m.status === 'active'),
    });
    
  } catch (error) {
    console.error('Whop error:', error);
    return NextResponse.json({ memberships: [], error: 'Failed to fetch Whop data' });
  }
}

// POST - Manage Whop subscription (cancel, etc.)
export async function POST(request: NextRequest) {
  try {
    const { adminEmail, membershipId, action } = await request.json();
    
    // Auth check
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!membershipId || !action) {
      return NextResponse.json({ error: 'Membership ID and action required' }, { status: 400 });
    }
    
    if (!WHOP_API_KEY) {
      return NextResponse.json({ error: 'Whop not configured' }, { status: 500 });
    }
    
    if (action === 'cancel') {
      const res = await fetch(
        `https://api.whop.com/api/v2/memberships/${membershipId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_at: 'period_end' }),
        }
      );
      
      if (!res.ok) {
        const error = await res.text();
        console.error('Whop cancel error:', error);
        return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Subscription canceled at period end' });
    }
    
    if (action === 'terminate') {
      const res = await fetch(
        `https://api.whop.com/api/v2/memberships/${membershipId}/terminate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHOP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!res.ok) {
        const error = await res.text();
        console.error('Whop terminate error:', error);
        return NextResponse.json({ error: 'Failed to terminate' }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, message: 'Subscription terminated immediately' });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
