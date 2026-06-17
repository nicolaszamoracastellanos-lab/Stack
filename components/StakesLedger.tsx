"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { BrokenPactCard } from "@/components/BrokenPactCard";
import { recordPactDebts, settleDebt } from "@/lib/pact-actions";
import type { DebtEntry } from "@/lib/group-detail";

/**
 * The stakes ledger on the group page (Batch 4 §3 + §4). On view it records any
 * newly-owed debts (idempotent server action), then shows OUTSTANDING debts as
 * playful broken-pact roast cards up top with "mark settled", and SETTLED
 * history below. Honor system — marking settled just records it.
 */
export function StakesLedger({
  groupId,
  outstanding,
  settled,
  hasStake,
}: {
  groupId: string;
  outstanding: DebtEntry[];
  settled: DebtEntry[];
  hasStake: boolean;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);

  // Evaluate completed weeks on view; refresh if new debts were recorded.
  useEffect(() => {
    if (!hasStake) return;
    let active = true;
    recordPactDebts(groupId).then((n) => {
      if (active && n > 0) router.refresh();
    });
    return () => {
      active = false;
    };
  }, [groupId, hasStake, router]);

  async function settle(id: string) {
    setWorking(id);
    await settleDebt(id);
    router.refresh();
  }

  if (!hasStake) return null;
  if (outstanding.length === 0 && settled.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
        {t("ledger_label")}
      </h2>

      {outstanding.length === 0 ? (
        <p className="text-body text-text-muted">{t("ledger_all_clear")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {outstanding.map((d, i) => (
            <div key={d.id} className="flex flex-col gap-2">
              <BrokenPactCard
                name={d.debtorName}
                stake={d.stakeDescription}
                isYou={d.isYou}
                roastIndex={i}
              />
              <button
                type="button"
                onClick={() => settle(d.id)}
                disabled={working === d.id}
                className="self-end rounded-pill border border-border-strong px-3 py-1.5 text-caption font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
              >
                {working === d.id ? t("loading") : t("ledger_mark_settled")}
              </button>
            </div>
          ))}
        </div>
      )}

      {settled.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("ledger_settled")}
          </p>
          <ul className="rounded-card border border-border bg-surface px-4 py-1">
            {settled.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 border-t border-border py-3 text-label first:border-t-0"
              >
                <span className="min-w-0 truncate text-text-muted">
                  <span className="text-text line-through decoration-text-dim">
                    {d.debtorName}
                  </span>{" "}
                  · {d.stakeDescription}
                </span>
                {d.settledAt && (
                  <span className="shrink-0 text-caption text-text-dim">
                    {t("ledger_settled_on", {
                      date: new Date(d.settledAt).toLocaleDateString(lang, {
                        month: "short",
                        day: "numeric",
                      }),
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
