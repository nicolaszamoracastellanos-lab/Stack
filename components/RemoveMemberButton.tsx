"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { Modal } from "@/components/Modal";
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onRemove() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const res = await removeMember(groupId, memberUserId);
    setBusy(false);
    if (!res.ok) {
      // res.error is a code (not_owner/self/failed), never display text.
      console.error("remove member:", res.error);
      setFailed(true);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="danger"
        size="sm"
        pill
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        aria-label={t("gd_remove")}
        className="shrink-0"
      >
        {t("gd_remove")}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} label={t("gd_remove")}>
        <p className="text-body text-text">
          {t("gd_remove_confirm").replace("{name}", memberName)}
        </p>
        {failed && <FormError className="mt-4">{t("gd_remove_failed")}</FormError>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={onRemove} disabled={busy}>
            {busy ? t("loading") : t("groups_confirm_yes")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
