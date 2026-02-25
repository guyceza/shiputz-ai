import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Get authenticated user from request cookies (server-side)
 * Returns null if not authenticated
 */
export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // This will throw in middleware, ignore
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('getAuthUser error:', error);
    return null;
  }
}

/**
 * Verify that the authenticated user matches the given email
 */
export async function verifyUserEmail(email: string): Promise<boolean> {
  const user = await getAuthUser();
  if (!user?.email) return false;
  return user.email.toLowerCase() === email.toLowerCase();
}
