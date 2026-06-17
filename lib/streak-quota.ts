/**
 * Streak Engine v2 — weekly-quota streaks (Batch 5 Stage C).
 *
 * SOURCE OF TRUTH = the weekly quota Q (target workouts/week, 1–7). A week runs
 * Mon–Sun local (see lib/week). Each week the user may miss up to `7 − Q` days
 * ("banked rest days").
 *
 * A COUNTING DAY keeps the streak alive: a day with a logged workout, OR a day
 * consumed as a banked rest. In the quota era this means EVERY day counts until
 * a break — so the streak is simply the number of consecutive days since the
 * last break. A perfect week therefore adds 7, whatever Q is; the TIER colour
 * (lib/tiers) disambiguates how hard two equal-length streaks were earned.
 *
 * THE BREAK RULE (precise): the streak breaks the moment hitting Q for the
 * current week becomes mathematically impossible — i.e. when
 *   (days remaining in the week) < (workouts still needed to reach Q).
 * Not on a rest day, not on a skip with slack left. Only on impossibility.
 *
 * AT-RISK: slack === 0 — all `7 − Q` misses are used and the user must train
 * every remaining day this week to keep the streak. One more miss breaks it.
 *
 * MIGRATION / GRACE (C5): before `quotaActiveFromKey` the OLD rules apply (a
 * logged day or a marked rest keeps the streak; a missed non-rest day breaks
 * it) so an existing user's number is preserved exactly and never breaks mid-
 * week on conversion. `quotaActiveFromKey` is always a Monday, so no week
 * straddles the two rulesets. Pass a null Q (no goal set yet) for pure grace.
 *
 * Pure + injectable `now`; rest days are cosmetic to the quota era and only
 * matter for the pre-quota grace window.
 */

import {
  dayKey,
  weekdayMon0,
  getWeekStartKey,
  addDaysKey,
  weekDayKeys,
  type DayKey,
} from "@/lib/week";

export type StreakState = "alive" | "at-risk" | "broken";

export type QuotaStreak = {
  /** Consecutive counting-days, ending today or yesterday. */
  count: number;
  state: StreakState;
  /** Workouts logged in the current Mon–Sun week. */
  weekWorkouts: number;
  /** Workouts still needed to reach Q this week (0 once met). */
  needed: number;
  /** Days left in the week, including today. */
  daysLeftInclToday: number;
  /** daysLeftInclToday − needed. 0 ⇒ at-risk; <0 ⇒ already impossible. */
  slack: number;
  /** Did the user log a workout today? */
  workedToday: boolean;
};

export type QuotaOpts = {
  /** Weekly goal 1–7, or null when the user hasn't set one (pure grace mode). */
  weeklyGoal: number | null;
  /** Monday (day-key) from which quota rules apply; null ⇒ never (all grace). */
  quotaActiveFromKey: DayKey | null;
  /** Marked rest days (day-keys) — only used in the pre-quota grace window. */
  restDayKeys?: string[];
  now?: Date;
};

/** Distinct local day-keys with at least one workout. */
export function workoutDaySet(dates: Array<string | number | Date>): Set<DayKey> {
  return new Set(dates.map((d) => dayKey(new Date(d))));
}

function classifyResolvedDay(
  k: DayKey,
  worked: boolean,
  weekWorkouts: number,
  quotaEra: boolean,
  weeklyGoal: number | null,
  restSet: Set<string>,
  streak: number,
): number {
  if (quotaEra && weeklyGoal != null) {
    if (worked) return streak + 1; // counting day
    const needed = Math.max(0, weeklyGoal - weekWorkouts);
    const daysAfter = 6 - weekdayMon0(k); // days left in week AFTER k
    // Banked rest (counting) while Q stays reachable; otherwise the break.
    return needed === 0 || daysAfter >= needed ? streak + 1 : 0;
  }
  // Pre-quota grace: logged day extends, marked rest bridges (no change),
  // a missed non-rest day breaks.
  if (worked) return streak + 1;
  if (restSet.has(k)) return streak;
  return 0;
}

/**
 * The user's personal quota streak as of `now`. Walks resolved days
 * (start → yesterday), then accounts for today (still an open day).
 */
export function computeQuotaStreak(
  dates: Array<string | number | Date>,
  opts: QuotaOpts,
): QuotaStreak {
  const now = opts.now ?? new Date();
  const todayKey = dayKey(now);
  const yesterdayKey = addDaysKey(todayKey, -1);
  const restSet = new Set(opts.restDayKeys ?? []);
  const workouts = workoutDaySet(dates);
  const { weeklyGoal, quotaActiveFromKey } = opts;

  // Current-week facts (drive state + ring), independent of the walk.
  const weekKeys = weekDayKeys(todayKey);
  const weekWorkoutsCurrent = weekKeys.filter(
    (k) => k <= todayKey && workouts.has(k),
  ).length;
  const daysLeftInclToday = 7 - weekdayMon0(todayKey);
  const workedToday = workouts.has(todayKey);
  const quotaEraNow =
    weeklyGoal != null &&
    quotaActiveFromKey != null &&
    getWeekStartKey(todayKey) >= quotaActiveFromKey;
  const needed = weeklyGoal != null ? Math.max(0, weeklyGoal - weekWorkoutsCurrent) : 0;
  const slack = daysLeftInclToday - needed;

  // Walk resolved days [start..yesterday]. Start at the earliest logged day so
  // the whole current chain is captured (capped naturally by history length).
  const sortedKeys = Array.from(workouts).sort();
  if (sortedKeys.length === 0 && restSet.size === 0) {
    return {
      count: 0,
      state: "broken",
      weekWorkouts: weekWorkoutsCurrent,
      needed,
      daysLeftInclToday,
      slack,
      workedToday: false,
    };
  }
  const startKey = sortedKeys[0] ?? yesterdayKey;

  let streak = 0;
  let weekWorkouts = 0;
  let curWeekStart = getWeekStartKey(startKey);
  let k = startKey;
  while (k <= yesterdayKey) {
    const wk = getWeekStartKey(k);
    if (wk !== curWeekStart) {
      curWeekStart = wk;
      weekWorkouts = 0;
    }
    const quotaEra =
      weeklyGoal != null && quotaActiveFromKey != null && wk >= quotaActiveFromKey;
    const worked = workouts.has(k);
    if (worked) weekWorkouts++;
    streak = classifyResolvedDay(
      k,
      worked,
      weekWorkouts,
      quotaEra,
      weeklyGoal,
      restSet,
      streak,
    );
    k = addDaysKey(k, 1);
  }
  const streakAtYesterday = streak;

  // Account for today (open day).
  let count: number;
  let state: StreakState;
  if (quotaEraNow && weeklyGoal != null) {
    if (workedToday) {
      count = streakAtYesterday + 1;
      state = "alive";
    } else if (slack < 0) {
      // Already impossible this week — broken regardless of past days.
      count = 0;
      state = "broken";
    } else if (needed === 0) {
      // Quota already met this week → today is a guaranteed banked rest, so it
      // counts now (this is what makes a perfect week add 7).
      count = streakAtYesterday + 1;
      state = "alive";
    } else {
      // Today still open; streak holds at yesterday's value. With no streak to
      // protect (count 0) there's nothing to be at-risk about → broken.
      count = streakAtYesterday;
      state = count === 0 ? "broken" : slack === 0 ? "at-risk" : "alive";
    }
  } else {
    // Grace / no goal: old-style today handling.
    if (workedToday) {
      count = streakAtYesterday + 1;
      state = "alive";
    } else if (restSet.has(todayKey)) {
      count = streakAtYesterday;
      state = "alive";
    } else if (streakAtYesterday > 0) {
      count = streakAtYesterday;
      state = "at-risk";
    } else {
      count = 0;
      state = "broken";
    }
  }

  return {
    count,
    state,
    weekWorkouts: weekWorkoutsCurrent,
    needed,
    daysLeftInclToday,
    slack,
    workedToday,
  };
}
