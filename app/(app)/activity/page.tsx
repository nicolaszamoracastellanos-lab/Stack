import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSignedPhotoUrls } from "@/lib/storage";
import { ActivityView } from "@/components/ActivityView";

// Activity: a grid of the current user's posts (across every group), newest
// first. A cross-post (one workout to several groups) shares a post_id and is
// shown ONCE.
export default async function ActivityPage() {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const supabase = createClient();
  const { data } = await supabase
    .from("checkins")
    .select("id, post_id, photo_url, note, sport, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(300);

  // Dedupe by post_id (legacy rows fall back to their unique id). Rows are
  // already newest-first, so the first occurrence wins.
  const seen = new Set<string>();
  const checkins = (data ?? []).filter((c) => {
    const key = (c.post_id as string | null) ?? (c.id as string);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const signed = await getSignedPhotoUrls(
    supabase,
    checkins.map((c) => c.photo_url as string),
  );

  const items = checkins.slice(0, 120).map((c) => ({
    id: c.id as string,
    photoUrl: signed[c.photo_url as string] ?? "",
    note: (c.note as string | null) ?? null,
    sport: (c.sport as string | null) ?? null,
    createdAt: c.created_at as string,
  }));

  return <ActivityView items={items} />;
}
