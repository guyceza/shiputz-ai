import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser client for auth - lazy initialization
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    // Read env vars at runtime, not at module load time
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
      'https://vghfcdtzywbmlacltnjp.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGZjZHR6eXdibWxhY2x0bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjE3MTcsImV4cCI6MjA4NzIzNzcxN30.EUwH73NbfQ3eeAbu32YicJlHrxngf4WGgi2E6mNOnhw';
    
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// Sign up with email and password
export async function signUp(email: string, password: string, name?: string) {
  const client = getSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  
  if (error) throw error;
  return data;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Sign in with Google
export async function signInWithGoogle() {
  const client = getSupabase();
  
  // Sign out first to clear any existing session
  await client.auth.signOut();
  
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : 'https://shipazti.com/auth/callback',
      queryParams: {
        prompt: 'select_account', // Force Google to show account picker
      },
    },
  });
  
  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// Get current user
export async function getCurrentUser() {
  const client = getSupabase();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

// Get current session
export async function getSession() {
  try {
    const client = getSupabase();
    const { data: { session } } = await client.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getSupabase();
  return client.auth.onAuthStateChange(callback);
}
