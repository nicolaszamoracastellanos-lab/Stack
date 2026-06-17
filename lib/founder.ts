import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

/**
 * Founder/QA harness gate (STACK_FOUNDER_MODE).
 *
 * SECURITY BOUNDARY: access is decided here, server-side, by the `is_founder`
 * flag on the current session user's own profile — never by a client email
 * check. Every founder page, route handler, and server action MUST pass through
 * one of these before doing anything. `getUserAndProfile` validates the session
 * against the Supabase auth server, so the identity can't be spoofed from the
 * client.
 *
 * `FOUNDER_TOOLS_ENABLED` (default true) is a kill-switch to disable the entire
 * surface instantly without a code change.
 */

export type Founder = { userId: string; profile: Profile };

export function founderToolsEnabled(): boolean {
  return process.env.FOUNDER_TOOLS_ENABLED !== "false";
}

/**
 * Resolve the current user IF they are an authorized founder, else null.
 * Use in route handlers / server actions: `if (!f) return 403`.
 */
export async function getFounder(): Promise<Founder | null> {
  if (!founderToolsEnabled()) return null;
  const { userId, profile } = await getUserAndProfile();
  if (!userId || !profile?.is_founder) return null;
  return { userId, profile };
}

/**
 * Page guard: returns the founder, or redirects non-founders to /home so the
 * route is invisible (and inaccessible) to everyone else.
 */
export async function requireFounderPage(): Promise<Founder> {
  const f = await getFounder();
  if (!f) redirect("/home");
  return f;
}
