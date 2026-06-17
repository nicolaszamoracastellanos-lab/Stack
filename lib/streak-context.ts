import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { computeQuotaStreak, type QuotaStreak } from "@/lib/streak-quota";
import { evaluateTiersFromHistory, currentWeekFreq } from "@/lib/tier-eval";
import { tierProjection, type TierKey, type TierProjection } from "@/lib/tiers";
import { nextWeekStartKey } from "@/lib/week";

export type StreakContext = {
  /** Goal not set yet → show the one-screen goal prompt (skippable). */
  needsGoal: boolean;
  weeklyGoal: number | null;
  quotaActiveFromKey: string | null;
  preferredRestDays: number[];
  /** Server-seeded streak (client recomputes with local "today"). */
  streak: QuotaStreak;
  confirmedTier: TierKey | null;
  provisionalTier: TierKey | null;
  currentWeekFreq: number;
  projection: TierProjection;
  /**
   * Founder simulator override (STACK_FOUNDER_MODE). Set ONLY for is_founder
   * rows; when present the client uses it verbatim and skips recomputation, so
   * the badge/at-risk UI reflects a forced state. Always null for normal users.
   */
  streakOverride: { count: number; state: QuotaStreak["state"] } | null;
};

/**
 * Load the quota-streak + tier context for a user, and persist any tier change
 * (Batch 5 Stage C). Tier writes are gated on an actual change so the common
 * load does no writes; on a month boundary it updates the profile, records the
 * confirmed month in tier_history, and snapshots completed weeks to
 * weekly_stats. All persistence is best-effort and never blocks the render.
 */
export async function loadStreakContext(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile | null,
  personalDates: Array<string | number | Date>,
  restDayKeys: string[],
  now: Date = new Date(),
): Promise<StreakContext> {
  const weeklyGoal = profile?.weekly_goal ?? null;
  const quotaActiveFromKey = profile?.quota_active_from ?? null;
  const preferredRestDays = profile?.preferred_rest_days ?? [];

  const streak = computeQuotaStreak(personalDates, {
    weeklyGoal,
    quotaActiveFromKey,
    restDayKeys,
    now,
  });

  let confirmedTier = (profile?.tier_confirmed ?? null) as TierKey | null;
  let provisionalTier = (profile?.tier_provisional ?? null) as TierKey | null;
  const weekFreqNow = currentWeekFreq(personalDates, now);

  if (weeklyGoal != null && quotaActiveFromKey) {
    const evalRes = evaluateTiersFromHistory(personalDates, quotaActiveFromKey, now);
    const changed =
      evalRes.confirmed !== confirmedTier ||
      evalRes.provisional !== provisionalTier;
    confirmedTier = evalRes.confirmed;
    provisionalTier = evalRes.provisional;

    if (changed) {
      // Persist on the rare change path. Awaited so serverless doesn't cancel
      // the writes mid-flight; errors are swallowed (display already correct).
      try {
        const writes: PromiseLike<unknown>[] = [
          supabase
            .from("profiles")
            .update({
              tier_confirmed: confirmedTier,
              tier_provisional: provisionalTier,
            })
            .eq("id", userId),
        ];

        if (evalRes.weekFreqs.length) {
          writes.push(
            supabase.from("weekly_stats").upsert(
              evalRes.weekFreqs.map((w) => ({
                user_id: userId,
                week_start: w.weekStart,
                workouts_count: w.freq,
                quota_met: w.freq >= weeklyGoal,
              })),
              { onConflict: "user_id,week_start" },
            ),
          );
        }

        // Record the confirmed month (latest complete 4-week block).
        const blocks = Math.floor(evalRes.weekFreqs.length / 4);
        if (confirmedTier && blocks >= 1) {
          const block = evalRes.weekFreqs.slice((blocks - 1) * 4, blocks * 4);
          const avg = block.reduce((a, b) => a + b.freq, 0) / block.length;
          writes.push(
            supabase.from("tier_history").upsert(
              {
                user_id: userId,
                month_start: block[0].weekStart,
                avg_frequency: Number(avg.toFixed(2)),
                tier: confirmedTier,
              },
              { onConflict: "user_id,month_start" },
            ),
          );
        }

        await Promise.all(writes);
      } catch {
        /* best-effort — the rendered values are already fresh */
      }
    }
  }

  // Founder simulator override — founder rows only; never set for normal users.
  let streakOverride: StreakContext["streakOverride"] = null;
  const sim = profile?.is_founder ? profile.founder_sim : null;
  if (sim?.active && typeof sim.count === "number" && sim.state) {
    streakOverride = { count: sim.count, state: sim.state };
  }

  return {
    needsGoal: weeklyGoal == null,
    weeklyGoal,
    quotaActiveFromKey,
    preferredRestDays,
    streak: streakOverride
      ? { ...streak, count: streakOverride.count, state: streakOverride.state }
      : streak,
    confirmedTier,
    provisionalTier,
    currentWeekFreq: weekFreqNow,
    projection: tierProjection(weekFreqNow, confirmedTier),
    streakOverride,
  };
}

/** The Monday quota rules start from when a goal is set now (always next week,
 * so conversion never breaks the current week). */
export function nextQuotaActivationKey(now: Date = new Date()): string {
  return nextWeekStartKey(now);
}
