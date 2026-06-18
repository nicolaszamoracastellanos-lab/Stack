/**
 * Unit tests for the pact-debt evaluation. Run: npx tsx lib/pact-eval.test.ts
 */
import assert from "node:assert";
import { evaluatePactDebts, type PactCheckin } from "./pact-eval";
import type { Group } from "./types";

// NOW = Mon Jun 15 2026 → the last completed Sun→Sat week is Jun 7–13.
const NOW = new Date(2026, 5, 15, 12, 0, 0);
const ago = (n: number) => new Date(2026, 5, 15 - n, 8, 0, 0).toISOString();

function pactGroup(over: Partial<Group> = {}): Group {
  return {
    id: "g", name: "G", goal: null, invite_code: "X", created_by: "x", owner_id: "x", created_at: "",
    intention: null, motivation: null, end_goal: null, meaning: null,
    workouts_per_week: 3, allowed_disciplines: [], duration_type: "ongoing",
    duration_weeks: null, pact_start_date: "2026-06-01", pact_end_date: null,
    stake_type: "favor", stake_value: "dinner", who_pays: "breaker",
    ...over,
  };
}

// A hits the target (3 days), B misses (1), C misses (0) — all in Jun 7–13.
const checkins: PactCheckin[] = [
  { user_id: "A", created_at: ago(2), sport: "lifting" },
  { user_id: "A", created_at: ago(3), sport: "lifting" },
  { user_id: "A", created_at: ago(4), sport: "running" },
  { user_id: "B", created_at: ago(2), sport: "lifting" },
];
const members = ["A", "B", "C"];

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

check("breaker: everyone who misses the weekly target owes", () => {
  const debts = evaluatePactDebts(pactGroup(), members, checkins, NOW);
  const debtors = debts.map((d) => d.debtor_user).sort();
  assert.deepEqual(debtors, ["B", "C"]);
  assert.equal(debts[0].period_key, "2026-06-07");
  assert.equal(debts[0].stake_description, "dinner");
});

check("last_place: only the lowest member owes", () => {
  const debts = evaluatePactDebts(pactGroup({ who_pays: "last_place" }), members, checkins, NOW);
  assert.deepEqual(debts.map((d) => d.debtor_user), ["C"]);
});

check("allowed disciplines: non-allowed sports don't count", () => {
  // Only running counts → A's lifting days don't, so A now misses too.
  const debts = evaluatePactDebts(
    pactGroup({ allowed_disciplines: ["running"] }),
    members,
    checkins,
    NOW,
  );
  assert.deepEqual(debts.map((d) => d.debtor_user).sort(), ["A", "B", "C"]);
});

check("no stake / no who_pays → no debts", () => {
  assert.deepEqual(
    evaluatePactDebts(pactGroup({ stake_value: null, who_pays: null }), members, checkins, NOW),
    [],
  );
});

check("not a pact → no debts", () => {
  assert.deepEqual(
    evaluatePactDebts(pactGroup({ workouts_per_week: null }), members, checkins, NOW),
    [],
  );
});

console.log(`\n${passed} pact-eval tests passed.`);
