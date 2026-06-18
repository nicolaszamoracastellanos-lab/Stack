# STACK_BATCH6 — Notification Center, Combined Feed, Chat Rebuild, Mentions

**For:** Claude Code
**App:** Stack — private, small-group fitness accountability web app
**Stack:** Next.js + Supabase + Vercel. Bilingual EN/ES. Dark/intense theme, volt accent `#C6F806`.
**Live at:** stack-one-tawny.vercel.app
**Builds on:** all shipped batches through STACK_BATCH5, STACK_FOUNDER_MODE, STACK_FIXES2.

**Standing rules (apply to everything):** no em dashes in any copy; every new user-facing string in English AND Spanish; all schema changes via Supabase CLI migrations; never a silent error state (show retry/error UI); every destructive action needs a confirmation dialog.

---

## 0. Scope, order, and locked decisions

This batch is four features. Build them in this order; each must ship and stand alone:
1. **Stage 1 — Notifications model + in-app notification center** (foundation; the feed/chat/mentions all feed into it).
2. **Stage 2 — Home combined "All Activity" feed** (the headline feature).
3. **Stage 3 — Group chat rebuild + unread badge.**
4. **Stage 4 — Mentions / tagging** in comments and chat (depends on 1, 2, 3 existing).

**Locked decisions:**
- **One source of truth for notifications.** A single `notifications` table backs BOTH the in-app notification center AND the push sender. Every notifiable event inserts one row and (when push is possible) sends one push from that same row. Do not build two parallel systems.
- **The combined feed is your-groups-only.** It aggregates posts from groups the user is already in. It is NOT a public feed, NOT public profiles, NOT following. Do not reopen any of that.
- **Tagging is group-scoped.** A user can only mention people who are members of the relevant group. In a combined-feed comment, taggable people = members of that post's group.
- **Reuse existing components** (post cards, reactions, comments, tier badges, realtime) rather than rebuilding them.

---

## STAGE 1 — Notifications model + notification center

### 1.1 Data model
- Create `notifications`: `id`, `recipient_id` (user), `type`, `actor_id` (who caused it, nullable for system), `group_id` (nullable), `target_type` (post / comment / chat_message / profile / group / tier / streak), `target_id` (nullable), `data` (jsonb for rendering, e.g. names/snippets), `read_at` (nullable), `created_at`.
- RLS: a user can only read/update their own rows (`recipient_id = auth.uid()`). No cross-user reads.
- Unread = `read_at IS NULL`.

### 1.2 Event types (insert a row for each)
- `reaction` — someone reacted to your check-in
- `comment` — someone commented on your check-in
- `mention` — someone tagged you (Stage 4)
- `nudge` — someone nudged you
- `group_join` — someone joined your group
- `group_post` — a group member posted (cap at one per member per day to avoid spam)
- `tier_change` — your confirmed tier changed
- `tier_projection` — weekly up/down projection
- `at_risk` — you are about to lose your streak
- `invite_accepted` — someone accepted your group invite

Drop nothing silently: if push can't be delivered (e.g. iOS Safari not installed), the in-app notification row still exists so the user sees it in the center.

### 1.3 Unify with push
- Wherever Batch 5 currently sends a push, refactor so the flow is: **insert notification row → if recipient has a valid push subscription, send push from that row.** Same copy, localized EN/ES to the recipient's language.
- The founder test tools (STACK_FOUNDER_MODE) should now also create a visible notification row when firing test events, so the center can be tested too.

### 1.4 Notification center UI (placement modeled on Strava/Instagram)
- A **bell icon in the top app bar** on Home, with a **red unread count badge** (show a dot if count is 0 vs hidden; show number up to e.g. 99+).
- Tapping opens a **full-screen Activity list**, newest first, sectioned into Today / Earlier.
- Each row: actor avatar + tier badge, a localized one-line description, relative timestamp, and it is **tappable to deep-link to its target** (the post, comment thread, chat, profile, or group).
- **Mark read:** opening the center marks visible items read (set `read_at`); the unread count clears accordingly. Tapping an item also marks it read.
- Empty state: friendly, on-brand, EN/ES.
- Optional polish (not required): group similar items ("X and 2 others reacted").

**Acceptance:** a reaction, comment, nudge, join, and tier change each produce a notification row that appears in the center, deep-links correctly, and clears the unread count when read. The same events still push where push is possible.

---

## STAGE 2 — Home combined "All Activity" feed

Redesign Home into one screen with these stacked regions:

### 2.1 Top: your snapshot
- Your streak (with the corrected at-risk logic from FIXES2), your **tier badge** (provisional or confirmed), consistency ring, and key personal metrics. This is what a solo user sees first too.
- The notification bell (Stage 1) sits in the top bar here.

### 2.2 Pinned groups (up to 3)
- A row of the user's groups. The user can **pin up to 3 groups** to the top and reorder them; unpinned groups order by most-recent-activity.
- Each group card shows the group name and a headline metric (e.g. how many members checked in today, and the group's collective streak) plus an **unread chat dot** (Stage 3).

### 2.3 Segmented control: [All Activity] | [Groups]
- **All Activity** (default): a combined feed of check-in posts from ALL the user's groups, **today-first** (today's posts, then "Earlier" with recent history). Each post is labeled with the **poster name + group name**. If the viewer shares more than one group with the poster, **list the group names**. Reactions and comments work inline (reuse existing components).
- **Groups**: the list/grid of the user's groups. Tapping one opens the **existing single-group layout** with full history, metrics, chat button, etc. (unchanged).

### 2.4 Solo users
- Solo users see their snapshot at the top and a prominent **"Start a group / Invite with a link"** call to action. The All Activity area shows an encouraging empty state that guides them to create or join a group. **Do not fabricate content** to fill it.

**Acceptance:** a member of multiple groups sees one combined today-first feed with correct poster+group labels (including multi-group labeling), can pin 3 groups, and can drill into any single group's full existing view. A solo user sees their stats and a clear path to start a group.

---

## STAGE 3 — Group chat rebuild + unread badge

### 3.1 Make it look and feel like a real chat
- Message **bubbles**: own messages aligned right (volt-tinted), others left with **avatar + name + tier badge**.
- **Timestamps** and **day separators**; **input pinned to the bottom**; **auto-scroll** to newest on open and on new message; smooth realtime via the existing Supabase realtime channel.
- **Optimistic send** with a clear failed-to-send state and retry (no silent failure).
- Keep it performant for long histories (paginate older messages on scroll up).

### 3.2 Entry point + unread indicator
- Inside a specific group's view, add a **Chat button near the group metrics** (next to or just below them).
- Track unread per user per group: `group_chat_reads(user_id, group_id, last_read_at)`. **Unread count** = messages after `last_read_at`. Show a **red dot + count** on the Chat button, and mirror the dot on the group's card in Home (2.2).
- Opening the chat sets `last_read_at = now()` and clears the count.

**Acceptance:** the chat reads as a modern chat (bubbles, timestamps, realtime, day separators); a new message from another member shows a red count on that group's Chat button and on its Home card; opening the chat clears it.

---

## STAGE 4 — Mentions / tagging

### 4.1 Behavior
- Typing `@` in a **comment** or a **chat message** opens an **autocomplete of that group's members only** (group-scoped; in a combined-feed comment, scope = that post's group). Selecting inserts a mention token that stores the mentioned `user_id`.
- Render the mention as a **styled volt-accent token** that is **tappable to open that member's profile**.
- On send, parse mentions and, for each mentioned user (deduped, never notify the sender about themselves), **insert a `mention` notification row + send push** (via the Stage 1 unified flow). Copy localized EN/ES.

### 4.2 Scope and safety
- You can only mention members of the relevant group. Never allow mentioning users outside the group. This preserves Stack's private-by-design model.

**Acceptance:** tagging a group member in a comment or chat message creates a styled tappable mention, notifies that member (in-app center + push), and cannot reach anyone outside the group.

---

## Cross-cutting
- All new copy EN + ES; no em dashes; no silent errors; destructive actions confirmed; schema via Supabase CLI migrations.
- Theme consistent (dark, volt accent); reuse existing post/reaction/comment/badge components.
- Keep it Capacitor-friendly (no web-only assumptions that block a future native wrap).
- Do not break what is live: solo mode, streak engine v2 (post-FIXES2), tiers + badges, push, pacts, story cards, reactions/comments, streak forgiveness, leaderboard, recaps, onboarding tour, group admin.

## QA checklist
- [ ] Notifications table + RLS; only recipient can read their rows.
- [ ] Each event type creates a row; rows appear in the center, deep-link correctly, and clear unread on read.
- [ ] Push and in-app center come from the SAME row/flow; push-impossible recipients still get the in-app row.
- [ ] Bell shows accurate unread count; opening the center marks read.
- [ ] Home: combined today-first All Activity feed with correct poster+group labels, including multi-group labeling.
- [ ] Pin up to 3 groups + reorder; drilling into a group shows the existing full layout.
- [ ] Solo Home shows stats + invite CTA; no fabricated content.
- [ ] Chat reads as a real chat (bubbles, timestamps, day separators, realtime, retry on fail, paginated history).
- [ ] Chat unread red count on the group's Chat button and Home card; clears on open.
- [ ] Mentions: `@` autocompletes group members only; token is tappable to profile; mentioned user notified (center + push); cannot mention outside the group.
- [ ] All new copy EN + ES; no em dashes; no silent errors.

## Build order
Stage 1 (notifications model + center) → Stage 2 (combined feed) → Stage 3 (chat) → Stage 4 (mentions). Deploy and verify each stage before the next. Stop at any stage boundary and the app is still fully live.
