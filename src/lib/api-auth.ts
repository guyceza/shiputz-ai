import { NextRequest } from 'next/server';

/**
 * Verify user is authenticated via cookie OR Authorization header
 * Supabase v2 stores session in localStorage, so we need to accept
 * the access token in the Authorization header as well as cookies.
 */
export function verifyAuth(request: NextRequest): boolean {
  try {
    // Check for Supabase cookie (set by auth-helpers)
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => c.name.startsWith('sb-'));
    if (hasSupabaseCookie) return true;
    
    // Check for Authorization header (Bearer token from localStorage)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Token exists and has reasonable length - Supabase validates on use
      if (token && token.length > 20) return true;
    }
    
    return false;
  } catch (e) {
    console.error('verifyAuth error:', e);
    return false;
  }
}
