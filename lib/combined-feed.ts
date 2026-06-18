import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { getSignedPhotoUrls } from "@/lib/storage";
import { nameOf } from "@/lib/feed";
import type { FeedReaction, FeedComment } from "@/lib/feed";
import type { TierKey } from "@/lib/tiers";

/**
 * Combined "All Activity" feed (STACK_BATCH6 Stage 2). Aggregates check-ins from
 * ALL the user's groups (your-groups-only; never public). One item per POST
 * (deduped by post_id); a representative check-in row carries the reactions and
 * comments, and the item is labelled with every group the post went to that the
 * viewer shares. Today-first ordering is applied client-side.
 */
export type CombinedItem = {
  id: string; // representative checkin id (for reactions/comments)
  postId: string | null;
  userId: string;
  name: string;
  avatarUrl: string | null;
  tier: TierKey | null;
  photoUrl: string;
  photoPath: string;
  note: string | null;
  sport: string | null;
  environment: string | null;
  goal: string | null;
  createdAt: string;
  /** Group names the post went to (viewer-shared), for the "posted in X" label. */
  groupNames: string[];
};

export type CombinedFeedData = {
  items: CombinedItem[];
  reactions: FeedReaction[];
  comments: FeedComment[];
  /** Group members by group id, for mention autocomplete (Stage 4). */
  groupIds: string[];
};

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier_confirmed: string | null;
  tier_provisional: string | null;
} | null;

type CheckinRow = {
  id: string;
  post_id: string | null;
  user_id: string;
  group_id: string;
  photo_url: string;
  note: string | null;
  sport: string | null;
  environment: string | null;
  goal: string | null;
  created_at: string;
  author: ProfileLite;
};

export async function getCombinedFeed(): Promise<CombinedFeedData> {
  const supabase = createClient();
  const groups = await getUserGroups();
  const groupIds = groups.map((g) => g.id);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  if (groupIds.length === 0) {
    return { items: [], reactions: [], comments: [], groupIds: [] };
  }

  const { data: rows } = await supabase
    .from("checkins")
    .select(
      "id, post_id, user_id, group_id, photo_url, note, sport, environment, goal, created_at, " +
        "author:user_id(username, display_name, avatar_url, tier_confirmed, tier_provisional)",
    )
    .in("group_id", groupIds)
    .order("created_at", { ascending: false })
    .limit(300);

  // Dedupe by post_id (keep the first/newest row as representative) and collect
  // the set of groups each post went to.
  const byPost = new Map<string, CombinedItem>();
  for (const r of (rows ?? []) as unknown as CheckinRow[]) {
    const postKey = r.post_id ?? r.id;
    const gName = groupName.get(r.group_id);
    const existing = byPost.get(postKey);
    if (existing) {
      if (gName && !existing.groupNames.includes(gName)) existing.groupNames.push(gName);
      continue;
    }
    const author = r.author;
    byPost.set(postKey, {
      id: r.id,
      postId: r.post_id ?? null,
      userId: r.user_id,
      name: nameOf(author),
      avatarUrl: author?.avatar_url ?? null,
      tier: ((author?.tier_confirmed ?? author?.tier_provisional) ??
        null) as TierKey | null,
      photoUrl: "",
      photoPath: r.photo_url,
      note: r.note ?? null,
      sport: r.sport ?? null,
      environment: r.environment ?? null,
      goal: r.goal ?? null,
      createdAt: r.created_at,
      groupNames: gName ? [gName] : [],
    });
  }
  const items = Array.from(byPost.values());

  // Sign photos.
  const signed = await getSignedPhotoUrls(
    supabase,
    items.map((i) => i.photoPath),
  );
  for (const i of items) i.photoUrl = signed[i.photoPath] ?? "";

  // Reactions + comments for the representative check-ins.
  const ids = items.map((i) => i.id);
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
    // Comment author names: resolve from a profiles lookup.
    const commenterIds = Array.from(
      new Set((cmRes.data ?? []).map((c) => c.user_id as string)),
    );
    const nameById = new Map<string, { name: string; avatar: string | null }>();
    if (commenterIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", commenterIds);
      for (const p of profs ?? []) {
        const pl = p as unknown as {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        nameById.set(pl.id, {
          name: nameOf({
            username: pl.username,
            display_name: pl.display_name,
            avatar_url: pl.avatar_url,
            tier_confirmed: null,
            tier_provisional: null,
          }),
          avatar: pl.avatar_url ?? null,
        });
      }
    }
    comments = (cmRes.data ?? []).map((c) => ({
      id: c.id as string,
      checkin_id: c.checkin_id as string,
      user_id: c.user_id as string,
      name: nameById.get(c.user_id as string)?.name ?? "Member",
      avatarUrl: nameById.get(c.user_id as string)?.avatar ?? null,
      body: c.body as string,
      created_at: c.created_at as string,
    }));
  }

  return { items, reactions, comments, groupIds };
}
