"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/site";

/**
 * Forgot password: sends a Supabase reset link. The link returns through
 * /auth/callback (which exchanges the code for a session) to /reset-password
 * where the user sets a new password. We always show the same "sent" message
 * regardless of whether the email exists, to avoid account enumeration.
 */
export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${SITE_URL}/auth/callback?next=/reset-password` },
    );
    setLoading(false);
    if (resetError) {
      setError(t("error_generic"));
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title={t("forgot_title")}
      subtitle={t("forgot_subtitle")}
      footer={
        <Link href="/login" className="text-volt hover:text-volt-dim">
          {t("forgot_back_login")}
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-card border border-volt/30 bg-volt/10 px-4 py-3 text-body text-volt">
          {t("forgot_sent")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            type="email"
            label={t("email_label")}
            placeholder={t("email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {error && <p className="text-label text-danger">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || !email}
          >
            {loading ? t("loading") : t("forgot_submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
