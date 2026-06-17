/**
 * Monday-anchored week math — the single source of truth for week boundaries
 * (Batch 5 Stage A). Pure, no DB, no React.
 *
 * LOCKED DECISION: a week runs Monday 00:00 → Sunday 23:59:59 in the user's
 * local timezone, regardless of signup day. Monday is day 0. Every consumer
 * (streak engine, heatmap "The Stack", weekly recap, quota counting,
 * leaderboard period) keys off this util — no ad-hoc week logic anywhere else.
 *
 * Day keys ("YYYY-MM-DD") are the interchange format. They compose cleanly with
 * the existing streak engine (lib/streaks localDateKey produces the same shape
 * for the device-local frame). When an IANA `tz` is supplied, the civil date is
 * resolved in that timezone — used server-side (e.g. notification scheduling)
 * where the device frame isn't the user's frame. When omitted, the device-local
 * frame is used, matching the rest of the app's client-side date math.
 */

export type DayKey = string; // "YYYY-MM-DD"

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

/**
 * Civil calendar-day key (YYYY-MM-DD) for `date`. In `tz` if given (IANA name),
 * else the device-local frame. Matches lib/streaks.localDateKey for the no-tz
 * case so the two interoperate.
 */
export function dayKey(date: Date, tz?: string): DayKey {
  if (tz) return fmt(tz).format(date); // en-CA formats as YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseKey(key: DayKey): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/** Day-of-week for a civil day-key as 0=Mon … 6=Sun (tz-independent). */
export function weekdayMon0(key: DayKey): number {
  const { y, m, d } = parseKey(key);
  // getDay() is 0=Sun … 6=Sat for a local-midnight Date; shift so Mon=0.
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/** A day-key shifted by `n` days (handles month/year rollover via Date). */
export function addDaysKey(key: DayKey, n: number): DayKey {
  const { y, m, d } = parseKey(key);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dayKey(dt);
}

/** Monday (day 0) of the week containing `key`, as a day-key. */
export function getWeekStartKey(key: DayKey): DayKey {
  return addDaysKey(key, -weekdayMon0(key));
}

/** Sunday (day 6) of the week containing `key`, as a day-key. */
export function getWeekEndKey(key: DayKey): DayKey {
  return addDaysKey(getWeekStartKey(key), 6);
}

/** The Monday that STARTS the week after `date`'s week (quota activation, etc). */
export function nextWeekStartKey(date: Date, tz?: string): DayKey {
  return addDaysKey(getWeekStartKey(dayKey(date, tz)), 7);
}

/** The 7 day-keys (Mon→Sun) of the week containing `key`. */
export function weekDayKeys(key: DayKey): DayKey[] {
  const start = getWeekStartKey(key);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
}

/**
 * Number of whole Mon–Sun weeks between two day-keys, by week-start distance.
 * Same week → 0; consecutive weeks → 1. Sign follows a→b ordering.
 */
export function weeksBetweenKeys(aKey: DayKey, bKey: DayKey): number {
  const a = parseKey(getWeekStartKey(aKey));
  const b = parseKey(getWeekStartKey(bKey));
  const da = new Date(a.y, a.m - 1, a.d).getTime();
  const db = new Date(b.y, b.m - 1, b.d).getTime();
  return Math.round((db - da) / (7 * 24 * 60 * 60 * 1000));
}

// ---- Date-returning wrappers for UI that needs a Date object ----

/** Local Date at 00:00 on the Monday of `date`'s week (civil date via `tz`). */
export function getWeekStart(date: Date, tz?: string): Date {
  const { y, m, d } = parseKey(getWeekStartKey(dayKey(date, tz)));
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Local Date at 23:59:59.999 on the Sunday of `date`'s week. */
export function getWeekEnd(date: Date, tz?: string): Date {
  const { y, m, d } = parseKey(getWeekEndKey(dayKey(date, tz)));
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

/** Whole Mon–Sun weeks between two dates. */
export function weeksBetween(a: Date, b: Date, tz?: string): number {
  return weeksBetweenKeys(dayKey(a, tz), dayKey(b, tz));
}

/** Best-effort IANA timezone for the current device; "" if unavailable. */
export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}
