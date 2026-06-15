import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrls } from "@/lib/storage";
import { ActivityView } from "@/components/ActivityView";

// Activity: a grid of all of the current user's check-in photos / posts
// (across every group), newest first.
export default async function ActivityPage() {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const supabase = createClient();
  const { data } = await supabase
    .from("checkins")
    .select("id, photo_url, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(120);

  const checkins = data ?? [];
  const signed = await getSignedPhotoUrls(
    supabase,
    checkins.map((c) => c.photo_url as string),
  );

  const items = checkins.map((c) => ({
    id: c.id as string,
    photoUrl: signed[c.photo_url as string] ?? "",
    note: (c.note as string | null) ?? null,
    createdAt: c.created_at as string,
  }));

  return <ActivityView items={items} />;
}
