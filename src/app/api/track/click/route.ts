import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('e');
  const url = request.nextUrl.searchParams.get('url') || 'https://shipazti.com';
  const seq = request.nextUrl.searchParams.get('seq') || '1';

  // Log the click
  if (email) {
    try {
      const supabase = createServiceClient();
      await supabase.from('lead_emails').update({
        status: 'clicked',
        updated_at: new Date().toISOString(),
      }).eq('email', email).eq('sequence_number', parseInt(seq)).eq('status', 'opened');
      
      // Also try updating from 'delivered' or 'sent' status
      await supabase.from('lead_emails').update({
        status: 'clicked',
        updated_at: new Date().toISOString(),
      }).eq('email', email).eq('sequence_number', parseInt(seq)).in('status', ['delivered', 'sent']);
    } catch (err) {
      console.error('Click tracking error:', err);
    }
  }

  // Redirect to actual URL
  return NextResponse.redirect(url, { status: 302 });
}
