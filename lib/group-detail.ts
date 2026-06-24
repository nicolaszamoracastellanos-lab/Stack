import { createClient } from "@/lib/supabase/server";
import { nameOf } from "@/lib/feed";
import { inviteLink as buildInviteLink } from "@/lib/site";
import {
  computeGroupStreak,
  localDateKey,
  toDaySet,
  type StreakState,
} from "@/lib/streaks";
import { computeQuotaStreak } from "@/lib/streak-quota";
import { isPact, disciplineCounts } from "@/lib/pacts";
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
): Promise<GroupDetailData | null> {
  const supabase = createClient();
  const now = new Date();

  const [groupRes, memberRes, checkinRes] = await Promise.all([
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
        streak = computeQuotaStreak(globalDates, {
          weeklyGoal: profile?.weekly_goal ?? null,
          quotaActiveFromKey: profile?.quota_active_from ?? null,
          restDayKeys: restDays,
          tz: profile?.timezone ?? null,
          now,
        }).count;
      }
      const tier = (showStats
        ? profile?.tier_confirmed ?? profile?.tier_provisional ?? null
        : null) as TierKey | null;

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
        tier,
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

  // Stakes ledger (Batch 4 §3) — debts with the debtor's name.
  const { data: ledgerRows } = await supabase
    .from("stakes_ledger")
    .select(
      "id, debtor_user, stake_description, period_key, status, created_at, settled_at, debtor:profiles!stakes_ledger_debtor_user_fkey(username, display_name)",
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

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

  // Pending rule-change proposal (§5).
  const { data: propRows } = await supabase
    .from("rule_change_proposals")
    .select(
      "id, proposed_by, summary, approvals, proposer:profiles!rule_change_proposals_proposed_by_fkey(username, display_name)",
    )
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

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

    // Current week, Sunday → Saturday, matching the debt evaluator.
    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayMid);
    weekStart.setDate(todayMid.getDate() - todayMid.getDay());
    const weekKeys = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekKeys.add(localDateKey(d));
    }
    const weekQualifyingDays = (uid: string): number => {
      const days = new Set<string>();
      for (const c of checkins) {
        if ((c as { user_id: string }).user_id !== uid) continue;
        const sport = (c as { sport: string | null }).sport ?? null;
        if (!disciplineCounts(allowed, sport)) continue;
        const k = localDateKey(new Date(c.created_at as string));
        if (weekKeys.has(k)) days.add(k);
      }
      return days.size;
    };

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
    const daysElapsed = todayMid.getDay() + 1; // Sun=1 … Sat=7
    const restAllowance = Math.max(0, 7 - target);
    const behind =
      target > 0 && daysElapsed > restAllowance
        ? members
            .filter(
              (m) =>
                m.showStats &&
                !brokeMap.has(m.userId) &&
                weekQualifyingDays(m.userId) === 0,
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
      week: { total: totalIn(weekSet), mostConsistent: mostConsistentIn(weekSet) },
      month: { total: totalIn(monthSet), mostConsistent: mostConsistentIn(monthSet) },
      all: { total: totalIn(null), mostConsistent: mostConsistentIn(null) },
    },
  };
}
