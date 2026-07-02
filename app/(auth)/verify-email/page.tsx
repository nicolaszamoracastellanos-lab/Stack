"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function resend() {
    if (!email || sending || cooldown) return;
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setSending(false);
    if (resendError) {
      console.error("[verify-email resend] error:", resendError);
      setError(t("error_generic"));
      return;
    }
    setResent(true);
    setCooldown(true);
    timerRef.current = setTimeout(() => setCooldown(false), 30_000);
  }

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
        {email && (
          <Button
            type="button"
            variant="secondary"
            onClick={resend}
            disabled={sending || cooldown}
          >
            {sending ? t("loading") : t("verify_resend")}
          </Button>
        )}
        {resent && !error && (
          <p className="text-label text-volt" role="status">
            {t("verify_resent")}
          </p>
        )}
        <FormError>{error}</FormError>
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
