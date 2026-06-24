"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluatePactDebts, type PactCheckin } from "@/lib/pact-eval";
import { notifyMany } from "@/lib/notifications";
import { nameOf } from "@/lib/feed";
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
    .select("id, debtor_user");

  const newCount = inserted?.length ?? 0;
  if (newCount > 0) {
    // A real break just landed — tell the WHOLE team (including the breaker).
    // Idempotent insert means this only fires the first time a break is seen.
    await notifyPactBreaks(
      groupId,
      g,
      memberIds,
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

/**
 * Approve a pending rule-change proposal (§5). Adds the caller to approvals and,
 * once every group member has approved (unanimous), commits the change to the
 * group via the SECURITY DEFINER apply function.
 */
export async function approveProposal(proposalId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: prop } = await supabase
    .from("rule_change_proposals")
    .select("approvals, group_id, status")
    .eq("id", proposalId)
    .single();
  if (!prop || prop.status !== "pending") return;

  const approvals: string[] = (prop.approvals as string[]) ?? [];
  const already = approvals.includes(user.id);
  if (!already) {
    await supabase
      .from("rule_change_proposals")
      .update({ approvals: [...approvals, user.id] })
      .eq("id", proposalId);
  }

  const { count } = await supabase
    .from("group_members")
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", prop.group_id);
  const newCount = already ? approvals.length : approvals.length + 1;
  if (count != null && newCount >= count) {
    await supabase.rpc("apply_rule_proposal", { _proposal_id: proposalId });
  }
}

/** Reject a proposal — any single rejection keeps the rule as-is. */
export async function rejectProposal(proposalId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("rule_change_proposals")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", proposalId);
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
