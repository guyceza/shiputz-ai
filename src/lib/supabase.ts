import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Server-side client with service role (for API routes)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl || '', serviceKey || '');
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
