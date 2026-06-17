import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { TimezoneSync } from "@/components/TimezoneSync";
import { getUserAndProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";

/**
 * Shell for the logged-in app (home, check-in, profile, groups).
 *
 * NAV STRATEGY (Fix #1, recurring): the nav is NO LONGER `position: fixed`. A
 * fixed bar drifts mid-screen on iOS during momentum scroll, and there is no
 * transformed ancestor to blame — it's WebKit's fixed-element repaint behavior.
 * Instead this is a flex shell pinned to the dynamic viewport (`h-[100dvh]`):
 * the CONTENT scrolls in an inner `overflow-y-auto` pane and the Nav is a plain
 * flex child that literally cannot drift (no fixed positioning involved). Using
 * `dvh` (not `vh`) keeps the bar flush with the bottom as Safari's toolbar
 * shows/hides, avoiding the black-gap that sank earlier inner-scroll attempts.
 *
 * `flex-col-reverse` puts the Nav (first child) at the BOTTOM on mobile;
 * `lg:flex-row` puts it on the LEFT as a rail on desktop.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");
  // Existing users replay the welcome story once (flag defaults false for all).
  // Guard on `=== false` so a pre-migration undefined never traps anyone.
  if (profile && profile.has_seen_welcome === false) redirect("/welcome");
  // Every user — new or existing — must complete onboarding before the app.
  if (!isProfileComplete(profile)) redirect("/onboarding");

  return (
    <div className="flex h-[100dvh] flex-col-reverse overflow-hidden lg:flex-row">
      <TimezoneSync userId={userId} current={profile?.timezone ?? null} />
      <Nav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {children}
      </div>
    </div>
  );
}
