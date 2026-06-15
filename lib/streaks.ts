/**
 * Streak engine — the emotional core of Stack.
 *
 * All functions here are PURE and take an explicit `now` so they're trivially
 * unit-testable (see streaks.test.ts). Nothing in here touches the DB or React.
 *
 * TIMEZONE LIMITATION (Phase 1): days are bucketed using the DEVICE's local
 * timezone via the Date object's local getters. Two members in very different
 * timezones could therefore disagree about where a "day" boundary falls. That's
 * acceptable for Phase 1; a later phase can pin each user to a stored timezone.
 */

export type StreakState = "alive" | "at-risk" | "broken";

export type Streak = {
  /** Number of consecutive days, ending today or yesterday. */
  count: number;
  /**
   * alive   = checked in today (or, for groups, everyone did today)
   * at-risk = streak is alive but today is still open (last day was yesterday)
   * broken  = last qualifying day was 2+ days ago, or never
   */
  state: StreakState;
};

/** Local calendar-day key, e.g. "2026-06-15", in the device timezone. */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** A day key shifted by `deltaDays` (handles month/year rollover via Date). */
function shiftKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d); // local midnight
  dt.setDate(dt.getDate() + deltaDays);
  return localDateKey(dt);
}

/** Build the set of distinct local day keys from a list of timestamps. */
export function toDaySet(dates: Array<string | number | Date>): Set<string> {
  return new Set(dates.map((d) => localDateKey(new Date(d))));
}

/**
 * Core walk: from today (or yesterday if today is still open), count backward
 * while every day is present in `days`. Shared by personal and group streaks.
 */
function streakFromDaySet(days: Set<string>, now: Date): Streak {
  const todayKey = localDateKey(now);
  const yesterdayKey = shiftKey(todayKey, -1);

  let state: StreakState;
  let startKey: string;
  if (days.has(todayKey)) {
    state = "alive";
    startKey = todayKey;
  } else if (days.has(yesterdayKey)) {
    state = "at-risk";
    startKey = yesterdayKey;
  } else {
    return { count: 0, state: "broken" };
  }

  let count = 0;
  let k = startKey;
  while (days.has(k)) {
    count++;
    k = shiftKey(k, -1);
  }
  return { count, state };
}

/**
 * Personal streak: consecutive days, ending today or yesterday, on which the
 * user has at least one check-in.
 */
export function computePersonalStreak(
  checkinDates: Array<string | number | Date>,
  now: Date = new Date(),
): Streak {
  return streakFromDaySet(toDaySet(checkinDates), now);
}

/**
 * Longest streak ever: the maximum run of consecutive days the user checked in,
 * anywhere in their history.
 */
export function computeLongestStreak(
  checkinDates: Array<string | number | Date>,
): number {
  const keys = Array.from(toDaySet(checkinDates)).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    run = prev && shiftKey(prev, 1) === k ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = k;
  }
  return longest;
}

/**
 * Group collective streak: consecutive days on which EVERY current member
 * checked in. One member missing a day breaks it. Pass one array of check-in
 * timestamps per current member (members with zero check-ins => instantly
 * broken, which is correct).
 */
export function computeGroupStreak(
  memberCheckinDates: Array<Array<string | number | Date>>,
  now: Date = new Date(),
): Streak {
  if (memberCheckinDates.length === 0) return { count: 0, state: "broken" };

  const sets = memberCheckinDates.map((dates) => toDaySet(dates));
  // A day "counts" only if it appears in every member's set.
  const [first, ...rest] = sets;
  const completeDays = new Set<string>();
  for (const day of Array.from(first)) {
    if (rest.every((s) => s.has(day))) completeDays.add(day);
  }
  return streakFromDaySet(completeDays, now);
}
