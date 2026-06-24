"use client";

import { useLanguage } from "@/lib/language-context";
import type { PactAlert as PactAlertData } from "@/lib/group-detail";

/**
 * The loud, top-of-group accountability banner for a staked pact (the whole
 * point of the app). Everyone who opens the group sees it:
 *
 *  - 🚨 BROKE: members who missed a completed week and owe the stake.
 *  - ⚠️ BEHIND: members who still have zero workouts this week.
 *
 * Pairs with the team-wide push/notification fired when the break is recorded.
 */
export function PactAlert({ alert }: { alert: PactAlertData }) {
  const { t } = useLanguage();
  const hasBroke = alert.broke.length > 0;

  const behindNames = alert.behind.filter((m) => !m.isYou).map((m) => m.name);
  const youBehind = alert.behind.some((m) => m.isYou);

  return (
    <div
      className={`rounded-card border p-5 ${
        hasBroke
          ? "border-danger/50 bg-danger/10"
          : "border-volt/40 bg-volt/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl leading-none">
          {hasBroke ? "🚨" : "⚠️"}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-label font-bold uppercase tracking-wide ${
              hasBroke ? "text-danger" : "text-volt"
            }`}
          >
            {hasBroke ? t("pact_alert_broke_title") : t("pact_alert_behind_title")}
          </p>

          {/* Broke the pact — owes the stake. */}
          {alert.broke.map((m) => (
            <p key={`broke-${m.userId}`} className="mt-1.5 text-body text-text">
              {m.isYou
                ? t("pact_alert_broke_you", { stake: alert.stake })
                : t("pact_alert_broke_one", { name: m.name, stake: alert.stake })}
            </p>
          ))}

          {/* Behind this week — hasn't stacked yet. */}
          {youBehind && (
            <p className="mt-1.5 text-body text-text">
              {t("pact_alert_behind_you")}
            </p>
          )}
          {behindNames.length === 1 && (
            <p className="mt-1.5 text-body text-text">
              {t("pact_alert_behind_one", { name: behindNames[0] })}
            </p>
          )}
          {behindNames.length > 1 && (
            <p className="mt-1.5 text-body text-text">
              {t("pact_alert_behind_many", { names: behindNames.join(", ") })}
            </p>
          )}

          <p className="mt-2 text-caption text-text-muted">
            {t("pact_alert_target", { n: alert.target, stake: alert.stake })}
          </p>
        </div>
      </div>
    </div>
  );
}
