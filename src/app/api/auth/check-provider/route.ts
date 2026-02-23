import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Check which auth provider a user registered with
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('users')
      .select('auth_provider')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) {
      // User doesn't exist - they can register with any method
      return NextResponse.json({ exists: false, provider: null });
    }

    return NextResponse.json({ 
      exists: true, 
      provider: data.auth_provider || 'email' 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
