import type { SupabaseClient } from "@supabase/supabase-js";

export const CHECKINS_BUCKET = "checkins";

/**
 * Storage object key for a check-in photo: <user_id>/<filename>.
 * One uploaded photo can back a check-in in several groups (multi-group post).
 * Upload is authorized by foldername()[1] = user_id; READ is authorized by
 * membership in any group whose check-in references this object (see the
 * storage RLS policy in supabase/migrations).
 */
export function checkinPhotoPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

/**
 * The `checkins` bucket is PRIVATE, so we never store public URLs. We persist
 * the object path in checkins.photo_url and mint a short-lived signed URL at
 * display time. Tradeoff vs. a public bucket: a bit more work on read, but proof
 * photos never leak to anyone outside the group.
 */
export async function getSignedPhotoUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(CHECKINS_BUCKET)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** Batch-sign many paths at once (used by the feed). Returns a path -> url map. */
export async function getSignedPhotoUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn = 60 * 60,
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths));
  if (unique.length === 0) return {};
  const { data } = await supabase.storage
    .from(CHECKINS_BUCKET)
    .createSignedUrls(unique, expiresIn);
  const map: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map[item.path] = item.signedUrl;
  }
  return map;
}
