import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

// Export a getter that initializes on first use
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      const url = getSupabaseUrl();
      const key = getSupabaseAnonKey();
      if (!url || !key) {
        console.warn('Missing Supabase environment variables');
      }
      _supabase = createClient(url, key);
    }
    return (_supabase as any)[prop];
  }
});

// Server-side client with service role (for API routes)
export function createServiceClient() {
  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey);
}

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  purchased: boolean;
  purchased_at: string | null;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  user_email: string;
  discount_percent: number;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}
