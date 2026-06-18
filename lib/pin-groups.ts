"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Set the user's pinned groups (STACK_BATCH6 2.2): an ordered list capped at 3,
 * restricted to groups the user actually belongs to. Updates the user's own
 * profile row via RLS.
 */
export async function setPinnedGroups(ids: string[]): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Keep only groups the user is in, de-duped, capped at 3, order preserved.
  const { data: mem } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);
  const allowed = new Set((mem ?? []).map((m) => m.group_id as string));
  const seen = new Set<string>();
  const clean = ids
    .filter((id) => allowed.has(id) && !seen.has(id) && (seen.add(id), true))
    .slice(0, 3);

  const { error } = await supabase
    .from("profiles")
    .update({ pinned_groups: clean })
    .eq("id", user.id);
  return { ok: !error };
}
