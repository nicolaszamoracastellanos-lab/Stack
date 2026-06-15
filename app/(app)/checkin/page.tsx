import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { CheckinCamera, CheckinNoGroup } from "@/components/CheckinCamera";

export default async function CheckinPage() {
  const { userId } = await getUserAndProfile();
  const { active, groups } = await getActiveGroup();

  // You can only check in to a group you belong to.
  if (!userId || groups.length === 0) {
    return <CheckinNoGroup />;
  }

  return (
    <CheckinCamera userId={userId} groups={groups} activeId={active?.id ?? null} />
  );
}
