"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Wordmark } from "@/components/Wordmark";
import { WaitlistSignup } from "@/components/WaitlistSignup";
import { useLanguage } from "@/lib/language-context";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Subtle volt glow bleeding from the corner — energy, not decoration. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-volt/10 blur-[120px]"
      />

      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Wordmark size="md" />
        <LanguageToggle />
      </header>

      <div className="flex flex-1 items-center px-6 sm:px-10">
        <div className="mx-auto w-full max-w-2xl py-16">
          <h1>
            <Wordmark
              size="lg"
              style={{ fontSize: "clamp(3rem, 12vw, 6rem)" }}
            />
          </h1>

          <p className="mt-6 text-balance text-h1 text-text">
            {t("landing_tagline")}
          </p>

          <p className="mt-5 max-w-xl text-balance text-body text-text-muted">
            {t("landing_supporting")}
          </p>
          <p className="mt-3 max-w-xl text-balance text-body text-text-muted">
            {t("landing_supporting2")}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="sm:w-auto">
              <Button variant="primary" size="lg" fullWidth className="sm:w-56">
                {t("landing_cta_signup")}
              </Button>
            </Link>
            <Link href="/login" className="sm:w-auto">
              <Button variant="secondary" size="lg" fullWidth className="sm:w-44">
                {t("landing_cta_login")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-3 px-6 py-6 text-caption text-text-dim sm:px-10">
        <span className="text-volt">{t("landing_appstore")}</span>
        <WaitlistSignup />
        <span>{t("landing_credit")}</span>
      </footer>
    </main>
  );
}
