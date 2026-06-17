import { requireFounderPage } from "@/lib/founder";
import { getFounderEnv } from "@/lib/founder-env";
import { FounderPanel } from "@/components/founder/FounderPanel";

// Founder/QA harness (STACK_FOUNDER_MODE). Server-gated: non-founders are
// redirected to /home by requireFounderPage before anything renders.
export default async function FounderPage() {
  const { userId, profile } = await requireFounderPage();
  const env = await getFounderEnv();
  return <FounderPanel userId={userId} isFounder={profile.is_founder} env={env} />;
}
