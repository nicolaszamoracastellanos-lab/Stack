import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Server-side: get the current auth user and their profile row (if any).
 * Returns nulls when logged out / before onboarding. Used by protected layouts
 * to gate access and route to /onboarding when the username isn't set yet.
 */
export async function getUserAndProfile(): Promise<{
  userId: string | null;
  profile: Profile | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, profile: (profile as Profile) ?? null };
}
