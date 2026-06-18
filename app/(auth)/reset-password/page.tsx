"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

/**
 * Reset password landing. Reached after the email link returns through
 * /auth/callback, which has already exchanged the recovery code for a session,
 * so the user is authenticated here and can set a new password via updateUser.
 * If there's no session (link expired / opened directly), we route them back to
 * request a fresh link rather than failing silently.
 */
export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setHasSession(!!data.user))
      .catch(() => setHasSession(false));
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 6) return setError(t("reset_too_short"));
    if (pw !== confirm) return setError(t("reset_mismatch"));
    setLoading(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (updErr) return setError(updErr.message);
    setDone(true);
    setTimeout(() => {
      router.replace("/home");
      router.refresh();
    }, 1200);
  }

  // No recovery session: send them to request a new link.
  if (hasSession === false) {
    return (
      <AuthShell title={t("reset_title")} subtitle={t("reset_subtitle")}>
        <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-body text-danger">
          {t("reset_no_session")}
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-volt hover:text-volt-dim"
        >
          {t("reset_request_new")}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("reset_title")} subtitle={t("reset_subtitle")}>
      {done ? (
        <p className="rounded-card border border-volt/30 bg-volt/10 px-4 py-3 text-body text-volt">
          {t("reset_success")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            type="password"
            label={t("reset_new_label")}
            placeholder={t("password_placeholder")}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            label={t("reset_confirm_label")}
            placeholder={t("password_placeholder")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <p className="text-label text-danger">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || hasSession === null || !pw || !confirm}
          >
            {loading ? t("loading") : t("reset_submit")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
