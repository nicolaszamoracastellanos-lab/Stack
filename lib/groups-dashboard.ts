import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserGroups } from "@/lib/groups";
import { nameOf } from "@/lib/feed";
import { computeGroupStreak, type StreakState } from "@/lib/streaks";
import { computeQuotaStreak, workoutDaySet } from "@/lib/streak-quota";
import { dayKey, weekDayKeys } from "@/lib/week";
import type { TierKey } from "@/lib/tiers";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";
import type { Group } from "@/lib/types";

export type LeaderEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  streak: number;
  /** Has this member checked in today? (drives the at-risk flag) */
  checkedInToday: boolean;
  /** Distinct days checked in this Mon–Sun week (0–7). */
  daysThisWeek: number;
  isYou: boolean;
  /** Section 2: false → hide streak/ranking, keep name/avatar/at-risk. */
  showStats: boolean;
  /** Confirmed-or-provisional tier key for the colour legend (Batch 5 C). */
  tier: TierKey | null;
  /** Weekly goal (1–7), for goal-aware "perfect week" framing. */
  weeklyGoal: number | null;
};

export type DashboardGroup = {
  group: Group;
  members: LeaderEntry[];
  /** Total check-ins in this group this Mon–Sun week. */
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
  weekly_goal: number | null;
  quota_active_from: string | null;
  timezone: string | null;
  tier_confirmed: string | null;
  tier_provisional: string | null;
} | null;

/**
 * Dashboard data for all of a user's groups: each group with its members ranked
 * by current streak (computed from that group's check-ins) — the leaderboard
 * that answers "who's #1 here". Returns the active group id for highlighting.
 */
export async function getGroupsDashboard(
  userId: string,
  /** Pre-fetched groups — pass when the caller already loaded them so a home
   * render doesn't repeat the membership query. */
  prefetchedGroups?: Group[],
): Promise<{
  groups: DashboardGroup[];
  activeId: string | null;
}> {
  const supabase = createClient();
  const groups = prefetchedGroups ?? (await getUserGroups());
  const now = new Date();

  const dashGroups = await Promise.all(
    groups.map(async (g) => {
      const [memberRes, checkinRes] = await Promise.all([
        supabase
          .from("group_members")
          .select(
            "user_id, profile:profiles(username, display_name, avatar_url, show_stats, weekly_goal, quota_active_from, timezone, tier_confirmed, tier_provisional)",
          )
          .eq("group_id", g.id),
        supabase
          .from("checkins")
          .select("user_id, created_at")
          .eq("group_id", g.id)
          .limit(2000),
      ]);

      const checkins = checkinRes.data ?? [];

      // Per-member week frames: "today" and the Mon–Sun week resolve in EACH
      // member's stored timezone, not the server's (UTC on Vercel) — otherwise
      // the checked-in-today dot and weekly counts flip a day early/late
      // around midnight for non-UTC users. Matches the streak count below.
      const weekSetByUid = new Map<string, Set<string>>();

      const members: LeaderEntry[] = (memberRes.data ?? []).map((row) => {
        const uid = (row as { user_id: string }).user_id;
        const profile = (row as unknown as { profile: ProfileLite }).profile;
        const tz = profile?.timezone ?? null;
        const todayKey = dayKey(now, tz);
        const week = weekDayKeys(todayKey);
        weekSetByUid.set(uid, new Set(week));
        const dates = checkins
          .filter((c) => c.user_id === uid)
          .map((c) => c.created_at as string);
        const daySet = workoutDaySet(dates, tz);
        const isYou = uid === userId;
        // Privacy floor: hidden-stat members keep name/avatar/at-risk, but their
        // streak/consistency are zeroed in the payload so nothing leaks.
        const showStats = isYou || profile?.show_stats !== false;
        const streak = showStats
          ? computeQuotaStreak(dates, {
              weeklyGoal: profile?.weekly_goal ?? null,
              quotaActiveFromKey: profile?.quota_active_from ?? null,
              tz: profile?.timezone ?? null,
              now,
            }).count
          : 0;
        const tier = (showStats
          ? profile?.tier_confirmed ?? profile?.tier_provisional ?? null
          : null) as TierKey | null;
        return {
          userId: uid,
          name: nameOf(profile),
          avatarUrl: profile?.avatar_url ?? null,
          streak,
          checkedInToday: daySet.has(todayKey),
          daysThisWeek: showStats
            ? week.filter((k) => daySet.has(k)).length
            : 0,
          isYou,
          showStats,
          tier,
          weeklyGoal: profile?.weekly_goal ?? null,
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

      // Week total in each check-in owner's frame (falls back to the poster's
      // membership week set; check-ins from since-departed members are skipped).
      const tzByUid = new Map<string, string | null>();
      for (const row of memberRes.data ?? []) {
        tzByUid.set(
          (row as { user_id: string }).user_id,
          (row as unknown as { profile: ProfileLite }).profile?.timezone ?? null,
        );
      }
      const weekTotal = checkins.filter((c) => {
        const uid = c.user_id as string;
        const weekSet = weekSetByUid.get(uid);
        if (!weekSet) return false;
        return weekSet.has(
          dayKey(new Date(c.created_at as string), tzByUid.get(uid)),
        );
      }).length;

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
