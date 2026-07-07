import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";
import { computeQuotaStreak, workoutDaySet } from "@/lib/streak-quota";
import { dayKey, weekDayKeys } from "@/lib/week";
import { CheckinFlow } from "@/components/CheckinFlow";

export default async function CheckinPage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");
  const { groups } = await getActiveGroup();

  const order = profile?.checkin_order === "photo" ? "photo" : "details";
  const initialTemplate = profile?.card_template ?? "minimal";

  const supabase = createClient();
  const [mineRes, restRes, lastRes] = await Promise.all([
    supabase.from("checkins").select("created_at").eq("user_id", userId).limit(400),
    supabase.from("rest_days").select("day").eq("user_id", userId),
    // The user's recent rows — seed the default destination (Batch 5 B2) AND
    // the last-used sport/environment/focus so a daily check-in is mostly
    // taps-through. 20 rows covers the last post's multi-group fan-out without
    // a second round-trip.
    supabase
      .from("checkins")
      .select("post_id, group_id, created_at, sport, environment, goal")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const personalDates = (mineRes.data ?? []).map((r) => r.created_at as string);
  const restDays = (restRes.data ?? []).map((r) => r.day as string);
  const now = new Date();
  const current = computeQuotaStreak(personalDates, {
    weeklyGoal: profile?.weekly_goal ?? null,
    quotaActiveFromKey: profile?.quota_active_from ?? null,
    restDayKeys: restDays,
    tz: profile?.timezone ?? null,
    now,
  });
  // If today isn't logged yet, this post extends the streak by one.
  const streakAfter = current.workedToday ? current.count : current.count + 1;

  // Celebration stats (v3 §3.3), all "as of after this post": days hit this
  // week / weekly goal, the consistency %, and total workout days ever.
  const tz = profile?.timezone ?? null;
  const daySet = workoutDaySet(personalDates, tz);
  const todayKey = dayKey(now, tz);
  const weekDaysBefore = weekDayKeys(todayKey).filter((k) => daySet.has(k)).length;
  const weekDaysAfter = current.workedToday ? weekDaysBefore : weekDaysBefore + 1;
  const goalDenom = profile?.weekly_goal && profile.weekly_goal > 0 ? profile.weekly_goal : 7;
  const totalDaysAfter = daySet.size + (current.workedToday ? 0 : 1);
  const celebration = {
    streakBefore: current.workedToday ? streakAfter : current.count,
    weekLabel: `${Math.min(weekDaysAfter, goalDenom)}/${goalDenom}`,
    consistencyPct: Math.min(100, Math.round((weekDaysAfter / goalDenom) * 100)),
    totalDays: totalDaysAfter,
  };

  // Default destination = the group(s) the last post went to, else "Just me".
  // The last post's multi-group rows are already in lastRes (same post_id) —
  // no second query needed.
  const groupIdSet = new Set(groups.map((g) => g.id));
  const recent = lastRes.data ?? [];
  const last = recent[0];
  let initialDestination: { justMe: boolean; groupIds: string[] };
  if (groups.length === 0) {
    initialDestination = { justMe: true, groupIds: [] };
  } else if (last && last.post_id) {
    const ids = recent
      .filter((r) => r.post_id === last.post_id)
      .map((r) => r.group_id as string | null)
      .filter((id): id is string => !!id && groupIdSet.has(id));
    initialDestination = ids.length
      ? { justMe: false, groupIds: ids }
      : { justMe: true, groupIds: [] };
  } else if (last && !last.group_id) {
    initialDestination = { justMe: true, groupIds: [] };
  } else {
    // No prior post: default to the active group.
    const activeId = groups[0]?.id;
    initialDestination = activeId
      ? { justMe: false, groupIds: [activeId] }
      : { justMe: true, groupIds: [] };
  }

  return (
    <CheckinFlow
      userId={userId}
      groups={groups}
      initialDestination={initialDestination}
      initialOrder={order}
      streakAfter={streakAfter}
      celebration={celebration}
      initialTemplate={initialTemplate}
      initialSelfieMirror={profile?.selfie_mirror_default ?? false}
      lastDetails={
        last
          ? {
              sport: (last.sport as string | null) ?? "",
              environment: (last.environment as string | null) ?? "",
              goal: (last.goal as string | null) ?? "",
            }
          : null
      }
    />
  );
}
