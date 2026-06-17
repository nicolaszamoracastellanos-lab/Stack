/**
 * Unit tests for the Monday-anchored week util (Batch 5 Stage A).
 * Run with:  npx tsx lib/week.test.ts
 */
import assert from "node:assert";
import {
  dayKey,
  weekdayMon0,
  addDaysKey,
  getWeekStartKey,
  getWeekEndKey,
  weekDayKeys,
  weeksBetweenKeys,
  getWeekStart,
  getWeekEnd,
} from "./week";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

// Reference anchors. 2026-06-15 is a Monday; 2026-06-17 a Wednesday;
// 2026-06-21 a Sunday.
check("weekdayMon0: Monday => 0", () => {
  assert.equal(weekdayMon0("2026-06-15"), 0);
});
check("weekdayMon0: Wednesday => 2", () => {
  assert.equal(weekdayMon0("2026-06-17"), 2);
});
check("weekdayMon0: Sunday => 6", () => {
  assert.equal(weekdayMon0("2026-06-21"), 6);
});

check("getWeekStartKey: Wed-signup user's week starts Monday", () => {
  assert.equal(getWeekStartKey("2026-06-17"), "2026-06-15");
});
check("getWeekStartKey: Sunday belongs to the Monday that opened the week", () => {
  assert.equal(getWeekStartKey("2026-06-21"), "2026-06-15");
});
check("getWeekStartKey: Monday is its own start", () => {
  assert.equal(getWeekStartKey("2026-06-15"), "2026-06-15");
});
check("getWeekEndKey: week ends the following Sunday", () => {
  assert.equal(getWeekEndKey("2026-06-17"), "2026-06-21");
});

check("addDaysKey: rolls across month boundary", () => {
  assert.equal(addDaysKey("2026-06-30", 1), "2026-07-01");
  assert.equal(addDaysKey("2026-01-01", -1), "2025-12-31");
});

check("weekDayKeys: Mon→Sun, 7 entries", () => {
  assert.deepEqual(weekDayKeys("2026-06-17"), [
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-19",
    "2026-06-20",
    "2026-06-21",
  ]);
});

check("weeksBetweenKeys: same week => 0", () => {
  assert.equal(weeksBetweenKeys("2026-06-15", "2026-06-21"), 0);
});
check("weeksBetweenKeys: next week => 1", () => {
  assert.equal(weeksBetweenKeys("2026-06-17", "2026-06-24"), 1);
});
check("weeksBetweenKeys: four completed weeks", () => {
  assert.equal(weeksBetweenKeys("2026-06-01", "2026-06-29"), 4);
});

check("getWeekStart: Date lands on local Monday midnight", () => {
  const d = getWeekStart(new Date(2026, 5, 17, 14, 30)); // Wed afternoon
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 5);
  assert.equal(d.getDate(), 15);
  assert.equal(d.getHours(), 0);
  assert.equal(d.getMinutes(), 0);
});
check("getWeekEnd: Date lands on local Sunday end-of-day", () => {
  const d = getWeekEnd(new Date(2026, 5, 17, 14, 30));
  assert.equal(d.getDate(), 21);
  assert.equal(d.getHours(), 23);
});

check("dayKey: device-local matches YYYY-MM-DD", () => {
  assert.equal(dayKey(new Date(2026, 5, 17, 9, 0)), "2026-06-17");
});
check("dayKey: tz-aware resolves civil date in zone", () => {
  // 2026-06-17 03:00 UTC is still 2026-06-16 in New York (UTC-4).
  const d = new Date("2026-06-17T03:00:00Z");
  assert.equal(dayKey(d, "America/New_York"), "2026-06-16");
  assert.equal(dayKey(d, "UTC"), "2026-06-17");
});

console.log(`\n${passed} passed`);
