import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET - Check unsubscribe status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Check newsletter_subscribers table - if unsubscribed_at is set, they're unsubscribed
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('unsubscribed_at')
      .eq('email', email.toLowerCase())
      .single();

    return NextResponse.json({ 
      unsubscribed: data?.unsubscribed_at !== null 
    });
  } catch (error) {
    // If no record exists, they're not unsubscribed
    return NextResponse.json({ unsubscribed: false });
  }
}

// POST - Unsubscribe user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const normalizedEmail = email.toLowerCase();
    
    // Try to update existing record first
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // Update existing record - set unsubscribed_at
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          unsubscribed_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      if (error) {
        console.error('Unsubscribe update error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
      }
    } else {
      // Create new record with unsubscribed_at set
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ 
          email: normalizedEmail,
          unsubscribed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Unsubscribe insert error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
