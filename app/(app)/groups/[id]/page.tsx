import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getGroupDetail } from "@/lib/group-detail";
import { GroupDetail } from "@/components/GroupDetail";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";

// Group detail page (Batch 2 · Section 4): group-level stats + per-member
// breakdown, with the invite link and leave/delete moved here from the list.
export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  const data = await getGroupDetail(params.id, userId, baseUrl);
  if (!data) redirect("/groups");

  const activeId = cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? null;

  return (
    <GroupDetail data={data} userId={userId} isActive={activeId === params.id} />
  );
}
