"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { useLanguage } from "@/lib/language-context";

/** Error boundary for everything outside the logged-in shell (landing, auth). */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("[root error]", error, error.digest);
  }, [error]);

  return <ErrorScreen title={t("err_title")} body={t("err_body")} onRetry={reset} />;
}
