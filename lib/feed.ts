import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrls } from "@/lib/storage";

export type FeedCheckin = {
  id: string;
  user_id: string;
  name: string;
  avatarUrl: string | null;
  photoUrl: string;
  /** Raw storage path + post id, needed to delete a check-in (Fix #4). */
  photoPath: string;
  postId: string | null;
  note: string | null;
  sport: string | null;
  environment: string | null;
  goal: string | null;
  created_at: string;
};

export type FeedMember = {
  user_id: string;
  name: string;
  avatarUrl: string | null;
};
export type FeedReaction = {
  checkin_id: string;
  user_id: string;
  emoji: string;
};

export type FeedComment = {
  id: string;
  checkin_id: string;
  user_id: string;
  name: string;
  avatarUrl: string | null;
  body: string;
  created_at: string;
};

export type HomeData = {
  feed: FeedCheckin[];
  members: FeedMember[];
  reactions: FeedReaction[];
  comments: FeedComment[];
  /** The current user's check-in timestamps across ALL their groups (personal streak). */
  personalDates: string[];
  /** The current user's rest days (day keys), which bridge the streak (§9). */
  restDays: string[];
};

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url?: string | null;
} | null;

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
      .select("user_id, profile:profiles(username, display_name, avatar_url)")
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
    return {
      user_id: (row as { user_id: string }).user_id,
      name: nameOf(profile),
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
  const nameByUser = Object.fromEntries(members.map((m) => [m.user_id, m.name]));
  const avatarByUser = Object.fromEntries(
    members.map((m) => [m.user_id, m.avatarUrl]),
  );

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
    photoPath: c.photo_url as string,
    postId: (c.post_id as string | null) ?? null,
    note: (c.note as string | null) ?? null,
    sport: (c.sport as string | null) ?? null,
    environment: (c.environment as string | null) ?? null,
    goal: (c.goal as string | null) ?? null,
    created_at: c.created_at as string,
  }));

  const ids = checkins.map((c) => c.id as string);
  let reactions: FeedReaction[] = [];
  let comments: FeedComment[] = [];
  if (ids.length > 0) {
    const [rxRes, cmRes] = await Promise.all([
      supabase.from("reactions").select("checkin_id, user_id, emoji").in("checkin_id", ids),
      supabase
        .from("comments")
        .select("id, checkin_id, user_id, body, created_at")
        .in("checkin_id", ids)
        .order("created_at", { ascending: true }),
    ]);
    reactions = (rxRes.data ?? []) as FeedReaction[];
    comments = (cmRes.data ?? []).map((c) => ({
      id: c.id as string,
      checkin_id: c.checkin_id as string,
      user_id: c.user_id as string,
      name: nameByUser[c.user_id as string] ?? "Member",
      avatarUrl: avatarByUser[c.user_id as string] ?? null,
      body: c.body as string,
      created_at: c.created_at as string,
    }));
  }

  const personalDates = (mineRes.data ?? []).map((r) => r.created_at as string);

  const { data: restData } = await supabase
    .from("rest_days")
    .select("day")
    .eq("user_id", userId);
  const restDays = (restData ?? []).map((r) => r.day as string);

  return { feed, members, reactions, comments, personalDates, restDays };
}
