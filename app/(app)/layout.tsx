import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUserAndProfile } from "@/lib/auth";

/**
 * Shell for the logged-in app (home, check-in, profile, groups). Enforces the
 * two gates from the spec:
 *   - no session            -> /login
 *   - session but no username -> /onboarding
 *
 * APP-SHELL LAYOUT: the whole app is a fixed 100dvh flex box. Only the inner
 * content div scrolls; the Nav is a non-scrolling flex child. This is why the
 * nav can never "scroll into the middle" — it isn't position:fixed against the
 * document, it's structurally outside the scroll region. Also sidesteps iOS
 * Safari's dynamic-toolbar quirks with fixed bottom bars.
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
    <div className="flex h-[100dvh] flex-col overflow-hidden lg:flex-row">
      {/* The ONLY scroll container. min-h-0 lets it shrink so overflow works. */}
      <div className="order-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:order-2">
        {children}
      </div>
      <Nav />
    </div>
  );
}
