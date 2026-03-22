import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    // Auth check via cookie or header
    const authEmail = request.headers.get('x-admin-email') || '';
    if (!isAdmin(authEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all leads with status counts
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('status, unsubscribed_at');

    if (leadsError) throw leadsError;

    const statusCounts: Record<string, number> = {};
    let unsubscribed = 0;
    leads?.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      if (l.unsubscribed_at) unsubscribed++;
    });

    const total = leads?.length || 0;
    const email1Sent = (statusCounts['email1_sent'] || 0) + (statusCounts['email2_sent'] || 0);
    const email2Sent = statusCounts['email2_sent'] || 0;
    const remaining = (statusCounts['new'] || 0) + (statusCounts['pending'] || 0);

    // Get email stats from lead_emails
    const { data: emailStats } = await supabase
      .from('lead_emails')
      .select('status, sequence_number');

    let bounced = 0;
    let errors = 0;
    let opened = 0;
    let delivered = 0;
    let complained = 0;
    let clicked = 0;
    let totalEmailsSent = 0;
    emailStats?.forEach(e => {
      if (e.status === 'bounced') bounced++;
      if (e.status === 'error') errors++;
      if (e.status === 'opened') opened++;
      if (e.status === 'delivered') delivered++;
      if (e.status === 'complained') complained++;
      if (e.status === 'clicked') { clicked++; opened++; } // clicked implies opened
      if (['sent', 'delivered', 'opened', 'clicked'].includes(e.status)) totalEmailsSent++;
    });

    // Get today's sends
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const { data: todaySends } = await supabase
      .from('lead_emails')
      .select('id')
      .gte('sent_at', today.toISOString());
    
    const sentToday = todaySends?.length || 0;

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
    let dailyLimit = 15;
    if (campaignStart) {
      const daysSinceStart = Math.floor((Date.now() - campaignStart.getTime()) / (1000 * 60 * 60 * 24));
      warmupWeek = Math.min(Math.floor(daysSinceStart / 7) + 1, 3);
      dailyLimit = warmupWeek === 1 ? 30 : warmupWeek === 2 ? 40 : 50;
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
    nextBatch.setUTCHours(7, 0, 0, 0); // 07:00 UTC = 09:00 Israel
    if (now.getUTCHours() >= 7) {
      nextBatch.setDate(nextBatch.getDate() + 1);
    }
    // Skip Friday (5) and Saturday (6)
    while (nextBatch.getUTCDay() === 5 || nextBatch.getUTCDay() === 6) {
      nextBatch.setDate(nextBatch.getDate() + 1);
    }

    // Get next batch preview: follow-ups first, then new leads
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    
    // Follow-ups (email1_sent, 5+ days ago)
    const { data: followupLeads } = await supabase
      .from('leads')
      .select('id, email, name, profession, status, last_email_sent_at')
      .eq('status', 'email1_sent')
      .is('unsubscribed_at', null)
      .lte('last_email_sent_at', fiveDaysAgo)
      .order('last_email_sent_at', { ascending: true })
      .limit(dailyLimit);

    const followupCount = followupLeads?.length || 0;
    const newLeadsLimit = dailyLimit - followupCount;

    // New leads
    const { data: newLeads } = await supabase
      .from('leads')
      .select('id, email, name, profession, status')
      .eq('status', 'new')
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: true })
      .limit(newLeadsLimit);

    const nextBatchLeads = [
      ...(followupLeads || []).map(l => ({ ...l, nextEmail: 2 })),
      ...(newLeads || []).map(l => ({ ...l, nextEmail: 1 })),
    ];

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
      totalEmailsSent,
      warmupWeek,
      dailyLimit,
      campaignStarted: !!campaignStart,
      campaignStartDate: campaignStart?.toISOString() || null,
      nextBatch: nextBatch.toISOString(),
      recentEmails: recentEmails || [],
      statusBreakdown: statusCounts,
      nextBatchLeads,
    });
  } catch (error: unknown) {
    console.error('Leads stats error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
