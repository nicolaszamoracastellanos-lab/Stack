import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { ProfileEditForm } from "@/components/ProfileEditForm";

export default async function ProfileEditPage() {
  const { userId, profile } = await getUserAndProfile();
  if (!userId || !profile) redirect("/login");

  return <ProfileEditForm userId={userId} profile={profile} />;
}
