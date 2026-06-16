import { redirect } from "next/navigation";
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

  const data = await getMemberProfile(userId, params.id);
  if (!data) redirect("/home");

  return <MemberProfile data={data} />;
}
