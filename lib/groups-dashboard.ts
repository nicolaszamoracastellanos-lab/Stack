import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { nameOf } from "@/lib/feed";
import {
  computePersonalStreak,
  localDateKey,
  toDaySet,
} from "@/lib/streaks";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";
import type { Group } from "@/lib/types";

export type LeaderEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  streak: number;
  /** Has this member checked in today? (drives the at-risk flag) */
  checkedInToday: boolean;
  /** Distinct days checked in over the last 7 (0–7). */
  daysThisWeek: number;
  isYou: boolean;
};

export type DashboardGroup = {
  group: Group;
  members: LeaderEntry[];
  /** Total check-ins in this group over the last 7 days. */
  weekTotal: number;
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

      // Day keys for "today" and the last 7 days (local time).
      const todayKey = localDateKey(now);
      const last7: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        last7.push(localDateKey(d));
      }
      const last7Set = new Set(last7);

      const members: LeaderEntry[] = (memberRes.data ?? []).map((row) => {
        const uid = (row as { user_id: string }).user_id;
        const profile = (row as unknown as { profile: ProfileLite }).profile;
        const dates = checkins
          .filter((c) => c.user_id === uid)
          .map((c) => c.created_at as string);
        const daySet = toDaySet(dates);
        return {
          userId: uid,
          name: nameOf(profile),
          avatarUrl: profile?.avatar_url ?? null,
          streak: computePersonalStreak(dates, now).count,
          checkedInToday: daySet.has(todayKey),
          daysThisWeek: last7.filter((k) => daySet.has(k)).length,
          isYou: uid === userId,
        };
      });

      // Rank: highest streak first, then alphabetical for stable ties.
      members.sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name));

      const weekTotal = checkins.filter((c) =>
        last7Set.has(localDateKey(new Date(c.created_at as string))),
      ).length;

      return { group: g, members, weekTotal };
    }),
  );

  const activeId =
    cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? groups[0]?.id ?? null;
  return { groups: dashGroups, activeId };
}
