/**
 * Unit tests for the streak engine. Run with:  npx tsx lib/streaks.test.ts
 * Pure functions + injected `now` make these deterministic.
 */
import assert from "node:assert";
import {
  computePersonalStreak,
  computeLongestStreak,
  computeGroupStreak,
} from "./streaks";

// Fixed reference "now": Mon Jun 15 2026, local noon.
const NOW = new Date(2026, 5, 15, 12, 0, 0);
// n days before NOW, at 08:00 local (a plausible workout time).
const ago = (n: number) => new Date(2026, 5, 15 - n, 8, 0, 0);

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
