import type { SupabaseClient } from "@supabase/supabase-js";
import { CHECKINS_BUCKET } from "@/lib/storage";

/**
 * Delete a check-in POST owned by the user — all the group rows that share its
 * post_id (a multi-group post) — plus its photo from storage. reactions and
 * comments cascade via the FK. Never a silent fail (Fix #4): failures are
 * logged with full detail and reported to the caller as a translatable flag,
 * never as a raw error string a user could see.
 */
export async function deleteCheckinPost(
  supabase: SupabaseClient,
  {
    id,
    postId,
    photoPath,
    userId,
  }: { id: string; postId: string | null; photoPath: string; userId: string },
): Promise<{ error: string | null }> {
  let q = supabase.from("checkins").delete().eq("user_id", userId);
  q = postId ? q.eq("post_id", postId) : q.eq("id", id);
  // .select() so a silent RLS block (0 rows, no error) is detectable.
  const { data, error } = await q.select();
  if (error) {
    console.error("deleteCheckinPost:", error.code, error.message);
    return { error: "failed" };
  }
  if (!data || data.length === 0) {
    // 0 rows with no error means RLS blocked the delete ("users delete own
    // checkins" policy missing or changed) — surfaced to devs via the log.
    console.error("deleteCheckinPost: deleted 0 rows (RLS block?)", { id, postId });
    return { error: "failed" };
  }
  // Best-effort photo cleanup (the row is already gone either way).
  await supabase.storage.from(CHECKINS_BUCKET).remove([photoPath]);
  return { error: null };
}
