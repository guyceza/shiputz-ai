import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('users')
      .select('purchased, vision_subscription, viz_credits')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        isPro: false, 
        vizCredits: 0,
        remaining: 0
      });
    }

    const isPro = data.purchased === true && 
      (data.vision_subscription === true || data.vision_subscription === 'active');
    const vizCredits = data.viz_credits || 0;

    return NextResponse.json({
      isPro,
      vizCredits,
      remaining: vizCredits,
      packs: [
        { id: 'pack_10', name: '10 הדמיות', credits: 10, price: 29, perViz: 2.90 },
        { id: 'pack_30', name: '30 הדמיות', credits: 30, price: 69, perViz: 2.30, popular: true },
        { id: 'pack_100', name: '100 הדמיות', credits: 100, price: 149, perViz: 1.49, discount: '49%' },
      ]
    });
  } catch (err) {
    console.error('viz-credits error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
