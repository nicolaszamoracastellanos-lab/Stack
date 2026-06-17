"use client";

import Link from "next/link";
import { TIERS } from "@/lib/tiers";
import { TierBadge } from "@/components/TierBadge";
import { useLanguage } from "@/lib/language-context";

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="text-h2">{title}</h2>
      <p className="mt-2 text-body text-text-muted">{body}</p>
    </section>
  );
}

/**
 * Tier Guide (Batch 5 C6): teaches the streak + tier system in plain language —
 * the tiers, when a streak breaks, what the red alert means, what rest days do,
 * and how to climb/drop. EN + ES.
 */
export function TierGuide() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/profile" className="text-label text-text-muted hover:text-text">
          {t("back")}
        </Link>
        <h1 className="text-h2">{t("tierguide_title")}</h1>
        <span className="w-10" />
      </header>

      <p className="text-body text-text-muted">{t("tierguide_intro")}</p>

      {/* The tiers table */}
      <section className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="text-h2">{t("tierguide_tiers_title")}</h2>
        <p className="mt-1 text-label text-text-muted">
          {t("tierguide_tiers_body")}
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {TIERS.map((tier) => (
            <li
              key={tier.key}
              className="flex items-center justify-between rounded-input border border-border bg-bg px-3 py-2"
            >
              <TierBadge tierKey={tier.key} />
              <span className="font-mono text-caption text-text-dim nums">
                {t("tierguide_per_week", { n: tier.frequency })}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        <Section
          title={t("tierguide_streak_title")}
          body={t("tierguide_streak_body")}
        />
        <Section
          title={t("tierguide_red_title")}
          body={t("tierguide_red_body")}
        />
        <Section
          title={t("tierguide_rest_title")}
          body={t("tierguide_rest_body")}
        />
        <Section
          title={t("tierguide_climb_title")}
          body={t("tierguide_climb_body")}
        />
      </div>
    </main>
  );
}
