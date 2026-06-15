"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { useLanguage } from "@/lib/language-context";

function VerifyEmailInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <AuthShell
      title={t("verify_email_title")}
      subtitle={t("verify_email_body", { email: email || "your inbox" })}
      footer={
        <Link href="/login" className="text-volt hover:text-volt-dim">
          {t("verify_email_login")}
        </Link>
      }
    >
      <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface p-6 text-center">
        <span aria-hidden className="text-4xl">📬</span>
        <p className="text-body text-text-muted">{t("verify_email_hint")}</p>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
