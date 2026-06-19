/**
 * Public configuration. In Expo, variables prefixed EXPO_PUBLIC_ are inlined
 * into the JS bundle at build time. These point the native app at the SAME
 * Supabase project the web app uses, so accounts, groups and check-ins are
 * shared across web and mobile.
 *
 * Set them in mobile/.env (see .env.example) for local dev, and as EAS build
 * secrets / environment variables for cloud builds.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Canonical web origin, used for share links and deep links. */
export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://www.stack-app.online";

export function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy mobile/.env.example to mobile/.env and fill them in.",
    );
  }
}
