"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { isPact, disciplinesLabel } from "@/lib/pacts";
import type { Group } from "@/lib/types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill bg-bg/50 px-3 py-1.5 text-label font-medium text-text">
      {children}
    </span>
  );
}

/**
 * The pact's contract + identity on the group page (Batch 4 §1+§2). Shows the
 * clean summary prominently, an "About this pact" block when identity exists,
 * and a set-up / edit CTA for the admin.
 */
export function PactSection({ group, isCreator }: { group: Group; isCreator: boolean }) {
  const { t, lang } = useLanguage();
  const pact = isPact(group);

  const hasIdentity =
    group.intention || group.motivation || group.end_goal || group.meaning;

  if (!pact) {
    // Not a pact yet. Only the admin sees the invite to make one.
    if (!isCreator && !hasIdentity) return null;
    return (
      <section className="flex flex-col gap-6">
        {hasIdentity && <About group={group} />}
        {isCreator && (
          <Link href={`/groups/${group.id}/pact`}>
            <Button variant="primary" size="lg" fullWidth>
              {t("pact_setup_cta")}
            </Button>
          </Link>
        )}
      </section>
    );
  }

  const durationLabel =
    group.duration_type === "ongoing"
      ? t("pact_duration_ongoing")
      : group.pact_end_date
        ? t("pact_ends", {
            date: new Date(group.pact_end_date).toLocaleDateString(lang, {
              month: "short",
              day: "numeric",
            }),
          })
        : t("pact_weeks", { n: group.duration_weeks ?? 0 });

  const whoPaysLabel =
    group.who_pays === "breaker"
      ? t("pact_breaker_pays")
      : group.who_pays === "any_misser"
        ? t("pact_any_misser_pays")
        : group.who_pays === "last_place"
          ? t("pact_last_place_pays")
          : null;

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-card border border-volt/30 bg-gradient-to-br from-volt/10 to-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("pact_summary_label")}
          </p>
          {isCreator && (
            <Link
              href={`/groups/${group.id}/pact`}
              className="text-caption font-medium text-volt hover:text-volt-dim"
            >
              {t("pact_edit_cta")}
            </Link>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>🎯 {t("pact_per_week", { n: group.workouts_per_week ?? 0 })}</Pill>
          <Pill>🏋️ {disciplinesLabel(group.allowed_disciplines, lang, t("pact_all_disciplines"))}</Pill>
          <Pill>📅 {durationLabel}</Pill>
          {group.stake_value && <Pill>💸 {group.stake_value}</Pill>}
          {whoPaysLabel && <Pill>⚖️ {whoPaysLabel}</Pill>}
        </div>
      </div>

      {hasIdentity && <About group={group} />}
    </section>
  );
}

function About({ group }: { group: Group }) {
  const { t } = useLanguage();
  const rows: { label: string; value: string | null }[] = [
    { label: t("pact_intention_label"), value: group.intention },
    { label: t("pact_motivation_label"), value: group.motivation },
    { label: t("pact_endgoal_label"), value: group.end_goal },
    { label: t("pact_meaning_label"), value: group.meaning },
  ].filter((r) => r.value && r.value.trim());

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
        {t("pact_about_label")}
      </p>
      <div className="rounded-card border border-border bg-surface px-5 py-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex flex-col gap-0.5 border-t border-border py-3 first:border-t-0 first:pt-0"
          >
            <span className="text-caption uppercase tracking-wide text-text-dim">{r.label}</span>
            <span className="text-body text-text">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
