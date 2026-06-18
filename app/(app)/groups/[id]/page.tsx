import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getGroupDetail } from "@/lib/group-detail";
import { getHomeData } from "@/lib/feed";
import { getUnreadChatByGroup } from "@/lib/chat";
import { GroupDetail } from "@/components/GroupDetail";
import type { PostFeedItem } from "@/components/PostFeed";
import { ACTIVE_GROUP_COOKIE } from "@/lib/active-group";

// Group detail page: group-level stats + per-member breakdown + this group's
// full check-in history (Batch 6 Stage 2) + chat.
export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  const data = await getGroupDetail(params.id, userId, baseUrl);
  if (!data) redirect("/groups");

  const [home, chatUnread] = await Promise.all([
    getHomeData(params.id, userId),
    getUnreadChatByGroup([params.id]),
  ]);
  const tierByUser = Object.fromEntries(home.members.map((m) => [m.user_id, m.tier]));
  const items: PostFeedItem[] = home.feed.map((c) => ({
    id: c.id,
    postId: c.postId,
    userId: c.user_id,
    name: c.name,
    avatarUrl: c.avatarUrl,
    tier: tierByUser[c.user_id] ?? null,
    photoUrl: c.photoUrl,
    photoPath: c.photoPath,
    note: c.note,
    sport: c.sport,
    environment: c.environment,
    goal: c.goal,
    createdAt: c.created_at,
    groupLabel: null,
  }));
  const userName = profile?.display_name?.trim() || `@${profile?.username ?? "you"}`;

  const activeId = cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? null;

  return (
    <GroupDetail
      data={data}
      userId={userId}
      isActive={activeId === params.id}
      chatUnread={chatUnread[params.id] ?? 0}
      feed={{
        items,
        reactions: home.reactions,
        comments: home.comments,
        userName,
        userAvatar: profile?.avatar_url ?? null,
      }}
    />
  );
}
