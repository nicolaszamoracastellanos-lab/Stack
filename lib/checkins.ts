import type { SupabaseClient } from "@supabase/supabase-js";
import { CHECKINS_BUCKET } from "@/lib/storage";

/**
 * Delete a check-in POST owned by the user — all the group rows that share its
 * post_id (a multi-group post) — plus its photo from storage. reactions and
 * comments cascade via the FK. Returns the REAL error on failure, never a
 * silent fail (Fix #4).
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
  if (error) return { error: `${error.code ?? "ERR"}: ${error.message}` };
  if (!data || data.length === 0) {
    return {
      error: 'Deleted 0 rows — RLS policy "users delete own checkins" is missing.',
    };
  }
  // Best-effort photo cleanup (the row is already gone either way).
  await supabase.storage.from(CHECKINS_BUCKET).remove([photoPath]);
  return { error: null };
}
