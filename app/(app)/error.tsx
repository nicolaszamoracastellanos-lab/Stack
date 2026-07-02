"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { useLanguage } from "@/lib/language-context";

/**
 * Error boundary for the logged-in app. The real error (message + digest)
 * goes to the console for diagnosis; the user gets branded bilingual copy and
 * a recover action — never a raw error string.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("[app error]", error, error.digest);
  }, [error]);

  return <ErrorScreen title={t("err_title")} body={t("err_body")} onRetry={reset} />;
}
