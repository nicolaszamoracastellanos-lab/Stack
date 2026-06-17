"use server";

import { createClient } from "@/lib/supabase/server";
import { evaluatePactDebts, type PactCheckin } from "@/lib/pact-eval";
import type { Group } from "@/lib/types";

/**
 * Evaluate completed pact weeks and record any owed debts into the stakes ledger
 * (Batch 4 §3). Idempotent — safe to call on every group view: the unique
 * (group_id, debtor_user, period_key) constraint dedupes, and already-settled
 * debts are left untouched. Honor system; no money moves. // FUTURE: real money.
 */
export async function recordPactDebts(groupId: string): Promise<number> {
  const supabase = createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (!group) return 0;
  const g = group as Group;
  if (!g.workouts_per_week || !g.stake_value || !g.who_pays) return 0;

  const [{ data: members }, { data: checkins }] = await Promise.all([
    supabase.from("group_members").select("user_id").eq("group_id", groupId),
    supabase
      .from("checkins")
      .select("user_id, created_at, sport")
      .eq("group_id", groupId)
      .limit(5000),
  ]);

  const memberIds = (members ?? []).map((m) => m.user_id as string);
  const debts = evaluatePactDebts(
    g,
    memberIds,
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
  const { data: inserted } = await supabase
    .from("stakes_ledger")
    .upsert(rows, {
      onConflict: "group_id,debtor_user,period_key",
      ignoreDuplicates: true,
    })
    .select("id");
  return inserted?.length ?? 0;
}

/** Mark a debt settled (owed person or any group member confirms). */
export async function settleDebt(debtId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase
    .from("stakes_ledger")
    .update({
      status: "settled",
      settled_at: new Date().toISOString(),
      settled_by: user?.id ?? null,
    })
    .eq("id", debtId);
}
