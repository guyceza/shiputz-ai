import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Whop Webhook Handler
// Receives notifications when someone purchases through Whop

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Whop webhook received:', JSON.stringify(body, null, 2));

    const { action, data } = body;

    // Handle successful payment / membership activation
    if (action === 'membership.went_valid' || action === 'payment.succeeded') {
      const email = data?.user?.email || data?.email;
      const discountCode = data?.promo_code || data?.metadata?.discount_code;

      if (email) {
        const supabase = createServiceClient();

        // Mark user as purchased
        const { error: userError } = await supabase
          .from('users')
          .update({
            purchased: true,
            purchased_at: new Date().toISOString(),
          })
          .eq('email', email.toLowerCase());

        if (userError) {
          console.error('Error updating user:', userError);
        } else {
          console.log(`✅ User ${email} marked as purchased`);
        }

        // Mark discount code as used (if provided)
        if (discountCode) {
          const { error: codeError } = await supabase
            .from('discount_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('code', discountCode.toUpperCase());

          if (!codeError) {
            console.log(`✅ Discount code ${discountCode} marked as used`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Whop sends GET to verify webhook URL
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ShiputzAI Whop Webhook' });
}
