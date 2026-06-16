import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { CheckinFlow, CheckinNoGroup } from "@/components/CheckinFlow";

export default async function CheckinPage() {
  const { userId, profile } = await getUserAndProfile();
  const { active, groups } = await getActiveGroup();

  // You can only check in to a group you belong to.
  if (!userId || groups.length === 0) {
    return <CheckinNoGroup />;
  }

  const order = profile?.checkin_order === "photo" ? "photo" : "details";

  return (
    <CheckinFlow
      userId={userId}
      groups={groups}
      activeId={active?.id ?? null}
      initialOrder={order}
    />
  );
}
