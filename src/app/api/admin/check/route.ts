import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// List of admin emails (should be in env variable in production)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'guyceza@gmail.com').split(',').map(e => e.trim().toLowerCase());

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
