import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Redirect www → non-www (fixes split analytics + SEO)
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.replace('www.', '');
    const response = NextResponse.redirect(url, 301);
    setGiftCampaignCookie(request, response);
    return response;
  }

  if (request.nextUrl.pathname === '/editor3d' || request.nextUrl.pathname.startsWith('/editor3d/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/floorplan';
    const response = NextResponse.redirect(url, 307);
    setGiftCampaignCookie(request, response);
    return response;
  }

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

    const response = NextResponse.redirect(url, 303);
    setGiftCampaignCookie(request, response);
    return response;
  }

  const response = NextResponse.next();
  setGiftCampaignCookie(request, response);
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  return response;
}

function setGiftCampaignCookie(request: NextRequest, response: NextResponse) {
  const gift = request.nextUrl.searchParams.get('gift');
  if (gift !== 'shavuot20') return;

  response.cookies.set('shiputzai_gift_campaign', 'shavuot_2026', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 21,
  });
}

export const config = {
  // Match all paths for www redirect, plus specific paths for PayPlus
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$).*)'],
};
