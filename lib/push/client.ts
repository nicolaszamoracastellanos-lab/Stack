"use client";

/**
 * Client push subscription flow (Batch 5 D2). Registers the service worker,
 * requests permission, subscribes via the Push API, and persists the
 * subscription server-side. Thin on purpose — the trigger logic lives on the
 * server, and a future Capacitor wrapper can replace this file with an FCM/APNs
 * bridge without touching anything else.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function platform(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "web";
}

/** Subscribe this device. Returns true on success. Caller must hold the VAPID
 * public key (exposed as NEXT_PUBLIC_VAPID_PUBLIC_KEY). */
export async function subscribePush(vapidPublicKey: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!vapidPublicKey) return false;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    }));

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      platform: platform(),
    }),
  });
  return res.ok;
}

/** Remove this device's subscription (master toggle off). */
export async function unsubscribePush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}
