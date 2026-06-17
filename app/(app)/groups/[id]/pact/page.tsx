import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PactEditor } from "@/components/PactEditor";
import { isPact } from "@/lib/pacts";
import type { Group } from "@/lib/types";

// Pact setup / editor (Batch 4). Admin (creator) only — used to create or
// upgrade a group into a pact, and to edit it later.
export default async function PactPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await getUserAndProfile();
  if (!userId) redirect("/login");

  const supabase = createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!group) redirect("/groups");
  if (group.created_by !== userId) redirect(`/groups/${params.id}`);

  return <PactEditor group={group as Group} isEdit={isPact(group as Group)} />;
}
