import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function getAuthenticatedUser(request: NextRequest): Promise<{ id: string; email?: string | null } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.id) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export async function verifyUserId(request: NextRequest, userId: string): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  return Boolean(user?.id && user.id === userId);
}
