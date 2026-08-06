"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Mark3D } from "@/components/Mark3D";
import { WaitlistSignup } from "@/components/WaitlistSignup";
import { useLanguage } from "@/lib/language-context";

/**
 * Landing, ported from stack_v3_prototype.html §3.1. No wordmark in the top
 * corner — the 3D mark is the only logo. Tagline slams in word by word at
 * 130ms intervals; the second sentence carries the volt accent with a soft
 * text glow. CTAs and footer exactly as prototyped.
 */
export default function LandingPage() {
  const { t, lang } = useLanguage();

  // "Show up. Every day." — first sentence white, second sentence volt.
  // Splitting on sentence boundaries keeps the accent rule working in Spanish
  // ("Preséntate. Todos los días.") without hardcoding word counts.
  const tagline = t("landing_tagline");
  const firstLen = tagline.indexOf(".") + 1;
  const words = tagline.split(" ").map((w, i, arr) => ({
    w,
    accent: arr.slice(0, i + 1).join(" ").length > firstLen,
  }));

  return (
    <main
      className="relative flex min-h-dvh flex-col overflow-hidden px-[26px] pb-10 pt-16"
      style={{
        background:
          "radial-gradient(120% 60% at 70% 8%, rgba(198,248,6,.07), transparent 60%), #0A0A0B",
      }}
    >
      <div className="absolute right-5 top-5 z-10">
        <LanguageToggle />
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        {/* "App coming soon" pill — hairline chip with a pulsing volt dot. Sits
            above the 3D mark so it reads before the hero without touching it. */}
        <div className="in-rise" style={{ animationDelay: ".1s" }}>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3.5 py-1.5">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "#C6F806" }}
            />
            <span className="eyebrow">{t("landing_coming_soon")}</span>
          </span>
        </div>

        {/* 3D hero — the entrance fade lives HERE (the wrapper), never on the
            preserve-3d element itself (filters/opacity flatten the 3D). */}
        <div className="in-rise" style={{ animationDelay: ".15s" }}>
          <Mark3D />
        </div>

        {/* Tagline: 32px single-line display, word-staggered. Keyed by lang so
            the sequence replays on toggle. */}
        <h1
          key={lang}
          className="type-display mt-1.5 text-[32px] leading-[1.05]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {words.map(({ w, accent }, i) => (
            <span
              key={`${w}-${i}`}
              className="word-slam mr-[0.26em] inline-block last:mr-0"
              style={{
                animationDelay: `${0.25 + i * 0.13}s`,
                ...(accent
                  ? { color: "#C6F806", textShadow: "0 0 40px rgba(198,248,6,.35)" }
                  : {}),
              }}
            >
              {w}
            </span>
          ))}
        </h1>

        <p
          className="in-rise mt-[18px] max-w-[32ch] text-[15px] font-medium leading-[1.55] text-text-muted"
          style={{ animationDelay: ".9s" }}
        >
          {t("landing_supporting")}
        </p>

        <div
          className="in-rise mt-auto flex flex-col gap-3 pt-7"
          style={{ animationDelay: "1.05s" }}
        >
          <Link href="/signup" className="w-full">
            <Button variant="primary" size="lg" fullWidth>
              {t("landing_cta_signup")}
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary" size="lg" fullWidth>
              {t("landing_cta_login")}
            </Button>
          </Link>
        </div>

        <footer
          className="in-rise mt-[22px] flex flex-col items-center gap-3 text-center"
          style={{ animationDelay: "1.2s" }}
        >
          <WaitlistSignup />
          <span className="eyebrow">{t("landing_credit")}</span>
        </footer>
      </div>
    </main>
  );
}
