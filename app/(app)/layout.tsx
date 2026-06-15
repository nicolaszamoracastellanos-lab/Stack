import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUserAndProfile } from "@/lib/auth";

/**
 * Shell for the logged-in app (home, check-in, profile, groups).
 *
 * NAV STRATEGY (read before touching): the document scrolls NATIVELY (no inner
 * scroll container, no 100dvh+overflow-hidden shell — that combo breaks on iOS
 * Safari and leaves a black gap below the bar). The Nav is `position: fixed` and
 * anchored to the viewport. This container is a plain, NON-TRANSFORMED top-level
 * box, so the fixed nav resolves against the viewport (a transform/filter/
 * perspective/will-change/backdrop-filter here would re-base it and make it
 * drift — never add one to this element or any ancestor of the nav).
 *
 * The content gets bottom padding = nav height + the iOS home-indicator inset so
 * nothing hides behind the bar and there's no dead space.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");
  if (!profile) redirect("/onboarding");

  return (
    <div className="min-h-[100dvh] lg:pl-20">
      {/* Bottom clearance for the fixed mobile tab bar + safe area. Desktop uses
          the left side rail, so no bottom padding there. */}
      <div className="pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <Nav />
    </div>
  );
}
