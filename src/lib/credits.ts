import { createServiceClient } from './supabase';

// ====== Credit Costs per Action ======
export const CREDIT_COSTS = {
  'visualize': 10,         // AI Room Visualization
  'floorplan': 10,         // Floor Plan rendering
  'room-photo': 5,         // Room photo from floorplan
  'furniture-swap': 5,     // Furniture replacement
  'video-walkthrough': 25, // Video tour (Veo)
  'shop-look': 3,          // Product detection
  'bill-of-quantities': 5, // כתב כמויות
  'scan-receipt': 2,       // Receipt scanning
  'analyze-quote': 3,      // Quote analysis
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// ====== Plans ======
export const PLANS = {
  free: {
    id: 'free',
    name: 'חינם',
    nameEn: 'Free',
    price: 0,
    monthlyCredits: 0,
    features: ['10 קרדיטים לניסיון', 'הדמיית חדר', 'כתב כמויות'],
    highlighted: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    nameEn: 'Starter',
    price: 29,
    annualPrice: 15,
    monthlyCredits: 50,
    features: ['50 קרדיטים לחודש', 'הדמיית חדר', 'כתב כמויות', 'החלפת רהיט', 'Shop the Look'],
    highlighted: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    nameEn: 'Pro',
    price: 79,
    annualPrice: 39,
    monthlyCredits: 200,
    features: ['200 קרדיטים לחודש', 'כל הכלים', 'סרטון סיור', 'קניית קרדיטים נוספים', 'שימוש מסחרי'],
    highlighted: true,
  },
  business: {
    id: 'business',
    name: 'Business',
    nameEn: 'Business',
    price: 199,
    annualPrice: 99,
    monthlyCredits: 600,
    features: ['600 קרדיטים לחודש', 'כל הכלים', 'סרטון סיור', 'קניית קרדיטים נוספים', 'שימוש מסחרי', 'תמיכה עדיפה'],
    highlighted: false,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// ====== Credit Packs ======
export const CREDIT_PACKS = [
  { id: 'pack_20', credits: 20, price: 19, perCredit: 0.95 },
  { id: 'pack_60', credits: 60, price: 49, perCredit: 0.82, popular: true },
  { id: 'pack_200', credits: 200, price: 129, perCredit: 0.65, discount: '32%' },
] as const;

// ====== Admin emails (bypass credits) ======
const ADMIN_EMAILS = ['guyceza@gmail.com'];

// ====== Server-side functions ======

export interface CreditBalance {
  credits: number;
  plan: string;
  monthlyCredits: number;
  nextReset: string | null;
}

/**
 * Get user's credit balance
 */
export async function getCredits(email: string): Promise<CreditBalance> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('viz_credits, plan, plan_started_at')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return { credits: 0, plan: 'free', monthlyCredits: 0, nextReset: null };
  }

  const plan = (data.plan || 'free') as PlanId;
  const planConfig = PLANS[plan] || PLANS.free;

  // Calculate next reset date
  let nextReset: string | null = null;
  if (data.plan_started_at && plan !== 'free') {
    const started = new Date(data.plan_started_at);
    const now = new Date();
    const nextResetDate = new Date(started);
    while (nextResetDate <= now) {
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
    }
    nextReset = nextResetDate.toISOString();
  }

  return {
    credits: data.viz_credits || 0,
    plan,
    monthlyCredits: planConfig.monthlyCredits,
    nextReset,
  };
}

/**
 * Check if user can perform an action (has enough credits)
 */
export async function canPerformAction(email: string, action: CreditAction): Promise<{ allowed: boolean; cost: number; balance: number; isAdmin: boolean }> {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return { allowed: true, cost: 0, balance: 999, isAdmin: true };
  }

  const cost = CREDIT_COSTS[action];
  const { credits } = await getCredits(email);

  return {
    allowed: credits >= cost,
    cost,
    balance: credits,
    isAdmin: false,
  };
}

/**
 * Deduct credits for an action. Returns new balance or throws if insufficient.
 */
export async function deductCredits(email: string, action: CreditAction): Promise<{ newBalance: number; cost: number }> {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return { newBalance: 999, cost: 0 };
  }

  const cost = CREDIT_COSTS[action];
  const supabase = createServiceClient();

  // Atomic deduction using RPC or manual check+update
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('viz_credits')
    .eq('email', email.toLowerCase())
    .single();

  if (fetchError || !user) {
    throw new Error('משתמש לא נמצא');
  }

  const currentCredits = user.viz_credits || 0;
  if (currentCredits < cost) {
    throw new Error(`אין מספיק קרדיטים (${currentCredits}/${cost})`);
  }

  const newBalance = currentCredits - cost;
  const { error: updateError } = await supabase
    .from('users')
    .update({ viz_credits: newBalance })
    .eq('email', email.toLowerCase());

  if (updateError) {
    throw new Error('שגיאה בעדכון קרדיטים');
  }

  // Log transaction
  try {
    await supabase.from('credit_transactions').insert({
      user_email: email.toLowerCase(),
      action,
      amount: -cost,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Failed to log credit transaction:', e); }

  return { newBalance, cost };
}

/**
 * Add credits to user (purchase, plan renewal, admin grant)
 */
export async function addCredits(email: string, amount: number, reason: string): Promise<number> {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('viz_credits')
    .eq('email', email.toLowerCase())
    .single();

  const currentCredits = user?.viz_credits || 0;
  const newBalance = currentCredits + amount;

  const { error } = await supabase
    .from('users')
    .update({ viz_credits: newBalance })
    .eq('email', email.toLowerCase());

  if (error) throw new Error('Failed to add credits');

  // Log transaction
  try {
    await supabase.from('credit_transactions').insert({
      user_email: email.toLowerCase(),
      action: reason,
      amount: amount,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    });
  } catch (e) { console.error('Failed to log credit transaction:', e); }

  return newBalance;
}

/**
 * Set user plan and grant monthly credits
 */
export async function setPlan(email: string, planId: PlanId): Promise<void> {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const supabase = createServiceClient();

  // Get current credits
  const { data: user } = await supabase
    .from('users')
    .select('viz_credits')
    .eq('email', email.toLowerCase())
    .single();

  const currentCredits = user?.viz_credits || 0;
  const newCredits = currentCredits + plan.monthlyCredits;

  await supabase
    .from('users')
    .update({
      plan: planId,
      plan_started_at: new Date().toISOString(),
      viz_credits: newCredits,
      purchased: true,
      purchased_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase());

  // Log
  if (plan.monthlyCredits > 0) {
    try {
      await supabase.from('credit_transactions').insert({
        user_email: email.toLowerCase(),
        action: `plan_${planId}`,
        amount: plan.monthlyCredits,
        balance_after: newCredits,
        created_at: new Date().toISOString(),
      });
    } catch {}
  }
}

/**
 * Grant trial credits to new user (guest or registered)
 */
export async function grantTrialCredits(email: string, amount: number = 10): Promise<number> {
  return addCredits(email, amount, 'trial');
}
