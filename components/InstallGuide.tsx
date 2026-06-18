"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";
import {
  StepSafari,
  StepShare,
  StepAddToHome,
  StepAdd,
  StepHomeScreen,
} from "@/components/InstallIllustrations";

const FALLBACK_HOST = "stack-app.online";

const STEPS = [
  { titleKey: "install_step1_title", bodyKey: "install_step1_body", Art: StepSafari },
  { titleKey: "install_step2_title", bodyKey: "install_step2_body", Art: StepShare },
  { titleKey: "install_step3_title", bodyKey: "install_step3_body", Art: StepAddToHome },
  { titleKey: "install_step4_title", bodyKey: "install_step4_body", Art: StepAdd },
  { titleKey: "install_step5_title", bodyKey: "install_step5_body", Art: StepHomeScreen },
] as const;

export function InstallGuide() {
  const { t } = useLanguage();
  const [host, setHost] = useState(FALLBACK_HOST);
  const [isSafari, setIsSafari] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHost(window.location.host || FALLBACK_HOST);
    const ua = window.navigator.userAgent;
    // Real iOS Safari has "Safari" but none of the in-app/other-browser tokens.
    const notSafari = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Android|FBAN|FBAV|Instagram|Line\//i.test(
      ua,
    );
    setIsSafari(/Safari/i.test(ua) && !notSafari);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${host}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the URL is shown on screen to type manually.
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 pb-16 pt-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/profile"
          aria-label={t("back")}
          className="flex h-9 w-9 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <Wordmark size="sm" />
        <LanguageToggle />
      </div>

      {/* Hero */}
      <h1 className="text-balance text-h1">{t("install_title")}</h1>
      <p className="mt-3 text-balance text-body text-text-muted">
        {t("install_subtitle")}
      </p>
      <p className="mt-3 text-balance text-label text-volt">
        {t("install_beta_note")}
      </p>

      {/* Safari callout */}
      <div
        className={`mt-7 rounded-card border p-5 ${
          isSafari
            ? "border-border bg-surface"
            : "border-volt/40 bg-volt/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-xl leading-none">🧭</span>
          <div className="min-w-0">
            <p className="text-label font-semibold text-text">
              {t("install_safari_title")}
            </p>
            <p className="mt-1 text-label text-text-muted">
              {t(isSafari ? "install_safari_body" : "install_not_safari", {
                url: host,
              })}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-input bg-bg px-2.5 py-1.5 text-caption text-text">
                {host}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-input border border-border-strong px-2.5 py-1.5 text-caption text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                {copied ? t("install_link_copied") : t("install_copy_link")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <ol className="mt-10 flex flex-col gap-12">
        {STEPS.map((step, i) => {
          const n = i + 1;
          const Art = step.Art;
          return (
            <li key={step.titleKey} className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-volt font-mono text-label font-bold text-bg nums">
                  {n}
                </span>
                <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
                  {t("install_step_label", { n })}
                </p>
              </div>

              <h2 className="mt-4 text-balance text-h2">{t(step.titleKey)}</h2>
              <p className="mt-2 text-balance text-body text-text-muted">
                {t(step.bodyKey, { url: host })}
              </p>

              <div className="mt-5 flex justify-center">
                <div className="w-full max-w-[240px]">
                  <Art label={t(step.titleKey)} />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-14">
        <Link href="/profile">
          <Button variant="primary" size="lg" fullWidth>
            {t("install_done")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
