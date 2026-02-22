import { NextRequest, NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY || 'apik_tR2AgicmyYyuX_C4452549_C_a790e2075322e366d45eb7bf92833006fe6774abd805e931fd0f5ae327e8b2';
const WHOP_PRODUCT_ID = 'prod_ymF9Of2pEXLEY'; // ShiputzAI

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // 1. Find active membership for this email
    const searchUrl = `https://api.whop.com/api/v5/memberships?email=${encodeURIComponent(email)}&product_id=${WHOP_PRODUCT_ID}&status=active`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!searchRes.ok) {
      const error = await searchRes.text();
      console.error('Whop search error:', error);
      return NextResponse.json({ error: 'Failed to find membership' }, { status: 500 });
    }

    const searchData = await searchRes.json();
    
    if (!searchData.data || searchData.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const membership = searchData.data[0];
    const membershipId = membership.id;
    const renewalEnd = membership.renewal_period_end;

    // 2. Cancel the membership at period end
    const cancelUrl = `https://api.whop.com/api/v5/memberships/${membershipId}/cancel`;
    
    const cancelRes = await fetch(cancelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at: 'period_end'
      }),
    });

    if (!cancelRes.ok) {
      const error = await cancelRes.text();
      console.error('Whop cancel error:', error);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    const cancelData = await cancelRes.json();

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at period end',
      canceledAt: cancelData.canceled_at,
      periodEnd: renewalEnd || cancelData.renewal_period_end,
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Check if user has active subscription
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const searchUrl = `https://api.whop.com/api/v5/memberships?email=${encodeURIComponent(email)}&product_id=${WHOP_PRODUCT_ID}`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ hasSubscription: false });
    }

    const data = await res.json();
    const activeMembership = data.data?.find((m: { status: string }) => m.status === 'active');
    
    if (!activeMembership) {
      return NextResponse.json({ hasSubscription: false });
    }

    return NextResponse.json({
      hasSubscription: true,
      status: activeMembership.status,
      cancelAtPeriodEnd: activeMembership.cancel_at_period_end || false,
      periodEnd: activeMembership.renewal_period_end,
      plan: activeMembership.plan?.id,
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return NextResponse.json({ hasSubscription: false });
  }
}
