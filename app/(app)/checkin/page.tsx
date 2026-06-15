import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { CheckinCamera, CheckinNoGroup } from "@/components/CheckinCamera";

export default async function CheckinPage() {
  const { userId } = await getUserAndProfile();
  const { active } = await getActiveGroup();

  // You can only check in to a group you belong to.
  if (!active || !userId) {
    return <CheckinNoGroup />;
  }

  return (
    <CheckinCamera groupId={active.id} userId={userId} groupName={active.name} />
  );
}
