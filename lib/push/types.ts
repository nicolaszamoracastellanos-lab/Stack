/**
 * Push notification types (Batch 5 Stage D).
 *
 * The seven trigger types. Kept as a stable union so the send layer, the copy
 * builder, and the per-type settings toggles all agree. Follow-related triggers
 * were intentionally dropped (following was cut from Stack).
 */
export type NotificationType =
  | "group_post" // someone posted in your group
  | "group_join" // someone joined your group
  | "member_workout" // a group member's first log of the day
  | "self_nudge" // you haven't logged and it's late
  | "at_risk" // about to lose your streak
  | "member_nudge" // a member nudged you (legacy alias of "nudge")
  | "tier_projection" // weekly projection
  // Batch 6 additions (notification center + push share these):
  | "reaction" // someone reacted to your check-in
  | "comment" // someone commented on your check-in
  | "mention" // someone tagged you
  | "nudge" // someone nudged you
  | "tier_change" // your confirmed tier changed
  | "invite_accepted" // someone accepted your group invite
  | "pact_broken"; // a member broke the pact and owes the stake

export const NOTIFICATION_TYPES: NotificationType[] = [
  "group_post",
  "group_join",
  "member_workout",
  "self_nudge",
  "at_risk",
  "member_nudge",
  "tier_projection",
];

export type PushPayload = {
  title: string;
  body: string;
  /** Path to open on click (defaults to "/home"). */
  url?: string;
  /** Coalescing tag so duplicates replace rather than stack. */
  tag?: string;
  type: NotificationType;
};

/** A stored subscription, web-push shaped. */
export type StoredSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type Lang = "en" | "es";
