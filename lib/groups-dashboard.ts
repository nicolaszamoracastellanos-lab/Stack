import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { nameOf } from "@/lib/feed";
import { computePersonalStreak } from "@/lib/streaks";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";
import type { Group } from "@/lib/types";

export type LeaderEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  streak: number;
  isYou: boolean;
};

export type DashboardGroup = {
  group: Group;
  members: LeaderEntry[];
};

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

/**
 * Dashboard data for all of a user's groups: each group with its members ranked
 * by current streak (computed from that group's check-ins) — the leaderboard
 * that answers "who's #1 here". Returns the active group id for highlighting.
 */
export async function getGroupsDashboard(userId: string): Promise<{
  groups: DashboardGroup[];
  activeId: string | null;
}> {
  const supabase = createClient();
  const groups = await getUserGroups();
  const now = new Date();

  const dashGroups = await Promise.all(
    groups.map(async (g) => {
      const [memberRes, checkinRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("user_id, profile:profiles(username, display_name, avatar_url)")
          .eq("group_id", g.id),
        supabase
          .from("checkins")
          .select("user_id, created_at")
          .eq("group_id", g.id)
          .limit(2000),
      ]);

      const checkins = checkinRes.data ?? [];
      const members: LeaderEntry[] = (memberRes.data ?? []).map((row) => {
        const uid = (row as { user_id: string }).user_id;
        const profile = (row as unknown as { profile: ProfileLite }).profile;
        const dates = checkins
          .filter((c) => c.user_id === uid)
          .map((c) => c.created_at as string);
        return {
          userId: uid,
          name: nameOf(profile),
          avatarUrl: profile?.avatar_url ?? null,
          streak: computePersonalStreak(dates, now).count,
          isYou: uid === userId,
        };
      });

      // Rank: highest streak first, then alphabetical for stable ties.
      members.sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name));
      return { group: g, members };
    }),
  );

  const activeId =
    cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? groups[0]?.id ?? null;
  return { groups: dashGroups, activeId };
}
