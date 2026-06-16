import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { getHomeData } from "@/lib/feed";
import {
  computePersonalStreak,
  computeGroupStreak,
  localDateKey,
  toDaySet,
} from "@/lib/streaks";
import { HomeClient } from "@/components/HomeClient";
import { EmptyGroupState } from "@/components/EmptyGroupState";
import { GroupSwitcher } from "@/components/GroupSwitcher";
import { BrandBar } from "@/components/BrandBar";

// The heart of the app. Server-fetches the group's feed + the data needed to
// seed the streaks, then hands off to HomeClient for the live, interactive UI.
export default async function HomePage() {
  const { userId } = await getUserAndProfile();
  const { active, groups } = await getActiveGroup();

  if (!active || !userId) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-8">
        <BrandBar className="mb-8" />
        <EmptyGroupState />
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

      <header className="mb-8 min-w-0">
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
      />
    </main>
  );
}
