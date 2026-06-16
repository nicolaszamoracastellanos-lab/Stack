"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeStory } from "@/components/WelcomeStory";
import { createClient } from "@/lib/supabase/client";

const SEEN_KEY = "stack.welcomeSeen";

/**
 * Drives the welcome story and routes onward when it's finished or skipped.
 *
 * - Existing users (a profile row exists) → persist has_seen_welcome=true in the
 *   DB so it never replays, then go to Home (their profile is already complete).
 * - Brand-new users (no profile row yet) → the onboarding insert will set the
 *   flag; here we just route into profile setup. A localStorage marker prevents
 *   the story re-appearing if they refresh /welcome mid-signup.
 */
export function WelcomeRunner({
  userId,
  hasProfile,
  profileComplete,
  next,
}: {
  userId: string;
  hasProfile: boolean;
  profileComplete: boolean;
  next?: string;
}) {
  const router = useRouter();

  const dest = profileComplete
    ? next && next.startsWith("/")
      ? next
      : "/home"
    : `/onboarding${next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : ""}`;

  // Refresh-safety for brand-new users (no DB flag to persist yet).
  useEffect(() => {
    if (!hasProfile && window.localStorage.getItem(SEEN_KEY) === "1") {
      router.replace(dest);
    }
  }, [hasProfile, dest, router]);

  async function complete() {
    window.localStorage.setItem(SEEN_KEY, "1");
    if (hasProfile) {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ has_seen_welcome: true })
        .eq("id", userId);
    }
    router.replace(dest);
    router.refresh();
  }

  return <WelcomeStory onComplete={complete} />;
}
