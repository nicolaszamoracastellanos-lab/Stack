import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getGroupsDashboard } from "@/lib/groups-dashboard";
import { GroupsDashboard } from "@/components/GroupsDashboard";

// Groups dashboard: manage groups, re-share invite links, switch the active
// group, and see the per-group leaderboard.
export default async function GroupsPage() {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const { groups, activeId } = await getGroupsDashboard(userId);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";

  return (
    <GroupsDashboard
      groups={groups}
      activeId={activeId}
      userId={userId}
      baseUrl={baseUrl}
    />
  );
}
