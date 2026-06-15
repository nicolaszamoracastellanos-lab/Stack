"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Holds either a translated string or a raw Supabase message — never a silent
  // generic for unexpected errors.
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Where the email confirmation link returns to. Prefer the configured base
  // URL (prod), fall back to the current origin in dev. Never hardcode localhost.
  function callbackUrl() {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const suffix =
      next && next.startsWith("/") ? `?next=${encodeURIComponent(next)}` : "";
    return `${base.replace(/\/$/, "")}/auth/callback${suffix}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: callbackUrl() },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered")) {
        setError(t("error_email_taken"));
      } else if (msg.includes("password")) {
        setError(t("error_weak_password"));
      } else {
        // Show the real reason (e.g. email rate limit) instead of a generic.
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Supabase obfuscates an already-registered confirmed email as a "success"
    // with no identities — surface it as taken rather than "check your email".
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(t("error_email_taken"));
      setLoading(false);
      return;
    }

    if (data.session) {
      // Confirmation OFF: logged in immediately -> onboarding.
      const onboarding =
        next && next.startsWith("/")
          ? `/onboarding?next=${encodeURIComponent(next)}`
          : "/onboarding";
      router.replace(onboarding);
    } else {
      // Confirmation ON: account created, no session yet. NOT an error — send
      // them to the confirmation-pending screen.
      router.replace(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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

        {error && (
          <p className="rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
            {error}
          </p>
        )}

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
