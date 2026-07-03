import { createClient } from "@/lib/supabase/server";
import { nameOf } from "@/lib/feed";
import { inviteLink as buildInviteLink } from "@/lib/site";
import { computeGroupStreak, type StreakState } from "@/lib/streaks";
import { computeQuotaStreak, workoutDaySet } from "@/lib/streak-quota";
import { isPact, disciplineCounts } from "@/lib/pacts";
import { pactWeekStartKey } from "@/lib/pact-eval";
import { dayKey, addDaysKey, weekdayMon0, weekDayKeys } from "@/lib/week";
import type { LeaderEntry } from "@/lib/groups-dashboard";
import type { TierKey } from "@/lib/tiers";
import type { Group } from "@/lib/types";

export type WindowStat = {
  total: number;
  mostConsistent: { name: string; days: number } | null;
};

export type DebtEntry = {
  id: string;
  debtorName: string;
  debtorUserId: string;
  isYou: boolean;
  stakeDescription: string;
  periodKey: string;
  status: "outstanding" | "settled";
  createdAt: string;
  settledAt: string | null;
};

/** Loud, top-of-group standing for a pact that has a stake on the line. */
export type PactAlert = {
  stake: string;
  target: number;
  /** Members who broke a completed pact week and owe the stake. */
  broke: { userId: string; name: string; isYou: boolean }[];
  /** Members with zero qualifying workouts so far this week (not already broke). */
  behind: { userId: string; name: string; isYou: boolean }[];
};

export type ProposalView = {
  id: string;
  summary: string | null;
  proposerName: string;
  approvedCount: number;
  memberCount: number;
  hasApproved: boolean;
  waitingNames: string[];
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
  /** Stakes ledger (Batch 4): outstanding debts up top, settled history below. */
  debts: { outstanding: DebtEntry[]; settled: DebtEntry[] };
  /** A pending rule-change proposal awaiting unanimous approval (§5). */
  proposal: ProposalView | null;
  /** Loud pact standing for the whole team; null unless it's a staked pact. */
  pactAlert: PactAlert | null;
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

/** The last `n` day-keys ending at `todayKey` (a member-frame civil today). */
function backKeys(todayKey: string, n: number): Set<string> {
  const s = new Set<string>();
  for (let i = 0; i < n; i++) s.add(addDaysKey(todayKey, -i));
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
): Promise<GroupDetailData | null> {
  const supabase = createClient();
  const now = new Date();

  const [groupRes, memberRes, checkinRes, ledgerRes, propRes] =
    await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).single(),
      supabase
        .from("group_members")
        .select(
          "user_id, profile:profiles(username, display_name, avatar_url, show_stats, weekly_goal, quota_active_from, timezone, tier_confirmed, tier_provisional)",
        )
        .eq("group_id", groupId),
      supabase
        .from("checkins")
        .select("user_id, created_at, sport")
        .eq("group_id", groupId)
        .limit(5000),
      // Stakes ledger (Batch 4 §3) — debts with the debtor's name.
      supabase
        .from("stakes_ledger")
        .select(
          "id, debtor_user, stake_description, period_key, status, created_at, settled_at, debtor:profiles!stakes_ledger_debtor_user_fkey(username, display_name)",
        )
        .eq("group_id", groupId)
        .order("created_at", { ascending: false }),
      // Pending rule-change proposal (§5).
      supabase
        .from("rule_change_proposals")
        .select(
          "id, proposed_by, summary, approvals, proposer:profiles!rule_change_proposals_proposed_by_fkey(username, display_name)",
        )
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  const group = groupRes.data as Group | null;
  if (!group) return null;

  const checkins = checkinRes.data ?? [];
  const rows = memberRes.data ?? [];

  // Per-member time frames: today, the current Mon–Sun week (the app-wide
  // locked week definition — NOT a rolling 7-day window) and the trailing
  // 30 days, all resolved in EACH member's stored timezone so the numbers
  // here agree with the dashboard and with the member's own home screen.
  const tzByUid = new Map<string, string | null>();
  const todayKeyByUid = new Map<string, string>();
  const weekSetByUid = new Map<string, Set<string>>();
  const monthSetByUid = new Map<string, Set<string>>();
  for (const row of rows) {
    const uid = (row as { user_id: string }).user_id;
    const tz =
      (row as unknown as { profile: ProfileLite }).profile?.timezone ?? null;
    const todayK = dayKey(now, tz);
    tzByUid.set(uid, tz);
    todayKeyByUid.set(uid, todayK);
    weekSetByUid.set(uid, new Set(weekDayKeys(todayK)));
    monthSetByUid.set(uid, backKeys(todayK, 30));
  }

  // Group check-ins per member once — datesOf/daySetOf are hit several times
  // per member below (streaks, consistency, windows, pact alert), so repeated
  // full scans of up to 5000 rows add up.
  const datesByUid = new Map<string, string[]>();
  for (const c of checkins) {
    const uid = c.user_id as string;
    const arr = datesByUid.get(uid);
    if (arr) arr.push(c.created_at as string);
    else datesByUid.set(uid, [c.created_at as string]);
  }
  const datesOf = (uid: string) => datesByUid.get(uid) ?? [];
  const daySetByUid = new Map<string, Set<string>>();
  const daySetOf = (uid: string): Set<string> => {
    let s = daySetByUid.get(uid);
    if (!s)
      daySetByUid.set(uid, (s = workoutDaySet(datesOf(uid), tzByUid.get(uid))));
    return s;
  };
  /** Distinct days this member checked in within a member-frame key set. */
  const daysIn = (uid: string, set: Set<string> | undefined): number => {
    if (!set) return 0;
    const ds = daySetOf(uid);
    let n = 0;
    set.forEach((k) => {
      if (ds.has(k)) n++;
    });
    return n;
  };

  // Section B — per-member rows (privacy-aware).
  // Fix #7: the per-member STREAK is the member's PERSONAL (global) streak —
  // computed from ALL their check-ins + rest days via the gated RPCs, NOT from
  // this group's check-ins. A streak belongs to the person, not the group, so it
  // must not reset to 0 in a newly-joined group. The at-risk dot and the weekly
  // consistency ring stay GROUP-scoped (participation in this group).
  //
  // The batch RPCs (migration 20260702120000) fetch every visible member's
  // inputs in TWO round-trips total, replacing the old 2-per-member pattern.
  // Both are SECURITY DEFINER with the same privacy floor as the single-user
  // versions, so a hidden member still returns no rows to other viewers.
  const isVisible = (row: unknown): boolean => {
    const uid = (row as { user_id: string }).user_id;
    const profile = (row as { profile: ProfileLite }).profile;
    return uid === userId || profile?.show_stats !== false;
  };
  const statUids = rows
    .filter(isVisible)
    .map((row) => (row as { user_id: string }).user_id);
  const globalDatesByUid = new Map<string, string[]>();
  const restDaysByUid = new Map<string, string[]>();
  if (statUids.length > 0) {
    const [datesRes, restRes] = await Promise.all([
      supabase.rpc("member_checkin_dates_batch", { _user_ids: statUids }),
      supabase.rpc("member_rest_days_batch", { _user_ids: statUids }),
    ]);
    for (const r of (datesRes.data ?? []) as {
      user_id: string;
      created_at: string;
    }[]) {
      const arr = globalDatesByUid.get(r.user_id);
      if (arr) arr.push(r.created_at);
      else globalDatesByUid.set(r.user_id, [r.created_at]);
    }
    for (const r of (restRes.data ?? []) as {
      user_id: string;
      day: string;
    }[]) {
      const arr = restDaysByUid.get(r.user_id);
      if (arr) arr.push(r.day);
      else restDaysByUid.set(r.user_id, [r.day]);
    }
  }

  const members: LeaderEntry[] = rows.map((row) => {
    const uid = (row as { user_id: string }).user_id;
    const profile = (row as unknown as { profile: ProfileLite }).profile;
    const groupDaySet = daySetOf(uid);
    const isYou = uid === userId;
    const showStats = isYou || profile?.show_stats !== false;

    const streak = showStats
      ? computeQuotaStreak(globalDatesByUid.get(uid) ?? [], {
          weeklyGoal: profile?.weekly_goal ?? null,
          quotaActiveFromKey: profile?.quota_active_from ?? null,
          restDayKeys: restDaysByUid.get(uid) ?? [],
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
      checkedInToday: groupDaySet.has(todayKeyByUid.get(uid)!),
      daysThisWeek: showStats ? daysIn(uid, weekSetByUid.get(uid)) : 0,
      isYou,
      showStats,
      tier,
      weeklyGoal: profile?.weekly_goal ?? null,
    };
  });
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

  // Group consistency this week, goal-aware: each member contributes their
  // checked days (capped at their goal) against their goal, so a 4/week member
  // who hit 4 counts as complete rather than dragging the group under 100%.
  let earnedDays = 0;
  let possibleDays = 0;
  for (const row of rows) {
    const uid = (row as { user_id: string }).user_id;
    const profile = (row as unknown as { profile: ProfileLite }).profile;
    const goal = Math.min(7, Math.max(1, profile?.weekly_goal ?? 7));
    earnedDays += Math.min(daysIn(uid, weekSetByUid.get(uid)), goal);
    possibleDays += goal;
  }
  const consistencyPct = Math.round((earnedDays / Math.max(1, possibleDays)) * 100);

  // Totals + "most consistent" per window, each check-in resolved in its
  // owner's frame. `window` picks the per-member key set; null means all-time.
  type WindowKind = "week" | "month" | null;
  const setFor = (uid: string, kind: WindowKind) =>
    kind === "week"
      ? weekSetByUid.get(uid)
      : kind === "month"
        ? monthSetByUid.get(uid)
        : undefined;

  const totalIn = (kind: WindowKind) =>
    kind === null
      ? checkins.length
      : checkins.filter((c) => {
          const uid = c.user_id as string;
          const set = setFor(uid, kind);
          if (!set) return false;
          return set.has(
            dayKey(new Date(c.created_at as string), tzByUid.get(uid)),
          );
        }).length;

  const mostConsistentIn = (kind: WindowKind): WindowStat["mostConsistent"] => {
    let best: { name: string; days: number } | null = null;
    for (const row of rows) {
      const uid = (row as { user_id: string }).user_id;
      const profile = (row as unknown as { profile: ProfileLite }).profile;
      const isYou = uid === userId;
      const showStats = isYou || profile?.show_stats !== false;
      if (!showStats) continue; // never expose a hidden member's standing
      const days =
        kind === null ? daySetOf(uid).size : daysIn(uid, setFor(uid, kind));
      if (days > 0 && (!best || days > best.days)) {
        best = { name: nameOf(profile), days };
      }
    }
    return best;
  };

  const ledgerRows = ledgerRes.data;
  const allDebts: DebtEntry[] = (ledgerRows ?? []).map((r) => {
    const row = r as unknown as {
      id: string;
      debtor_user: string;
      stake_description: string;
      period_key: string;
      status: "outstanding" | "settled";
      created_at: string;
      settled_at: string | null;
      debtor: { username: string; display_name: string | null } | null;
    };
    return {
      id: row.id,
      debtorName: nameOf(row.debtor),
      debtorUserId: row.debtor_user,
      isYou: row.debtor_user === userId,
      stakeDescription: row.stake_description,
      periodKey: row.period_key,
      status: row.status,
      createdAt: row.created_at,
      settledAt: row.settled_at,
    };
  });

  const propRows = propRes.data;
  let proposal: ProposalView | null = null;
  const pr = (propRows ?? [])[0] as unknown as
    | {
        id: string;
        summary: string | null;
        approvals: string[] | null;
        proposer: { username: string; display_name: string | null } | null;
      }
    | undefined;
  if (pr) {
    const approvals = pr.approvals ?? [];
    const waiting = rows
      .map((row) => ({
        uid: (row as { user_id: string }).user_id,
        name: nameOf((row as unknown as { profile: ProfileLite }).profile),
      }))
      .filter((m) => !approvals.includes(m.uid))
      .map((m) => m.name);
    proposal = {
      id: pr.id,
      summary: pr.summary,
      proposerName: nameOf(pr.proposer),
      approvedCount: approvals.length,
      memberCount: rows.length,
      hasApproved: approvals.includes(userId),
      waitingNames: waiting,
    };
  }

  // Loud pact standing for the whole team (only when there's a stake on the line).
  let pactAlert: PactAlert | null = null;
  if (isPact(group) && group.stake_value && group.who_pays) {
    const target = group.workouts_per_week ?? 0;
    const allowed = group.allowed_disciplines ?? [];

    // Each member's CURRENT week (Sunday → Saturday) in their OWN timezone,
    // matching the debt evaluator's per-member frames (tzByUid from above).
    const weekStartByUid = new Map<string, string>();
    const weekEndByUid = new Map<string, string>();
    const daysElapsedByUid = new Map<string, number>(); // Sun=1 … Sat=7
    tzByUid.forEach((tz, uid) => {
      const todayK = dayKey(now, tz);
      const start = pactWeekStartKey(todayK);
      weekStartByUid.set(uid, start);
      weekEndByUid.set(uid, addDaysKey(start, 6));
      daysElapsedByUid.set(uid, (weekdayMon0(todayK) + 1) % 7 + 1);
    });

    // One pass over the check-ins: distinct qualifying day-keys per member,
    // each resolved in that member's frame.
    const weekDaysByUid = new Map<string, Set<string>>();
    for (const c of checkins) {
      const uid = (c as { user_id: string }).user_id;
      const start = weekStartByUid.get(uid);
      if (!start) continue;
      const sport = (c as { sport: string | null }).sport ?? null;
      if (!disciplineCounts(allowed, sport)) continue;
      const k = dayKey(new Date(c.created_at as string), tzByUid.get(uid));
      if (k < start || k > weekEndByUid.get(uid)!) continue;
      let s = weekDaysByUid.get(uid);
      if (!s) weekDaysByUid.set(uid, (s = new Set()));
      s.add(k);
    }

    // Breakers (owe the stake) from completed weeks — distinct per member.
    const brokeMap = new Map<string, { userId: string; name: string; isYou: boolean }>();
    for (const d of allDebts) {
      if (d.status !== "outstanding") continue;
      brokeMap.set(d.debtorUserId, {
        userId: d.debtorUserId,
        name: d.debtorName,
        isYou: d.isYou,
      });
    }

    // "Behind" = zero qualifying days this week, but only once a member has
    // burned more than their weekly rest allowance (so Monday isn't an alarm).
    const restAllowance = Math.max(0, 7 - target);
    const behind =
      target > 0
        ? members
            .filter(
              (m) =>
                m.showStats &&
                !brokeMap.has(m.userId) &&
                (daysElapsedByUid.get(m.userId) ?? 0) > restAllowance &&
                (weekDaysByUid.get(m.userId)?.size ?? 0) === 0,
            )
            .map((m) => ({ userId: m.userId, name: m.name, isYou: m.isYou }))
        : [];

    const broke = Array.from(brokeMap.values());
    if (broke.length > 0 || behind.length > 0) {
      pactAlert = { stake: group.stake_value, target, broke, behind };
    }
  }

  return {
    group,
    // Owner is the authority for admin actions (backfilled to the creator).
    isCreator: (group.owner_id ?? group.created_by) === userId,
    inviteLink: buildInviteLink(group.invite_code),
    proposal,
    pactAlert,
    debts: {
      outstanding: allDebts.filter((d) => d.status === "outstanding"),
      settled: allDebts.filter((d) => d.status === "settled"),
    },
    collectiveStreak: collective.count,
    collectiveState: collective.state,
    consistencyPct,
    members,
    windows: {
      week: { total: totalIn("week"), mostConsistent: mostConsistentIn("week") },
      month: { total: totalIn("month"), mostConsistent: mostConsistentIn("month") },
      all: { total: totalIn(null), mostConsistent: mostConsistentIn(null) },
    },
  };
}
