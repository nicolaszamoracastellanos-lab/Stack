"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * `error` is a translatable code, not display text — the UI maps it to
 * bilingual copy. Raw DB detail stays in the server log.
 */
export type RemoveResult = {
  ok: boolean;
  error?: "unauthorized" | "not_owner" | "self" | "failed";
};

/**
 * Remove a member from a group (STACK_FIXES2 D). Owner-only, enforced
 * SERVER-SIDE here AND by RLS ("owner removes members"). Deletes the membership
 * row (revoking future access) but KEEPS the member's historical check-ins.
 * Never a silent failure: an unauthorized or no-op delete returns an error.
 */
export async function removeMember(
  groupId: string,
  targetUserId: string,
): Promise<RemoveResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Server-side owner check (defense in depth on top of RLS). owner_id falls
  // back to created_by for groups predating the owner_id backfill.
  const { data: group } = await supabase
    .from("groups")
    .select("owner_id, created_by")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return { ok: false, error: "failed" };
  const ownerId = group.owner_id ?? group.created_by;
  if (ownerId !== user.id) return { ok: false, error: "not_owner" };
  if (targetUserId === user.id) return { ok: false, error: "self" };

  // .select() so an RLS-blocked (0-row) delete is detected, never silent.
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .select();
  if (error) {
    console.error("removeMember:", error.code, error.message);
    return { ok: false, error: "failed" };
  }
  if (!data || data.length === 0) {
    console.error("removeMember: deleted 0 rows (RLS block?)", { groupId, targetUserId });
    return { ok: false, error: "failed" };
  }
  return { ok: true };
}
