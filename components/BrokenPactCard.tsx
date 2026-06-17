"use client";

import { useLanguage } from "@/lib/language-context";
import { roastLine } from "@/lib/pacts";

/**
 * The "broken pact" moment (Batch 4 §4): a playful, roasting card — never a cold
 * red failure screen. Friends ribbing friends. The breaker sees a self-aware
 * version; everyone else sees a rotating roast line. Warm volt styling, not
 * harsh danger red.
 */
export function BrokenPactCard({
  name,
  stake,
  isYou,
  roastIndex = 0,
}: {
  name: string;
  stake: string;
  isYou?: boolean;
  roastIndex?: number;
}) {
  const { t, lang } = useLanguage();
  const line = isYou ? t("pact_broke_you") : roastLine(roastIndex, name, lang);

  return (
    <article className="overflow-hidden rounded-card border border-volt/30 bg-gradient-to-br from-volt/10 to-surface p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl leading-none">🍗</span>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("pact_broke_title")}
          </p>
          <p className="mt-1 text-body font-medium text-text">{line}</p>
          {stake && (
            <p className="mt-1.5 text-label font-semibold text-volt">
              {t("pact_owes", { stake })}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
