import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// Public project identifiers only. Never put SUPABASE_SECRET_KEY in this module.
export const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pilszwojwjgmqlzqrzni.supabase.co';
export const authKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_xYEgahHOZg-RI6Jh57qaMw_C3hAy4_E';
let client: SupabaseClient | undefined;
export function getAuthClient() {
  return client ??= createClient(authUrl, authKey);
}
