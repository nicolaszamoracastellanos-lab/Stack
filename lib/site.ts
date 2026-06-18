/**
 * Canonical public origin for shareable links (group invites, etc).
 *
 * Prefers the NEXT_PUBLIC_BASE_URL env override when set, and otherwise falls
 * back to the production domain. The fallback is deliberately the real domain,
 * NOT localhost or the *.vercel.app URL, so an invite link always shows
 * stack-app.online regardless of where it was generated.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.stack-app.online"
).replace(/\/$/, "");

/** A full, shareable group-invite link on the canonical domain. */
export function inviteLink(code: string): string {
  return `${SITE_URL}/join/${code}`;
}
