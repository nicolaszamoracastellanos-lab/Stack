"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { removeMember } from "@/lib/group-admin";

/**
 * Owner-only remove control (STACK_FIXES2 D). Confirmation required; surfaces
 * any error (never silent). The real authorization is server-side (action +
 * RLS); this button is only rendered for the owner as a convenience.
 */
export function RemoveMemberButton({
  groupId,
  memberUserId,
  memberName,
}: {
  groupId: string;
  memberUserId: string;
  memberName: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onRemove() {
    if (busy) return;
    if (!window.confirm(t("gd_remove_confirm").replace("{name}", memberName))) return;
    setBusy(true);
    const res = await removeMember(groupId, memberUserId);
    setBusy(false);
    if (!res.ok) {
      window.alert(`${t("gd_remove_failed")}: ${res.error}`);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={busy}
      className="shrink-0 rounded-pill border border-danger/40 px-2.5 py-1 text-caption font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
      aria-label={t("gd_remove")}
    >
      {busy ? t("loading") : t("gd_remove")}
    </button>
  );
}
