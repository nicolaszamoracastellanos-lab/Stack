/**
 * Tier system (Batch 5 Stage C, §C4) — the game layer on top of streaks.
 *
 * A tier is earned by weekly TRAINING FREQUENCY. Two people can hold the same
 * streak length; the tier colour shows how hard each is going. Structure and
 * colours are LOCKED by the user:
 *
 *   7×/week  Gold    warm gold     #F5C518
 *   6×/week  Silver  cool silver   #C7CDD6
 *   5×/week  Volt    Stack volt    #C6F806   (brand colour)
 *   4×/week  Bronze  bronze        #C77B3B
 *   3×/week  Purple  purple        #8B5CF6
 *   2×/week  Amber   amber         #F2B705
 *   1×/week  Slate   dark slate    #3A4250 + 1px volt outline
 *
 * RED is reserved exclusively for the at-risk streak alert — no tier uses red.
 * The "5× = volt" rationale is private and must NEVER surface in UI/store copy.
 *
 * Earning (locked):
 * - Everyone starts at level zero (no confirmed tier).
 * - Week 1 shows an immediate PROVISIONAL tier (instant gratification).
 * - A tier is CONFIRMED only after a full month (4 completed Mon–Sun weeks),
 *   from the average weekly frequency over those weeks.
 * - Climbing/dropping is slow + symmetric: the confirmed badge only moves on the
 *   monthly cadence, so one bad week never drops it. Weekly up/down feedback is
 *   delivered as projections (notifications), not badge changes.
 */

export type TierKey =
  | "gold"
  | "silver"
  | "volt"
  | "bronze"
  | "purple"
  | "amber"
  | "slate";

export type Tier = {
  key: TierKey;
  /** Weekly frequency this tier represents (1–7); also its rank. */
  frequency: number;
  hex: string;
  /** Thin outline so a near-black badge stays legible on the dark theme. */
  outline?: string;
};

// Ordered high → low.
export const TIERS: Tier[] = [
  { key: "gold", frequency: 7, hex: "#F5C518" },
  { key: "silver", frequency: 6, hex: "#C7CDD6" },
  { key: "volt", frequency: 5, hex: "#C6F806" },
  { key: "bronze", frequency: 4, hex: "#C77B3B" },
  { key: "purple", frequency: 3, hex: "#8B5CF6" },
  { key: "amber", frequency: 2, hex: "#F2B705" },
  { key: "slate", frequency: 1, hex: "#3A4250", outline: "#C6F806" },
];

const BY_FREQ = new Map(TIERS.map((t) => [t.frequency, t]));
const BY_KEY = new Map(TIERS.map((t) => [t.key, t]));

export function tierByKey(key: TierKey | null | undefined): Tier | null {
  return key ? BY_KEY.get(key) ?? null : null;
}

/** Tier for an integer weekly frequency. 0 (or less) → no tier (level zero). */
export function tierForFrequency(freq: number): Tier | null {
  const f = Math.max(0, Math.min(7, Math.round(freq)));
  return f < 1 ? null : BY_FREQ.get(f) ?? null;
}

/** Tier for an average weekly frequency (rounded to the nearest tier). */
export function tierForAverage(avg: number): Tier | null {
  return tierForFrequency(avg);
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export type TierEvaluation = {
  /** Confirmed tier — only set once at least one full month (4 weeks) is done. */
  confirmed: TierKey | null;
  /** Provisional tier — shown in the first 1–3 weeks before confirmation. */
  provisional: TierKey | null;
  completedWeeks: number;
};

/**
 * Evaluate tiers from a list of COMPLETED Mon–Sun week frequencies, oldest →
 * newest. Confirmation runs on fixed 4-week blocks from the start (NOT a rolling
 * window), so the confirmed badge only changes monthly. Weeks 1–3 yield a
 * provisional tier from the running average.
 */
export function evaluateTiers(weeklyFreqs: number[]): TierEvaluation {
  const completedWeeks = weeklyFreqs.length;
  const blocks = Math.floor(completedWeeks / 4);
  if (blocks >= 1) {
    const lastBlock = weeklyFreqs.slice((blocks - 1) * 4, blocks * 4);
    return {
      confirmed: tierForAverage(avg(lastBlock))?.key ?? null,
      provisional: null,
      completedWeeks,
    };
  }
  return {
    confirmed: null,
    provisional: completedWeeks
      ? tierForAverage(avg(weeklyFreqs))?.key ?? null
      : null,
    completedWeeks,
  };
}

export type TierProjection = {
  direction: "up" | "down" | "steady";
  /** The tier the current pace points toward (for the projection copy). */
  target: Tier | null;
};

/**
 * Weekly projection (notifications only — the badge doesn't change weekly).
 * Compares the in-progress/just-finished week's frequency to the confirmed tier.
 */
export function tierProjection(
  currentWeekFreq: number,
  confirmed: TierKey | null,
): TierProjection {
  const paceTier = tierForFrequency(currentWeekFreq);
  const base = tierByKey(confirmed);
  if (!base) return { direction: "steady", target: paceTier };
  const paceRank = paceTier?.frequency ?? 0;
  if (paceRank > base.frequency) return { direction: "up", target: paceTier };
  if (paceRank < base.frequency) return { direction: "down", target: paceTier };
  return { direction: "steady", target: base };
}
