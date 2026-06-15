"use client";

import { useLanguage } from "@/lib/language-context";
import { type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const options: { value: Language; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "es", label: "ES" },
];

/**
 * EN / ES segmented switch. Flips the language instantly across the app and
 * persists the choice. Small, quiet, lives in a corner.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex rounded-pill border border-border bg-surface p-0.5",
        className,
      )}
      role="group"
      aria-label={t("a11y_language")}
    >
      {options.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={cn(
              "rounded-pill px-3 py-1 text-caption font-medium transition-colors duration-150",
              active
                ? "bg-volt text-bg"
                : "text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
