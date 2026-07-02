"use client";

import { ErrorScreen } from "@/components/ErrorScreen";
import { useLanguage } from "@/lib/language-context";

/** Branded bilingual 404 — replaces Next's default unstyled English screen. */
export default function NotFound() {
  const { t } = useLanguage();
  return <ErrorScreen title={t("nf_title")} body={t("nf_body")} />;
}
