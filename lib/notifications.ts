import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push/send";
import type { NotificationType } from "@/lib/push/types";
import type { CopyVars } from "@/lib/push/copy";

/**
 * Unified notifications (STACK_BATCH6 Stage 1).
 *
 * notify() is the ONE path every notifiable event goes through: it inserts a
 * row in `notifications` (which backs the in-app center) AND sends a push from
 * that same row. There is no parallel system. The row is always written even if
 * push is impossible (no subscription / iOS Safari not installed), so the user
 * still sees it in the center. Must run server-side with the service-role admin
 * client (it writes other users' notification rows).
 */

export type NotifTargetType =
  | "post"
  | "comment"
  | "chat_message"
  | "profile"
  | "group"
  | "tier"
  | "streak";

export type NotifInput = {
  recipientId: string;
  type: NotificationType;
  /** Who caused it; null for system events (at_risk, self_nudge, tier_*). */
  actorId?: string | null;
  groupId?: string | null;
  targetType?: NotifTargetType | null;
  targetId?: string | null;
  /** Render + push vars (name, group, snippet, tier, ...). Stored in `data`. */
  data?: CopyVars;
  /** Deep-link path; stored in data.url and used as the push click target. */
  url?: string;
};

export async function notify(
  admin: SupabaseClient,
  input: NotifInput,
): Promise<void> {
  // Never notify someone about their own action.
  if (input.actorId && input.actorId === input.recipientId) return;

  const url = input.url ?? "/home";
  const data = { ...(input.data ?? {}), url };

  // 1) Insert the row (backs the center; survives push being impossible).
  await admin.from("notifications").insert({
    recipient_id: input.recipientId,
    type: input.type,
    actor_id: input.actorId ?? null,
    group_id: input.groupId ?? null,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    data,
  });

  // 2) Push from the same row (no-op if the recipient has no subscription).
  await sendPushToUser(
    admin,
    input.recipientId,
    input.type,
    input.data as CopyVars,
    url,
  );
}

/** notify() a list of recipients with the same payload (deduped, no self). */
export async function notifyMany(
  admin: SupabaseClient,
  recipientIds: string[],
  base: Omit<NotifInput, "recipientId">,
): Promise<void> {
  const seen = new Set<string>();
  await Promise.all(
    recipientIds
      .filter((id) => id && !seen.has(id) && (seen.add(id), true))
      .map((recipientId) => notify(admin, { ...base, recipientId })),
  );
}
