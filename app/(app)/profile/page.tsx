import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/ProfileView";

export default async function ProfilePage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId || !profile) redirect("/login");

  // All of this user's check-ins (any group). created_at drives streaks/heatmap;
  // post_id lets us count POSTS rather than per-group rows for the total.
  const supabase = createClient();
  const { data } = await supabase
    .from("checkins")
    .select("id, post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  const checkinDates = rows.map((r) => r.created_at as string);
  // A cross-post to N groups shares one post_id → counts once. Legacy rows have
  // no post_id, so fall back to their unique id.
  const totalPosts = new Set(
    rows.map((r) => (r.post_id as string | null) ?? (r.id as string)),
  ).size;

  return (
    <ProfileView
      profile={profile}
      checkinDates={checkinDates}
      totalPosts={totalPosts}
    />
  );
}
