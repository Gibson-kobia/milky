import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

const noStoreFetch: typeof fetch = async (input, init) => {
  return fetch(input, { ...init, cache: 'no-store' });
};

export const supabaseConfig = {
  fetch: noStoreFetch,
} as unknown as Parameters<typeof createClient>[2];

const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  supabaseConfig
);

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}
