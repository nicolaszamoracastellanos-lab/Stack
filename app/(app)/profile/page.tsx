import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";

// The Profile tab is your own member profile. One screen powers both your
// profile and everyone else's (see /u/[id] + MemberProfile).
export default async function ProfilePage() {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");
  redirect(`/u/${userId}`);
}
