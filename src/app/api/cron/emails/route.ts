import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

// Vercel: use Node.js runtime with 60s timeout (NOT Edge)
export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================================
// ShiputzAI Email Flow System — Behavioral Triggers
// 10 Flows, 29 emails total
// Replaces old day-based sequence system
// ============================================================

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'ShiputzAI <help@shipazti.com>';
const BASE_URL = 'https://shipazti.com';

// Admin/test emails — never send marketing
const EXCLUDED_EMAILS = new Set([
  'test@test.com',
  'test@shiputzai.com',
  'test-ollie@shipazti.com',
  'test-ollie-2028@test.com',
]);

// 48h minimum between emails (in ms)
const MIN_EMAIL_GAP_MS = 48 * 60 * 60 * 1000;

// Flow priority (lower = higher priority, checked first)
// credits flows > activation > welcome > post_purchase > inactive > summary > milestone
const FLOW_PRIORITY: string[] = [
  'zero_credits',
  'low_credits',
  'abandoned',
  'activation',
  'welcome',
  'post_purchase',
  'inactive',
  'referral',
  'usage_summary',
  'milestone',
];

// ============================================================
// HELPERS
// ============================================================

function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return '';
  }
  return crypto
    .createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex')
    .substring(0, 16);
}

function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  return `${BASE_URL}/unsubscribe?email=${encodeURIComponent(email.toLowerCase())}${token ? `&token=${token}` : ''}`;
}

// Apple-style email wrapper — clean, RTL, Hebrew
function wrapEmail(title: string, subtitle: string, content: string, ctaText: string, ctaUrl: string, userEmail: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(userEmail);
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif; direction: rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;" dir="rtl">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;" dir="rtl">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <img src="${BASE_URL}/logo-email.png" alt="ShiputzAI" style="width: 40px; height: 40px; vertical-align: middle; margin-left: 10px;" /><span style="font-size: 28px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.5px; vertical-align: middle;">ShiputzAI</span>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background: #ffffff; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);" dir="rtl">
              <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
                <tr>
                  <td style="padding: 60px 50px; text-align: right;" dir="rtl">
                    <h1 style="font-size: 34px; font-weight: 700; color: #1d1d1f; margin: 0 0 12px; letter-spacing: -0.5px; text-align: center;">${title}</h1>
                    ${subtitle ? `<p style="font-size: 17px; color: #86868b; margin: 0 0 50px; text-align: center;">${subtitle}</p>` : '<div style="margin-bottom: 50px;"></div>'}
                    ${content}
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px;">
                      <tr>
                        <td align="center">
                          <a href="${ctaUrl}" style="display: inline-block; background: #1d1d1f; color: #ffffff; padding: 18px 48px; border-radius: 980px; text-decoration: none; font-size: 17px; font-weight: 500;">${ctaText}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px 20px; text-align: center;">
              <p style="font-size: 12px; color: #86868b; margin: 0 0 8px;">בהצלחה עם השיפוץ!</p>
              <p style="font-size: 12px; color: #86868b; margin: 0 0 16px;">ShiputzAI · ניהול שיפוצים חכם</p>
              <p style="font-size: 11px; color: #aeaeb2; margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #aeaeb2; text-decoration: underline;">להסרה מרשימת התפוצה</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send single email via Resend (fallback for one-offs)
async function sendEmail(to: string, subject: string, html: string): Promise<{ id?: string; message?: string }> {
  const unsubUrl = getUnsubscribeUrl(to);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return response.json();
}

// Batch send via Resend Batch API — up to 100 emails per request
// Returns array of { id } or { message } per email (same order as input)
interface BatchEmailInput { to: string; subject: string; html: string; }
async function sendBatchEmails(emails: BatchEmailInput[], maxRetries = 3): Promise<Array<{ id?: string; message?: string }>> {
  if (emails.length === 0) return [];

  const payload = emails.map(e => ({
    from: FROM_EMAIL,
    to: e.to,
    subject: e.subject,
    html: e.html,
    headers: {
      'List-Unsubscribe': `<${getUnsubscribeUrl(e.to)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }));

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Rate limited — respect Retry-After
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
        const waitMs = Math.min(retryAfter * 1000, 10000);
        console.warn(`Resend batch rate limit, waiting ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      // Server error — retry with backoff
      if (response.status >= 500) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`Resend batch server error ${response.status}, retrying in ${waitMs}ms`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      const result = await response.json();
      // Batch API returns { data: [{ id },...] } on success
      if (result.data && Array.isArray(result.data)) {
        return result.data;
      }
      // Error response
      return emails.map(() => ({ message: result.message || 'Batch send failed' }));
    } catch (err: any) {
      if (attempt < maxRetries - 1) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`Batch network error: ${err.message}, retrying in ${waitMs}ms`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return emails.map(() => ({ message: `Network error after ${maxRetries} retries: ${err.message}` }));
    }
  }

  return emails.map(() => ({ message: `Failed after ${maxRetries} retries` }));
}

// Helper: greeting
function greet(name?: string): string {
  const n = name || 'משפץ יקר';
  return `<p style="font-size: 17px; color: #1d1d1f; line-height: 1.5; margin: 0 0 30px; text-align: right;">היי <strong>${n}</strong>,</p>`;
}

// Helper: info box
function infoBox(lines: string[]): string {
  return `<div style="background: #f5f5f7; border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: right;">
    <p style="font-size: 16px; color: #1d1d1f; line-height: 2; margin: 0;">${lines.join('<br>')}</p>
  </div>`;
}

// Helper: paragraph
function para(text: string): string {
  return `<p style="font-size: 17px; color: #1d1d1f; line-height: 1.7; margin: 0 0 25px; text-align: right;">${text}</p>`;
}

// Helper: big number box
function bigNumber(number: string, caption: string): string {
  return `<div style="background: #f5f5f7; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
    <p style="font-size: 36px; font-weight: 700; color: #1d1d1f; margin: 0;">${number}</p>
    <p style="font-size: 15px; color: #86868b; margin: 12px 0 0;">${caption}</p>
  </div>`;
}

// Generate unique discount code
function generateDiscountCode(prefix: string, email: string): string {
  const emailPart = email.split('@')[0].slice(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${emailPart}-${random}`;
}

// ============================================================
// TYPES
// ============================================================

interface UserData {
  id: string;
  email: string;
  name: string | null;
  purchased: boolean;
  purchased_at: string | null;
  created_at: string;
  vision_subscription: string | null;
  viz_credits: number;
  plan: string | null;
  marketing_unsubscribed_at: string | null;
  last_started_action: string | null;
  last_started_action_at: string | null;
  last_started_action_page: string | null;
}

interface EmailAction {
  flowName: string;
  dayNumber: number;
  subject: string;
  html: string;
  reason: string;
}

interface FlowContext {
  user: UserData;
  sentEmails: Map<string, Set<number>>; // flowName → Set of day_numbers sent
  lastEmailAt: Date | null;
  creditTransactions: Array<{ action: string; amount: number; created_at: string }>;
  totalUsageCount: number;
  daysSinceSignup: number;
  daysSinceLastActivity: number;
  daysSincePurchase: number;
  isSunday: boolean;
  weeklyActionCount: number;
}

// ============================================================
// FLOW EVALUATORS
// Each returns an EmailAction or null
// ============================================================

// Flow 1: Welcome (trigger: signup)
function evaluateWelcome(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, daysSinceSignup } = ctx;
  const sent = sentEmails.get('welcome') || new Set();

  // #1 IMMEDIATE (day 0): Welcome with free credits
  if (!sent.has(0)) {
    return {
      flowName: 'welcome',
      dayNumber: 0,
      subject: 'ברוכים הבאים — יש לכם קרדיטים חינם',
      reason: 'new_signup',
      html: wrapEmail(
        'ברוכים הבאים',
        'יש לכם 10 קרדיטים חינם לניסיון',
        greet(user.name || undefined) +
        para('תודה שהצטרפתם! עם ShiputzAI תוכלו <strong>לראות איך הבית ייראה אחרי עיצוב מחדש</strong> — לפני שמוציאים שקל.') +
        infoBox([
          '✅ <strong>הדמיית חדר</strong> — צלם ותראה עיצוב חדש תוך שניות',
          '✅ <strong>Style Match</strong> — מצאו את הסגנון שמתאים לכם',
          '✅ <strong>Shop the Look</strong> — זיהוי מוצרים וקנייה ישירה',
          '✅ <strong>סרטון סיור</strong> — וידאו תלת-מימדי של החדר',
        ]) +
        para('התחילו עם הדמיה ראשונה — מצלמים חדר, בוחרים סגנון, ומקבלים תוצאה <strong>תוך 30 שניות</strong>.'),
        'צור הדמיה ראשונה',
        `${BASE_URL}/visualize`,
        user.email,
      ),
    };
  }

  // #2 +24h: Tip email
  if (!sent.has(1) && daysSinceSignup >= 1) {
    return {
      flowName: 'welcome',
      dayNumber: 1,
      subject: 'קיבלתם הצעת מחיר? ככה בודקים אותה',
      reason: 'welcome_day1',
      html: wrapEmail(
        'קיבלתם הצעת מחיר?',
        'ככה בודקים אותה בשניות',
        greet(user.name || undefined) +
        para('לפני שמתחילים שיפוץ — <strong>כדאי לדעת כמה זה באמת עולה</strong>. קיבלתם הצעת מחיר מקבלן?') +
        para('ה-AI שלנו מנתח את ההצעה ובודק:') +
        infoBox([
          '🔍 האם <strong>המחיר הוגן</strong> לעומת השוק?',
          '📋 מה <strong>חסר</strong> בהצעה?',
          '⚠️ סעיפים <strong>לשים לב</strong> אליהם לפני שחותמים',
        ]) +
        para('מצלמים או מעלים את ההצעה — ו<strong>תוך שניות מקבלים ניתוח מלא</strong>.'),
        'לנתח הצעת מחיר',
        `${BASE_URL}/quote-analysis`,
        user.email,
      ),
    };
  }

  // #3 +72h: Only if user hasn't used visualization
  if (!sent.has(2) && daysSinceSignup >= 3) {
    const hasUsedVision = ctx.creditTransactions.some(t => t.action === 'visualize');
    if (!hasUsedVision) {
      return {
        flowName: 'welcome',
        dayNumber: 2,
        subject: 'עדיין לא ניסיתם את ההדמיה?',
        reason: 'welcome_no_vision_use',
        html: wrapEmail(
          'עדיין לא ניסיתם?',
          'ההדמיה לוקחת 30 שניות',
          greet(user.name || undefined) +
          para('שמנו לב שעדיין לא ניסיתם את <strong>הדמיית החדר</strong> — הכלי הכי פופולרי שלנו!') +
          para('מצלמים את החדר, בוחרים סגנון עיצוב — ותוך שניות רואים <strong>איך זה ייראה בעיצוב חדש</strong>.') +
          bigNumber('10 קרדיטים', 'מחכים לכם בחשבון — מספיק להדמיה אחת'),
          'לנסות עכשיו',
          `${BASE_URL}/visualize`,
          user.email,
        ),
      };
    }
  }

  return null;
}

// Flow 2: Activation (trigger: first tool use)
// Flow: Abandoned Action — user started but didn't finish
function evaluateAbandoned(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails } = ctx;
  const sent = sentEmails.get('abandoned') || new Set();

  // Only trigger if user started an action but didn't complete it (24h+ ago)
  if (!user.last_started_action || !user.last_started_action_at) return null;

  const hoursSinceAction = (Date.now() - new Date(user.last_started_action_at).getTime()) / (1000 * 60 * 60);
  if (hoursSinceAction < 24) return null; // Wait at least 24h

  if (!sent.has(0)) {
    const actionNames: Record<string, string> = {
      'visualize': 'הדמיית חדר',
      'style-match': 'Style Match',
      'detect-items': 'Shop the Look',
      'floorplan': 'תוכנית קומה',
      'quote-analysis': 'ניתוח הצעת מחיר',
      'receipt-scanner': 'סריקת קבלה',
    };
    const actionName = actionNames[user.last_started_action] || user.last_started_action;
    const actionPage = user.last_started_action_page || '/dashboard';

    return {
      flowName: 'abandoned',
      dayNumber: 0,
      subject: 'התמונה שלכם עדיין מחכה',
      reason: `abandoned_${user.last_started_action}`,
      html: wrapEmail(
        'לא סיימת!',
        'התמונה שלכם עדיין מחכה',
        greet(user.name || undefined) +
        para(`שמנו לב שהתחלתם להשתמש ב-<strong>${actionName}</strong> אבל לא סיימתם.`) +
        para('אל דאגה — <strong>הכל שמור ומחכה לכם</strong>. פשוט חזרו ותסיימו.') +
        bigNumber(actionName, 'מחכה לכם'),
        'להמשיך מאיפה שעצרת',
        `${BASE_URL}${actionPage}`,
        user.email,
      ),
    };
  }

  return null;
}

function evaluateActivation(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, creditTransactions } = ctx;
  const sent = sentEmails.get('activation') || new Set();

  // Need at least one deduction (negative amount = usage)
  const deductions = creditTransactions.filter(t => t.amount < 0);
  if (deductions.length === 0) return null;

  const firstUse = new Date(deductions[0].created_at);
  const hoursSinceFirstUse = (Date.now() - firstUse.getTime()) / (1000 * 60 * 60);

  // #1 IMMEDIATE after first deduction
  if (!sent.has(0)) {
    return {
      flowName: 'activation',
      dayNumber: 0,
      subject: 'ההדמיה הראשונה שלכם מוכנה',
      reason: 'first_tool_use',
      html: wrapEmail(
        'כל הכבוד',
        'השתמשתם בכלי הראשון שלכם',
        greet(user.name || undefined) +
        para('מעולה! עשיתם את הצעד הראשון. <strong>התוצאה שלכם מוכנה</strong>.') +
        para('רוצים לראות את החדר בסגנון אחר? <strong>כל סגנון נותן תוצאה שונה לגמרי</strong> — מודרני, כפרי, מינימליסטי, ועוד.'),
        'לנסות סגנון אחר',
        `${BASE_URL}/visualize`,
        user.email,
      ),
    };
  }

  // #2 +48h: Suggest unused tools
  if (!sent.has(1) && hoursSinceFirstUse >= 48) {
    const usedActions = new Set(deductions.map(t => t.action));
    const allTools = [
      { action: 'visualize', name: 'הדמיית חדר', url: '/visualize' },
      { action: 'style-match', name: 'Style Match — מצאו את הסגנון שלכם', url: '/style-match' },
      { action: 'shop-look', name: 'Shop the Look — קנה את הסגנון', url: '/shop-the-look' },
      { action: 'analyze-quote', name: 'ניתוח הצעת מחיר', url: '/quote-analysis' },
      { action: 'scan-receipt', name: 'סריקת קבלות', url: '/receipt-scanner' },
      { action: 'bill-of-quantities', name: 'כתב כמויות', url: '/bill-of-quantities' },
    ];
    const unused = allTools.filter(t => !usedActions.has(t.action)).slice(0, 3);

    if (unused.length > 0) {
      const toolLines = unused.map(t => `✅ <strong>${t.name}</strong>`);
      return {
        flowName: 'activation',
        dayNumber: 1,
        subject: 'כלים שכדאי לנסות',
        reason: 'suggest_unused_tools',
        html: wrapEmail(
          'עוד כלים שיעזרו לכם',
          'כדאי לנסות',
          greet(user.name || undefined) +
          para('בנוסף לכלי שכבר ניסיתם, יש עוד כלי AI <strong>שיעזרו לכם לעצב את הבית</strong>:') +
          infoBox(toolLines) +
          para('כל כלי עולה רק <strong>כמה קרדיטים</strong> ונותן תוצאה מיידית.'),
          'לנסות עכשיו',
          `${BASE_URL}${unused[0].url}`,
          user.email,
        ),
      };
    }
  }

  return null;
}

// Flow 3: Abandoned Action — TODO: needs frontend tracking
// function evaluateAbandoned(ctx: FlowContext): EmailAction | null { return null; }

// Flow 4: Low Credits (viz_credits <= 3 AND > 0)
function evaluateLowCredits(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails } = ctx;
  const sent = sentEmails.get('low_credits') || new Set();

  if (user.viz_credits > 3 || user.viz_credits <= 0) return null;

  if (!sent.has(0)) {
    return {
      flowName: 'low_credits',
      dayNumber: 0,
      subject: `נשארו לכם ${user.viz_credits} קרדיטים`,
      reason: 'credits_running_low',
      html: wrapEmail(
        `נשארו ${user.viz_credits} קרדיטים`,
        'כדאי להשלים לפני שנגמרים',
        greet(user.name || undefined) +
        para(`נשארו לכם <strong>${user.viz_credits} קרדיטים</strong> בחשבון. מספיק לעוד שימוש אחד או שניים.`) +
        para('כדי להמשיך להשתמש בכל הכלים — <strong>השלימו קרדיטים בכל רגע</strong>.') +
        bigNumber(`${user.viz_credits}`, 'קרדיטים נותרו'),
        'לצפות בדשבורד',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  return null;
}

// Flow 5: Zero Credits (viz_credits = 0)
async function evaluateZeroCredits(ctx: FlowContext, supabase: any): Promise<EmailAction | null> {
  const { user, sentEmails, creditTransactions } = ctx;
  const sent = sentEmails.get('zero_credits') || new Set();

  if (user.viz_credits !== 0) return null;
  // Only trigger if user actually used credits before (not a brand new account)
  const hadDeductions = creditTransactions.some(t => t.amount < 0);
  if (!hadDeductions) return null;

  // #1 IMMEDIATE: credits depleted
  if (!sent.has(0)) {
    const deductions = creditTransactions.filter(t => t.amount < 0);
    const usageCount = deductions.length;
    const totalSpent = deductions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      flowName: 'zero_credits',
      dayNumber: 0,
      subject: 'נגמרו הקרדיטים',
      reason: 'credits_depleted',
      html: wrapEmail(
        'הקרדיטים נגמרו',
        '',
        greet(user.name || undefined) +
        para(`השתמשתם ב-<strong>${usageCount} כלים</strong> וצרכתם <strong>${totalSpent} קרדיטים</strong>. עכשיו הגיע הזמן להשלים.`) +
        infoBox([
          `📊 ${usageCount} שימושים בכלים`,
          `💰 ${totalSpent} קרדיטים נוצלו`,
        ]) +
        para('חבילות מתחילות מ-<strong>₪10 בלבד</strong>.'),
        'לרכוש קרדיטים',
        `${BASE_URL}/pricing`,
        user.email,
      ),
    };
  }

  // #2 +48h: 20% discount (if didn't buy)
  if (!sent.has(1) && sent.has(0)) {
    // Check if user bought since flow started
    const flow0Sent = await getFlowSentDate(supabase, user.email, 'zero_credits', 0);
    if (flow0Sent) {
      const hoursSince = (Date.now() - flow0Sent.getTime()) / (1000 * 60 * 60);
      if (hoursSince >= 48 && !user.purchased) {
        const code = generateDiscountCode('SAVE20', user.email);
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await supabase.from('discount_codes').insert({
          code,
          user_email: user.email,
          discount_percent: 20,
          expires_at: expiresAt.toISOString(),
        });

        return {
          flowName: 'zero_credits',
          dayNumber: 1,
          subject: 'הנחה מיוחדת — 48 שעות בלבד',
          reason: 'zero_credits_discount_20',
          html: wrapEmail(
            'הנחה מיוחדת בשבילכם',
            '48 שעות בלבד',
            greet(user.name || undefined) +
            para('כי ראינו שאתם משתמשים פעילים, יש לנו הצעה:') +
            bigNumber('20% הנחה', `קוד: <strong>${code}</strong>`) +
            para('ההנחה תקפה ל-<strong>48 השעות הקרובות בלבד</strong>.'),
            'לרכוש עם הנחה',
            `${BASE_URL}/pricing?code=${code}`,
            user.email,
          ),
        };
      }
    }
  }

  // #3 +7 days: 25% discount (last attempt)
  if (!sent.has(2) && sent.has(0)) {
    const flow0Sent = await getFlowSentDate(supabase, user.email, 'zero_credits', 0);
    if (flow0Sent) {
      const daysSince = (Date.now() - flow0Sent.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7 && !user.purchased) {
        const code = generateDiscountCode('BACK25', user.email);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await supabase.from('discount_codes').insert({
          code,
          user_email: user.email,
          discount_percent: 25,
          expires_at: expiresAt.toISOString(),
        });

        return {
          flowName: 'zero_credits',
          dayNumber: 2,
          subject: 'הצעה אחרונה — 25 אחוז הנחה',
          reason: 'zero_credits_discount_25',
          html: wrapEmail(
            'הצעה אחרונה',
            'הנחה הכי גבוהה שלנו',
            greet(user.name || undefined) +
            para('לא רוצים לוותר עליכם. הנה <strong>ההנחה הכי גבוהה שלנו</strong>:') +
            bigNumber('25% הנחה', `קוד: <strong>${code}</strong>`) +
            para('חבילות קרדיטים מ-₪10 — <strong>עם ההנחה עוד פחות</strong>.'),
            'לנצל את ההנחה',
            `${BASE_URL}/pricing?code=${code}`,
            user.email,
          ),
        };
      }
    }
  }

  return null;
}

// Flow 6: Inactive (no credit_transactions in X days)
async function evaluateInactive(ctx: FlowContext, supabase: any): Promise<EmailAction | null> {
  const { user, sentEmails, daysSinceLastActivity } = ctx;
  const sent = sentEmails.get('inactive') || new Set();

  // User must have been active at some point
  if (ctx.creditTransactions.length === 0) return null;
  // If user is still active, skip
  if (daysSinceLastActivity < 7) return null;

  // #1: 7 days inactive
  if (!sent.has(0) && daysSinceLastActivity >= 7) {
    return {
      flowName: 'inactive',
      dayNumber: 0,
      subject: 'יש לנו כלי עיצוב חדשים',
      reason: 'inactive_7d',
      html: wrapEmail(
        'חזרת!',
        'יש כלי עיצוב חדשים שחבל לפספס',
        greet(user.name || undefined) +
        para('לא ראינו אתכם כבר שבוע. יש לנו <strong>כלי עיצוב חדשים</strong> שחבל לפספס!') +
        para('החשבון שלכם מחכה — <strong>כל מה שעשיתם שמור</strong>.'),
        'לצפות בדשבורד',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  // #2: 14 days inactive
  if (!sent.has(1) && daysSinceLastActivity >= 14) {
    return {
      flowName: 'inactive',
      dayNumber: 1,
      subject: 'ראית את הכלי החדש?',
      reason: 'inactive_14d',
      html: wrapEmail(
        'יש לנו כלים חדשים',
        '',
        greet(user.name || undefined) +
        para('כלי עיצוב שכדאי לנסות:') +
        infoBox([
          '✅ <strong>Style Match</strong> — מצאו את סגנון העיצוב שמתאים לכם',
          '✅ <strong>Shop the Look</strong> — זיהוי מוצרים בתמונה + קישורי קנייה',
          '✅ <strong>סרטון סיור</strong> — וידאו תלת-מימדי של החדר שלכם',
        ]),
        'לנסות עכשיו',
        `${BASE_URL}/visualize`,
        user.email,
      ),
    };
  }

  // #3: 30 days — gift 5 credits
  if (!sent.has(2) && daysSinceLastActivity >= 30) {
    // Actually add 5 credits
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('viz_credits')
        .eq('email', user.email)
        .single();
      const currentCredits = userData?.viz_credits || 0;
      const newBalance = currentCredits + 5;
      await supabase
        .from('users')
        .update({ viz_credits: newBalance })
        .eq('email', user.email);
      await supabase.from('credit_transactions').insert({
        user_email: user.email,
        action: 'gift_inactive',
        amount: 5,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Failed to gift credits to ${user.email}:`, e);
    }

    return {
      flowName: 'inactive',
      dayNumber: 2,
      subject: 'מתגעגעים — יש לכם מתנה',
      reason: 'inactive_30d_gift',
      html: wrapEmail(
        'מתגעגעים',
        'יש לכם 5 קרדיטים מתנה',
        greet(user.name || undefined) +
        para('עבר חודש מהשימוש האחרון שלכם. רצינו להגיד שלום ולתת לכם <strong>מתנה קטנה</strong>.') +
        bigNumber('5 קרדיטים', 'כבר בחשבון שלכם — מוכנים לשימוש') +
        para('מספיק ל-Style Match, ניתוח הצעת מחיר, או סריקת קבלות.'),
        'להשתמש במתנה',
        `${BASE_URL}/visualize`,
        user.email,
      ),
    };
  }

  // #4: 60 days — last email with prominent unsubscribe
  if (!sent.has(3) && daysSinceLastActivity >= 60) {
    const unsubUrl = getUnsubscribeUrl(user.email);
    return {
      flowName: 'inactive',
      dayNumber: 3,
      subject: 'עדיין שם?',
      reason: 'inactive_60d_final',
      html: wrapEmail(
        'עדיין שם?',
        '',
        greet(user.name || undefined) +
        para('עברו חודשיים מהביקור האחרון שלכם. אם מצאתם את הסגנון המושלם — מעולה!') +
        para('אם רוצים להמשיך לקבל עדכונים על כלים חדשים, <strong>פשוט לחצו על הכפתור</strong>.') +
        para(`לא רוצים לשמוע מאיתנו? <a href="${unsubUrl}" style="color: #0071e3; text-decoration: underline;">להסרה מרשימת התפוצה</a>`),
        'לצפות בדשבורד',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  return null;
}

// Flow 7: Referral — TODO: needs referral system
// function evaluateReferral(ctx: FlowContext): EmailAction | null { return null; }

// Flow 8: Post-Purchase (trigger: purchased=true)
function evaluatePostPurchase(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, daysSincePurchase } = ctx;
  const sent = sentEmails.get('post_purchase') || new Set();

  if (!user.purchased || !user.purchased_at) return null;

  // #1 IMMEDIATE: Credits ready
  if (!sent.has(0)) {
    return {
      flowName: 'post_purchase',
      dayNumber: 0,
      subject: 'הקרדיטים מוכנים',
      reason: 'purchase_confirmed',
      html: wrapEmail(
        'הקרדיטים מוכנים',
        'אפשר להתחיל',
        greet(user.name || undefined) +
        para('הקרדיטים החדשים שלכם <strong>כבר בחשבון</strong> ומוכנים לשימוש.') +
        bigNumber(`${user.viz_credits}`, 'קרדיטים בחשבון שלכם') +
        para('היכנסו לדשבורד ותתחילו להשתמש.'),
        'לדשבורד',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  // #2 +3 days: Tips for maximizing credits
  if (!sent.has(1) && daysSincePurchase >= 3) {
    return {
      flowName: 'post_purchase',
      dayNumber: 1,
      subject: 'ככה מנצלים כל קרדיט למקסימום',
      reason: 'post_purchase_tips',
      html: wrapEmail(
        'ניצול מקסימלי',
        'של הקרדיטים שלכם',
        greet(user.name || undefined) +
        para('הנה כמה טיפים <strong>לנצל כל קרדיט בצורה חכמה</strong>:') +
        infoBox([
          '🎨 <strong>הדמיה בסגנונות שונים</strong> — נסו מודרני, כפרי, מינימליסטי (10 קרדיטים)',
          '🛋️ <strong>Style Match</strong> — AI מזהה את הסגנון שלכם ומציע מוצרים (3 קרדיטים)',
          '🛒 <strong>Shop the Look</strong> — זיהוי מוצרים בתמונה + קישורי קנייה (3 קרדיטים)',
        ]) +
        para('הכלי הכי פופולרי? <strong>הדמיית חדר</strong> — 30 שניות ורואים את העתיד.'),
        'צור הדמיה',
        `${BASE_URL}/visualize`,
        user.email,
      ),
    };
  }

  // #3 +7 days: Feedback request
  if (!sent.has(2) && daysSincePurchase >= 7) {
    return {
      flowName: 'post_purchase',
      dayNumber: 2,
      subject: 'מה דעתך? לוקח 15 שניות',
      reason: 'post_purchase_feedback',
      html: wrapEmail(
        'מה דעתך?',
        'לוקח 15 שניות',
        greet(user.name || undefined) +
        para('עבר שבוע מאז שרכשתם קרדיטים. נשמח לשמוע <strong>מה אתם חושבים</strong>!') +
        para('הפידבק שלכם עוזר לנו לבנות מוצר טוב יותר. פשוט <strong>שלחו לנו מייל קצר</strong> עם מה שאהבתם ומה אפשר לשפר.'),
        'לשלוח פידבק',
        'mailto:help@shipazti.com?subject=פידבק על ShiputzAI',
        user.email,
      ),
    };
  }

  return null;
}

// Flow 9: Usage Summary (weekly, Sunday)
function evaluateUsageSummary(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, isSunday, weeklyActionCount } = ctx;
  if (!isSunday) return null;

  // Variant C: 0 actions — don't send, let Inactive flow handle
  if (weeklyActionCount === 0) return null;

  const sent = sentEmails.get('usage_summary') || new Set();
  // Use week number as day_number for idempotency
  const weekNum = getWeekNumber();
  if (sent.has(weekNum)) return null;

  // Variant A: 3+ actions
  if (weeklyActionCount >= 3) {
    return {
      flowName: 'usage_summary',
      dayNumber: weekNum,
      subject: 'סיכום שבועי — שבוע פרודוקטיבי',
      reason: 'weekly_summary_active',
      html: wrapEmail(
        'הסיכום השבועי שלכם',
        'שבוע מעולה',
        greet(user.name || undefined) +
        bigNumber(`${weeklyActionCount} שימושים`, 'השבוע') +
        para('השבוע הייתם פעילים מאוד! <strong>המשיכו ככה</strong> — כל הדמיה מקרבת אתכם לעיצוב המושלם.') +
        para(`נותרו לכם <strong>${user.viz_credits} קרדיטים</strong>.`),
        'לדשבורד',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  // Variant B: 1-2 actions
  return {
    flowName: 'usage_summary',
    dayNumber: weekNum,
    subject: 'סיכום שבועי — נסו עוד כלי',
    reason: 'weekly_summary_light',
    html: wrapEmail(
      'הסיכום השבועי שלכם',
      '',
      greet(user.name || undefined) +
      bigNumber(`${weeklyActionCount}`, `שימוש${weeklyActionCount > 1 ? 'ים' : ''} השבוע`) +
      para('יש לכם עוד כלים שיכולים לעזור. נסו <strong>Style Match</strong> או <strong>Shop the Look</strong> — מצאו וקנו את הסגנון שמתאים לכם.') +
      para(`נותרו לכם <strong>${user.viz_credits} קרדיטים</strong>.`),
      'לנסות כלי נוסף',
      `${BASE_URL}/visualize`,
      user.email,
    ),
  };
}

// Flow 9: Referral — encourage sharing (sent once to active users)
function evaluateReferral(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, totalUsageCount, daysSinceSignup } = ctx;
  const sent = sentEmails.get('referral') || new Set();

  // Only send to users who have used at least 3 tools and signed up 5+ days ago
  if (totalUsageCount < 3 || daysSinceSignup < 5) return null;

  if (!sent.has(0)) {
    return {
      flowName: 'referral',
      dayNumber: 0,
      subject: 'הזמן חבר — שניכם מקבלים 20 קרדיטים',
      reason: 'referral_invite',
      html: wrapEmail(
        'הזמן חבר',
        'שניכם מקבלים 20 קרדיטים',
        greet(user.name || undefined) +
        para('אהבת את ShiputzAI? <strong>שתף עם חבר ותרוויח!</strong>') +
        bigNumber('20', 'קרדיטים לכל אחד — לכם ולחבר שלכם') +
        para('איך זה עובד:') +
        infoBox([
          '1️⃣ שלחו את הלינק האישי שלכם לחבר',
          '2️⃣ החבר נרשם דרך הלינק',
          '3️⃣ <strong>שניכם מקבלים 20 קרדיטים אוטומטית!</strong>',
        ]) +
        para('הלינק האישי שלכם מחכה בדשבורד.'),
        'לקבל את הלינק שלי',
        `${BASE_URL}/dashboard`,
        user.email,
      ),
    };
  }

  return null;
}

// Flow 10: Milestone (usage count milestones)
function evaluateMilestone(ctx: FlowContext): EmailAction | null {
  const { user, sentEmails, totalUsageCount } = ctx;
  const sent = sentEmails.get('milestone') || new Set();

  // #1: 5 uses
  if (!sent.has(0) && totalUsageCount >= 5) {
    // Find an unused tool to suggest
    const usedActions = new Set(ctx.creditTransactions.filter(t => t.amount < 0).map(t => t.action));
    const suggestions = [
      { action: 'analyze-quote', name: 'ניתוח הצעת מחיר', url: '/quote-analysis' },
      { action: 'bill-of-quantities', name: 'כתב כמויות', url: '/bill-of-quantities' },
      { action: 'shop-look', name: 'קנה את הסגנון', url: '/shop-the-look' },
      { action: 'scan-receipt', name: 'סריקת קבלות', url: '/receipt-scanner' },
    ];
    const unused = suggestions.find(s => !usedActions.has(s.action));
    const suggestUrl = unused ? `${BASE_URL}${unused.url}` : `${BASE_URL}/dashboard`;
    const suggestText = unused ? `נסה גם את <strong>${unused.name}</strong> — כלי שרוב המשתמשים אוהבים.` : 'המשך לנצל את כל הכלים!';

    return {
      flowName: 'milestone',
      dayNumber: 0,
      subject: 'חמש פעמים — מקצוענים!',
      reason: 'milestone_5_uses',
      html: wrapEmail(
        'חמש פעם',
        'מקצוענים!',
        greet(user.name || undefined) +
        bigNumber('5', 'שימושים בכלים') +
        para('כבר השתמשתם ב-5 כלי עיצוב! <strong>אתם יודעים מה אתם עושים.</strong>') +
        para(suggestText),
        'להמשיך',
        suggestUrl,
        user.email,
      ),
    };
  }

  // #2: 10 uses — upsell
  if (!sent.has(1) && totalUsageCount >= 10) {
    return {
      flowName: 'milestone',
      dayNumber: 1,
      subject: 'אתם בין המשתמשים הפעילים ביותר',
      reason: 'milestone_10_uses',
      html: wrapEmail(
        'אתם בין הפעילים ביותר',
        '',
        greet(user.name || undefined) +
        bigNumber('10+', 'שימושים') +
        para('עם יותר מ-10 שימושים, <strong>אתם בין המשתמשים הכי פעילים שלנו</strong>.') +
        para('שווה לבדוק את התוכניות שלנו — <strong>חבילת קרדיטים גדולה יותר = מחיר טוב יותר לקרדיט</strong>.'),
        'לצפות בתוכניות',
        `${BASE_URL}/pricing`,
        user.email,
      ),
    };
  }

  // #3: second purchase — suggest Pro
  if (!sent.has(2) && user.purchased) {
    // Check if user has more than one purchase transaction
    const purchaseTransactions = ctx.creditTransactions.filter(
      t => t.amount > 0 && !['trial', 'gift_inactive'].includes(t.action)
    );
    if (purchaseTransactions.length >= 2) {
      return {
        flowName: 'milestone',
        dayNumber: 2,
        subject: 'אולי תוכנית חודשית מתאימה?',
        reason: 'milestone_second_purchase',
        html: wrapEmail(
          'אולי תוכנית חודשית?',
          'חוסך לכם כסף וזמן',
          greet(user.name || undefined) +
          para('שמנו לב שכבר רכשתם קרדיטים פעמיים. <strong>תוכנית חודשית יכולה לחסוך לכם</strong>:') +
          infoBox([
            '✅ <strong>מחיר טוב יותר</strong> לקרדיט',
            '✅ <strong>קרדיטים אוטומטיים</strong> כל חודש',
            '✅ <strong>בלי לדאוג</strong> שיגמרו',
          ]),
          'לצפות בתוכניות',
          `${BASE_URL}/pricing`,
          user.email,
        ),
      };
    }
  }

  // #4: project 100% budget — TODO: needs project tracking system

  return null;
}

// ============================================================
// HELPER QUERIES
// ============================================================

async function getFlowSentDate(supabase: any, email: string, flowName: string, dayNumber: number): Promise<Date | null> {
  const { data } = await supabase
    .from('email_sequences')
    .select('sent_at')
    .eq('user_email', email)
    .eq('sequence_type', flowName)
    .eq('day_number', dayNumber)
    .eq('status', 'sent')
    .not('resend_id', 'is', null)
    .limit(1)
    .single();
  return data?.sent_at ? new Date(data.sent_at) : null;
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

// ============================================================
// MAIN CRON HANDLER
// ============================================================

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const supabase = createServiceClient();
  const runId = `cron-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  let sent = 0;
  let errors = 0;
  let skipped = 0;
  const details: string[] = [];
  const now = new Date();
  const isSunday = now.getUTCDay() === 0;

  try {
    // Fetch all users
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw usersError;

    // Fetch unsubscribed newsletter emails
    const { data: unsubscribed } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .not('unsubscribed_at', 'is', null);
    const unsubscribedEmails = new Set((unsubscribed || []).map((u: any) => u.email.toLowerCase()));

    // Fetch ALL email_sequences (for sent tracking) — batch
    const { data: allSequences } = await supabase
      .from('email_sequences')
      .select('user_email, sequence_type, day_number, status, resend_id, sent_at')
      .eq('status', 'sent')
      .not('resend_id', 'is', null);

    // Build per-user sent map: email → flowName → Set<dayNumber>
    const userSentMap = new Map<string, Map<string, Set<number>>>();
    // Also track last email date per user
    const userLastEmailMap = new Map<string, Date>();
    for (const seq of allSequences || []) {
      const email = seq.user_email.toLowerCase();
      if (!userSentMap.has(email)) userSentMap.set(email, new Map());
      const flows = userSentMap.get(email)!;
      if (!flows.has(seq.sequence_type)) flows.set(seq.sequence_type, new Set());
      flows.get(seq.sequence_type)!.add(seq.day_number);

      if (seq.sent_at) {
        const sentDate = new Date(seq.sent_at);
        const existing = userLastEmailMap.get(email);
        if (!existing || sentDate > existing) {
          userLastEmailMap.set(email, sentDate);
        }
      }
    }

    // Fetch all credit_transactions — batch
    const { data: allTransactions } = await supabase
      .from('credit_transactions')
      .select('user_email, action, amount, created_at')
      .order('created_at', { ascending: true });

    // Build per-user transaction map
    const userTransactions = new Map<string, Array<{ action: string; amount: number; created_at: string }>>();
    for (const tx of allTransactions || []) {
      const email = tx.user_email.toLowerCase();
      if (!userTransactions.has(email)) userTransactions.set(email, []);
      userTransactions.get(email)!.push(tx);
    }

    // Process each user — collect actions first, then send in parallel batches
    const pendingActions: Array<{ user: UserData; action: EmailAction }> = [];

    for (const user of (users || []) as UserData[]) {
      const email = user.email.toLowerCase();

      // Skip excluded
      if (EXCLUDED_EMAILS.has(email)) continue;

      // Skip unsubscribed (both mechanisms)
      if (user.marketing_unsubscribed_at) continue;
      if (unsubscribedEmails.has(email)) continue;

      // 48h minimum gap check
      const lastEmailAt = userLastEmailMap.get(email) || null;
      if (lastEmailAt && (now.getTime() - lastEmailAt.getTime()) < MIN_EMAIL_GAP_MS) {
        // Exception: welcome email day 0 can be sent immediately for new users
        const sentFlows = userSentMap.get(email);
        const welcomeSent = sentFlows?.get('welcome')?.has(0);
        if (welcomeSent) {
          skipped++;
          continue;
        }
      }

      // Build context
      const transactions = userTransactions.get(email) || [];
      const deductions = transactions.filter(t => t.amount < 0);
      const lastActivity = deductions.length > 0
        ? new Date(deductions[deductions.length - 1].created_at)
        : null;

      // Weekly action count (last 7 days)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyActionCount = deductions.filter(t => new Date(t.created_at) >= weekAgo).length;

      const ctx: FlowContext = {
        user,
        sentEmails: userSentMap.get(email) || new Map(),
        lastEmailAt,
        creditTransactions: transactions,
        totalUsageCount: deductions.length,
        daysSinceSignup: Math.floor((now.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        daysSinceLastActivity: lastActivity
          ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        daysSincePurchase: user.purchased_at
          ? Math.floor((now.getTime() - new Date(user.purchased_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999,
        isSunday,
        weeklyActionCount,
      };

      // Evaluate flows in priority order — first match wins
      let action: EmailAction | null = null;

      for (const flowName of FLOW_PRIORITY) {
        switch (flowName) {
          case 'zero_credits':
            action = await evaluateZeroCredits(ctx, supabase);
            break;
          case 'low_credits':
            action = evaluateLowCredits(ctx);
            break;
          case 'abandoned':
            action = evaluateAbandoned(ctx);
            break;
          case 'activation':
            action = evaluateActivation(ctx);
            break;
          case 'welcome':
            action = evaluateWelcome(ctx);
            break;
          case 'post_purchase':
            action = evaluatePostPurchase(ctx);
            break;
          case 'inactive':
            action = await evaluateInactive(ctx, supabase);
            break;
          case 'referral':
            action = evaluateReferral(ctx);
            break;
          case 'usage_summary':
            action = evaluateUsageSummary(ctx);
            break;
          case 'milestone':
            action = evaluateMilestone(ctx);
            break;
          default:
            break;
        }
        if (action) break;
      }

      if (!action) {
        skipped++;
        continue;
      }

      pendingActions.push({ user, action });
    }

    // ================================================================
    // BATCH SEND via Resend Batch API (up to 100 per request)
    // 2,000 users = 20 API calls, ~10 seconds total
    // ================================================================
    const BATCH_SIZE = 100; // Resend max per batch request

    // Step 1: Idempotency check — filter out already-sent emails
    const toSend: Array<{ user: UserData; action: EmailAction }> = [];
    for (const { user, action } of pendingActions) {
      const { data: existing } = await supabase
        .from('email_sequences')
        .select('id, status, resend_id')
        .eq('user_email', user.email)
        .eq('sequence_type', action.flowName)
        .eq('day_number', action.dayNumber)
        .single();

      if (existing?.status === 'sent' && existing?.resend_id) {
        skipped++;
        continue;
      }

      // Insert or update pending record
      if (!existing) {
        const { error: insertError } = await supabase
          .from('email_sequences')
          .insert({
            user_email: user.email,
            sequence_type: action.flowName,
            day_number: action.dayNumber,
            run_id: runId,
            status: 'pending',
            reason: action.reason,
          });
        if (insertError?.code === '23505') {
          skipped++;
          continue;
        }
      } else {
        await supabase
          .from('email_sequences')
          .update({ run_id: runId, status: 'pending', reason: action.reason })
          .eq('id', existing.id);
      }

      toSend.push({ user, action });
    }

    // Step 2: Send in batches of 100 via Resend Batch API
    for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
      const batch = toSend.slice(i, i + BATCH_SIZE);

      const batchEmails: BatchEmailInput[] = batch.map(({ user, action }) => ({
        to: user.email,
        subject: action.subject,
        html: action.html,
      }));

      const results = await sendBatchEmails(batchEmails);

      // Step 3: Update DB with results
      for (let j = 0; j < batch.length; j++) {
        const { user, action } = batch[j];
        const result = results[j] || { message: 'No result returned' };

        if (result.id) {
          await supabase
            .from('email_sequences')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              resend_id: result.id,
            })
            .eq('user_email', user.email)
            .eq('sequence_type', action.flowName)
            .eq('day_number', action.dayNumber);
          sent++;
          details.push(`${user.email}: ${action.flowName}#${action.dayNumber} (${action.reason})`);
        } else {
          await supabase
            .from('email_sequences')
            .update({
              status: 'failed',
              error: result.message || 'Unknown error',
            })
            .eq('user_email', user.email)
            .eq('sequence_type', action.flowName)
            .eq('day_number', action.dayNumber);
          errors++;
          details.push(`FAIL ${user.email}: ${action.flowName}#${action.dayNumber} — ${result.message}`);
        }
      }

      // Rate limit: 500ms between batch requests (Resend allows 2 req/sec)
      if (i + BATCH_SIZE < toSend.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      errors,
      skipped,
      evaluated: pendingActions.length,
      runId,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to process emails', message: error.message }, { status: 500 });
  }
}
