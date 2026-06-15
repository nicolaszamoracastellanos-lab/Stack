"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { JoinByCode } from "@/components/JoinByCode";
import { SignOutButton } from "@/components/SignOutButton";
import { useLanguage } from "@/lib/language-context";

/**
 * Home screen when the user belongs to no group: create one, or join an
 * existing one by pasting its invite code / link.
 */
export function EmptyGroupState() {
  const { t } = useLanguage();

  return (
    <div className="mt-2">
      <h1 className="text-h1">{t("home_no_group_title")}</h1>
      <p className="mt-2 text-body text-text-muted">
        {t("home_no_group_subtitle")}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        <Link href="/groups/new">
          <Button variant="primary" size="lg" fullWidth>
            {t("home_create_group")}
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-caption text-text-dim">{t("home_join_group")}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Join an existing group by pasting its code or invite link. */}
        <JoinByCode />
      </div>

      <div className="mt-10">
        <SignOutButton variant="ghost" />
      </div>
    </div>
  );
}
