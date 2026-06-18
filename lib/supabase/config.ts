/**
 * Persistent auth-cookie options (STACK_FIXES2 C).
 *
 * Without an explicit maxAge the Supabase auth cookies behave as SESSION cookies
 * that are dropped when the browser/PWA process is killed, logging the user out
 * on every close. A long maxAge (well beyond the refresh-token lifetime, which
 * rotates) makes them persistent so an installed PWA stays logged in across
 * closes and is silently re-authed via the refresh token.
 */
export const AUTH_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 400, // ~400 days
  path: "/",
  sameSite: "lax" as const,
};
