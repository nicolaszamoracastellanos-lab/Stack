import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { nameOf } from "@/lib/feed";
import {
  computeGroupStreak,
  computePersonalStreak,
  localDateKey,
  toDaySet,
  type StreakState,
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
  /** Section 2: false → hide streak/ranking, keep name/avatar/at-risk. */
  showStats: boolean;
};

export type DashboardGroup = {
  group: Group;
  members: LeaderEntry[];
  /** Total check-ins in this group over the last 7 days. */
  weekTotal: number;
  /** Collective streak: consecutive days every member checked in. */
  collectiveStreak: number;
  collectiveState: StreakState;
  /** Whether YOU have checked in today for this group (drives the at-risk dot). */
  youCheckedInToday: boolean;
};

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  show_stats: boolean | null;
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
          .select(
            "user_id, profile:profiles(username, display_name, avatar_url, show_stats)",
          )
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
        const isYou = uid === userId;
        // Privacy floor: hidden-stat members keep name/avatar/at-risk, but their
        // streak/consistency are zeroed in the payload so nothing leaks.
        const showStats = isYou || profile?.show_stats !== false;
        return {
          userId: uid,
          name: nameOf(profile),
          avatarUrl: profile?.avatar_url ?? null,
          streak: showStats ? computePersonalStreak(dates, now).count : 0,
          checkedInToday: daySet.has(todayKey),
          daysThisWeek: showStats
            ? last7.filter((k) => daySet.has(k)).length
            : 0,
          isYou,
          showStats,
        };
      });

      // Rank visible members by streak; hidden-stat members fall to the bottom
      // (no rank shown), alphabetical for stable ties.
      members.sort((a, b) =>
        a.showStats !== b.showStats
          ? a.showStats
            ? -1
            : 1
          : b.streak - a.streak || a.name.localeCompare(b.name),
      );

      const weekTotal = checkins.filter((c) =>
        last7Set.has(localDateKey(new Date(c.created_at as string))),
      ).length;

      // Collective streak: feed one check-in array per member.
      const memberArrays = (memberRes.data ?? []).map((row) => {
        const uid = (row as { user_id: string }).user_id;
        return checkins
          .filter((c) => c.user_id === uid)
          .map((c) => c.created_at as string);
      });
      const collective = computeGroupStreak(memberArrays, now);
      const youCheckedInToday =
        members.find((m) => m.isYou)?.checkedInToday ?? false;

      return {
        group: g,
        members,
        weekTotal,
        collectiveStreak: collective.count,
        collectiveState: collective.state,
        youCheckedInToday,
      };
    }),
  );

  const activeId =
    cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? groups[0]?.id ?? null;
  return { groups: dashGroups, activeId };
}
