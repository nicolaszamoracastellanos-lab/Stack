"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Wordmark } from "@/components/Wordmark";
import { WaitlistSignup } from "@/components/WaitlistSignup";
import { useLanguage } from "@/lib/language-context";

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const taglineWords = t("landing_tagline").split(" ");

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Off-center radial volt ambience behind the hero. Energy, not decor. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-pill bg-volt/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-15%] top-[30%] h-[24rem] w-[24rem] rounded-pill bg-volt/[0.06] blur-[100px]"
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
              pulsePeriod
              style={{ fontSize: "clamp(3rem, 12vw, 6rem)" }}
            />
          </h1>

          {/* The tagline as a moment: enormous, weight 900, entering word by
              word. Keyed by language so the sequence replays on toggle. */}
          <p
            key={lang}
            className="mt-8 text-balance font-sans leading-[1.02] tracking-[-0.03em] text-text"
            style={{ fontSize: "clamp(3rem, 10vw, 4.25rem)", fontWeight: 900 }}
          >
            {taglineWords.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="word-rise mr-[0.28em] last:mr-0"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {word}
              </span>
            ))}
          </p>

          <div
            className="word-rise mt-8"
            style={{ animationDelay: `${taglineWords.length * 120 + 100}ms`, display: "block" }}
          >
            <p className="max-w-xl text-balance text-body text-text-muted">
              {t("landing_supporting")}
            </p>
            <p className="mt-3 max-w-xl text-balance text-body text-text-muted">
              {t("landing_supporting2")}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="glow-volt sm:w-56"
                >
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
      </div>

      <footer className="flex flex-col gap-3 px-6 py-6 text-caption text-text-dim sm:px-10">
        <span className="text-volt">{t("landing_appstore")}</span>
        <WaitlistSignup />
        <span>{t("landing_credit")}</span>
      </footer>
    </main>
  );
}
