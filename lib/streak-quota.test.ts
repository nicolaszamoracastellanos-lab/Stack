/**
 * Unit tests for the weekly-quota streak engine (Batch 5 Stage C).
 * Run with:  npx tsx lib/streak-quota.test.ts
 *
 * Calendar anchors (2026): 06-15 Mon, 06-16 Tue, 06-17 Wed, 06-18 Thu,
 * 06-19 Fri, 06-20 Sat, 06-21 Sun. 06-08 is the prior Monday.
 */
import assert from "node:assert";
import { computeQuotaStreak } from "./streak-quota";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// Workout timestamp for a given YYYY-MM-DD at 08:00 local.
const at = (key: string) => `${key}T08:00:00`;
const noonOf = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};
const PAST_MONDAY = "2026-06-08"; // quota active from here in most tests
// A perfect prior week (06-08 Mon … 06-14 Sun) so there's a streak to protect.
const PRIOR_WEEK = ["08", "09", "10", "11", "12", "13", "14"].map((d) =>
  at(`2026-06-${d}`),
);

// ---- The Q=5 worked example ----
check("Q=5: skip Mon+Tue → Wednesday is at-risk (slack 0)", () => {
  // Prior streak alive; nothing logged yet this week; today is Wed, still open.
  const r = computeQuotaStreak(PRIOR_WEEK, {
    weeklyGoal: 5,
    quotaActiveFromKey: PAST_MONDAY,
    now: noonOf("2026-06-17"),
  });
  assert.equal(r.needed, 5);
  assert.equal(r.daysLeftInclToday, 5); // Wed..Sun
  assert.equal(r.slack, 0);
  assert.equal(r.state, "at-risk");
  assert.equal(r.count, 9); // 7 (prior week) + Mon + Tue banked rests
});

check("Q=5: skip Mon+Tue+Wed → streak breaks on Wednesday (Thu sees broken)", () => {
  const r = computeQuotaStreak(PRIOR_WEEK, {
    weeklyGoal: 5,
    quotaActiveFromKey: PAST_MONDAY,
    now: noonOf("2026-06-18"), // Thursday, still nothing logged this week
  });
  assert.equal(r.slack < 0, true); // 4 days left, 5 needed
  assert.equal(r.state, "broken");
  assert.equal(r.count, 0);
});

check("Q=5: training Wednesday clears the at-risk state", () => {
  const r = computeQuotaStreak([at("2026-06-17")], {
    weeklyGoal: 5,
    quotaActiveFromKey: PAST_MONDAY,
    now: noonOf("2026-06-17"),
  });
  assert.equal(r.weekWorkouts, 1);
  assert.equal(r.needed, 4);
  assert.equal(r.slack, 1);
  assert.equal(r.state, "alive");
});

// ---- Perfect weeks add 7 regardless of Q ----
check("perfect fortnight (Q=5) → streak counts every day = 14", () => {
  const keys: string[] = [];
  for (let d = 8; d <= 21; d++) keys.push(at(`2026-06-${String(d).padStart(2, "0")}`));
  const r = computeQuotaStreak(keys, {
    weeklyGoal: 5,
    quotaActiveFromKey: PAST_MONDAY,
    now: noonOf("2026-06-21"),
  });
  assert.equal(r.count, 14);
  assert.equal(r.state, "alive");
});

check("banked rests count: Q=5 Mon–Fri then rest Sat+Sun stays alive", () => {
  const keys = ["15", "16", "17", "18", "19"].map((d) => at(`2026-06-${d}`));
  const r = computeQuotaStreak(keys, {
    weeklyGoal: 5,
    quotaActiveFromKey: PAST_MONDAY,
    now: noonOf("2026-06-21"), // Sunday, quota already met
  });
  assert.equal(r.needed, 0);
  assert.equal(r.state, "alive"); // resting on a met week never breaks
  // Mon..Sat resolved (6 counting days incl Sat banked rest); Sun open & met.
  assert.equal(r.count >= 6, true);
});

check("two equal streaks: Q=7 and Q=1 both reach 7 over a perfect week", () => {
  const keys: string[] = [];
  for (let d = 15; d <= 21; d++) keys.push(at(`2026-06-${d}`));
  const hard = computeQuotaStreak(keys, {
    weeklyGoal: 7,
    quotaActiveFromKey: "2026-06-15",
    now: noonOf("2026-06-21"),
  });
  // Q=1 user who logged once (Mon) and banked the other 6 days.
  const easy = computeQuotaStreak([at("2026-06-15")], {
    weeklyGoal: 1,
    quotaActiveFromKey: "2026-06-15",
    now: noonOf("2026-06-21"),
  });
  assert.equal(hard.count, 7);
  assert.equal(easy.count, 7); // 1 workout + 6 banked rests = 7 counting days
});

// ---- Migration grace (C5) ----
check("grace (no goal): missed non-rest day breaks like the old engine", () => {
  const keys = [at("2026-06-15"), at("2026-06-16")]; // Mon, Tue; skip Wed
  const r = computeQuotaStreak(keys, {
    weeklyGoal: null,
    quotaActiveFromKey: null,
    now: noonOf("2026-06-18"), // Thursday
  });
  assert.equal(r.state, "broken");
  assert.equal(r.count, 0);
});

check("grace: a marked rest day bridges the streak", () => {
  const keys = [at("2026-06-15"), at("2026-06-17")]; // Mon + Wed
  const r = computeQuotaStreak(keys, {
    weeklyGoal: null,
    quotaActiveFromKey: null,
    restDayKeys: ["2026-06-16"], // Tue rested
    now: noonOf("2026-06-17"),
  });
  assert.equal(r.count, 2); // Mon(1) bridge Tue Wed(2)
  assert.equal(r.state, "alive");
});

check("grace until next Monday: quota can't break the current week on conversion", () => {
  // Q set with activation NEXT Monday (06-22); this week (06-15..21) is grace.
  // The user logged Monday then marked rest days the rest of the week. Under
  // quota this would break (only 1 of 5 done); under grace the rests bridge it.
  const r = computeQuotaStreak([at("2026-06-15")], {
    weeklyGoal: 5,
    quotaActiveFromKey: "2026-06-22",
    restDayKeys: ["2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"],
    now: noonOf("2026-06-21"), // Sunday
  });
  assert.equal(r.state, "alive"); // grace honored — no mid-week quota break
  assert.equal(r.count, 1); // Mon logged; rests bridge but don't increment
});

// ---- STACK_FIXES2 A: the founder's Q=6 case + partial first week ----
const Q6_WEEK = ["15", "16", "17"].map((d) => at(`2026-06-${d}`)); // Mon/Tue/Wed
const Q6_OPTS = { weeklyGoal: 6, quotaActiveFromKey: "2026-06-15" }; // quota active

check("Q=6: Mon/Tue/Wed logged → Thursday is NOT at-risk (slack 1)", () => {
  const r = computeQuotaStreak(Q6_WEEK, { ...Q6_OPTS, now: noonOf("2026-06-18") });
  assert.equal(r.weekWorkouts, 3);
  assert.equal(r.needed, 3);
  assert.equal(r.daysLeftInclToday, 4); // Thu/Fri/Sat/Sun
  assert.equal(r.slack, 1);
  assert.equal(r.state, "alive");
});

check("Q=6: skip Thursday → Friday IS at-risk (slack 0)", () => {
  const r = computeQuotaStreak(Q6_WEEK, { ...Q6_OPTS, now: noonOf("2026-06-19") });
  assert.equal(r.slack, 0);
  assert.equal(r.state, "at-risk");
});

check("Q=6: skip Thursday+Friday → Saturday streak breaks", () => {
  const r = computeQuotaStreak(Q6_WEEK, { ...Q6_OPTS, now: noonOf("2026-06-20") });
  assert.equal(r.slack < 0, true);
  assert.equal(r.state, "broken");
});

check("partial first week: mid-week joiner is never at-risk or broken", () => {
  // Joined Wed, goal set Wed → quota activates next Monday (06-22). Logged Wed,
  // missed Thu. Friday must be protected: alive, streak holds, no at-risk/break.
  const r = computeQuotaStreak([at("2026-06-17")], {
    weeklyGoal: 6,
    quotaActiveFromKey: "2026-06-22",
    now: noonOf("2026-06-19"),
  });
  assert.equal(r.state, "alive");
  assert.equal(r.count, 1); // Wed counts, Thu bridges
});

check("timezone-aware: a late-UTC workout counts on the local day", () => {
  // 2026-06-17 02:00 UTC is still Tue 2026-06-16 in New York.
  const r = computeQuotaStreak(["2026-06-17T02:00:00Z"], {
    weeklyGoal: 6,
    quotaActiveFromKey: "2026-06-15",
    tz: "America/New_York",
    now: noonOf("2026-06-16"),
  });
  assert.equal(r.weekWorkouts, 1); // counts on Tuesday local, not Wednesday
});

console.log(`\n${passed} passed`);
