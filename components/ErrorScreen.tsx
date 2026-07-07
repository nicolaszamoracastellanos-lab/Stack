"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { useLanguage } from "@/lib/language-context";

/**
 * The one branded failure screen — error boundaries and the 404 both compose
 * it. Bilingual, calm, never a raw error (detail belongs in console/server
 * logs), always a clear next action.
 */
export function ErrorScreen({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  /** When present, shows the primary "Try again" action (error boundaries). */
  onRetry?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <Wordmark />
      <div className="flex flex-col gap-2">
        <h1 className="type-display text-[26px] leading-tight">{title}</h1>
        <p className="text-body text-text-muted">{body}</p>
      </div>
      <div className="flex gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            {t("err_retry")}
          </Button>
        )}
        <Link href="/home">
          <Button variant={onRetry ? "secondary" : "primary"}>
            {t("nav_home")}
          </Button>
        </Link>
      </div>
    </main>
  );
}
