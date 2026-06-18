import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NOTIF_SELECT, type NotifRow } from "@/lib/notification-view";
import { NotificationCenter } from "@/components/NotificationCenter";

// Notification center (STACK_BATCH6 1.4). RLS limits rows to the recipient.
export default async function NotificationsPage() {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select(NOTIF_SELECT)
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <NotificationCenter userId={userId} initial={(data ?? []) as unknown as NotifRow[]} />
  );
}
