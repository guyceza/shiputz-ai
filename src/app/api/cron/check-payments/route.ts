import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/check-payments
 * 
 * Vercel Cron job that checks all pending payments via PayPlus IPN.
 * Safety net for when user closes browser before success page loads.
 * Runs every 5 minutes.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all pending payments (created in last 24 hours)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: pendingPayments, error: fetchError } = await supabase
    .from('pending_payments')
    .select('*')
    .eq('status', 'pending')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(50);

  if (fetchError || !pendingPayments?.length) {
    return NextResponse.json({ 
      checked: 0, 
      updated: 0, 
      message: fetchError ? fetchError.message : 'No pending payments' 
    });
  }

  let checked = 0;
  let updated = 0;
  let expired = 0;

  for (const payment of pendingPayments) {
    checked++;

    try {
      // Query PayPlus IPN for this transaction
      const ipnResponse = await fetch(`${PAYPLUS_BASE_URL}/PaymentPages/ipn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': PAYPLUS_API_KEY!,
          'secret-key': PAYPLUS_SECRET_KEY!,
        },
        body: JSON.stringify({ payment_request_uid: payment.page_request_uid }),
      });

      const ipnData = await ipnResponse.json();
      const tx = ipnData.data || {};
      const statusCode = tx.status_code;
      const isSuccess = String(statusCode) === '000' || String(statusCode) === '0' || tx.status === 'approved';

      if (isSuccess) {
        const email = tx.more_info_1 || tx.customer_email || payment.email;
        const productType = tx.more_info || payment.product_type;

        // Check if user already updated (by webhook or success page)
        const { data: user } = await supabase
          .from('users')
          .select('purchased, vision_subscription')
          .eq('email', email.toLowerCase())
          .single();

        let needsUpdate = false;

        if (productType === 'premium' || productType === 'premium_plus') {
          if (!user?.purchased) needsUpdate = true;
        }
        if (productType === 'vision' || productType === 'premium_plus') {
          if (user?.vision_subscription !== 'active') needsUpdate = true;
        }

        if (needsUpdate) {
          const upsertData: Record<string, unknown> = { email: email.toLowerCase() };

          if (productType === 'premium' || productType === 'premium_plus') {
            upsertData.purchased = true;
            upsertData.purchased_at = new Date().toISOString();
          }
          if (productType === 'vision' || productType === 'premium_plus') {
            upsertData.vision_subscription = 'active';
          }

          await supabase.from('users').upsert(upsertData, { onConflict: 'email' });
          console.log(`✅ Cron: ${email} → ${productType} activated (was missed)`);
          updated++;
        }

        // Mark as completed
        await supabase
          .from('pending_payments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', payment.id);

      } else if (ipnData.results?.status === 'error' || tx.status === 'rejected') {
        // Transaction failed or not found — check if it's old enough to expire
        const ageMinutes = (Date.now() - new Date(payment.created_at).getTime()) / 60000;
        if (ageMinutes > 60) {
          // Expire after 1 hour
          await supabase
            .from('pending_payments')
            .update({ status: 'expired' })
            .eq('id', payment.id);
          expired++;
        }
      }
      // If still pending (not yet paid), leave it for next cron run

    } catch (err) {
      console.error(`Cron check-payments error for ${payment.page_request_uid}:`, err);
    }
  }

  console.log(`Cron check-payments: checked=${checked}, updated=${updated}, expired=${expired}`);

  return NextResponse.json({ checked, updated, expired });
}
