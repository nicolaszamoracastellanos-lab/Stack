import type { SupabaseClient } from "@supabase/supabase-js";

/** Mirrors the web app: check-in photos live in a PRIVATE bucket. */
export const CHECKINS_BUCKET = "checkins";

/** Storage object key for a check-in photo: <user_id>/<filename>. */
export function checkinPhotoPath(userId: string, filename: string): string {
  return `${userId}/${filename}`;
}

/** Mint a short-lived signed URL for one private photo path. */
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
