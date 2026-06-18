import { createBrowserClient } from "@supabase/ssr";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/config";

/**
 * Supabase client for use inside Client Components ("use client"). Reads the
 * public env vars and manages the auth session in PERSISTENT cookies via
 * @supabase/ssr, with refresh tokens, so the session survives a PWA close
 * (STACK_FIXES2 C).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      auth: { persistSession: true, autoRefreshToken: true },
    },
  );
}
