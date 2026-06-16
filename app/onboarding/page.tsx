import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";
import { OnboardingFlow } from "@/components/OnboardingFlow";

// Required multi-step onboarding. Reached after signup, and any time a
// logged-in user is missing a required profile field (enforced by the (app)
// layout). Already-complete users are bounced straight to the app.
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");

  // Existing users who haven't seen the welcome story go there first.
  if (profile && profile.has_seen_welcome === false) redirect("/welcome");

  const next = searchParams.next;
  if (isProfileComplete(profile)) {
    redirect(next && next.startsWith("/") ? next : "/home");
  }

  return <OnboardingFlow userId={userId} profile={profile} next={next} />;
}
