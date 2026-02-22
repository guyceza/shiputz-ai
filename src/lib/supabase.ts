import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized clients to avoid build-time errors
let _supabaseClient: SupabaseClient | null = null;
let _serviceClient: SupabaseClient | null = null;

function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

// Get public Supabase client (lazy init)
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    const { url, anonKey } = getEnvVars();
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    _supabaseClient = createClient(url, anonKey);
  }
  return _supabaseClient;
}

// Server-side client with service role (for API routes) - lazy init
export function createServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    const { url, serviceKey } = getEnvVars();
    if (!url || !serviceKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    _serviceClient = createClient(url, serviceKey);
  }
  return _serviceClient;
}

// For backward compatibility - use getSupabaseClient() instead
export const supabase = {
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()); },
  get auth() { return getSupabaseClient().auth; },
  get storage() { return getSupabaseClient().storage; },
  get functions() { return getSupabaseClient().functions; },
  get realtime() { return getSupabaseClient().realtime; },
  get rpc() { return getSupabaseClient().rpc.bind(getSupabaseClient()); },
};

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
