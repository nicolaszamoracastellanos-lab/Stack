import { localDateKey } from "@/lib/streaks";
import { disciplineCounts, isPact } from "@/lib/pacts";
import type { Group } from "@/lib/types";

export type PactCheckin = { user_id: string; created_at: string; sport: string | null };

export type PactDebt = {
  debtor_user: string;
  period_key: string; // week start day-key — dedupes one debt per member per week
  stake_description: string;
};

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Distinct qualifying days (allowed discipline) a member logged in [start, start+6]. */
function qualifyingDays(
  checkins: PactCheckin[],
  uid: string,
  allowed: string[],
  weekStart: Date,
): number {
  const keys = new Set<string>();
  for (let i = 0; i < 7; i++) keys.add(localDateKey(addDays(weekStart, i)));
  const days = new Set<string>();
  for (const c of checkins) {
    if (c.user_id !== uid) continue;
    if (!disciplineCounts(allowed, c.sport)) continue;
    const k = localDateKey(new Date(c.created_at));
    if (keys.has(k)) days.add(k);
  }
  return days.size;
}

/**
 * Evaluate completed pact weeks and return the debts that SHOULD exist (Batch 4
 * §3). Pure + on-demand (no cron): the caller upserts these into the ledger
 * idempotently (unique on group_id+debtor+period_key). Only produces debts when
 * the pact has a stake + who_pays rule.
 *
 * - breaker / any_misser: every member who missed their weekly target owes.
 * - last_place: only the member(s) with the fewest qualifying days that week owe.
 *
 * Weeks are Sunday→Saturday, evaluated only after they fully end and only within
 * the pact's active period.
 */
export function evaluatePactDebts(
  group: Group,
  memberIds: string[],
  checkins: PactCheckin[],
  now: Date,
): PactDebt[] {
  if (!isPact(group) || !group.stake_value || !group.who_pays) return [];
  if (!group.pact_start_date) return [];
  const target = group.workouts_per_week ?? 0;
  const allowed = group.allowed_disciplines ?? [];

  // Current week start (Sunday), and the first Sunday on/after the pact start.
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const thisSunday = addDays(today, -today.getDay());

  const [py, pm, pd] = group.pact_start_date.split("-").map(Number);
  const startDate = new Date(py, pm - 1, pd);
  let firstSunday = addDays(startDate, -startDate.getDay());
  if (firstSunday < startDate) firstSunday = addDays(firstSunday, 7);

  const endDate = group.pact_end_date
    ? (() => {
        const [ey, em, ed] = group.pact_end_date!.split("-").map(Number);
        return new Date(ey, em - 1, ed);
      })()
    : null;

  const debts: PactDebt[] = [];
  for (
    let wStart = firstSunday;
    addDays(wStart, 7) <= thisSunday; // week has fully ended
    wStart = addDays(wStart, 7)
  ) {
    if (endDate && wStart > endDate) break; // outside the pact period
    const periodKey = localDateKey(wStart);

    const counts = memberIds.map((uid) => ({
      uid,
      n: qualifyingDays(checkins, uid, allowed, wStart),
    }));

    let debtors: string[];
    if (group.who_pays === "last_place") {
      const min = Math.min(...counts.map((c) => c.n));
      debtors = counts.filter((c) => c.n === min).map((c) => c.uid);
    } else {
      // breaker / any_misser
      debtors = counts.filter((c) => c.n < target).map((c) => c.uid);
    }

    for (const uid of debtors) {
      debts.push({
        debtor_user: uid,
        period_key: periodKey,
        stake_description: group.stake_value,
      });
    }
  }
  return debts;
}
