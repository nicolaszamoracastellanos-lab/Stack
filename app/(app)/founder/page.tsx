import { requireFounderPage } from "@/lib/founder";
import { getFounderEnv } from "@/lib/founder-env";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeQuotaStreak } from "@/lib/streak-quota";
import { FounderPanel } from "@/components/founder/FounderPanel";

// Founder/QA harness (STACK_FOUNDER_MODE). Server-gated: non-founders are
// redirected to /home by requireFounderPage before anything renders.
export default async function FounderPage() {
  const { userId, profile } = await requireFounderPage();
  const env = await getFounderEnv();
  const supabase = createClient();

  const [subRes, ckRes, restRes] = await Promise.all([
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase.from("checkins").select("created_at").eq("user_id", userId).limit(400),
    supabase.from("rest_days").select("day").eq("user_id", userId),
  ]);

  // REAL engine state (raw — ignores the founder_sim display override).
  const dates = (ckRes.data ?? []).map((r) => r.created_at as string);
  const restDays = (restRes.data ?? []).map((r) => r.day as string);
  const real = computeQuotaStreak(dates, {
    weeklyGoal: profile.weekly_goal,
    quotaActiveFromKey: profile.quota_active_from,
    restDayKeys: restDays,
  });
  const engine = {
    weeklyGoal: profile.weekly_goal,
    quotaActiveFrom: profile.quota_active_from,
    count: real.count,
    state: real.state,
    weekWorkouts: real.weekWorkouts,
    needed: real.needed,
    daysLeftInclToday: real.daysLeftInclToday,
    slack: real.slack,
    reachable: real.slack >= 0,
  };

  // Snapshot presence (kv_meta via admin, after the gate above).
  let snapshotTakenAt: string | null = null;
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("kv_meta")
      .select("value")
      .eq("key", `founder_snapshot:${userId}`)
      .maybeSingle();
    snapshotTakenAt =
      (data?.value as { taken_at?: string } | undefined)?.taken_at ?? null;
  }

  return (
    <FounderPanel
      userId={userId}
      isFounder={profile.is_founder}
      env={env}
      subCount={subRes.count ?? 0}
      engine={engine}
      tierConfirmed={(profile.tier_confirmed as never) ?? null}
      tierProvisional={(profile.tier_provisional as never) ?? null}
      simActive={!!profile.founder_sim?.active}
      snapshotTakenAt={snapshotTakenAt}
    />
  );
}
