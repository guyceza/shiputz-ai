import { NextRequest, NextResponse } from 'next/server';
import { getCredits, canPerformAction, CREDIT_COSTS, PLANS, CREDIT_ANCHORS } from '@/lib/credits';
import { verifyUserEmail } from '@/lib/api-auth';

// GET /api/credits?email=...
// GET /api/credits?email=...&check=visualize
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    if (!(await verifyUserEmail(request, email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get('check') as keyof typeof CREDIT_COSTS | null;

    // If checking specific action
    if (action && CREDIT_COSTS[action]) {
      const result = await canPerformAction(email, action);
      return NextResponse.json(result);
    }

    // Return full balance + config
    const balance = await getCredits(email);
    return NextResponse.json({
      ...balance,
      costs: CREDIT_COSTS,
      plans: PLANS,
      creditAnchors: CREDIT_ANCHORS,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
