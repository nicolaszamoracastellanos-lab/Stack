import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";
import { WelcomeRunner } from "@/components/WelcomeRunner";

// The Welcome Story (Part 1) — shown once after signup, before profile setup,
// and once to existing users on their next login. Full-screen, no app nav.
export default async function WelcomePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const complete = isProfileComplete(profile);

  // An existing user who has already seen it (or, pre-migration, where the
  // column reads undefined) never replays — straight onward.
  if (profile && profile.has_seen_welcome !== false) {
    redirect(complete ? "/home" : "/onboarding");
  }

  return (
    <WelcomeRunner
      userId={userId}
      hasProfile={Boolean(profile)}
      profileComplete={complete}
      next={searchParams.next}
    />
  );
}
