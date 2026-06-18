import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getActiveGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";
import { computeQuotaStreak } from "@/lib/streak-quota";
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
    // The user's most recent post — seeds the default destination (Batch 5 B2).
    supabase
      .from("checkins")
      .select("post_id, group_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
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

  // Default destination = the group(s) the last post went to, else "Just me".
  const groupIdSet = new Set(groups.map((g) => g.id));
  const last = lastRes.data?.[0];
  let initialDestination: { justMe: boolean; groupIds: string[] };
  if (groups.length === 0) {
    initialDestination = { justMe: true, groupIds: [] };
  } else if (last && last.post_id) {
    // Re-expand the last post to all the groups it targeted (still-joined only).
    const { data: lastRows } = await supabase
      .from("checkins")
      .select("group_id")
      .eq("user_id", userId)
      .eq("post_id", last.post_id as string);
    const ids = (lastRows ?? [])
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
      initialTemplate={initialTemplate}
      initialSelfieMirror={profile?.selfie_mirror_default ?? false}
    />
  );
}
