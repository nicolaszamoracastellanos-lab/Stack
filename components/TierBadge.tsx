"use client";

import { tierByKey, type TierKey } from "@/lib/tiers";
import { useLanguage } from "@/lib/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAME_KEY: Record<TierKey, TranslationKey> = {
  gold: "tier_gold",
  silver: "tier_silver",
  volt: "tier_volt",
  bronze: "tier_bronze",
  purple: "tier_purple",
  amber: "tier_amber",
  slate: "tier_slate",
};

/**
 * A tier badge (Batch 5 C4): a colour medal + the tier NAME, always paired so
 * Gold/Amber are never confused and a viewer understands a 20-day Gold ≠ a
 * 20-day Purple. `provisional` desaturates + labels it. Renders "Unranked" at
 * level zero unless `hideUnranked`.
 */
export function TierBadge({
  tierKey,
  provisional = false,
  size = "md",
  hideUnranked = false,
  className,
}: {
  tierKey: TierKey | null | undefined;
  provisional?: boolean;
  size?: "sm" | "md";
  hideUnranked?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const tier = tierByKey(tierKey ?? null);

  if (!tier) {
    if (hideUnranked) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-caption text-text-dim",
          className,
        )}
      >
        {t("tier_unranked")}
      </span>
    );
  }

  const dot = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-medium",
        size === "sm" ? "text-caption" : "text-label",
        provisional && "opacity-70",
        className,
      )}
      style={{
        borderColor: provisional ? "var(--border-strong, #2A2A2E)" : tier.hex,
        backgroundColor: `${tier.hex}1f`, // ~12% alpha
        color: tier.hex,
      }}
    >
      <span
        className={cn("shrink-0 rounded-pill", dot)}
        style={{
          backgroundColor: tier.hex,
          boxShadow: tier.outline ? `0 0 0 1px ${tier.outline}` : undefined,
        }}
      />
      {t(NAME_KEY[tier.key])}
      {provisional && (
        <span className="text-caption font-normal text-text-dim">
          · {t("tier_provisional")}
        </span>
      )}
    </span>
  );
}
