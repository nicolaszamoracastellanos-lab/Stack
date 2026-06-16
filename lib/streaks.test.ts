/**
 * Unit tests for the streak engine. Run with:  npx tsx lib/streaks.test.ts
 * Pure functions + injected `now` make these deterministic.
 */
import assert from "node:assert";
import {
  computePersonalStreak,
  computeLongestStreak,
  computeGroupStreak,
  localDateKey,
} from "./streaks";

// Fixed reference "now": Mon Jun 15 2026, local noon.
const NOW = new Date(2026, 5, 15, 12, 0, 0);
// n days before NOW, at 08:00 local (a plausible workout time).
const ago = (n: number) => new Date(2026, 5, 15 - n, 8, 0, 0);
// Day key n days before NOW (for rest days).
const restKey = (n: number) => localDateKey(ago(n));

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// ---- Personal streak ----
check("no check-ins => 0, broken", () => {
  assert.deepEqual(computePersonalStreak([], NOW), { count: 0, state: "broken" });
});

check("checked in today only => 1, alive", () => {
  assert.deepEqual(computePersonalStreak([ago(0)], NOW), {
    count: 1,
    state: "alive",
  });
});

check("today + yesterday + 2 days ago => 3, alive", () => {
  assert.deepEqual(computePersonalStreak([ago(0), ago(1), ago(2)], NOW), {
    count: 3,
    state: "alive",
  });
});

check("yesterday + 2 days ago, not today => 2, at-risk", () => {
  assert.deepEqual(computePersonalStreak([ago(1), ago(2)], NOW), {
    count: 2,
    state: "at-risk",
  });
});

check("last check-in 2 days ago => 0, broken", () => {
  assert.deepEqual(computePersonalStreak([ago(2), ago(3)], NOW), {
    count: 0,
    state: "broken",
  });
});

check("multiple check-ins same day count once", () => {
  assert.deepEqual(computePersonalStreak([ago(0), ago(0), ago(1)], NOW), {
    count: 2,
    state: "alive",
  });
});

check("gap breaks the run: today + 3 days ago => 1, alive", () => {
  assert.deepEqual(computePersonalStreak([ago(0), ago(3)], NOW), {
    count: 1,
    state: "alive",
  });
});

// ---- Longest streak ----
check("longest run is found across history", () => {
  // runs: [d5,d4,d3]=3 and [d1,d0]=2  => longest 3
  assert.equal(
    computeLongestStreak([ago(5), ago(4), ago(3), ago(1), ago(0)]),
    3,
  );
});

check("longest of empty is 0", () => {
  assert.equal(computeLongestStreak([]), 0);
});

// ---- Rest days (Section 9) ----
check("rest day today keeps the streak alive (protected)", () => {
  // Checked in yesterday + 2 days ago, didn't today, but marked today a rest day.
  assert.deepEqual(
    computePersonalStreak([ago(1), ago(2)], NOW, [restKey(0)]),
    { count: 2, state: "alive" },
  );
});

check("rest day bridges a gap in the current run", () => {
  // Today + 2 days ago checked in; yesterday was a rest day → 2, alive.
  assert.deepEqual(
    computePersonalStreak([ago(0), ago(2)], NOW, [restKey(1)]),
    { count: 2, state: "alive" },
  );
});

check("a real miss (no rest) still breaks the run", () => {
  assert.deepEqual(computePersonalStreak([ago(0), ago(2)], NOW), {
    count: 1,
    state: "alive",
  });
});

check("longest streak bridges rest days in history", () => {
  // d5,d4,[d3 rest],d2,[d1 rest],d0 → one continuous run of 4 check-ins.
  assert.equal(
    computeLongestStreak(
      [ago(5), ago(4), ago(2), ago(0)],
      [restKey(3), restKey(1)],
    ),
    4,
  );
});

// ---- Group streak ----
check("both members today+yesterday => 2, alive", () => {
  assert.deepEqual(
    computeGroupStreak([
      [ago(0), ago(1)],
      [ago(0), ago(1)],
    ], NOW),
    { count: 2, state: "alive" },
  );
});

check("one member missing today => 1, at-risk (yesterday complete)", () => {
  assert.deepEqual(
    computeGroupStreak([
      [ago(0), ago(1)],
      [ago(1)],
    ], NOW),
    { count: 1, state: "at-risk" },
  );
});

check("members never overlap => 0, broken", () => {
  assert.deepEqual(
    computeGroupStreak([[ago(0)], [ago(3)]], NOW),
    { count: 0, state: "broken" },
  );
});

check("no members => 0, broken", () => {
  assert.deepEqual(computeGroupStreak([], NOW), { count: 0, state: "broken" });
});

console.log(`\n${passed} streak tests passed.`);
