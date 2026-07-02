import { notFound, redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getMemberProfile } from "@/lib/member-profile";
import { MemberProfile } from "@/components/MemberProfile";

// Any member's profile (Batch 2 · Section 1). Reached by tapping a name/avatar
// in the feed, leaderboard, or member list. Your own id renders the same screen
// with owner controls.
export default async function MemberPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  // A bad or unknown id is an honest 404, not a silent bounce home.
  const data = await getMemberProfile(userId, params.id);
  if (!data) notFound();

  return <MemberProfile data={data} />;
}
