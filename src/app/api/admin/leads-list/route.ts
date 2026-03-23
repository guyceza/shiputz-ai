import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const PROFESSION_PRIORITY: Record<string, number> = {
  'מעצבי פנים': 1,
  'אדריכלים': 2,
  'קבלני שיפוצים': 3,
  'מטבחים ואמבטיות': 4,
  'נגרות אדריכלית': 5,
};

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

export async function GET(request: NextRequest) {
  try {
    const authEmail = request.headers.get('x-admin-email') || '';
    if (!isAdmin(authEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) throw leadsError;

    const { data: emails, error: emailsError } = await supabase
      .from('lead_emails')
      .select('*')
      .order('sent_at', { ascending: false });

    if (emailsError) throw emailsError;

    const emailsByLead: Record<string, typeof emails> = {};
    emails?.forEach(e => {
      if (!emailsByLead[e.email]) emailsByLead[e.email] = [];
      emailsByLead[e.email].push(e);
    });

    // Determine next batch (unsent leads sorted by quality)
    const unsent = leads?.filter(l => 
      ['new', 'pending'].includes(l.status) && !l.unsubscribed_at
    ) || [];
    const sortedUnsent = unsent.sort((a, b) => scoreLead(b) - scoreLead(a));
    const nextBatchEmails = new Set(sortedUnsent.slice(0, 30).map(l => l.email));

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
