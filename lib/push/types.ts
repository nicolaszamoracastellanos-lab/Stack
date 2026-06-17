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
  | "member_nudge" // a member nudged you
  | "tier_projection"; // weekly projection / confirmed tier change

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
