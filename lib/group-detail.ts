import { createClient } from "@/lib/supabase/server";
import { nameOf } from "@/lib/feed";
import {
  computeGroupStreak,
  computePersonalStreak,
  localDateKey,
  toDaySet,
  type StreakState,
} from "@/lib/streaks";
import type { LeaderEntry } from "@/lib/groups-dashboard";
import type { Group } from "@/lib/types";

export type WindowStat = {
  total: number;
  mostConsistent: { name: string; days: number } | null;
};

export type GroupDetailData = {
  group: Group;
  isCreator: boolean;
  inviteLink: string;
  collectiveStreak: number;
  collectiveState: StreakState;
  /** Group consistency this week: share of member-days checked, 0–100. */
  consistencyPct: number;
  members: LeaderEntry[];
  windows: { week: WindowStat; month: WindowStat; all: WindowStat };
};

type ProfileLite = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  show_stats: boolean | null;
} | null;

function daySetBack(now: Date, n: number): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    s.add(localDateKey(d));
  }
  return s;
}

/**
 * Group detail (Batch 2 · Section 4): group-level stats (Section A) + the
 * per-member breakdown (Section B). Privacy-aware: hidden-stat members keep
 * name/avatar/at-risk but their streak/consistency are zeroed in the per-member
 * payload and they're excluded from the "most consistent" callout. Aggregate
 * group numbers still count everyone (an aggregate reveals no individual).
 */
export async function getGroupDetail(
  groupId: string,
  userId: string,
  baseUrl: string,
): Promise<GroupDetailData | null> {
  const supabase = createClient();
  const now = new Date();

  const [groupRes, memberRes, checkinRes] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase
      .from("group_members")
      .select(
        "user_id, profile:profiles(username, display_name, avatar_url, show_stats)",
      )
      .eq("group_id", groupId),
    supabase
      .from("checkins")
      .select("user_id, created_at")
      .eq("group_id", groupId)
      .limit(5000),
  ]);

  const group = groupRes.data as Group | null;
  if (!group) return null;

  const checkins = checkinRes.data ?? [];
  const rows = memberRes.data ?? [];
  const todayKey = localDateKey(now);
  const weekSet = daySetBack(now, 7);
  const monthSet = daySetBack(now, 30);
  const last7 = Array.from(weekSet);

  const datesOf = (uid: string) =>
    checkins.filter((c) => c.user_id === uid).map((c) => c.created_at as string);

  // Section B — per-member rows (privacy-aware).
  // Fix #7: the per-member STREAK is the member's PERSONAL (global) streak —
  // computed from ALL their check-ins + rest days via the gated RPCs, NOT from
  // this group's check-ins. A streak belongs to the person, not the group, so it
  // must not reset to 0 in a newly-joined group. The at-risk dot and the weekly
  // consistency ring stay GROUP-scoped (participation in this group).
  const members: LeaderEntry[] = await Promise.all(
    rows.map(async (row) => {
      const uid = (row as { user_id: string }).user_id;
      const profile = (row as unknown as { profile: ProfileLite }).profile;
      const groupDaySet = toDaySet(datesOf(uid));
      const isYou = uid === userId;
      const showStats = isYou || profile?.show_stats !== false;

      let streak = 0;
      if (showStats) {
        const [datesRes, restRes] = await Promise.all([
          supabase.rpc("member_checkin_dates", { _user_id: uid }),
          supabase.rpc("member_rest_days", { _user_id: uid }),
        ]);
        const globalDates = Array.isArray(datesRes.data)
          ? (datesRes.data as { created_at: string }[]).map((r) => r.created_at)
          : [];
        const restDays = Array.isArray(restRes.data)
          ? (restRes.data as { day: string }[]).map((r) => r.day)
          : [];
        streak = computePersonalStreak(globalDates, now, restDays).count;
      }

      return {
        userId: uid,
        name: nameOf(profile),
        avatarUrl: profile?.avatar_url ?? null,
        streak,
        checkedInToday: groupDaySet.has(todayKey),
        daysThisWeek: showStats
          ? last7.filter((k) => groupDaySet.has(k)).length
          : 0,
        isYou,
        showStats,
      };
    }),
  );
  members.sort((a, b) =>
    a.showStats !== b.showStats
      ? a.showStats
        ? -1
        : 1
      : b.streak - a.streak || a.name.localeCompare(b.name),
  );

  // Section A — collective streak across all members.
  const memberArrays = rows.map((row) =>
    datesOf((row as { user_id: string }).user_id),
  );
  const collective = computeGroupStreak(memberArrays, now);

  // Group consistency this week (counts everyone's real days; aggregate only).
  const memberCount = rows.length || 1;
  let groupWeekDays = 0;
  for (const row of rows) {
    const ds = toDaySet(datesOf((row as { user_id: string }).user_id));
    groupWeekDays += last7.filter((k) => ds.has(k)).length;
  }
  const consistencyPct = Math.round((groupWeekDays / (memberCount * 7)) * 100);

  // Totals + "most consistent" per window. `window === null` means all-time.
  const totalIn = (set: Set<string> | null) =>
    set === null
      ? checkins.length
      : checkins.filter((c) =>
          set.has(localDateKey(new Date(c.created_at as string))),
        ).length;

  const mostConsistentIn = (set: Set<string> | null): WindowStat["mostConsistent"] => {
    let best: { name: string; days: number } | null = null;
    for (const row of rows) {
      const uid = (row as { user_id: string }).user_id;
      const profile = (row as unknown as { profile: ProfileLite }).profile;
      const isYou = uid === userId;
      const showStats = isYou || profile?.show_stats !== false;
      if (!showStats) continue; // never expose a hidden member's standing
      const ds = toDaySet(datesOf(uid));
      const days =
        set === null
          ? ds.size
          : Array.from(set).filter((k) => ds.has(k)).length;
      if (days > 0 && (!best || days > best.days)) {
        best = { name: nameOf(profile), days };
      }
    }
    return best;
  };

  return {
    group,
    isCreator: group.created_by === userId,
    inviteLink: `${baseUrl}/join/${group.invite_code}`,
    collectiveStreak: collective.count,
    collectiveState: collective.state,
    consistencyPct,
    members,
    windows: {
      week: { total: totalIn(weekSet), mostConsistent: mostConsistentIn(weekSet) },
      month: { total: totalIn(monthSet), mostConsistent: mostConsistentIn(monthSet) },
      all: { total: totalIn(null), mostConsistent: mostConsistentIn(null) },
    },
  };
}
