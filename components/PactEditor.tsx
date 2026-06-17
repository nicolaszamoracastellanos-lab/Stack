"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { SPORTS, labelFor, type Option } from "@/lib/workout-options";
import { DURATION_PRESETS, WHO_PAYS, type WhoPays } from "@/lib/pacts";
import { localDateKey } from "@/lib/streaks";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

type StakeChoice = "none" | "money" | "favor" | "custom";

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-caption font-medium uppercase tracking-wide text-text-dim">{label}</p>
      {hint && <p className="mt-1 text-caption text-text-dim">{hint}</p>}
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-label transition-colors",
        active
          ? "border-volt bg-volt/15 text-volt"
          : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

const inputCls =
  "w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30";

/**
 * The pact setup flow (Batch 4 §1+§2): optional identity + required rules
 * (workouts/week, allowed disciplines, duration, stake, who pays). Admin-only;
 * saves onto the group row.
 */
export function PactEditor({
  group,
  isEdit,
  memberCount,
}: {
  group: Group;
  isEdit: boolean;
  memberCount: number;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [intention, setIntention] = useState(group.intention ?? "");
  const [motivation, setMotivation] = useState(group.motivation ?? "");
  const [endGoal, setEndGoal] = useState(group.end_goal ?? "");
  const [meaning, setMeaning] = useState(group.meaning ?? "");

  const [workouts, setWorkouts] = useState<number>(group.workouts_per_week ?? 4);
  const [allowAll, setAllowAll] = useState(
    !group.allowed_disciplines || group.allowed_disciplines.length === 0,
  );
  const [disciplines, setDisciplines] = useState<Set<string>>(
    new Set(group.allowed_disciplines ?? []),
  );
  const [query, setQuery] = useState("");

  const [durationType, setDurationType] = useState<"fixed" | "ongoing">(
    group.duration_type ?? "fixed",
  );
  const [weeks, setWeeks] = useState<number>(group.duration_weeks ?? 8);

  const [stake, setStake] = useState<StakeChoice>(
    (group.stake_type as StakeChoice) ?? "none",
  );
  const [stakeValue, setStakeValue] = useState(group.stake_value ?? "");
  const [whoPays, setWhoPays] = useState<WhoPays | "">(group.who_pays ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredSports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SPORTS;
    return SPORTS.filter(
      (o) => o.en.toLowerCase().includes(q) || o.es.toLowerCase().includes(q) || o.key.includes(q),
    );
  }, [query]);

  function toggleDiscipline(key: string) {
    setDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const stakePlaceholder =
    stake === "money" ? t("pact_stake_money_ph") : stake === "favor" ? t("pact_stake_favor_ph") : t("pact_stake_custom_ph");

  async function save() {
    setError(null);
    if (!workouts || workouts < 1 || workouts > 7) return setError(t("pact_err_workouts"));
    if (durationType === "fixed" && (!weeks || weeks < 1)) return setError(t("pact_err_duration"));
    const hasStake = stake !== "none";
    if (hasStake && !stakeValue.trim()) return setError(t("pact_err_stake_value"));
    if (hasStake && !whoPays) return setError(t("pact_err_whopays"));

    setSaving(true);
    const supabase = createClient();
    const start = new Date();
    const startKey = localDateKey(start);
    let endKey: string | null = null;
    if (durationType === "fixed") {
      const end = new Date(start);
      end.setDate(end.getDate() + weeks * 7);
      endKey = localDateKey(end);
    }

    const allowedList = allowAll ? [] : Array.from(disciplines);
    const payload = {
      intention: intention.trim() || null,
      motivation: motivation.trim() || null,
      end_goal: endGoal.trim() || null,
      meaning: meaning.trim() || null,
      workouts_per_week: workouts,
      allowed_disciplines: allowedList,
      duration_type: durationType,
      duration_weeks: durationType === "fixed" ? weeks : null,
      pact_start_date: startKey,
      pact_end_date: endKey,
      stake_type: hasStake ? stake : null,
      stake_value: hasStake ? stakeValue.trim() : null,
      who_pays: hasStake ? whoPays : null,
    };

    // Changing an EXISTING pact with >1 member can't be unilateral — it becomes
    // a proposal that every member must approve (§5). First-time setup, or a
    // solo group, applies directly.
    const needsVote = isEdit && memberCount > 1;
    if (needsVote) {
      const summary = [
        t("pact_per_week", { n: workouts }),
        allowAll
          ? t("pact_all_disciplines")
          : allowedList.map((k) => labelFor(SPORTS, k, lang)).join(", "),
        durationType === "ongoing" ? t("pact_duration_ongoing") : t("pact_weeks", { n: weeks }),
        ...(hasStake ? [stakeValue.trim()] : []),
      ].join(" · ");
      const { error: pErr } = await supabase.from("rule_change_proposals").insert({
        group_id: group.id,
        proposed_by: group.created_by,
        // Keep the original start date; everything else is the proposed spec.
        proposed_changes: { ...payload, pact_start_date: group.pact_start_date ?? startKey },
        summary,
        approvals: [group.created_by],
        status: "pending",
      });
      if (pErr) {
        setError(`${pErr.code ?? "ERR"}: ${pErr.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: upErr } = await supabase.from("groups").update(payload).eq("id", group.id);
      if (upErr) {
        setError(`${upErr.code ?? "ERR"}: ${upErr.message}`);
        setSaving(false);
        return;
      }
    }
    router.push(`/groups/${group.id}`);
    router.refresh();
  }

  const whoPaysDesc: Record<WhoPays, string> = {
    breaker: t("pact_whopays_breaker_desc"),
    any_misser: t("pact_whopays_any_misser_desc"),
    last_place: t("pact_whopays_last_place_desc"),
  };
  const whoPaysLabel: Record<WhoPays, string> = {
    breaker: t("pact_whopays_breaker"),
    any_misser: t("pact_whopays_any_misser"),
    last_place: t("pact_whopays_last_place"),
  };

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="mb-7 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/groups/${group.id}`)}
          aria-label={t("back")}
          className="flex h-9 w-9 items-center justify-center rounded-pill text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-h1">{isEdit ? t("pact_edit_title") : t("pact_setup_title")}</h1>
      </header>

      <div className="flex flex-col gap-9">
        {/* Identity (optional) */}
        <Section label={t("pact_identity_label")} hint={t("pact_identity_hint")}>
          <Input label={t("pact_intention_label")} placeholder={t("pact_intention_ph")} value={intention} onChange={(e) => setIntention(e.target.value)} maxLength={120} />
          <Input label={t("pact_motivation_label")} placeholder={t("pact_motivation_ph")} value={motivation} onChange={(e) => setMotivation(e.target.value)} maxLength={160} />
          <Input label={t("pact_endgoal_label")} placeholder={t("pact_endgoal_ph")} value={endGoal} onChange={(e) => setEndGoal(e.target.value)} maxLength={120} />
          <div className="flex flex-col gap-1.5">
            <label className="text-label text-text-muted">{t("pact_meaning_label")}</label>
            <textarea value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder={t("pact_meaning_ph")} rows={2} maxLength={240} className={cn(inputCls, "resize-none")} />
          </div>
        </Section>

        {/* Rules */}
        <Section label={t("pact_rules_label")}>
          {/* Workouts per week */}
          <div>
            <label className="text-label text-text-muted">{t("pact_workouts_label")}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <Chip key={n} active={workouts === n} onClick={() => setWorkouts(n)}>
                  {n}
                </Chip>
              ))}
            </div>
            <p className="mt-1.5 text-caption text-text-dim">{t("pact_workouts_hint")}</p>
          </div>

          {/* Disciplines */}
          <div>
            <label className="text-label text-text-muted">{t("pact_disciplines_label")}</label>
            <p className="text-caption text-text-dim">{t("pact_disciplines_hint")}</p>
            <div className="mt-2">
              <Chip active={allowAll} onClick={() => setAllowAll((v) => !v)}>
                ✅ {t("pact_all_disciplines")}
              </Chip>
            </div>
            {!allowAll && (
              <>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("cd_search_sport")} className={cn(inputCls, "mt-3")} />
                <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                  {filteredSports.map((o: Option) => (
                    <Chip key={o.key} active={disciplines.has(o.key)} onClick={() => toggleDiscipline(o.key)}>
                      <span aria-hidden>{o.icon}</span>
                      {o[lang]}
                    </Chip>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="text-label text-text-muted">{t("pact_duration_label")}</label>
            <div className="mt-2">
              <SegmentedControl
                options={[
                  { value: "fixed", label: t("pact_duration_fixed") },
                  { value: "ongoing", label: t("pact_duration_ongoing") },
                ]}
                value={durationType}
                onChange={(v) => setDurationType(v as "fixed" | "ongoing")}
              />
            </div>
            {durationType === "fixed" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((n) => (
                  <Chip key={n} active={weeks === n} onClick={() => setWeeks(n)}>
                    {t("pact_weeks", { n })}
                  </Chip>
                ))}
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  aria-label={t("pact_custom_weeks")}
                  className="w-20 rounded-input border border-border bg-surface px-3 py-2 text-body text-text focus:border-volt focus:outline-none"
                />
                <span className="text-label text-text-dim">{t("pact_custom_weeks")}</span>
              </div>
            )}
          </div>

          {/* Stake */}
          <div>
            <label className="text-label text-text-muted">{t("pact_stake_label")}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip active={stake === "none"} onClick={() => setStake("none")}>{t("pact_stake_none")}</Chip>
              <Chip active={stake === "money"} onClick={() => setStake("money")}>💸 {t("pact_stake_money")}</Chip>
              <Chip active={stake === "favor"} onClick={() => setStake("favor")}>🤝 {t("pact_stake_favor")}</Chip>
              <Chip active={stake === "custom"} onClick={() => setStake("custom")}>🎭 {t("pact_stake_custom")}</Chip>
            </div>
            {stake !== "none" && (
              <>
                <input value={stakeValue} onChange={(e) => setStakeValue(e.target.value)} placeholder={stakePlaceholder} maxLength={80} className={cn(inputCls, "mt-3")} />
                {stake === "money" && <p className="mt-1.5 text-caption text-text-dim">{t("pact_money_note")}</p>}
              </>
            )}
          </div>

          {/* Who pays */}
          {stake !== "none" && (
            <div>
              <label className="text-label text-text-muted">{t("pact_whopays_label")}</label>
              <div className="mt-2 flex flex-col gap-2">
                {WHO_PAYS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWhoPays(w)}
                    className={cn(
                      "rounded-card border p-4 text-left transition-colors",
                      whoPays === w ? "border-volt bg-volt/10" : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <p className={cn("text-body font-medium", whoPays === w ? "text-volt" : "text-text")}>{whoPaysLabel[w]}</p>
                    <p className="mt-0.5 text-caption text-text-muted">{whoPaysDesc[w]}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Section>

        {error && (
          <p className="rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">{error}</p>
        )}

        <Button variant="primary" size="lg" fullWidth onClick={save} disabled={saving}>
          {saving ? t("loading") : t("pact_save")}
        </Button>
      </div>
    </main>
  );
}
