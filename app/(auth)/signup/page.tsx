"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { type TranslationKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState<TranslationKey | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      // Map Supabase messages to translated, friendly copy.
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        setError("error_email_taken");
      } else if (msg.includes("password")) {
        setError("error_weak_password");
      } else {
        setError("error_generic");
      }
      setLoading(false);
      return;
    }

    // If email confirmation is OFF (recommended for Phase 1) we get a session
    // immediately and go straight to onboarding. If it's ON, there's no session
    // yet — tell the user to confirm, then log in.
    if (data.session) {
      // Carry the invite target through onboarding so a new user who arrived
      // from a /join link lands back there after choosing a username.
      const onboarding =
        next && next.startsWith("/")
          ? `/onboarding?next=${encodeURIComponent(next)}`
          : "/onboarding";
      router.replace(onboarding);
    } else {
      setNotice("signup_check_email");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("signup_title")}
      subtitle={t("signup_subtitle")}
      footer={
        <>
          {t("signup_have_account")}{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="text-volt hover:text-volt-dim"
          >
            {t("signup_login_link")}
          </Link>
        </>
      }
    >
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
        <Input
          type="password"
          label={t("password_label")}
          placeholder={t("password_placeholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        {error && <p className="text-label text-danger">{t(error)}</p>}
        {notice && <p className="text-label text-volt">{t(notice)}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !email || !password}
        >
          {loading ? t("loading") : t("signup_submit")}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
