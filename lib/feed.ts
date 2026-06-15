import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrls } from "@/lib/storage";

export type FeedCheckin = {
  id: string;
  user_id: string;
  name: string;
  photoUrl: string;
  note: string | null;
  created_at: string;
};

export type FeedMember = { user_id: string; name: string };
export type FeedReaction = { checkin_id: string; user_id: string };

export type HomeData = {
  feed: FeedCheckin[];
  members: FeedMember[];
  reactions: FeedReaction[];
  /** The current user's check-in timestamps across ALL their groups (personal streak). */
  personalDates: string[];
};

type ProfileLite = { username: string; display_name: string | null } | null;

/** Friendly display name: the chosen display name, else @username. */
export function nameOf(profile: ProfileLite): string {
  if (!profile) return "Member";
  return profile.display_name?.trim() || `@${profile.username}`;
}

/**
 * Everything the home screen needs for a group, fetched server-side with RLS
 * applied. Photo paths are signed here (private bucket) before reaching the
 * client. Capped at the recent 200 check-ins — plenty for Phase 1 streaks/feed.
 */
export async function getHomeData(
  groupId: string,
  userId: string,
): Promise<HomeData> {
  const supabase = createClient();

  const [memberRes, checkinRes, mineRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id, profile:profiles(username, display_name)")
      .eq("group_id", groupId),
    supabase
      .from("checkins")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("checkins")
      .select("created_at")
      .eq("user_id", userId)
      .limit(400),
  ]);

  const members: FeedMember[] = (memberRes.data ?? []).map((row) => {
    const profile = (row as unknown as { profile: ProfileLite }).profile;
    return { user_id: (row as { user_id: string }).user_id, name: nameOf(profile) };
  });
  const nameByUser = Object.fromEntries(members.map((m) => [m.user_id, m.name]));

  const checkins = checkinRes.data ?? [];
  const signed = await getSignedPhotoUrls(
    supabase,
    checkins.map((c) => c.photo_url as string),
  );

  const feed: FeedCheckin[] = checkins.map((c) => ({
    id: c.id as string,
    user_id: c.user_id as string,
    name: nameByUser[c.user_id as string] ?? "Member",
    photoUrl: signed[c.photo_url as string] ?? "",
    note: (c.note as string | null) ?? null,
    created_at: c.created_at as string,
  }));

  const ids = checkins.map((c) => c.id as string);
  let reactions: FeedReaction[] = [];
  if (ids.length > 0) {
    const { data: rx } = await supabase
      .from("reactions")
      .select("checkin_id, user_id")
      .in("checkin_id", ids);
    reactions = (rx ?? []) as FeedReaction[];
  }

  const personalDates = (mineRes.data ?? []).map((r) => r.created_at as string);

  return { feed, members, reactions, personalDates };
}
