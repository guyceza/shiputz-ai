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
  let skippedPayPlusRecurring = 0;
  let skippedExpiredAnnual = 0;

  try {
    // Get all users with active plans
    const { data: users, error } = await supabase
      .from('users')
      .select('email, name, plan, plan_started_at, plan_billing_cycle, plan_period_end, viz_credits, purchased_credits, payplus_recurring_uid, payplus_subscription_status')
      .in('plan', ['starter', 'pro', 'business'])
      .not('plan_started_at', 'is', null);

    if (error || !users) {
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    for (const user of users) {
      const credits = PLAN_CREDITS[user.plan];
      if (!credits) continue;

      const billingCycle = user.plan_billing_cycle || ((user.payplus_recurring_uid || user.payplus_subscription_status === 'active') ? 'monthly' : null);

      // PayPlus monthly subscriptions receive credits only after a successful
      // recurring payment webhook. Annual users pay yearly but still receive
      // subscription credits monthly while their annual period is active.
      if (billingCycle === 'monthly') {
        skippedPayPlusRecurring++;
        continue;
      }

      if (billingCycle === 'annual' && user.plan_period_end && new Date(user.plan_period_end) <= now) {
        skippedExpiredAnnual++;
        continue;
      }

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

      // Reset subscription credits and preserve separately purchased credits.
      const purchasedCredits = user.purchased_credits || 0;
      const newBalance = purchasedCredits + credits;

      await supabase.from('users').update({
        viz_credits: newBalance,
        subscription_credits: credits,
        purchased_credits: purchasedCredits,
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

    // Low credit alerts - users with < 10 credits who had activity this month
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
      skippedPayPlusRecurring,
      skippedExpiredAnnual,
      checked: users.length,
    });

  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function brandedEmail(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #fbf7ef; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Arial, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 52px 18px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://shipazti.com/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 28px; font-weight: 600; color: #1d1d1f; vertical-align: middle;">ShiputzAI</span>
            </td>
          </tr>
          <tr>
            <td style="background: #fffaf0; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 42px rgba(30, 56, 38, 0.14); border: 1px solid #efe2c6;" dir="rtl">
              <div style="height: 12px; background: linear-gradient(90deg, #14b875 0%, #8bd86f 48%, #f0c75d 100%);"></div>
              <div style="padding: 48px 42px 44px; text-align: right;" dir="rtl">
                <h1 style="font-size: 34px; font-weight: 800; color: #142018; margin: 0 0 28px; text-align: center; direction: rtl;">${title}</h1>
                ${body}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 34px 20px; text-align: center;">
              <p style="font-size: 12px; color: #86868b; margin: 0;">ShiputzAI · ניהול שיפוצים חכם</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
        html: brandedEmail('הקרדיטים החודשיים שלך חודשו!', `
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${displayName},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">קרדיטי המנוי שלך התאפסו והתחדשו ל-<strong>${credits} קרדיטים</strong>.</p>
          <div style="background: #ffffff; border-radius: 18px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #eee5d7;">
            <div style="font-size: 48px; font-weight: bold; color: #10b981;">${total}</div>
            <div style="color: #666;">סה"כ קרדיטים זמינים</div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/visualize" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">התחל להדמות</a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0; text-align: right;">קרדיטים שנרכשו בנפרד לא מתאפסים ונשארים בחשבון. בהצלחה!</p>
        `),
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
        html: brandedEmail(`נשארו לך ${remaining} קרדיטים`, `
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">היי ${displayName},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.7; margin: 0 0 18px; text-align: right;">שמנו לב שנשארו לך מעט קרדיטים. כדי להמשיך להשתמש בכלי ה-AI, אפשר לרכוש קרדיטים נוספים.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://shipazti.com/pricing" style="display: inline-block; background: #16a765; color: white; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: bold; box-shadow: 0 10px 20px rgba(22, 167, 101, 0.26);">רכישת קרדיטים</a>
          </div>
        `),
      }),
    });
  } catch (e) { console.error('Low credit email failed:', e); }
}
