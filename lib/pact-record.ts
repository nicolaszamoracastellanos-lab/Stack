import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluatePactDebts, type PactCheckin, type PactMember } from "@/lib/pact-eval";
import { notifyMany } from "@/lib/notifications";
import { nameOf } from "@/lib/feed";
import type { Group } from "@/lib/types";

/**
 * Evaluate completed pact weeks for a group and record any owed debts into the
 * stakes ledger (Batch 4 §3). Idempotent — safe to call repeatedly: the unique
 * (group_id, debtor_user, period_key) constraint dedupes, and already-settled
 * debts are left untouched. Honor system; no money moves. // FUTURE: real money.
 *
 * Client-agnostic core: the group-view server action passes the caller's
 * RLS-scoped client; the pact cron passes the service-role client.
 */
export async function recordPactDebtsWith(
  client: SupabaseClient,
  groupId: string,
): Promise<number> {
  const { data: group } = await client
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (!group) return 0;
  const g = group as Group;
  if (!g.workouts_per_week || !g.stake_value || !g.who_pays) return 0;

  const [{ data: memberRows }, { data: checkins }] = await Promise.all([
    client
      .from("group_members")
      .select("user_id, profile:profiles(timezone)")
      .eq("group_id", groupId),
    client
      .from("checkins")
      .select("user_id, created_at, sport")
      .eq("group_id", groupId)
      .limit(5000),
  ]);

  // Each member evaluated in their own timezone (falls back to server frame).
  const members: PactMember[] = (memberRows ?? []).map((r) => ({
    id: (r as { user_id: string }).user_id,
    tz:
      (r as unknown as { profile: { timezone: string | null } | null }).profile
        ?.timezone ?? null,
  }));

  const debts = evaluatePactDebts(
    g,
    members,
    (checkins ?? []) as PactCheckin[],
    new Date(),
  );
  if (debts.length === 0) return 0;

  const rows = debts.map((d) => ({
    group_id: groupId,
    debtor_user: d.debtor_user,
    owed_to: null,
    reason: d.period_key, // week start; the UI renders "Missed week of <date>"
    stake_description: d.stake_description,
    status: "outstanding",
    period_key: d.period_key,
  }));

  // ignoreDuplicates → .select() returns only the NEWLY inserted debts.
  const { data: inserted } = await client
    .from("stakes_ledger")
    .upsert(rows, {
      onConflict: "group_id,debtor_user,period_key",
      ignoreDuplicates: true,
    })
    .select("id, debtor_user");

  const newCount = inserted?.length ?? 0;
  if (newCount > 0) {
    // A real break just landed — tell the WHOLE team (including the breaker).
    // Idempotent insert means this only fires the first time a break is seen.
    await notifyPactBreaks(
      groupId,
      g,
      members.map((m) => m.id),
      Array.from(new Set((inserted ?? []).map((r) => r.debtor_user as string))),
    );
  }
  return newCount;
}

/**
 * Notify every group member that a pact was broken. Best-effort: needs the
 * service role (writes other users' notification rows) and silently does
 * nothing if it isn't configured. One notification per distinct breaker, even
 * if they missed several weeks at once.
 */
async function notifyPactBreaks(
  groupId: string,
  group: Group,
  memberIds: string[],
  breakerIds: string[],
): Promise<void> {
  const admin = createAdminClient();
  if (!admin || breakerIds.length === 0) return;

  const { data: profs } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .in("id", breakerIds);
  const nameById = new Map(
    (profs ?? []).map((p) => [
      p.id as string,
      nameOf({ username: p.username as string, display_name: p.display_name as string | null }),
    ]),
  );

  for (const breakerId of breakerIds) {
    await notifyMany(admin, memberIds, {
      type: "pact_broken",
      groupId,
      data: {
        name: nameById.get(breakerId) ?? "Someone",
        group: group.name,
        stake: group.stake_value ?? "",
      },
      url: `/groups/${groupId}`,
    });
  }
}
