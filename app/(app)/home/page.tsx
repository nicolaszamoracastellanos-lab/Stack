import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getUserGroups } from "@/lib/groups";
import { getCombinedFeed } from "@/lib/combined-feed";
import { getGroupsDashboard } from "@/lib/groups-dashboard";
import { getUnreadChatByGroup } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { loadStreakContext } from "@/lib/streak-context";
import { suggestGoal } from "@/lib/tier-eval";
import { CombinedHome, type GroupCard } from "@/components/CombinedHome";
import { SoloHome } from "@/components/SoloHome";
import { BrandBar } from "@/components/BrandBar";
import { NotificationBell } from "@/components/NotificationBell";

// Home (STACK_BATCH6 Stage 2): personal snapshot + pinned groups + a combined
// "All Activity" feed across all the user's groups. Solo users get the snapshot
// plus a path into a group.
export default async function HomePage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");
  const supabase = createClient();
  const now = new Date();

  // Everything independent loads in ONE round: groups, the unread badge,
  // personal post dates (deduped by post) and rest days for the streak.
  const [groups, unreadRes, mineRes, restRes] = await Promise.all([
    getUserGroups(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .is("read_at", null),
    supabase
      .from("checkins")
      .select("id, post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase.from("rest_days").select("day").eq("user_id", userId),
  ]);
  const unread = unreadRes.count;
  const seen = new Set<string>();
  const personalDates: string[] = [];
  for (const c of mineRes.data ?? []) {
    const key = (c.post_id as string | null) ?? (c.id as string);
    if (seen.has(key)) continue;
    seen.add(key);
    personalDates.push(c.created_at as string);
  }
  const restDays = (restRes.data ?? []).map((r) => r.day as string);
  const ctx = await loadStreakContext(supabase, userId, profile, personalDates, restDays, now);

  const TopBar = (
    <BrandBar className="mb-8">
      <NotificationBell userId={userId} initialUnread={unread ?? 0} />
    </BrandBar>
  );

  // Solo: snapshot + invite path (no fabricated feed content).
  if (groups.length === 0) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-8">
        {TopBar}
        <SoloHome
          userId={userId}
          personalDates={personalDates}
          restDays={restDays}
          ctx={ctx}
          suggestedGoal={suggestGoal(personalDates, now)}
        />
      </main>
    );
  }

  const [feed, dash, chatUnread] = await Promise.all([
    getCombinedFeed(groups),
    getGroupsDashboard(userId, groups),
    getUnreadChatByGroup(groups.map((g) => g.id)),
  ]);
  const groupCards: GroupCard[] = dash.groups.map((d) => ({
    id: d.group.id,
    name: d.group.name,
    checkedInToday: d.members.filter((m) => m.checkedInToday).length,
    memberCount: d.members.length,
    collectiveStreak: d.collectiveStreak,
    chatUnread: chatUnread[d.group.id] ?? 0,
  }));
  const pinnedIds = (profile?.pinned_groups ?? []).filter((id) =>
    groupCards.some((g) => g.id === id),
  );
  const userName = profile?.display_name?.trim() || `@${profile?.username ?? "you"}`;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      {TopBar}
      <CombinedHome
        userId={userId}
        userName={userName}
        userAvatar={profile?.avatar_url ?? null}
        personalDates={personalDates}
        restDays={restDays}
        ctx={ctx}
        suggestedGoal={suggestGoal(personalDates, now)}
        items={feed.items}
        reactions={feed.reactions}
        comments={feed.comments}
        groupCards={groupCards}
        pinnedIds={pinnedIds}
      />
    </main>
  );
}
