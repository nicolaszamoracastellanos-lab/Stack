"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

/** Signs the user out and returns them to the public landing page. */
export function SignOutButton({
  variant = "secondary",
}: {
  variant?: "secondary" | "ghost" | "danger";
}) {
  const { t } = useLanguage();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Button variant={variant} onClick={signOut}>
      {t("profile_logout")}
    </Button>
  );
}
