"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/language-context";

/**
 * Shared frame for the auth screens (login, signup, onboarding): brand in the
 * corner, language toggle, and a centered card with title + subtitle.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <main className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-volt/[0.07] blur-[120px]"
      />

      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="text-h2 font-bold tracking-tight">
          {t("brand")}
          <span className="text-volt">.</span>
        </Link>
        <LanguageToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-h1">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-body text-text-muted">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-6 text-center text-label text-text-muted">
              {footer}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
