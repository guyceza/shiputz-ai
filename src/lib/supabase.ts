import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGZjZHR6eXdibWxhY2x0bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjE3MTcsImV4cCI6MjA4NzIzNzcxN30.EUwH73NbfQ3eeAbu32YicJlHrxngf4WGgi2E6mNOnhw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (for API routes)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGZjZHR6eXdibWxhY2x0bmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MTcxNywiZXhwIjoyMDg3MjM3NzE3fQ.HO-ka0H8J0hH1pCHgzDGiiH0ajOKeyFXaDSKJb8LUog';
  return createClient(supabaseUrl, serviceKey);
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
