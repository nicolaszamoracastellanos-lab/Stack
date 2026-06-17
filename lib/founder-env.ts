import { createAdminClient } from "@/lib/supabase/admin";
import { getFounder } from "@/lib/founder";

/**
 * Environment / build status for the founder panel (§4.6). Founder-gated and
 * server-only. Reports PRESENCE of secrets (booleans) — never the values — and
 * the cron's last run from kv_meta via the service-role admin client.
 */
export type FounderEnv = {
  commit: string;
  branch: string | null;
  environment: string;
  supabaseRef: string | null;
  vapidPublic: boolean;
  vapidPrivate: boolean;
  serviceRole: boolean;
  cronSecret: boolean;
  cronLastRun: { at: string; candidates: number; fired: number } | null;
};

export async function getFounderEnv(): Promise<FounderEnv | null> {
  // Defense in depth: re-verify the gate even though callers are gated.
  const f = await getFounder();
  if (!f) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseRef =
    url.match(/https?:\/\/([a-z0-9]+)\.supabase/i)?.[1] ?? null;

  let cronLastRun: FounderEnv["cronLastRun"] = null;
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("kv_meta")
      .select("value")
      .eq("key", "cron_last_run")
      .maybeSingle();
    const v = data?.value as
      | { at: string; candidates: number; fired: number }
      | undefined;
    cronLastRun = v ?? null;
  }

  return {
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    supabaseRef,
    // NEXT_PUBLIC_VAPID_PUBLIC_KEY is non-secret; the rest are presence-only.
    vapidPublic: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    cronSecret: !!process.env.CRON_SECRET,
    cronLastRun,
  };
}
