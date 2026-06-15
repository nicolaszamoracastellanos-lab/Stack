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
import { isProfileComplete } from "@/lib/profile";
import type { Profile } from "@/lib/types";

function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (signInError || !data.user) {
      setError("error_invalid_credentials");
      setLoading(false);
      return;
    }

    // Route by onboarding state: a fully-completed profile -> home (or the
    // original target), otherwise into the onboarding flow to finish it.
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (isProfileComplete(profile as Profile | null)) {
      router.replace(next && next.startsWith("/") ? next : "/home");
    } else {
      const target =
        next && next.startsWith("/")
          ? `/onboarding?next=${encodeURIComponent(next)}`
          : "/onboarding";
      router.replace(target);
    }
  }

  return (
    <AuthShell
      title={t("login_title")}
      subtitle={t("login_subtitle")}
      footer={
        <>
          {t("login_no_account")}{" "}
          <Link href="/signup" className="text-volt hover:text-volt-dim">
            {t("login_signup_link")}
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
          autoComplete="current-password"
          required
        />

        {error && <p className="text-label text-danger">{t(error)}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !email || !password}
        >
          {loading ? t("loading") : t("login_submit")}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
