/**
 * Weekly-frequency extraction + tier evaluation glue (Batch 5 Stage C).
 *
 * Pure helpers that turn a user's check-in history into the per-completed-week
 * frequencies the tier engine consumes, plus the convenience wrapper that runs
 * evaluateTiers over them. Kept separate from lib/tiers (definitions/math) and
 * lib/streak-quota (streak math) so the server eval has one import.
 */

import {
  dayKey,
  getWeekStartKey,
  addDaysKey,
  weekdayMon0,
  type DayKey,
} from "@/lib/week";
import { evaluateTiers, type TierEvaluation } from "@/lib/tiers";

export type WeekFreq = { weekStart: DayKey; freq: number };

/**
 * Distinct-workout-days per COMPLETED Mon–Sun week, oldest → newest, starting
 * from `fromKey` (the quota activation Monday) up to but excluding the current,
 * still-in-progress week. Weeks with no activity are included as 0 so a gap
 * correctly drags the monthly average down.
 */
export function completedWeekFreqs(
  dates: Array<string | number | Date>,
  fromKey: DayKey,
  now: Date = new Date(),
): WeekFreq[] {
  const todayKey = dayKey(now);
  const currentWeekStart = getWeekStartKey(todayKey);
  const startWeek = getWeekStartKey(fromKey);
  if (startWeek >= currentWeekStart) return []; // no completed week yet

  // Count distinct workout days per week-start.
  const byWeek = new Map<DayKey, Set<DayKey>>();
  for (const d of dates) {
    const k = dayKey(new Date(d));
    if (k < startWeek || k >= currentWeekStart) continue; // only completed weeks
    const ws = getWeekStartKey(k);
    let s = byWeek.get(ws);
    if (!s) byWeek.set(ws, (s = new Set()));
    s.add(k);
  }

  const out: WeekFreq[] = [];
  for (let ws = startWeek; ws < currentWeekStart; ws = addDaysKey(ws, 7)) {
    out.push({ weekStart: ws, freq: byWeek.get(ws)?.size ?? 0 });
  }
  return out;
}

/** Distinct workout days in the CURRENT (in-progress) Mon–Sun week. */
export function currentWeekFreq(
  dates: Array<string | number | Date>,
  now: Date = new Date(),
): number {
  const todayKey = dayKey(now);
  const ws = getWeekStartKey(todayKey);
  const days = new Set<DayKey>();
  for (const d of dates) {
    const k = dayKey(new Date(d));
    if (k >= ws && k <= todayKey) days.add(k);
  }
  return days.size;
}

export function evaluateTiersFromHistory(
  dates: Array<string | number | Date>,
  quotaActiveFromKey: DayKey,
  now: Date = new Date(),
): TierEvaluation & { weekFreqs: WeekFreq[] } {
  const weekFreqs = completedWeekFreqs(dates, quotaActiveFromKey, now);
  return { ...evaluateTiers(weekFreqs.map((w) => w.freq)), weekFreqs };
}

/** True once the user has weekday `d` (0=Mon..6=Sun) — used for rest prompts. */
export function isPreferredRestWeekday(restDays: number[], key: DayKey): boolean {
  return restDays.includes(weekdayMon0(key));
}

/**
 * Forgiving default goal on conversion (C5): the most they clearly sustain.
 * Average distinct workout-days over the last up-to-4 completed weeks, floored,
 * clamped to 1–7. Defaults to 3 when there's no usable history.
 */
export function suggestGoal(
  dates: Array<string | number | Date>,
  now: Date = new Date(),
): number {
  const todayKey = dayKey(now);
  const currentWeekStart = getWeekStartKey(todayKey);
  const fourWeeksAgo = addDaysKey(currentWeekStart, -28);
  const freqs = completedWeekFreqs(dates, fourWeeksAgo, now);
  const active = freqs.filter((f) => f.freq > 0);
  if (active.length === 0) return 3;
  const avg = active.reduce((a, b) => a + b.freq, 0) / active.length;
  return Math.max(1, Math.min(7, Math.floor(avg)));
}
