import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';

// Resend webhook events we care about
// https://resend.com/docs/dashboard/webhooks/introduction
type ResendEvent = {
  type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.bounced' | 'email.complained' | 'email.delivery_delayed';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    const event: ResendEvent = await request.json();
    
    if (!event?.type || !event?.data?.email_id) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const resendId = event.data.email_id;
    const eventType = event.type;

    // Map Resend event types to our status
    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.opened': 'opened',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.delivery_delayed': 'delayed',
    };

    const newStatus = statusMap[eventType];
    if (!newStatus) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = createServiceClient();

    // Update lead_emails status by resend_id
    const { data: updated, error } = await supabase
      .from('lead_emails')
      .update({ status: newStatus })
      .eq('resend_id', resendId)
      .select('id, email, lead_id');

    if (error) {
      console.error('Webhook DB error:', error);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    // If bounced or complained, mark lead as problematic
    if ((newStatus === 'bounced' || newStatus === 'complained') && updated && updated.length > 0) {
      const leadId = updated[0].lead_id;
      const email = updated[0].email;
      
      if (newStatus === 'complained') {
        // Treat spam complaint as unsubscribe
        await supabase
          .from('leads')
          .update({ 
            unsubscribed_at: new Date().toISOString(),
            status: 'unsubscribed'
          })
          .eq('id', leadId);
      } else if (newStatus === 'bounced') {
        await supabase
          .from('leads')
          .update({ status: 'bounced' })
          .eq('id', leadId);
      }
      
      console.log(`Webhook: ${eventType} for ${email} (lead ${leadId})`);
    }

    return NextResponse.json({ ok: true, updated: updated?.length || 0 });
  } catch (err) {
    console.error('Resend webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
