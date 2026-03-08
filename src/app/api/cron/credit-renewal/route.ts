import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PLAN_CREDITS: Record<string, number> = {
  starter: 50,
  pro: 200,
  business: 600,
};

/**
 * Monthly credit renewal cron.
 * Runs daily at 00:05 UTC. Checks each user with an active plan
 * and renews credits if their plan_started_at anniversary has passed.
 * 
 * Also sends low-credit alerts (< 10 credits remaining).
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow if no CRON_SECRET configured (dev)
    if (process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  let renewed = 0;
  let alerts = 0;

  try {
    // Get all users with active plans
    const { data: users, error } = await supabase
      .from('users')
      .select('email, name, plan, plan_started_at, viz_credits')
      .in('plan', ['starter', 'pro', 'business'])
      .not('plan_started_at', 'is', null);

    if (error || !users) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    for (const user of users) {
      const credits = PLAN_CREDITS[user.plan];
      if (!credits) continue;

      // Check if renewal is due (same day of month as plan_started_at)
      const started = new Date(user.plan_started_at);
      const dayOfMonth = started.getDate();
      
      // Is today the renewal day?
      if (now.getDate() !== dayOfMonth) continue;

      // Check we haven't already renewed today (look for transaction)
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: existing } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_email', user.email)
        .eq('action', `renewal_${user.plan}`)
        .gte('created_at', todayStart.toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue; // Already renewed today

      // Renew credits
      const currentCredits = user.viz_credits || 0;
      const newBalance = currentCredits + credits;

      await supabase.from('users').update({
        viz_credits: newBalance,
      }).eq('email', user.email);

      await supabase.from('credit_transactions').insert({
        user_email: user.email,
        action: `renewal_${user.plan}`,
        amount: credits,
        balance_after: newBalance,
        created_at: now.toISOString(),
      });

      renewed++;

      // Send renewal email
      await sendRenewalEmail(user.email, user.name, credits, newBalance);
    }

    // Low credit alerts — users with < 10 credits who had activity this month
    const { data: lowCreditUsers } = await supabase
      .from('users')
      .select('email, name, viz_credits, plan')
      .in('plan', ['starter', 'pro', 'business'])
      .lt('viz_credits', 10)
      .gt('viz_credits', 0);

    if (lowCreditUsers) {
      for (const user of lowCreditUsers) {
        // Only alert once per week (check last alert)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const { data: recentAlert } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('user_email', user.email)
          .eq('action', 'low_credit_alert')
          .gte('created_at', weekAgo.toISOString())
          .limit(1);

        if (recentAlert && recentAlert.length > 0) continue;

        await sendLowCreditEmail(user.email, user.name, user.viz_credits);
        
        // Mark alert sent
        await supabase.from('credit_transactions').insert({
          user_email: user.email,
          action: 'low_credit_alert',
          amount: 0,
          balance_after: user.viz_credits,
          created_at: now.toISOString(),
        });

        alerts++;
      }
    }

    return NextResponse.json({
      success: true,
      renewed,
      alerts,
      checked: users.length,
    });

  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendRenewalEmail(email: string, name: string | null, credits: number, total: number) {
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return;

    const displayName = escapeHtml(name || 'משפץ יקר');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: `${credits} קרדיטים חדשים נוספו לחשבון שלך`,
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111; text-align: center;">הקרדיטים החודשיים שלך חודשו!</h1>
          <p style="font-size: 16px; color: #333;">היי ${displayName},</p>
          <p style="font-size: 16px; color: #333;">קיבלת <strong>${credits} קרדיטים חדשים</strong> במסגרת המנוי שלך.</p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #10b981;">${total}</div>
            <div style="color: #666;">סה"כ קרדיטים זמינים</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/visualize" style="display: inline-block; background: #111; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">התחל להדמות ←</a>
          </div>
          <p style="color: #888; font-size: 14px;">בהצלחה!<br>צוות ShiputzAI</p>
        </div>`,
      }),
    });
  } catch (e) { console.error('Renewal email failed:', e); }
}

async function sendLowCreditEmail(email: string, name: string | null, remaining: number) {
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return;

    const displayName = escapeHtml(name || 'משפץ יקר');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: 'נשארו לך מעט קרדיטים',
        html: `<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111; text-align: center;">נשארו לך ${remaining} קרדיטים</h1>
          <p style="font-size: 16px; color: #333;">היי ${displayName},</p>
          <p style="font-size: 16px; color: #333;">שמנו לב שנשארו לך מעט קרדיטים. כדי להמשיך להשתמש בכלי ה-AI, אפשר לרכוש קרדיטים נוספים.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/pricing" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">רכישת קרדיטים ←</a>
          </div>
          <p style="color: #888; font-size: 14px;">צוות ShiputzAI</p>
        </div>`,
      }),
    });
  } catch (e) { console.error('Low credit email failed:', e); }
}
