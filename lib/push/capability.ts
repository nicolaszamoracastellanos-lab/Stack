"use client";

/**
 * Push capability detection (Batch 5 D1). Web push on iOS works ONLY in an
 * installed (Home Screen, standalone) PWA — Apple's restriction. We detect this
 * honestly so the UI routes iOS-Safari-not-installed users to "install as an
 * app" instead of showing a broken "enable notifications" button.
 */
export type PushCapability = {
  /** The browser exposes the Push API + service workers + Notification. */
  supported: boolean;
  /** iOS Safari, not installed — push is impossible until added to Home Screen. */
  iosNeedsInstall: boolean;
  /** Current Notification permission, or "unsupported". */
  permission: NotificationPermission | "unsupported";
};

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPhone/iPod, plus iPadOS which masquerades as Mac but has touch points.
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/i.test(ua) && (navigator.maxTouchPoints ?? 0) > 1)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari legacy flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function detectPushCapability(): PushCapability {
  if (typeof window === "undefined") {
    return { supported: false, iosNeedsInstall: false, permission: "unsupported" };
  }
  const hasApi =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const iosNeedsInstall = isIOS() && !isStandalone() && !hasApi;

  return {
    supported: hasApi,
    iosNeedsInstall,
    permission: hasApi ? Notification.permission : "unsupported",
  };
}
