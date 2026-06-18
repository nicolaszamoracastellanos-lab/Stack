"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Group chat reads (STACK_BATCH6 Stage 3). Unread = messages from OTHER members
 * created after the user's last_read_at for that group.
 */

/** Unread chat counts per group for the current user. */
export async function getUnreadChatByGroup(
  groupIds: string[],
): Promise<Record<string, number>> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || groupIds.length === 0) return {};

  const { data: reads } = await supabase
    .from("group_chat_reads")
    .select("group_id, last_read_at")
    .eq("user_id", user.id)
    .in("group_id", groupIds);
  const lastRead = new Map(
    (reads ?? []).map((r) => [r.group_id as string, r.last_read_at as string]),
  );

  const epoch = "1970-01-01T00:00:00Z";
  const counts = await Promise.all(
    groupIds.map(async (gid) => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("group_id", gid)
        .neq("user_id", user.id)
        .gt("created_at", lastRead.get(gid) ?? epoch);
      return [gid, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(counts);
}

/** Mark a group's chat as read up to now (called on opening the chat). */
export async function markChatRead(groupId: string): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from("group_chat_reads").upsert(
    { user_id: user.id, group_id: groupId, last_read_at: new Date().toISOString() },
    { onConflict: "user_id,group_id" },
  );
  return { ok: !error };
}
