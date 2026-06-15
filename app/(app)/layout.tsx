import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUserAndProfile } from "@/lib/auth";

/**
 * Shell for the logged-in app (home, check-in, profile, groups). Enforces the
 * two gates from the spec:
 *   - no session            -> /login
 *   - session but no username -> /onboarding
 * Renders the persistent Nav (bottom bar on mobile, side rail on desktop).
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
    <div className="min-h-dvh lg:pl-20">
      {/*
        Clear the fixed bottom tab bar on mobile, including the iOS home-indicator
        safe area, so the last feed item is never hidden behind the nav. Desktop
        uses the left side rail, so no bottom padding there.
      */}
      <div className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </div>
      <Nav />
    </div>
  );
}
