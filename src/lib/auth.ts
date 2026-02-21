import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser client for auth - only create if we have the URL
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!supabase) {
    throw new Error('Supabase client not initialized - missing environment variables');
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
