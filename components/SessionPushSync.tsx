"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribePush } from "@/lib/push/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Session + push resilience (STACK_FIXES2 C). Mounted once in the (app) shell.
 *
 * - Refreshes the session when the app regains focus / becomes visible, so a
 *   returning PWA user is silently re-authed via the refresh token rather than
 *   bounced to login.
 * - Re-syncs the push subscription on every load with a valid session (and on
 *   refocus), upserting it tied to the user id and de-duped by endpoint, so a
 *   churned session never orphans delivery. Never prompts: only runs when
 *   notification permission is already granted.
 */
export function SessionPushSync() {
  useEffect(() => {
    const supabase = createClient();

    function pushGranted(): boolean {
      return (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        !!VAPID_PUBLIC_KEY
      );
    }

    // Re-sync subscription on load (idempotent upsert by endpoint).
    if (pushGranted()) subscribePush(VAPID_PUBLIC_KEY).catch(() => {});

    function onVisible() {
      if (document.visibilityState !== "visible") return;
      // Touch the session so an expired access token is refreshed.
      supabase.auth.getUser().catch(() => {});
    }

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return null;
}
