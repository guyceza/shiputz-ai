import { NextRequest, NextResponse } from 'next/server';

const WHOP_API_KEY = process.env.WHOP_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, email, discountCode, redirectUrl } = body;

    if (!WHOP_API_KEY) {
      console.error('WHOP_API_KEY not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Create checkout session via Whop API
    const sessionData: any = {
      plan_id: planId,
      redirect_url: redirectUrl || 'https://shipazti.com/dashboard',
    };

    // Pre-fill email in checkout (more reliable than URL param)
    if (email) {
      sessionData.email = email;
    }

    // Add metadata if needed
    if (discountCode) {
      sessionData.metadata = { discount_code: discountCode };
    }

    const response = await fetch('https://api.whop.com/api/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });

    const session = await response.json();

    if (session.error) {
      console.error('Whop session error:', session.error);
      return NextResponse.json({ error: session.error.message }, { status: 400 });
    }

    // Construct purchase URL with email if provided
    // Use d[email] parameter which Whop uses for prefilling (more reliable)
    let purchaseUrl = session.purchase_url;
    if (email) {
      const separator = purchaseUrl.includes('?') ? '&' : '?';
      // Try both formats to ensure it works
      purchaseUrl = `${purchaseUrl}${separator}d[email]=${encodeURIComponent(email)}&email=${encodeURIComponent(email)}`;
    }

    return NextResponse.json({
      session_id: session.id,
      purchase_url: purchaseUrl,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
