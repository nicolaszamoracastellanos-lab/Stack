import { requireFounderPage } from "@/lib/founder";
import { getFounderEnv } from "@/lib/founder-env";
import { createClient } from "@/lib/supabase/server";
import { FounderPanel } from "@/components/founder/FounderPanel";

// Founder/QA harness (STACK_FOUNDER_MODE). Server-gated: non-founders are
// redirected to /home by requireFounderPage before anything renders.
export default async function FounderPage() {
  const { userId, profile } = await requireFounderPage();
  const env = await getFounderEnv();

  // Founder's OWN subscription count (their RLS only reads their own rows).
  const supabase = createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return (
    <FounderPanel
      userId={userId}
      isFounder={profile.is_founder}
      env={env}
      subCount={count ?? 0}
    />
  );
}
