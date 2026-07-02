import { dayKey, addDaysKey, weekdayMon0, type DayKey } from "@/lib/week";
import { disciplineCounts, isPact } from "@/lib/pacts";
import type { Group } from "@/lib/types";

export type PactCheckin = { user_id: string; created_at: string; sport: string | null };

/** A pact participant with their IANA timezone (null → server/device frame). */
export type PactMember = { id: string; tz: string | null };

export type PactDebt = {
  debtor_user: string;
  period_key: string; // week start day-key — dedupes one debt per member per week
  stake_description: string;
};

/**
 * Sunday (day 0 of a PACT week) of the week containing `key`. Pact weeks are
 * Sunday→Saturday — locked by the ledger's existing period_keys, which are
 * Sunday dates — unlike the Monday-anchored app weeks in lib/week.
 */
export function pactWeekStartKey(key: DayKey): DayKey {
  return addDaysKey(key, -((weekdayMon0(key) + 1) % 7));
}

/**
 * Evaluate completed pact weeks and return the debts that SHOULD exist (Batch 4
 * §3). Pure + on-demand (no state): the caller upserts these into the ledger
 * idempotently (unique on group_id+debtor+period_key). Only produces debts when
 * the pact has a stake + who_pays rule.
 *
 * - breaker / any_misser: every member who missed their weekly target owes.
 * - last_place: only the member(s) with the fewest qualifying days that week owe.
 *
 * Timezone-aware: each member's check-ins resolve to civil days in THEIR
 * timezone, and a week only counts against them once it has fully ended in that
 * frame. Members without a timezone fall back to the server/device frame (the
 * pre-timezone behavior). last_place compares members, so it waits until the
 * week has ended for everyone. Plain member-id strings are accepted for
 * convenience (tests, legacy callers) and mean "no timezone".
 *
 * Weeks are Sunday→Saturday, evaluated only within the pact's active period.
 */
export function evaluatePactDebts(
  group: Group,
  members: Array<string | PactMember>,
  checkins: PactCheckin[],
  now: Date,
): PactDebt[] {
  if (!isPact(group) || !group.stake_value || !group.who_pays) return [];
  if (!group.pact_start_date) return [];
  const target = group.workouts_per_week ?? 0;
  const allowed = group.allowed_disciplines ?? [];
  const stake = group.stake_value;

  const mems: PactMember[] = members.map((m) =>
    typeof m === "string" ? { id: m, tz: null } : m,
  );
  if (mems.length === 0) return [];

  // First pact-week Sunday on/after the pact start (dates are day-keys already;
  // "YYYY-MM-DD" keys compare correctly as strings).
  let firstSunday = pactWeekStartKey(group.pact_start_date);
  if (firstSunday < group.pact_start_date) firstSunday = addDaysKey(firstSunday, 7);
  const endKey = group.pact_end_date ?? null;

  // Each member's civil frame: distinct qualifying day-keys in their own
  // timezone, plus the Sunday starting their CURRENT (still open) week.
  const tzById = new Map(mems.map((m) => [m.id, m.tz]));
  const daysById = new Map<string, Set<DayKey>>(mems.map((m) => [m.id, new Set()]));
  for (const c of checkins) {
    const days = daysById.get(c.user_id);
    if (!days || !disciplineCounts(allowed, c.sport)) continue;
    days.add(dayKey(new Date(c.created_at), tzById.get(c.user_id)));
  }
  const currentSundayById = new Map(
    mems.map((m) => [m.id, pactWeekStartKey(dayKey(now, m.tz))]),
  );

  // How far to walk: last_place compares members, so only weeks ended for
  // EVERYONE; breaker/any_misser judges each member in their own ended weeks.
  const sundays: DayKey[] = [];
  currentSundayById.forEach((s) => sundays.push(s));
  sundays.sort();
  const horizon =
    group.who_pays === "last_place" ? sundays[0] : sundays[sundays.length - 1];

  const countIn = (uid: string, wStart: DayKey): number => {
    const days = daysById.get(uid)!;
    let n = 0;
    for (let i = 0; i < 7; i++) if (days.has(addDaysKey(wStart, i))) n++;
    return n;
  };

  const debts: PactDebt[] = [];
  for (
    let wStart = firstSunday;
    addDaysKey(wStart, 7) <= horizon; // week has fully ended
    wStart = addDaysKey(wStart, 7)
  ) {
    if (endKey && wStart > endKey) break; // outside the pact period

    let debtors: string[];
    if (group.who_pays === "last_place") {
      const counts = mems.map((m) => ({ uid: m.id, n: countIn(m.id, wStart) }));
      const min = Math.min(...counts.map((c) => c.n));
      debtors = counts.filter((c) => c.n === min).map((c) => c.uid);
    } else {
      // breaker / any_misser
      debtors = mems
        .filter((m) => addDaysKey(wStart, 7) <= currentSundayById.get(m.id)!)
        .filter((m) => countIn(m.id, wStart) < target)
        .map((m) => m.id);
    }

    for (const uid of debtors) {
      debts.push({ debtor_user: uid, period_key: wStart, stake_description: stake });
    }
  }
  return debts;
}
