import { NextRequest, NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY || 'apik_tR2AgicmyYyuX_C4452549_C_a790e2075322e366d45eb7bf92833006fe6774abd805e931fd0f5ae327e8b2';

export async function POST(request: NextRequest) {
  try {
    const { planId, email, discountCode } = await request.json();

    if (!planId || !email) {
      return NextResponse.json({ error: 'Missing planId or email' }, { status: 400 });
    }

    // Create Whop checkout session with metadata
    const response = await fetch('https://api.whop.com/api/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        redirect_url: 'https://shipazti.com/dashboard?welcome=true',
        metadata: {
          email: email,
          discount_code: discountCode || null,
        },
      }),
    });

    const session = await response.json();

    if (session.error) {
      console.error('Whop session error:', session.error);
      return NextResponse.json({ error: session.error.message }, { status: 400 });
    }

    // Add email to the purchase URL
    let purchaseUrl = session.purchase_url;
    if (purchaseUrl && email) {
      purchaseUrl += (purchaseUrl.includes('?') ? '&' : '?') + `email=${encodeURIComponent(email)}`;
    }

    return NextResponse.json({
      id: session.id,
      purchase_url: purchaseUrl,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
