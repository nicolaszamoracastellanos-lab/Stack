"use server";

import { createClient } from "@/lib/supabase/server";
import { recordPactDebtsWith } from "@/lib/pact-record";

/**
 * Evaluate completed pact weeks and record any owed debts into the stakes
 * ledger, as the viewing member (RLS-scoped). Called lazily on group view; the
 * pact cron (/api/pacts/cron) runs the same core hourly with the service role
 * so breaks are recorded and announced even when nobody opens the group.
 */
export async function recordPactDebts(groupId: string): Promise<number> {
  return recordPactDebtsWith(createClient(), groupId);
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
