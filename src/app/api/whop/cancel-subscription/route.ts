import { NextRequest, NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_PRODUCT_ID = 'prod_ymF9Of2pEXLEY'; // ShiputzAI
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Import email template dynamically to avoid build issues
async function sendCancellationEmail(email: string, periodEnd: number | null) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { subscriptionCancelled } = require('../../../../../emails/templates.js');
    const emailData = subscriptionCancelled(email, periodEnd);
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });
    
    if (!res.ok) {
      console.error('Failed to send cancellation email:', await res.text());
    } else {
      console.log('Cancellation email sent to:', email);
    }
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!WHOP_API_KEY) {
      console.error('WHOP_API_KEY not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
    }
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // 1. Find active membership for this email
    const searchUrl = `https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(email)}&product_id=${WHOP_PRODUCT_ID}&status=active`;
    
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
    const cancelUrl = `https://api.whop.com/api/v2/memberships/${membershipId}/cancel`;
    
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

    const periodEndTimestamp = renewalEnd || cancelData.renewal_period_end;
    const periodEndMs = periodEndTimestamp ? periodEndTimestamp * 1000 : null;
    
    // Send cancellation confirmation email
    await sendCancellationEmail(email, periodEndMs);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at period end',
      canceledAt: cancelData.canceled_at,
      periodEnd: periodEndMs,
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
  
  if (!WHOP_API_KEY) {
    return NextResponse.json({ hasSubscription: false });
  }

  try {
    const searchUrl = `https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(email)}&product_id=${WHOP_PRODUCT_ID}`;
    
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
      periodEnd: activeMembership.renewal_period_end ? activeMembership.renewal_period_end * 1000 : null, // Convert to milliseconds
      plan: activeMembership.plan?.id,
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return NextResponse.json({ hasSubscription: false });
  }
}
