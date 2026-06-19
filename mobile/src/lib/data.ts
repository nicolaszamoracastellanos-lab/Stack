import { supabase } from "@/lib/supabase";
import { CHECKINS_BUCKET, checkinPhotoPath, getSignedPhotoUrls } from "@/lib/storage";
import type { Group } from "@/lib/types";

/** A friendly display name: chosen display name, else @username. */
function nameOf(p: {
  username?: string;
  display_name?: string | null;
} | null): string {
  if (!p) return "Member";
  return p.display_name?.trim() || (p.username ? `@${p.username}` : "Member");
}

export type FeedCheckin = {
  id: string;
  user_id: string;
  name: string;
  avatarUrl: string | null;
  photoUrl: string;
  note: string | null;
  sport: string | null;
  created_at: string;
};

/** Groups the user belongs to, most recently created first. */
export async function getMyGroups(userId: string): Promise<Group[]> {
  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  const ids = (memberRows ?? []).map((r) => r.group_id as string);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("groups")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });
  return (data ?? []) as Group[];
}

export type GroupHome = {
  feed: FeedCheckin[];
  /** The user's check-in timestamps across ALL groups, for the personal streak. */
  personalDates: string[];
};

/** Everything the home feed needs for one group. Photos are signed for display. */
export async function getGroupHome(
  groupId: string,
  userId: string,
): Promise<GroupHome> {
  const [memberRes, checkinRes, mineRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id, profile:profiles(username, display_name, avatar_url)")
      .eq("group_id", groupId),
    supabase
      .from("checkins")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("checkins").select("created_at").eq("user_id", userId).limit(400),
  ]);

  const nameByUser: Record<string, string> = {};
  const avatarByUser: Record<string, string | null> = {};
  for (const row of memberRes.data ?? []) {
    const profile = (row as unknown as { profile: any }).profile;
    const uid = (row as { user_id: string }).user_id;
    nameByUser[uid] = nameOf(profile);
    avatarByUser[uid] = profile?.avatar_url ?? null;
  }

  const checkins = checkinRes.data ?? [];
  const signed = await getSignedPhotoUrls(
    supabase,
    checkins.map((c) => c.photo_url as string),
  );

  const feed: FeedCheckin[] = checkins.map((c) => ({
    id: c.id as string,
    user_id: c.user_id as string,
    name: nameByUser[c.user_id as string] ?? "Member",
    avatarUrl: avatarByUser[c.user_id as string] ?? null,
    photoUrl: signed[c.photo_url as string] ?? "",
    note: (c.note as string | null) ?? null,
    sport: (c.sport as string | null) ?? null,
    created_at: c.created_at as string,
  }));

  const personalDates = (mineRes.data ?? []).map((r) => r.created_at as string);
  return { feed, personalDates };
}

/**
 * Upload a captured photo and post a check-in. `groupIds` is the set of groups
 * to post to; pass `justMe` for a personal-only log (group_id = null), matching
 * the web app's "Just me" behavior.
 */
export async function createCheckin(opts: {
  userId: string;
  photoUri: string;
  note?: string | null;
  sport?: string | null;
  groupIds: string[];
  justMe?: boolean;
}): Promise<{ error: string | null }> {
  const { userId, photoUri, note, sport, groupIds, justMe } = opts;

  // RN: read the local file URI into an ArrayBuffer for upload.
  let bytes: ArrayBuffer;
  try {
    bytes = await fetch(photoUri).then((r) => r.arrayBuffer());
  } catch (e) {
    return { error: "Could not read the photo file." };
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const path = checkinPhotoPath(userId, filename);
  const { error: upErr } = await supabase.storage
    .from(CHECKINS_BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (upErr) return { error: `Photo upload failed: ${upErr.message}` };

  const postId =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const targets: (string | null)[] = justMe ? [null] : groupIds;
  const rows = targets.map((group_id) => ({
    group_id,
    user_id: userId,
    photo_url: path,
    note: note?.trim() || null,
    sport: sport ?? null,
    post_id: postId,
  }));

  const { error: insErr } = await supabase.from("checkins").insert(rows);
  if (insErr) return { error: `${insErr.code ?? "ERR"}: ${insErr.message}` };
  return { error: null };
}

/** Join a group by its invite code (case-insensitive), like the web /join flow. */
export async function joinGroupByCode(
  userId: string,
  code: string,
): Promise<{ error: string | null; groupId?: string }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { error: "Enter an invite code." };
  const { data: group } = await supabase
    .from("groups")
    .select("id")
    .ilike("invite_code", trimmed)
    .maybeSingle();
  if (!group) return { error: "No group found for that code." };
  const groupId = (group as { id: string }).id;
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });
  // Unique-violation = already a member; treat as success.
  if (error && error.code !== "23505") return { error: error.message };
  return { error: null, groupId };
}
