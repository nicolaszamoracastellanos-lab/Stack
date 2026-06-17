"use server";

import { getFounder } from "@/lib/founder";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextWeekStartKey } from "@/lib/week";
import { computeQuotaStreak } from "@/lib/streak-quota";
import type { TierKey } from "@/lib/tiers";

export type SimResult = { ok: boolean; error?: string };

// Profile fields the snapshot captures + restores. Real check-ins, groups,
// reactions, comments, tier_history, etc. are NEVER touched by any of this.
const SNAPSHOT_KEYS = [
  "has_seen_welcome",
  "has_completed_tour",
  "weekly_goal",
  "quota_active_from",
  "preferred_rest_days",
  "tier_confirmed",
  "tier_provisional",
  "founder_sim",
  "display_name",
  "avatar_url",
  "favorite_sport",
  "usual_activity",
  "focus_sport",
  "bio",
] as const;

const snapKey = (userId: string) => `founder_snapshot:${userId}`;

/** Capture the founder's restorable profile state into kv_meta (overwrites). */
async function writeSnapshot(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  profile: Record<string, unknown>,
  takenAt: string,
): Promise<void> {
  const fields: Record<string, unknown> = {};
  for (const k of SNAPSHOT_KEYS) fields[k] = profile[k] ?? null;
  await admin
    .from("kv_meta")
    .upsert(
      { key: snapKey(userId), value: { fields, taken_at: takenAt }, updated_at: takenAt },
      { onConflict: "key" },
    );
}

/** Create a snapshot only if none exists yet (preserves the first real state). */
async function ensureSnapshot(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  profile: Record<string, unknown>,
): Promise<void> {
  const { data } = await admin
    .from("kv_meta")
    .select("key")
    .eq("key", snapKey(userId))
    .maybeSingle();
  if (!data) await writeSnapshot(admin, userId, profile, new Date().toISOString());
}

async function gate() {
  const f = await getFounder();
  if (!f) return { f: null as null, admin: null };
  const admin = createAdminClient();
  return { f, admin };
}

/** Explicit "Snapshot my real state" — overwrites with the current state. */
export async function snapshotState(): Promise<SimResult> {
  const { f, admin } = await gate();
  if (!f) return { ok: false, error: "forbidden" };
  if (!admin) return { ok: false, error: "service role not configured" };
  await writeSnapshot(admin, f.userId, f.profile as unknown as Record<string, unknown>, new Date().toISOString());
  return { ok: true };
}

/** Restore the founder's profile state from the snapshot (incl clearing sim). */
export async function restoreState(): Promise<SimResult> {
  const { f, admin } = await gate();
  if (!f) return { ok: false, error: "forbidden" };
  if (!admin) return { ok: false, error: "service role not configured" };
  const { data } = await admin
    .from("kv_meta")
    .select("value")
    .eq("key", snapKey(f.userId))
    .maybeSingle();
  const fields = (data?.value as { fields?: Record<string, unknown> } | undefined)?.fields;
  if (!fields) return { ok: false, error: "no snapshot to restore" };
  const { error } = await createClient().from("profiles").update(fields).eq("id", f.userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

async function mutateProfile(patch: Record<string, unknown>): Promise<SimResult> {
  const { f, admin } = await gate();
  if (!f) return { ok: false, error: "forbidden" };
  if (!admin) return { ok: false, error: "service role not configured (needed to snapshot)" };
  await ensureSnapshot(admin, f.userId, f.profile as unknown as Record<string, unknown>);
  const { error } = await createClient().from("profiles").update(patch).eq("id", f.userId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// ---- §5 simulator (founder's own profile only; snapshot first) ----

export async function setGoalSim(q: number): Promise<SimResult> {
  const goal = Math.max(1, Math.min(7, Math.round(q)));
  const patch: Record<string, unknown> = { weekly_goal: goal };
  const f = await getFounder();
  if (f && !f.profile.quota_active_from) {
    patch.quota_active_from = nextWeekStartKey(new Date());
  }
  return mutateProfile(patch);
}

export async function setTierSim(
  confirmed: TierKey | null,
  provisional: TierKey | null,
): Promise<SimResult> {
  return mutateProfile({ tier_confirmed: confirmed, tier_provisional: provisional });
}

export async function setStreakOverride(
  count: number,
  state: "alive" | "at-risk" | "broken",
): Promise<SimResult> {
  return mutateProfile({
    founder_sim: { active: true, count: Math.max(0, Math.round(count)), state },
  });
}

export async function clearStreakOverride(): Promise<SimResult> {
  // A clear isn't destructive; still routed through mutateProfile for the gate.
  return mutateProfile({ founder_sim: { active: false } });
}

// ---- §4 onboarding/tour (replay = non-destructive flag flips) ----

export async function replayWelcome(): Promise<SimResult> {
  return mutateProfile({ has_seen_welcome: false });
}

export async function replayTour(): Promise<SimResult> {
  return mutateProfile({ has_completed_tour: false });
}

/**
 * Full onboarding reset (guarded, secondary). Clears the REQUIRED profile
 * identity fields so the real required onboarding runs again on next load, and
 * replays the welcome + tour. Does NOT touch check-ins, streak, groups, or
 * tier_history. Snapshot is taken first; one-tap restore brings it all back.
 */
export async function resetOnboarding(): Promise<SimResult> {
  return mutateProfile({
    display_name: null,
    avatar_url: null,
    favorite_sport: null,
    usual_activity: null,
    focus_sport: null,
    has_seen_welcome: false,
    has_completed_tour: false,
  });
}

// ---- §5 Q=5 worked-example regression check (pure; no mutation) ----

export type Q5Result = {
  pass: boolean;
  wed: { state: string; slack: number };
  thu: { state: string };
};

/**
 * Replays the spec's Q=5 scenario against the LIVE engine: a prior perfect week,
 * then skip Mon+Tue (→ at-risk Wed, slack 0), then skip Wed (→ break, Thu shows
 * broken). Guards the core mechanic. Uses fixed dates, independent of real data.
 */
export async function runQ5Check(): Promise<{ ok: boolean; error?: string } & Partial<Q5Result>> {
  const f = await getFounder();
  if (!f) return { ok: false, error: "forbidden" };

  const at = (d: string) => `${d}T08:00:00`;
  const noon = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return new Date(y, m - 1, dd, 12, 0, 0);
  };
  const priorWeek = ["08", "09", "10", "11", "12", "13", "14"].map((d) => at(`2026-06-${d}`));
  const opts = { weeklyGoal: 5, quotaActiveFromKey: "2026-06-08" };

  const wed = computeQuotaStreak(priorWeek, { ...opts, now: noon("2026-06-17") });
  const thu = computeQuotaStreak(priorWeek, { ...opts, now: noon("2026-06-18") });
  const pass =
    wed.state === "at-risk" && wed.slack === 0 && thu.state === "broken" && thu.count === 0;

  return {
    ok: true,
    pass,
    wed: { state: wed.state, slack: wed.slack },
    thu: { state: thu.state },
  };
}
