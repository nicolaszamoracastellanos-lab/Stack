# Stack — Update Batch 4: Group Pacts (Identity, Rules & Stakes)

> Turning groups from containers into pacts: a "why" plus rules plus stakes. This is the feature that gives Stack its soul. Save as `STACK_BATCH4.md` in the project root and point Claude Code at it.

---

## How to use this document

Save as `STACK_BATCH4.md` in your project root. In Claude Code:

> Read STACK_BATCH4.md in full and build it section by section, confirming each works before the next. Use existing design tokens, the existing i18n system (every string EN and ES, natural Spanish), and the Supabase CLI migration workflow for all schema changes. Show me the pact setup flow and the "broken pact" moment before wiring the rest.

---

## The vision for this batch

Right now a Stack group is just a container with a feed. This batch turns it into a **pact**: a group with a shared why, a set of rules everyone agreed to, and stakes for breaking them. Two layers:

1. **Identity (optional, the soul):** the group's intention, motivation, end goal, and meaning. Why does this group exist.
2. **Rules + stakes (the teeth):** how many workouts a week, which disciplines count, what's bet, who pays, how long the challenge runs.

The tone is **playful and roasting**, not punishing. Breaking the pact is a moment for friendly trash talk among friends, not a cold failure screen. Light, social, fun. This is critical: research shows real stakes attached to streaks can feel brutal and drive people away, so the tone must keep it a game between friends.

**Money model: honor system only, for now.** The app TRACKS who owes what; people settle it themselves (Venmo, cash, dinner, whatever). Stack does NOT hold, move, or process any real money in this batch. Architect a clean hook for real money as a future phase, but do not build payment rails. This keeps Stack out of payment processing and gambling-regulation territory entirely.

---

## 1. The identity layer (optional)

When creating or editing a group, offer an optional identity section. A group works fine without it, but groups that want meaning can add:

- **Group name** (already exists).
- **Intention / why:** a short statement of why this group exists ("Get shredded for Nico's wedding", "Stop making excuses", "Marathon prep crew").
- **Motivation:** what's driving the group, the deeper reason.
- **End goal:** the concrete target ("Lose 10kg by November", "Run a sub-2hr half").
- **Meaning:** what this group means to its members (free text, optional).

Keep these optional and skippable. Surface them on the group detail page as a clean "About this pact" section when present. Don't force a casual group through a heavy setup; let serious crews build identity if they want it.

## 2. The rules engine

When creating a group OR upgrading an existing group into a pact, the group admin sets rules. The group is a flexible pact-builder, not a rigid template. Rules:

- **Workouts per week (required for a pact):** how many check-ins per week each member must hit (e.g., 5). Rest days are simply the remainder, do NOT add a separate rest-day setting. 5 workouts a week means 2 rest days, implicitly. The app tracks whether each member hits the weekly target.
- **Allowed disciplines (required):** which sports/disciplines count toward the pact. A multi-select from the full sport list. The group can allow one discipline ("lifting only"), several ("lifting, running, padel"), or all. A check-in only counts toward the pact if its sport is in the allowed list. This means the check-in's sport field (from Batch 3) is what validates a workout against the pact.
- **Challenge duration (required):** the group chooses how long the pact runs. Options: a fixed period (e.g., 4 weeks, 8 weeks, custom number of weeks) or ongoing/indefinite until someone breaks it. Let the group pick. If fixed, show the end date and what happens at the end (it can renew or close).
- **The stake (optional but core):** what's bet. The group picks from:
  - **Money amount** (honor system: "$20", "$50"). Tracked, not processed.
  - **A real-world favor** ("buys dinner", "does the dishes", "buys coffee").
  - **Custom** ("loser wears a chicken suit to the gym"), free text.
  - The group sets this when creating the pact.
- **Who pays (required if there's a stake):** the group chooses the rule:
  - Only the member who breaks the streak/misses the weekly target pays (the gentlest, your default idea).
  - Anyone who misses the weekly target pays.
  - Last place each cycle pays.
  - Surface these clearly with plain-language descriptions so the group picks intentionally.

Show a clean **pact summary** once set: "5 workouts/week · Lifting & Running · 8 weeks · Loser buys dinner · Only the breaker pays." This is the group's contract, shown prominently on the group page.

## 3. Tracking the pact + the stakes ledger

- The app continuously tracks each member against the rules: are they hitting their weekly workout target with allowed disciplines.
- When a member breaks the rule (per the group's "who pays" setting), they owe the stake to the group (or to whoever the rule specifies).
- Maintain a **stakes ledger** per group: who owes what to whom, with the reason ("Missed week of Mar 3, owes dinner"). This is honor-system tracking, the app records the debt, members settle it themselves and can mark it settled.
- Add a way to **mark a debt as paid/settled** (the owed person or the group admin confirms). Once settled, it moves to a settled history.
- Show the ledger on the group detail page: outstanding debts up top (with playful framing), settled history below.

## 4. The "broken pact" moment (playful roasting tone)

When someone breaks the pact, this is a social moment, not a failure screen. Make it fun.

- Notify the group with playful, roasting copy (bilingual, and write genuinely funny natural Spanish too). Examples of the energy: "Nico missed leg day. He owes everyone dinner. 🍗", "Someone broke the chain... and it's Oscar. Pay up. 💸". Rotate a set of cheeky lines so it's not repetitive.
- Show it in the feed and/or as a group notification, tag the person, state what they owe.
- Keep it light and social, never shaming or cold. The person who broke it should feel roasted by friends, not punished by an app. No harsh red "YOU FAILED" full-screen.
- The person who broke it sees a slightly self-aware version ("You broke the pact. Time to pay up. 😅") with a clear path to see what they owe.

## 5. Changing rules: unanimous agreement

Rules cannot be changed unilaterally mid-challenge. Changing any rule requires the whole group to agree.

- Build a lightweight "propose a change" flow: any member (or just the admin, your call, recommend admin-proposes) proposes a rule change. Every other member must approve it.
- Show the proposal to all members with approve/reject. The change only takes effect when everyone approves. If anyone rejects, the rule stays as-is.
- Show the proposal's status ("3 of 4 approved, waiting on Oscar").
- This makes rule changes a real social contract, which adds weight and fairness. Surface pending proposals prominently on the group page.

## 6. Schema and data

Via CLI migration, add what's needed:
- Group identity fields (intention, motivation, end_goal, meaning), all nullable/optional.
- Pact rules: workouts_per_week, allowed_disciplines (array), duration type + length + start/end dates, stake type + value, who_pays rule.
- A stakes ledger table (id, group_id, debtor_user, owed_to, reason, stake_description, status [outstanding/settled], created_at, settled_at).
- A rule-change-proposals table (id, group_id, proposed_by, proposed_changes, approvals, status, created_at).
- RLS so only group members see and act on their group's pact data.

## Guardrails — not in this batch

Do not build: real money holding/processing/escrow (honor system only; leave a clean `// FUTURE: real money` hook), trainer tools, wearable integrations. Do not turn the roast into anything mean-spirited or harassing, keep the tone friendly. Leave clear comments where future hooks go.

## Acceptance

- A group can optionally add identity (intention, motivation, end goal, meaning), shown as "About this pact" when present, skippable.
- A group admin can set pact rules: workouts/week (rest days implicit), allowed disciplines, duration (fixed or ongoing), stake (money/favor/custom), and who pays.
- A clean pact summary shows on the group page.
- Check-ins are validated against the pact (only allowed disciplines count toward the weekly target).
- When a member breaks the pact per the group's rule, they owe the stake; it's recorded in the group's stakes ledger.
- Debts can be marked settled and move to history. No real money moves through the app.
- The broken-pact moment uses playful, roasting, bilingual copy, never shaming or cold.
- Changing any rule requires unanimous group approval via a propose-and-approve flow with visible status.
- All bilingual, schema via CLI migration, dark + volt aesthetic consistent.

Built for Nico Zamora C.
