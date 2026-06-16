import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";
import type { Group } from "@/lib/types";

/**
 * Server-side: all groups the current user belongs to, most recently joined
 * first.
 *
 * IMPORTANT (Fix #3): filter by `user_id = me`. RLS on group_members is
 * `is_group_member(group_id)` — it returns EVERY member's row in every group
 * you're in (needed for leaderboards), so WITHOUT this filter the join yields
 * one row per (group, member) and each group is duplicated by its member count.
 */
export async function getUserGroups(): Promise<Group[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("group_members")
    .select("group:groups(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (error || !data) return [];
  // The join nests the group under `group`; flatten and drop any nulls.
  return data
    .map((row) => (row as unknown as { group: Group | null }).group)
    .filter((g): g is Group => Boolean(g));
}

/**
 * Server-side: resolve the active group for home. Prefers the cookie choice (if
 * the user is still a member), otherwise falls back to their most recent group.
 * Returns null when the user is in no groups (empty-state on home).
 */
export async function getActiveGroup(): Promise<{
  active: Group | null;
  groups: Group[];
}> {
  const groups = await getUserGroups();
  if (groups.length === 0) return { active: null, groups };

  const preferred = cookies().get(ACTIVE_GROUP_COOKIE)?.value;
  const active =
    groups.find((g) => g.id === preferred) ?? groups[0];
  return { active, groups };
}
