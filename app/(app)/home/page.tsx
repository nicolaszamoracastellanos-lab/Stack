import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { getHomeData } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";
import {
  computePersonalStreak,
  computeGroupStreak,
  localDateKey,
  toDaySet,
} from "@/lib/streaks";
import { HomeClient } from "@/components/HomeClient";
import { SoloHome } from "@/components/SoloHome";
import { GroupSwitcher } from "@/components/GroupSwitcher";
import { BrandBar } from "@/components/BrandBar";

// The heart of the app. Server-fetches the group's feed + the data needed to
// seed the streaks, then hands off to HomeClient for the live, interactive UI.
export default async function HomePage() {
  const { userId, profile } = await getUserAndProfile();
  const { active, groups } = await getActiveGroup();
  // First-run feature tour: starts once when a user with a group lands on Home.
  const showTour = profile?.has_completed_tour === false;

  if (!userId) redirect("/login");

  // Solo mode (Batch 5 B1): no group yet, but full personal value — streak,
  // ring, heatmap — plus an obvious path into a group.
  if (!active) {
    const supabase = createClient();
    const [mineRes, restRes] = await Promise.all([
      supabase
        .from("checkins")
        .select("id, post_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(400),
      supabase.from("rest_days").select("day").eq("user_id", userId),
    ]);
    // Dedupe multi-group posts by post_id so a day isn't double-counted.
    const seen = new Set<string>();
    const personalDates: string[] = [];
    for (const c of mineRes.data ?? []) {
      const key = (c.post_id as string | null) ?? (c.id as string);
      if (seen.has(key)) continue;
      seen.add(key);
      personalDates.push(c.created_at as string);
    }
    const restDays = (restRes.data ?? []).map((r) => r.day as string);

    return (
      <main className="mx-auto w-full max-w-xl px-6 py-8">
        <BrandBar className="mb-8" />
        <SoloHome personalDates={personalDates} restDays={restDays} />
      </main>
    );
  }

  const data = await getHomeData(active.id, userId);

  // Seed streaks server-side so SSR matches the first client render; HomeClient
  // recomputes with the device's local "today" on mount.
  const now = new Date();
  const personal = computePersonalStreak(data.personalDates, now, data.restDays);
  const memberArrays = data.members.map((m) =>
    data.feed.filter((c) => c.user_id === m.user_id).map((c) => c.created_at),
  );
  const group = computeGroupStreak(memberArrays, now);
  const checkedInToday = toDaySet(data.personalDates).has(localDateKey(now));

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <BrandBar />

      <header className="mb-8 min-w-0" data-tour="home-header">
        {groups.length > 1 ? (
          <GroupSwitcher groups={groups} activeId={active.id} />
        ) : (
          <h1 className="truncate text-h2">{active.name}</h1>
        )}
        {active.goal && (
          <p className="mt-1 truncate text-caption text-text-dim">
            {active.goal}
          </p>
        )}
      </header>

      <HomeClient
        groupId={active.id}
        userId={userId}
        initialFeed={data.feed}
        members={data.members}
        initialReactions={data.reactions}
        initialComments={data.comments}
        initialPersonalDates={data.personalDates}
        initialRestDays={data.restDays}
        initialPersonal={personal}
        initialGroup={group}
        initialCheckedInToday={checkedInToday}
        showTour={showTour}
      />
    </main>
  );
}
