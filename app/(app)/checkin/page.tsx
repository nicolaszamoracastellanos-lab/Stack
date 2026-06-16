import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";
import { computePersonalStreak, toDaySet, localDateKey } from "@/lib/streaks";
import { CheckinFlow, CheckinNoGroup } from "@/components/CheckinFlow";

export default async function CheckinPage() {
  const { userId, profile } = await getUserAndProfile();
  const { active, groups } = await getActiveGroup();

  // You can only check in to a group you belong to.
  if (!userId || groups.length === 0) {
    return <CheckinNoGroup />;
  }

  const order = profile?.checkin_order === "photo" ? "photo" : "details";
  const initialTemplate = profile?.card_template ?? "minimal";

  // The streak the user will have once this check-in posts — drives the story
  // card and the milestone variant. If today isn't checked in yet, this post
  // extends (or restarts) the streak by one.
  const supabase = createClient();
  const [mineRes, restRes] = await Promise.all([
    supabase.from("checkins").select("created_at").eq("user_id", userId).limit(400),
    supabase.from("rest_days").select("day").eq("user_id", userId),
  ]);
  const personalDates = (mineRes.data ?? []).map((r) => r.created_at as string);
  const restDays = (restRes.data ?? []).map((r) => r.day as string);
  const now = new Date();
  const current = computePersonalStreak(personalDates, now, restDays);
  const checkedToday = toDaySet(personalDates).has(localDateKey(now));
  const streakAfter = checkedToday ? current.count : current.count + 1;

  return (
    <CheckinFlow
      userId={userId}
      groups={groups}
      activeId={active?.id ?? null}
      initialOrder={order}
      streakAfter={streakAfter}
      initialTemplate={initialTemplate}
    />
  );
}
