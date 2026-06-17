import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildNotification, type CopyVars } from "@/lib/push/copy";
import type { Lang, NotificationType } from "@/lib/push/types";

let configured = false;
function ensureVapid(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@stack.app";
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return true;
}

/** Local hour (0–23) in `tz` right now. Falls back to UTC if tz is bad. */
function localHour(tz: string | null): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      hour: "2-digit",
      hour12: false,
    }).format(new Date());
    return Number(s) % 24;
  } catch {
    return new Date().getUTCHours();
  }
}

/** Quiet hours wrap midnight (e.g. 22→8). [start, end). */
export function inQuietHours(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

type Prefs = {
  notif_master: boolean;
  notif_types: Record<string, boolean> | null;
  quiet_start: number;
  quiet_end: number;
  timezone: string | null;
  language: string | null;
};

/**
 * Send one notification type to a user, respecting their master toggle, per-type
 * toggle, and quiet hours, localized to their language. Prunes dead endpoints.
 * No-op (returns 0) if VAPID isn't configured. This is the single send seam a
 * future Capacitor/FCM bridge would replace.
 */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  type: NotificationType,
  vars: CopyVars = {},
  url = "/home",
  opts: { force?: boolean } = {},
): Promise<number> {
  if (!ensureVapid()) return 0;

  const { data: prof } = await admin
    .from("profiles")
    .select("notif_master, notif_types, quiet_start, quiet_end, timezone, language")
    .eq("id", userId)
    .maybeSingle();
  if (!prof) return 0;
  const prefs = prof as Prefs;

  // `force` (manual test only) bypasses prefs + quiet hours so a notification
  // fires on demand regardless of the time of day.
  if (!opts.force) {
    if (!prefs.notif_master) return 0;
    if (prefs.notif_types && prefs.notif_types[type] === false) return 0;
    if (inQuietHours(localHour(prefs.timezone), prefs.quiet_start, prefs.quiet_end)) {
      return 0;
    }
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;

  const lang: Lang = prefs.language === "es" ? "es" : "en";
  const payload = JSON.stringify(buildNotification(type, lang, vars, url));

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      const endpoint = s.endpoint as string;
      try {
        await webpush.sendNotification(
          {
            endpoint,
            keys: { p256dh: s.p256dh as string, auth: s.auth as string },
          },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(endpoint); // gone — prune
      }
    }),
  );

  if (dead.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", dead);
  }
  return sent;
}
