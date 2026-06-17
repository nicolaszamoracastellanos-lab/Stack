"use client";

import type { NotificationType } from "@/lib/push/types";

type EmitBody =
  | { event: "checkin"; groupIds: string[] }
  | { event: "join"; groupId: string }
  | { event: "nudge"; targetUserId: string };

/**
 * Fire-and-forget client trigger (Batch 5 D3). Posts an event to the push emit
 * route, which resolves recipients + copy server-side. Never throws and never
 * blocks the UI — a missing VAPID config or push setup just no-ops.
 */
export function emitPush(body: EmitBody): void {
  try {
    void fetch("/api/push/emit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export type { NotificationType };
