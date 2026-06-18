"use server";

import { createClient } from "@/lib/supabase/server";

export type RemoveResult = { ok: boolean; error?: string };

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
  if (!group) return { ok: false, error: "group not found" };
  const ownerId = group.owner_id ?? group.created_by;
  if (ownerId !== user.id) return { ok: false, error: "only the owner can remove members" };
  if (targetUserId === user.id) return { ok: false, error: "you cannot remove yourself" };

  // .select() so an RLS-blocked (0-row) delete is detected, never silent.
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .select();
  if (error) return { ok: false, error: `${error.code ?? "ERR"}: ${error.message}` };
  if (!data || data.length === 0) {
    return { ok: false, error: "removal blocked (not the owner, or already gone)" };
  }
  return { ok: true };
}
