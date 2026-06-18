"use server";

import { getFounder } from "@/lib/founder";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser, sendRawToUser } from "@/lib/push/send";
import { localizedTierName } from "@/lib/push/copy";
import type { CopyVars } from "@/lib/push/copy";
import type { NotificationType, Lang } from "@/lib/push/types";

export type FireResult = { ok: boolean; sent: number; error?: string };

function sampleFor(
  type: NotificationType,
  lang: Lang,
  projection?: "up" | "down" | "confirmed",
): { vars: CopyVars; url: string } {
  switch (type) {
    case "group_post":
      return { vars: { name: "María", group: "Dawn Patrol" }, url: "/home" };
    case "group_join":
      return { vars: { name: "Carlos", group: "Dawn Patrol" }, url: "/home" };
    case "member_workout":
      return { vars: { name: "María", group: "Dawn Patrol" }, url: "/home" };
    case "self_nudge":
      return { vars: {}, url: "/checkin" };
    case "at_risk":
      return { vars: {}, url: "/home" };
    case "member_nudge":
      return { vars: { name: "Coach" }, url: "/home" };
    case "tier_projection":
      if (projection === "up")
        return { vars: { direction: "up", tier: localizedTierName("silver", lang) }, url: "/tiers" };
      if (projection === "down")
        return { vars: { direction: "down", tier: localizedTierName("purple", lang) }, url: "/tiers" };
      return { vars: { confirmed: true, tier: localizedTierName("volt", lang) }, url: "/tiers" };
    default:
      return { vars: { name: "María", group: "Dawn Patrol" }, url: "/home" };
  }
}

/**
 * Fire one Batch 5 trigger type to the FOUNDER'S OWN subscriptions only, with a
 * realistic sample payload localized to `lang`. Server-gated; uses the SAME
 * sendPushToUser the cron uses (force=true so toggles/quiet-hours don't block a
 * test). Never touches other users or real groups.
 */
export async function fireTestNotification(input: {
  type: NotificationType;
  lang: Lang;
  projection?: "up" | "down" | "confirmed";
}): Promise<FireResult> {
  const f = await getFounder();
  if (!f) return { ok: false, sent: 0, error: "forbidden" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, sent: 0, error: "push not configured" };

  const { vars, url } = sampleFor(input.type, input.lang, input.projection);
  // Also create a visible notification-center row (STACK_BATCH6 1.3), so the
  // center can be tested, not just delivery.
  await admin.from("notifications").insert({
    recipient_id: f.userId,
    type: input.type,
    actor_id: null,
    data: { ...vars, url },
  });
  const sent = await sendPushToUser(admin, f.userId, input.type, vars, url, {
    force: true,
    lang: input.lang,
  });
  return { ok: true, sent };
}

/** Raw test push (arbitrary title/body) to the founder's own devices only. */
export async function fireRawNotification(input: {
  title: string;
  body: string;
}): Promise<FireResult> {
  const f = await getFounder();
  if (!f) return { ok: false, sent: 0, error: "forbidden" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, sent: 0, error: "push not configured" };

  const sent = await sendRawToUser(admin, f.userId, {
    title: input.title || "Stack",
    body: input.body || "Test",
  });
  return { ok: true, sent };
}
