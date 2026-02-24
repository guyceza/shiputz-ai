import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientId } from '@/lib/rate-limit';

// List of admin emails
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'guyceza@gmail.com').split(',').map(e => e.trim().toLowerCase());

// Bug #2 fix: Add rate limiting to prevent email enumeration attacks
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 20 checks per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 20, 60000);
    if (!rateLimit.success) {
      // Don't reveal rate limit was hit - just return false
      return NextResponse.json({ isAdmin: false });
    }

    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ isAdmin: false });
    }

    // Validate email format to prevent enumeration
    if (!email.includes('@') || email.length < 5 || email.length > 254) {
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
    // Rate limit: 20 checks per minute per IP
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ isAdmin: false });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ isAdmin: false });
    }

    // Validate email format
    if (!email.includes('@') || email.length < 5 || email.length > 254) {
      return NextResponse.json({ isAdmin: false });
    }

    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
