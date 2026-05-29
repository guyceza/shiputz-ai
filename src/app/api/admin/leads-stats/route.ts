import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/admin-auth';

const FOLLOWUP_DAILY_LIMIT = 20;
const NEW_LEAD_DAILY_LIMIT = 20;
const DAILY_SEND_LIMIT = FOLLOWUP_DAILY_LIMIT + NEW_LEAD_DAILY_LIMIT;

const PROFESSION_IMAGE_URLS: Record<string, string> = {
  'מעצבי פנים': 'https://shipazti.com/lead-email/interior-designers.jpg',
  'אדריכלים': 'https://shipazti.com/lead-email/architects.jpg',
  'קבלני שיפוצים': 'https://shipazti.com/lead-email/renovation-contractors.jpg',
  'מטבחים ואמבטיות': 'https://shipazti.com/lead-email/kitchens-bathrooms.jpg',
  'נגרות אדריכלית': 'https://shipazti.com/lead-email/architectural-carpentry.jpg',
  'תאורה ועיצוב': 'https://shipazti.com/lead-email/lighting-design.jpg',
};

const PROFESSION_EMAILS: Record<string, { subject1: string; hook: string; value: string; followup: string }> = {
  'מעצבי פנים': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI למעצבי פנים',
    hook: 'ראיתי את העבודות שלכם בגוגל ונראה מרשים.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של החלל, כך שאפשר לבדוק כיוון עיצובי לפני שמתחילים לעבוד על הדמיה מלאה.',
    followup: 'מעצבים שמשתמשים ב-ShiputzAI אומרים שזה חוסך להם שעות של עבודה על הדמיות ומרשים את הלקוחות.',
  },
  'אדריכלים': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI לאדריכלים',
    hook: 'ראיתי את המשרד שלכם בגוגל. עבודות מרשימות.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של חלל, ועוזר לבדוק כיוון ראשוני לפני שמתקדמים לרנדרים או תוכניות מפורטות.',
    followup: 'אדריכלים שמשתמשים ב-ShiputzAI אומרים שזה חוסך להם זמן יקר על הדמיות ראשוניות ומזרז את תהליך האישור מול לקוחות.',
  },
  'קבלני שיפוצים': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI לקבלני שיפוצים',
    hook: 'ראיתי את העסק שלכם בגוגל.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של החדר, כדי שיהיה קל יותר להבין איך השיפוץ יכול להיראות לפני שמקבלים החלטה.',
    followup: 'קבלנים שמשתמשים ב-ShiputzAI אומרים שהלקוחות מתלהבים כשהם רואים הדמיה של התוצאה הסופית. וזה עוזר לסגור עסקאות.',
  },
  'מטבחים ואמבטיות': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI למטבחים ואמבטיות',
    hook: 'ראיתי את העסק שלכם בגוגל.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של המטבח או חדר הרחצה, ועוזר לבדוק סגנון לפני שמתקדמים לתכנון מלא.',
    followup: 'עסקים בתחום המטבחים והאמבטיות משתמשים ב-ShiputzAI כדי להראות ללקוחות הדמיות של התוצאה הסופית. וזה מזרז החלטות.',
  },
  'נגרות אדריכלית': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI לנגרות ועיצוב',
    hook: 'ראיתי את העבודות שלכם בגוגל.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של החלל, ועוזר לדמיין שינויי עיצוב, חומרים ונגרות לפני ביצוע.',
    followup: 'אנשי מקצוע בתחום הנגרות משתמשים ב-ShiputzAI כדי להציג ללקוחות הדמיות מהירות של פרויקטים. בלי לחכות לרנדרים.',
  },
  'תאורה ועיצוב': {
    subject1: 'פנייה חד־פעמית לגבי כלי AI לתאורה ועיצוב',
    hook: 'ראיתי את העסק שלכם בגוגל.',
    value: 'הכלי מציג ללקוח לפני/אחרי על בסיס תמונה של החלל, ועוזר לבדוק אווירה, סגנון ותאורה לפני שמתקדמים לתכנון מלא.',
    followup: 'עסקים בתחום התאורה והעיצוב משתמשים ב-ShiputzAI כדי להראות ללקוחות כיוון חזותי ברור במהירות.',
  },
};

const ALLOWED_PROFESSIONS = new Set([
  'מעצבי פנים',
  'אדריכלים',
  'קבלני שיפוצים',
  'מטבחים ואמבטיות',
  'נגרות אדריכלית',
  'תאורה ועיצוב',
  'ריהוט ועיצוב הבית',
  'ריצוף וחיפוי',
]);

const EXCLUDE_EMAIL_PREFIXES = new Set(['unsubscribe', 'abuse', 'privacy', 'noreply', 'no-reply', 'donotreply']);
const EXCLUDE_DOMAINS = new Set(['midrag.co.il', 'd.co.il', 'zap.co.il']);
const EXCLUDE_NAME_PATTERNS = [
  /עמותת/i, /איגוד/i, /התאחדות/i, /מדרג/i, /דפי זהב/i, /לימודי/i, /בית ספר/i, /קורס/i,
  /מכללה/i, /חומרי בניין/i, /טמבור/i, /כלי עבודה/i, /שמלות/i, /כלה/i, /פרחים/i,
  /גלריה לעיצוב הבית/i, /קניון/i, /סנטר/i, /רהיטי/i, /רהיטים/i, /מזרנים/i, /וילונות/i,
  /טקסטיל/i, /קרמיקה/i, /עיצוב גרפי/i, /מיתוג/i, /קליניקה/i, /טיפול/i, /משפחה/i,
];
const STRONG_RELEVANCE_PATTERNS = [
  /עיצוב פנים/i, /מעצב/i, /מעצבת/i, /אדריכל/i, /אדריכלות/i, /סטודיו/i, /interior/i,
  /architect/i, /architecture/i, /design/i, /שיפוצ/i, /קבלן/i, /מטבח/i, /נגר/i,
  /חיפוי/i, /ריצוף/i, /תאורה/i,
];

type LeadRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  profession: string | null;
  rating: number | null;
  reviews?: number | null;
  website: string | null;
  source?: string | null;
  city?: string | null;
  phone?: string | null;
  created_at: string;
  unsubscribed_at: string | null;
  last_email_sent_at: string | null;
};

type LeadEmailRow = {
  id: string;
  email?: string;
  status: string;
  sequence_number: number;
  sent_at?: string;
  error_message?: string | null;
};

async function fetchAllRows<T>(
  supabase: ReturnType<typeof createServiceClient>,
  table: string,
  select: string,
  order?: { column: string; ascending: boolean }
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    let query = supabase
      .from(table)
      .select(select)
      .range(from, from + batchSize - 1);

    if (order) {
      query = query.order(order.column, { ascending: order.ascending });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...(data as T[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  return rows;
}

function isValidLeadEmail(email: string | null | undefined): boolean {
  if (!email || email !== email.trim()) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [local, domain] = email.toLowerCase().split('@');
  if (!local || !domain) return false;
  if (EXCLUDE_EMAIL_PREFIXES.has(local)) return false;
  if (EXCLUDE_DOMAINS.has(domain)) return false;
  if (email.includes('%') || email.includes(',')) return false;
  return true;
}

function isQualifiedLead(lead: LeadRow): boolean {
  if (!ALLOWED_PROFESSIONS.has(lead.profession || '')) return false;
  if (!isValidLeadEmail(lead.email)) return false;
  if (!lead.website || String(lead.website).includes('midrag.co.il')) return false;
  const name = lead.name || '';
  if (EXCLUDE_NAME_PATTERNS.some((pattern) => pattern.test(name))) return false;
  const haystack = `${lead.name || ''} ${lead.website || ''} ${lead.profession || ''}`;
  return STRONG_RELEVANCE_PATTERNS.some((pattern) => pattern.test(haystack));
}

function scoreLead(lead: LeadRow): number {
  const professionPriority: Record<string, number> = {
    'מעצבי פנים': 1,
    'אדריכלים': 2,
    'קבלני שיפוצים': 3,
    'מטבחים ואמבטיות': 4,
    'נגרות אדריכלית': 5,
  };
  let score = 0;
  const profRank = professionPriority[lead.profession || ''] || 6;
  score += (6 - profRank) * 100;
  if (lead.email && !/@(gmail|yahoo|hotmail|outlook|walla|bezeqint)\./i.test(lead.email)) score += 50;
  score += (lead.rating || 0) * 10;
  return score;
}

function getIsraelDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getIsraelWeekday(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
  }).format(date);
}

function isSendDay(date: Date): boolean {
  const weekday = getIsraelWeekday(date);
  return weekday !== 'Friday' && weekday !== 'Saturday';
}

function getNextSendDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setUTCHours(8, 15, 0, 0); // 11:15 Israel during DST.
  for (let i = 0; days.length < count && i < 21; i++) {
    const candidate = new Date(cursor);
    candidate.setUTCDate(cursor.getUTCDate() + i);
    if (isSendDay(candidate)) days.push(candidate);
  }
  return days;
}

function getScheduleLabel(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function simulateUpcomingSendDays(leads: LeadRow[], sentTodayEmail1: number, sentTodayEmail2: number) {
  const mutable = leads.map((lead) => ({ ...lead }));
  const todayKey = getIsraelDateKey(new Date());

  return getNextSendDays(7).map((sendDate) => {
    const dayKey = getIsraelDateKey(sendDate);
    const newLimit = Math.max(0, NEW_LEAD_DAILY_LIMIT - (dayKey === todayKey ? sentTodayEmail1 : 0));
    const followupLimit = Math.max(0, FOLLOWUP_DAILY_LIMIT - (dayKey === todayKey ? sentTodayEmail2 : 0));
    const planned: Array<LeadRow & { nextEmail: number; plannedReason: string }> = [];

    const fiveDaysBeforeSend = new Date(sendDate);
    fiveDaysBeforeSend.setDate(fiveDaysBeforeSend.getDate() - 5);

    const followups = mutable
      .filter((lead) =>
        lead.status === 'email1_sent' &&
        !lead.unsubscribed_at &&
        lead.last_email_sent_at &&
        new Date(lead.last_email_sent_at) <= fiveDaysBeforeSend
      )
      .sort((a, b) => new Date(a.last_email_sent_at || 0).getTime() - new Date(b.last_email_sent_at || 0).getTime())
      .slice(0, followupLimit);

    followups.forEach((lead) => {
      planned.push({ ...lead, nextEmail: 2, plannedReason: 'followup' });
      lead.status = 'email2_sent';
      lead.last_email_sent_at = sendDate.toISOString();
    });

    if (newLimit > 0) {
      const newLeads = mutable
        .filter((lead) => ['new', 'pending'].includes(lead.status) && !lead.unsubscribed_at && isQualifiedLead(lead))
        .sort((a, b) => scoreLead(b) - scoreLead(a))
        .slice(0, newLimit);

      newLeads.forEach((lead) => {
        planned.push({ ...lead, nextEmail: 1, plannedReason: 'new' });
        lead.status = 'email1_sent';
        lead.last_email_sent_at = sendDate.toISOString();
      });
    }

    return {
      date: sendDate.toISOString(),
      dateKey: dayKey,
      label: getScheduleLabel(sendDate),
      dailyLimit: DAILY_SEND_LIMIT,
      followupLimit: FOLLOWUP_DAILY_LIMIT,
      newLeadLimit: NEW_LEAD_DAILY_LIMIT,
      alreadySent: dayKey === todayKey ? sentTodayEmail1 + sentTodayEmail2 : 0,
      alreadySentEmail1: dayKey === todayKey ? sentTodayEmail1 : 0,
      alreadySentEmail2: dayKey === todayKey ? sentTodayEmail2 : 0,
      plannedCount: planned.length,
      leads: planned.map((lead) => ({
        id: lead.id,
        email: lead.email,
        name: lead.name || '',
        profession: lead.profession || 'מעצבי פנים',
        nextEmail: lead.nextEmail,
        qualityScore: scoreLead(lead),
        plannedReason: lead.plannedReason,
      })),
    };
  });
}

function getTemplatePreviews() {
  return Object.entries(PROFESSION_EMAILS).map(([profession, content]) => ({
    profession,
    imageUrl: PROFESSION_IMAGE_URLS[profession] || PROFESSION_IMAGE_URLS['מעצבי פנים'],
    email1: {
      subject: content.subject1,
      body: `היי דנה,\n\n${content.hook} אני פונה אליכם חד־פעמית כי אתם בתחום ${profession}, וחשבתי שזה עשוי להיות רלוונטי מקצועית.\n\nבניתי את ShiputzAI, כלי ישראלי שמייצר הדמיות AI לשיפוץ ועיצוב מתוך תמונה קיימת.\n\n${content.value}\n\n[תמונת לפני/אחרי מותאמת למקצוע]\n\nאם מעניין אתכם שאשלח עוד פרטים או שתראו דוגמה, אפשר להיכנס כאן:\nhttps://shipazti.com/visualize`,
    },
    email2: {
      subject: `Re: ${content.subject1}`,
      body: `היי דנה,\n\nשלחתי מייל לפני כמה ימים. אולי נחת בספאם.\n\n${content.followup}\n\nאשמח לשמוע מה אתם חושבים. https://shipazti.com`,
    },
  }));
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all leads. Supabase's default API limit is 1000, so page explicitly.
    const leads = await fetchAllRows<LeadRow>(
      supabase,
      'leads',
      'id,email,name,status,profession,rating,reviews,website,source,city,phone,created_at,unsubscribed_at,last_email_sent_at'
    );

    const statusCounts: Record<string, number> = {};
    let unsubscribed = 0;
    leads.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      if (l.unsubscribed_at) unsubscribed++;
    });

    const total = leads.length;
    const remaining = (statusCounts['new'] || 0) + (statusCounts['pending'] || 0);

    // Get all email stats from lead_emails. This is the source of truth for sent/event counters.
    const emailStats = await fetchAllRows<LeadEmailRow>(
      supabase,
      'lead_emails',
      'id,status,sequence_number,sent_at'
    );

    let bounced = 0;
    let errors = 0;
    let opened = 0;
    let delivered = 0;
    let complained = 0;
    let clicked = 0;
    let totalEmailsSent = 0;
    let email1Sent = 0;
    let email2Sent = 0;
    emailStats.forEach(e => {
      if (e.status === 'bounced') bounced++;
      if (e.status === 'error') errors++;
      if (['opened', 'clicked'].includes(e.status)) opened++;
      if (['delivered', 'opened', 'clicked'].includes(e.status)) delivered++;
      if (e.status === 'complained') complained++;
      if (e.status === 'clicked') clicked++;
      if (e.status !== 'error') {
        totalEmailsSent++;
        if (e.sequence_number === 1) email1Sent++;
        if (e.sequence_number === 2) email2Sent++;
      }
    });

    // Get today's sends by Israel date, matching the campaign schedule.
    const todayKey = getIsraelDateKey(new Date());
    const todaySends = emailStats.filter((send) => (
      send.sent_at &&
      getIsraelDateKey(new Date(send.sent_at)) === todayKey
    ));

    const sentToday = todaySends.length;
    const sentTodayEmail1 = todaySends.filter((send) => send.sequence_number === 1).length;
    const sentTodayEmail2 = todaySends.filter((send) => send.sequence_number === 2).length;

    // Get campaign start date for warm-up phase
    const { data: firstEmail } = await supabase
      .from('lead_emails')
      .select('sent_at')
      .order('sent_at', { ascending: true })
      .limit(1);

    const campaignStart = firstEmail?.[0]?.sent_at 
      ? new Date(firstEmail[0].sent_at) 
      : null;

    let warmupWeek = 1;
    const dailyLimit = DAILY_SEND_LIMIT;
    if (campaignStart) {
      const daysSinceStart = Math.floor((Date.now() - campaignStart.getTime()) / (1000 * 60 * 60 * 24));
      warmupWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, 3);
    }

    // Get recent activity (last 20 emails)
    const { data: recentEmails } = await supabase
      .from('lead_emails')
      .select('id, email, sequence_number, sent_at, status, error_message')
      .order('sent_at', { ascending: false })
      .limit(20);

    // Calculate next batch time
    const now = new Date();
    const nextBatch = new Date();
    nextBatch.setUTCHours(8, 15, 0, 0); // Current cron: 11:15 Asia/Jerusalem during DST.
    if (now.getTime() >= nextBatch.getTime()) {
      nextBatch.setDate(nextBatch.getDate() + 1);
    }
    // Skip Friday (5) and Saturday (6)
    while (nextBatch.getUTCDay() === 5 || nextBatch.getUTCDay() === 6) {
      nextBatch.setDate(nextBatch.getDate() + 1);
    }

    const upcomingSendDays = simulateUpcomingSendDays(leads, sentTodayEmail1, sentTodayEmail2);
    const nextBatchLeads = upcomingSendDays[0]?.leads || [];

    return NextResponse.json({
      total,
      email1Sent,
      email2Sent,
      bounced,
      errors,
      opened,
      delivered,
      complained,
      clicked,
      unsubscribed,
      remaining,
      sentToday,
      sentTodayEmail1,
      sentTodayEmail2,
      totalEmailsSent,
      warmupWeek,
      dailyLimit,
      followupDailyLimit: FOLLOWUP_DAILY_LIMIT,
      newLeadDailyLimit: NEW_LEAD_DAILY_LIMIT,
      campaignStarted: !!campaignStart,
      campaignStartDate: campaignStart?.toISOString() || null,
      nextBatch: nextBatch.toISOString(),
      recentEmails: recentEmails || [],
      statusBreakdown: statusCounts,
      nextBatchLeads,
      upcomingSendDays,
      professionTemplates: getTemplatePreviews(),
    });
  } catch (error: unknown) {
    console.error('Leads stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
