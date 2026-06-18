import type { TranslationKey } from "@/lib/i18n";
import type { TierKey } from "@/lib/tiers";

/** Client-safe view helpers for notification rows (no admin / no secrets). */

export type NotifActor = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  tier_confirmed: string | null;
  tier_provisional: string | null;
} | null;

export type NotifData = {
  name?: string;
  group?: string;
  snippet?: string;
  tier?: string;
  url?: string;
};

export type NotifRow = {
  id: string;
  type: string;
  actor_id: string | null;
  group_id: string | null;
  target_type: string | null;
  target_id: string | null;
  data: NotifData | null;
  read_at: string | null;
  created_at: string;
  actor?: NotifActor;
};

/** Embedded select for the actor's profile (avatar + tier badge). */
export const NOTIF_SELECT =
  "id, type, actor_id, group_id, target_type, target_id, data, read_at, created_at, " +
  "actor:actor_id(username, display_name, avatar_url, tier_confirmed, tier_provisional)";

export function notifHref(n: NotifRow): string {
  return n.data?.url || "/home";
}

export function notifActorName(n: NotifRow): string {
  if (n.data?.name) return n.data.name;
  const a = n.actor;
  if (!a) return "Stack";
  return a.display_name?.trim() || `@${a.username}`;
}

export function notifTier(n: NotifRow): TierKey | null {
  const a = n.actor;
  return ((a?.tier_confirmed ?? a?.tier_provisional) ?? null) as TierKey | null;
}

const DESC: Record<string, TranslationKey> = {
  reaction: "notif_desc_reaction",
  comment: "notif_desc_comment",
  mention: "notif_desc_mention",
  nudge: "notif_desc_nudge",
  member_nudge: "notif_desc_nudge",
  group_join: "notif_desc_group_join",
  invite_accepted: "notif_desc_invite_accepted",
  group_post: "notif_desc_group_post",
  member_workout: "notif_desc_member_workout",
  tier_change: "notif_desc_tier_change",
  tier_projection: "notif_desc_tier_projection",
  at_risk: "notif_desc_at_risk",
  self_nudge: "notif_desc_self_nudge",
};

/** i18n key for the one-line description; comment/mention drop the snippet
 *  variant when there's no snippet. */
export function notifDescKey(n: NotifRow): TranslationKey {
  if (n.type === "comment" && !n.data?.snippet) return "notif_desc_comment_plain";
  if (n.type === "mention" && !n.data?.snippet) return "notif_desc_mention_plain";
  return DESC[n.type] ?? "notif_desc_group_post";
}
