import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authEmail = request.headers.get('x-admin-email') || '';
    if (!isAdmin(authEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) throw leadsError;

    // Get all emails sent
    const { data: emails, error: emailsError } = await supabase
      .from('lead_emails')
      .select('*')
      .order('sent_at', { ascending: false });

    if (emailsError) throw emailsError;

    // Map emails to leads
    const emailsByLead: Record<string, typeof emails> = {};
    emails?.forEach(e => {
      if (!emailsByLead[e.email]) emailsByLead[e.email] = [];
      emailsByLead[e.email].push(e);
    });

    // Enrich leads with email data
    const enrichedLeads = leads?.map(lead => {
      const leadEmails = emailsByLead[lead.email] || [];
      const email1 = leadEmails.find((e: { sequence_number: number }) => e.sequence_number === 1);
      const email2 = leadEmails.find((e: { sequence_number: number }) => e.sequence_number === 2);
      
      return {
        id: lead.id,
        email: lead.email,
        name: lead.name || '',
        city: lead.city || '',
        phone: lead.phone || '',
        website: lead.website || '',
        profession: lead.profession || '',
        source: lead.source || '',
        status: lead.status,
        created_at: lead.created_at,
        unsubscribed: !!lead.unsubscribed_at,
        email1_status: email1?.status || null,
        email1_sent_at: email1?.sent_at || null,
        email2_status: email2?.status || null,
        email2_sent_at: email2?.sent_at || null,
        last_event: leadEmails[0]?.status || null,
        last_event_at: leadEmails[0]?.sent_at || null,
      };
    });

    return NextResponse.json({ leads: enrichedLeads || [] });
  } catch (error) {
    console.error('Leads list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
