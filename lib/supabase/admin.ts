import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for server-only push fan-out (Batch 5 D).
 * Bypasses RLS, so it is ONLY ever used inside server route handlers to resolve
 * recipients and their subscriptions for a notification — never exposed to the
 * client. Returns null if the service key isn't configured (push simply stays
 * inactive, app unaffected).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
