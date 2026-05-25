import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const noStoreFetch: typeof fetch = async (input, init) => {
  return fetch(input, { ...init, cache: 'no-store' });
};

export const supabaseConfig = {
  fetch: noStoreFetch,
} as unknown as Parameters<typeof createClient>[2];

let supabase: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
      );
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig);
  }

  return supabase;
}
