import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUserEmail } from '@/lib/api-auth';
import { getCreditPackPrice, getCreditPackUnitPrice } from '@/lib/credit-costs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    if (!(await verifyUserEmail(request, email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('users')
      .select('purchased, vision_subscription, viz_credits, plan, plan_period_end')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        isPro: false, 
        vizCredits: 0,
        remaining: 0
      });
    }

    const visionSubscription = String(data.vision_subscription || '').toLowerCase();
    const hasActiveVisionSubscription = visionSubscription === 'active' || visionSubscription === 'true';
    const isPro = data.purchased === true && hasActiveVisionSubscription;
    const vizCredits = data.viz_credits || 0;
    const canBuyExtraCredits = Boolean(
      data.plan &&
      ['starter', 'pro', 'business'].includes(data.plan) &&
      hasActiveVisionSubscription &&
      (!data.plan_period_end || new Date(data.plan_period_end).getTime() >= Date.now())
    );
    const packCredits = [20, 50, 100, 200, 300];

    return NextResponse.json({
      isPro,
      vizCredits,
      remaining: vizCredits,
      canBuyExtraCredits,
      requiresSubscriptionForPacks: true,
      packs: packCredits.map((credits) => ({
        id: `credits_${credits}`,
        name: `${credits} קרדיטים`,
        credits,
        price: getCreditPackPrice(credits),
        perCredit: Number(getCreditPackUnitPrice(credits)),
        popular: credits === 100,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
