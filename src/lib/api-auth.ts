import { NextRequest } from 'next/server';

/**
 * Verify user has a valid auth session.
 * Checks for Supabase auth cookies (sb-*) or Bearer token in Authorization header.
 * Same logic used in /api/visualize.
 */
export function verifyAuth(request: NextRequest): boolean {
  try {
    // Check for Supabase auth cookie
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => c.name.startsWith('sb-'));
    if (hasSupabaseCookie) return true;

    // Check for Bearer token in Authorization header (API clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return true;

    return false;
  } catch {
    return false;
  }
}
