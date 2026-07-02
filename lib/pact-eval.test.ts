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

// ---- Timezone-aware evaluation (explicit tz → deterministic on any machine).

check("tz: a late-Saturday check-in counts toward the member's local week", () => {
  // 2026-06-14T03:00Z is Sat Jun 13, 11pm in New York but Sun Jun 14 in UTC.
  // Week under test: Jun 7–13. NOW = Mon Jun 15 noon UTC (Monday in both tzs).
  const tzNow = new Date("2026-06-15T12:00:00Z");
  const late = "2026-06-14T03:00:00Z";
  const debts = evaluatePactDebts(
    pactGroup({ workouts_per_week: 1, pact_start_date: "2026-06-07" }),
    [
      { id: "ny", tz: "America/New_York" },
      { id: "utc", tz: "UTC" },
    ],
    [
      { user_id: "ny", created_at: late, sport: "lifting" },
      { user_id: "utc", created_at: late, sport: "lifting" },
    ],
    tzNow,
  );
  // NY's check-in lands on their Saturday → target met. UTC's lands on the
  // NEXT week's Sunday → week Jun 7–13 missed.
  assert.deepEqual(
    debts.map((d) => ({ uid: d.debtor_user, key: d.period_key })),
    [{ uid: "utc", key: "2026-06-07" }],
  );
});

check("tz: a week is only judged once it has ended in the member's frame", () => {
  // Sun Jun 14 00:00 UTC: Kiritimati (UTC+14) is already Sunday afternoon, so
  // their Jun 7–13 week has ended; Pago Pago (UTC-11) is still Saturday.
  const edgeNow = new Date("2026-06-14T00:00:00Z");
  const debts = evaluatePactDebts(
    pactGroup({ pact_start_date: "2026-06-07" }),
    [
      { id: "east", tz: "Pacific/Kiritimati" },
      { id: "west", tz: "Pacific/Pago_Pago" },
    ],
    [],
    edgeNow,
  );
  assert.deepEqual(
    debts.map((d) => ({ uid: d.debtor_user, key: d.period_key })),
    [{ uid: "east", key: "2026-06-07" }],
  );
});

console.log(`\n${passed} pact-eval tests passed.`);
