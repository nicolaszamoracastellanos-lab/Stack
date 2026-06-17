import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import { NotificationSettings } from "@/components/NotificationSettings";

export default async function NotificationsSettingsPage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/profile/edit" className="text-label text-text-muted hover:text-text">
          ←
        </Link>
        <span className="w-6" />
      </header>
      <NotificationSettings
        userId={userId}
        master={profile?.notif_master ?? true}
        types={profile?.notif_types ?? {}}
        quietStart={profile?.quiet_start ?? 22}
        quietEnd={profile?.quiet_end ?? 8}
      />
    </main>
  );
}
