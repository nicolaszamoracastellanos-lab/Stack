import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { getSignedPhotoUrls } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export type MemberPhoto = { id: string; photoUrl: string; createdAt: string };

export type MemberProfileData = {
  profile: Profile;
  isOwner: boolean;
  /** True when this member hid their stats and you're not them (Section 2). */
  statsHidden: boolean;
  /** One timestamp per post, across all the member's groups (gated by RPC). */
  checkinDates: string[];
  totalPosts: number;
  recentPhotos: MemberPhoto[];
  sharedGroups: { id: string; name: string }[];
};

const RECENT_PHOTO_CAP = 30;

/**
 * Everything a member-profile screen needs (Batch 2 · Section 1), viewed by
 * `viewerId`. Hero stats come from the cross-group RPC so they reflect the
 * member's true activity; recent photos come through normal RLS (so a viewer
 * only sees proof from groups they share). Returns null if the profile is
 * missing.
 */
export async function getMemberProfile(
  viewerId: string,
  targetId: string,
): Promise<MemberProfileData | null> {
  const supabase = createClient();
  const isOwner = viewerId === targetId;

  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetId)
    .single();
  if (!prof) return null;

  // Privacy (Section 2): a member who hid their stats shows a hidden state to
  // others — but never to themselves. The RPC already returns no rows in that
  // case; this flag drives the UI so 0s don't masquerade as real numbers.
  const statsHidden = !isOwner && (prof as Profile).show_stats === false;

  // Hero stats: cross-group post dates via the SECURITY DEFINER RPC. If the
  // migration hasn't been applied yet, fall back to RLS-visible check-ins so
  // the screen still works (owner numbers stay accurate either way).
  let checkinDates: string[] = [];
  const { data: rpcRows, error: rpcErr } = await supabase.rpc(
    "member_checkin_dates",
    { _user_id: targetId },
  );
  if (!rpcErr && Array.isArray(rpcRows)) {
    checkinDates = (rpcRows as { created_at: string }[]).map((r) => r.created_at);
  } else {
    const { data } = await supabase
      .from("checkins")
      .select("id, post_id, created_at")
      .eq("user_id", targetId);
    const seen = new Set<string>();
    for (const c of data ?? []) {
      const key = (c.post_id as string | null) ?? (c.id as string);
      if (seen.has(key)) continue;
      seen.add(key);
      checkinDates.push(c.created_at as string);
    }
  }
  const totalPosts = checkinDates.length;

  // Recent photos (RLS-limited to shared groups), deduped by post, newest first.
  const { data: photoRows } = await supabase
    .from("checkins")
    .select("id, post_id, photo_url, created_at")
    .eq("user_id", targetId)
    .order("created_at", { ascending: false })
    .limit(120);
  const seenPost = new Set<string>();
  const deduped = (photoRows ?? [])
    .filter((c) => {
      const key = (c.post_id as string | null) ?? (c.id as string);
      if (seenPost.has(key)) return false;
      seenPost.add(key);
      return true;
    })
    .slice(0, RECENT_PHOTO_CAP);
  const signed = await getSignedPhotoUrls(
    supabase,
    deduped.map((c) => c.photo_url as string),
  );
  const recentPhotos: MemberPhoto[] = deduped.map((c) => ({
    id: c.id as string,
    photoUrl: signed[c.photo_url as string] ?? "",
    createdAt: c.created_at as string,
  }));

  // Shared groups: the viewer's groups intersected with the member's membership.
  const myGroups = await getUserGroups();
  let sharedGroups: { id: string; name: string }[] = [];
  if (isOwner) {
    sharedGroups = myGroups.map((g) => ({ id: g.id, name: g.name }));
  } else if (myGroups.length > 0) {
    const { data: mem } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", targetId)
      .in(
        "group_id",
        myGroups.map((g) => g.id),
      );
    const sharedIds = new Set((mem ?? []).map((m) => m.group_id as string));
    sharedGroups = myGroups
      .filter((g) => sharedIds.has(g.id))
      .map((g) => ({ id: g.id, name: g.name }));
  }

  return {
    profile: prof as Profile,
    isOwner,
    statsHidden,
    checkinDates,
    totalPosts,
    recentPhotos,
    sharedGroups,
  };
}
