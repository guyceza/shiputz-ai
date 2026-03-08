import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

export const runtime = 'nodejs';

// Generate a short unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars
}

const REFERRAL_CREDITS = 20; // Both referrer and referred get 20 credits

// GET /api/referral?email=xxx — Get or create referral code for user
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check if user exists
  const { data: user } = await supabase
    .from('users')
    .select('email, referral_code')
    .eq('email', email)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // If user already has a referral code, return it
  if (user.referral_code) {
    // Count successful referrals
    const { count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_email', email)
      .eq('status', 'completed');

    return NextResponse.json({
      code: user.referral_code,
      link: `https://shipazti.com/?ref=${user.referral_code}`,
      completedReferrals: count || 0,
      creditsPerReferral: REFERRAL_CREDITS,
    });
  }

  // Generate new code
  let code = generateReferralCode();
  let attempts = 0;
  while (attempts < 5) {
    const { error } = await supabase
      .from('users')
      .update({ referral_code: code })
      .eq('email', email);

    if (!error) break;
    // Collision — regenerate
    code = generateReferralCode();
    attempts++;
  }

  return NextResponse.json({
    code,
    link: `https://shipazti.com/?ref=${code}`,
    completedReferrals: 0,
    creditsPerReferral: REFERRAL_CREDITS,
  });
}

// POST /api/referral — Complete a referral (called when new user signs up with ref code)
// Body: { referralCode: string, newUserEmail: string }
export async function POST(request: NextRequest) {
  try {
    const { referralCode, newUserEmail } = await request.json();

    if (!referralCode || !newUserEmail) {
      return NextResponse.json({ error: 'Missing referralCode or newUserEmail' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find referrer by code
    const { data: referrer } = await supabase
      .from('users')
      .select('email, referral_code')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (!referrer) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Can't refer yourself
    if (referrer.email.toLowerCase() === newUserEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if this referral already exists
    const { data: existing } = await supabase
      .from('referrals')
      .select('id, status')
      .eq('referrer_email', referrer.email)
      .eq('referred_email', newUserEmail.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Referral already exists', status: existing.status }, { status: 409 });
    }

    // Check if new user actually exists (registered)
    const { data: newUser } = await supabase
      .from('users')
      .select('email, viz_credits')
      .eq('email', newUserEmail.toLowerCase())
      .single();

    if (!newUser) {
      // Store pending referral — will complete when user signs up
      await supabase.from('referrals').insert({
        referrer_email: referrer.email,
        referral_code: referralCode.toUpperCase(),
        referred_email: newUserEmail.toLowerCase(),
        status: 'pending',
      });

      return NextResponse.json({ status: 'pending', message: 'Waiting for user to sign up' });
    }

    // User exists — complete the referral!
    // 1. Create referral record
    await supabase.from('referrals').insert({
      referrer_email: referrer.email,
      referral_code: referralCode.toUpperCase(),
      referred_email: newUserEmail.toLowerCase(),
      status: 'completed',
      referrer_credited: true,
      referred_credited: true,
      completed_at: new Date().toISOString(),
    });

    // 2. Credit referrer +20
    const { data: referrerData } = await supabase
      .from('users')
      .select('viz_credits')
      .eq('email', referrer.email)
      .single();

    const newReferrerCredits = (referrerData?.viz_credits || 0) + REFERRAL_CREDITS;
    await supabase
      .from('users')
      .update({ viz_credits: newReferrerCredits })
      .eq('email', referrer.email);

    await supabase.from('credit_transactions').insert({
      user_email: referrer.email,
      action: 'referral_bonus',
      amount: REFERRAL_CREDITS,
      balance_after: newReferrerCredits,
    });

    // 3. Credit referred +20
    const newReferredCredits = (newUser.viz_credits || 0) + REFERRAL_CREDITS;
    await supabase
      .from('users')
      .update({ viz_credits: newReferredCredits, referred_by: referralCode.toUpperCase() })
      .eq('email', newUserEmail.toLowerCase());

    await supabase.from('credit_transactions').insert({
      user_email: newUserEmail.toLowerCase(),
      action: 'referral_welcome',
      amount: REFERRAL_CREDITS,
      balance_after: newReferredCredits,
    });

    return NextResponse.json({
      status: 'completed',
      referrerCredits: newReferrerCredits,
      referredCredits: newReferredCredits,
      creditsGiven: REFERRAL_CREDITS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
