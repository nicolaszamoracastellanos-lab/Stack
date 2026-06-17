/**
 * Unit tests for the tier system (Batch 5 Stage C §C4).
 * Run with:  npx tsx lib/tiers.test.ts
 */
import assert from "node:assert";
import {
  tierForFrequency,
  evaluateTiers,
  tierProjection,
} from "./tiers";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

check("frequency → tier mapping (locked colours)", () => {
  assert.equal(tierForFrequency(7)?.key, "gold");
  assert.equal(tierForFrequency(5)?.key, "volt");
  assert.equal(tierForFrequency(5)?.hex, "#C6F806");
  assert.equal(tierForFrequency(1)?.key, "slate");
  assert.equal(tierForFrequency(1)?.outline, "#C6F806");
  assert.equal(tierForFrequency(0), null); // level zero
});

check("no tier uses red", () => {
  // sanity: none of the hexes are a pure-red family value
  for (const t of [1, 2, 3, 4, 5, 6, 7]) {
    const hex = tierForFrequency(t)!.hex.toLowerCase();
    assert.notEqual(hex, "#ff0000");
  }
});

check("week 1 → provisional tier, no confirmed", () => {
  const e = evaluateTiers([5]); // one completed week at 5×
  assert.equal(e.provisional, "volt");
  assert.equal(e.confirmed, null);
  assert.equal(e.completedWeeks, 1);
});

check("three weeks → still provisional from the running average", () => {
  const e = evaluateTiers([5, 4, 6]); // avg 5 → volt
  assert.equal(e.provisional, "volt");
  assert.equal(e.confirmed, null);
});

check("a full month (4 weeks) confirms from the block average", () => {
  const e = evaluateTiers([5, 5, 5, 5]); // avg 5 → volt confirmed
  assert.equal(e.confirmed, "volt");
  assert.equal(e.provisional, null);
});

check("one bad week never drops a confirmed tier (still mid-month)", () => {
  // 4 weeks at 6× confirmed Silver, then a single 2× week — block 2 incomplete,
  // so the confirmed tier is still the first block's Silver.
  const e = evaluateTiers([6, 6, 6, 6, 2]);
  assert.equal(e.confirmed, "silver");
});

check("a full lower month steps the confirmed tier down (symmetric)", () => {
  // Block 1 Silver (6×), block 2 averages 3× → Purple confirmed.
  const e = evaluateTiers([6, 6, 6, 6, 3, 3, 3, 3]);
  assert.equal(e.confirmed, "purple");
});

check("projection: going harder than the confirmed tier trends up", () => {
  const p = tierProjection(6, "volt"); // pace 6× vs confirmed Volt(5)
  assert.equal(p.direction, "up");
  assert.equal(p.target?.key, "silver");
});

check("projection: a lighter week trends down", () => {
  const p = tierProjection(3, "volt");
  assert.equal(p.direction, "down");
  assert.equal(p.target?.key, "purple");
});

console.log(`\n${passed} passed`);
