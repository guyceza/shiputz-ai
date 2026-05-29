import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const PROFESSION_PRIORITY: Record<string, number> = {
  'מעצבי פנים': 1,
  'אדריכלים': 2,
  'קבלני שיפוצים': 3,
  'מטבחים ואמבטיות': 4,
  'נגרות אדריכלית': 5,
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

function scoreLead(lead: any): number {
  let score = 0;
  const profRank = PROFESSION_PRIORITY[lead.profession] || 6;
  score += (6 - profRank) * 100;
  if (lead.email && !/\@(gmail|yahoo|hotmail|outlook|walla|bezeqint)\./i.test(lead.email)) {
    score += 50;
  }
  score += (lead.rating || 0) * 10;
  return score;
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

function isQualifiedLead(lead: any): boolean {
  if (!ALLOWED_PROFESSIONS.has(lead.profession || '')) return false;
  if (!isValidLeadEmail(lead.email)) return false;
  if (!lead.website || String(lead.website).includes('midrag.co.il')) return false;
  const name = lead.name || '';
  if (EXCLUDE_NAME_PATTERNS.some((pattern) => pattern.test(name))) return false;
  const haystack = `${lead.name || ''} ${lead.website || ''} ${lead.profession || ''}`;
  return STRONG_RELEVANCE_PATTERNS.some((pattern) => pattern.test(haystack));
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Fetch ALL leads (Supabase default limit is 1000)
    let allLeads: any[] = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
      const { data: batch, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + batchSize - 1);
      if (error) throw error;
      if (!batch || batch.length === 0) break;
      allLeads = allLeads.concat(batch);
      if (batch.length < batchSize) break;
      from += batchSize;
    }
    const leads = allLeads;

    // Fetch ALL emails
    let allEmails: any[] = [];
    from = 0;
    while (true) {
      const { data: batch, error } = await supabase
        .from('lead_emails')
        .select('*')
        .order('sent_at', { ascending: false })
        .range(from, from + batchSize - 1);
      if (error) throw error;
      if (!batch || batch.length === 0) break;
      allEmails = allEmails.concat(batch);
      if (batch.length < batchSize) break;
      from += batchSize;
    }
    const emails = allEmails;

    const emailsByLead: Record<string, typeof emails> = {};
    emails?.forEach(e => {
      if (!emailsByLead[e.email]) emailsByLead[e.email] = [];
      emailsByLead[e.email].push(e);
    });

    // Determine next batch (unsent leads sorted by quality)
    const unsent = leads?.filter(l => 
      ['new', 'pending'].includes(l.status) && !l.unsubscribed_at && isQualifiedLead(l)
    ) || [];
    const sortedUnsent = unsent.sort((a, b) => scoreLead(b) - scoreLead(a));
    const nextBatchEmails = new Set(sortedUnsent.slice(0, 20).map(l => l.email));

    const enrichedLeads = leads?.map(lead => {
      const leadEmails = emailsByLead[lead.email] || [];
      const email1 = leadEmails.find((e: any) => e.sequence_number === 1);
      const email2 = leadEmails.find((e: any) => e.sequence_number === 2);
      
      return {
        id: lead.id,
        email: lead.email,
        name: lead.name || '',
        city: lead.city || '',
        phone: lead.phone || '',
        website: lead.website || '',
        profession: lead.profession || '',
        source: lead.source || '',
        rating: lead.rating || null,
        status: lead.status,
        created_at: lead.created_at,
        unsubscribed: !!lead.unsubscribed_at,
        email1_status: email1?.status || null,
        email1_sent_at: email1?.sent_at || null,
        email2_status: email2?.status || null,
        email2_sent_at: email2?.sent_at || null,
        last_event: leadEmails[0]?.status || null,
        last_event_at: leadEmails[0]?.sent_at || null,
        quality_score: scoreLead(lead),
        in_next_batch: nextBatchEmails.has(lead.email),
      };
    });

    return NextResponse.json({ leads: enrichedLeads || [] });
  } catch (error) {
    console.error('Leads list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
