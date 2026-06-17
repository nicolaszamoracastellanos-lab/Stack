"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { deviceTimezone } from "@/lib/week";

/**
 * Backfills profiles.timezone for users who onboarded before Batch 5 A2.
 * Mounts once in the (app) shell; writes the device's IANA timezone exactly
 * once when the column is still empty. Best-effort — silent on failure, and a
 * no-op for anyone who already has a timezone stored.
 */
export function TimezoneSync({
  userId,
  current,
}: {
  userId: string;
  current: string | null;
}) {
  useEffect(() => {
    if (current) return;
    const tz = deviceTimezone();
    if (!tz) return;
    createClient().from("profiles").update({ timezone: tz }).eq("id", userId);
  }, [userId, current]);

  return null;
}
