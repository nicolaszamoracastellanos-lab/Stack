"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { FormError } from "@/components/FormError";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";

// Same pattern as the waitlist / subscribe endpoint — kept local on purpose.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Always a translated string — raw Supabase messages go to the console only.
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
    setEmailError(null);
    setPasswordError(null);

    // Client-side validation before hitting the API.
    let invalid = false;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(t("error_email_invalid"));
      invalid = true;
    }
    if (password.length < 8) {
      setPasswordError(t("error_password_short"));
      invalid = true;
    }
    if (invalid) return;

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
        // Log the real reason (e.g. email rate limit); show a neutral generic.
        console.error("[signup] error:", signUpError);
        setError(t("error_generic"));
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
      // Confirmation OFF: logged in immediately -> welcome story, then setup.
      const welcome =
        next && next.startsWith("/")
          ? `/welcome?next=${encodeURIComponent(next)}`
          : "/welcome";
      router.replace(welcome);
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
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          error={emailError ?? undefined}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label={t("password_label")}
          placeholder={t("password_placeholder")}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          error={passwordError ?? undefined}
          autoComplete="new-password"
          required
        />

        <FormError>{error}</FormError>

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
