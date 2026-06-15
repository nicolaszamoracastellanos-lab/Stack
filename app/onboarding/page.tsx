"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";
import { type TranslationKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function OnboardingForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") ? next : "/home";

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // If the user already finished onboarding, don't show this again.
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.username) {
        router.replace(destination);
        return;
      }
      setReady(true);
    })();
  }, [router, destination]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = username.trim().toLowerCase();
    if (!USERNAME_RE.test(normalized)) {
      setError("error_username_invalid");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // Pre-check availability for a friendly message (the DB unique constraint is
    // the real guard against races).
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalized)
      .maybeSingle();
    if (existing) {
      setError("error_username_taken");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      username: normalized,
      display_name: displayName.trim() || null,
    });

    if (insertError) {
      // 23505 = unique_violation (someone took it between check and insert).
      if (insertError.code === "23505") {
        setError("error_username_taken");
      } else {
        setError("error_generic");
      }
      setLoading(false);
      return;
    }

    router.replace(destination);
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-label text-text-dim">{t("loading")}</p>
      </main>
    );
  }

  return (
    <AuthShell title={t("onboarding_title")} subtitle={t("onboarding_subtitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label={t("username_label")}
          placeholder={t("username_placeholder")}
          prefix="@"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          required
        />
        <Input
          label={t("display_name_label")}
          placeholder={t("display_name_placeholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          maxLength={40}
        />

        {error && <p className="text-label text-danger">{t(error)}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !username}
        >
          {loading ? t("loading") : t("onboarding_submit")}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
