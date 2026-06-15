import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/ProfileView";

export default async function ProfilePage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId || !profile) redirect("/login");

  // All of this user's check-ins (any group) drive the streaks, total and the
  // heatmap. Only created_at is needed.
  const supabase = createClient();
  const { data } = await supabase
    .from("checkins")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const checkinDates = (data ?? []).map((r) => r.created_at as string);

  return <ProfileView profile={profile} checkinDates={checkinDates} />;
}
