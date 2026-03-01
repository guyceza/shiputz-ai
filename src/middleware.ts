import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // PayPlus redirects via POST to payment-success/payment-failed
  // Next.js pages only handle GET, so we redirect POST → GET
  if (request.method === 'POST' && 
      (request.nextUrl.pathname === '/payment-success' || request.nextUrl.pathname === '/payment-failed')) {
    
    const url = request.nextUrl.clone();
    
    // Try to extract params from POST body and add to URL
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const body = await request.text();
        const params = new URLSearchParams(body);
        params.forEach((value, key) => {
          if (!url.searchParams.has(key)) {
            url.searchParams.set(key, value);
          }
        });
      }
    } catch (e) {
      // Ignore parse errors
    }

    return NextResponse.redirect(url, 303);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/payment-success', '/payment-failed'],
};
