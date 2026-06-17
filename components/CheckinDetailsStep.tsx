"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/Avatar";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useLanguage } from "@/lib/language-context";
import { SPORTS, GOALS, OTHER_KEY, type Option } from "@/lib/workout-options";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

export type CheckinDetails = {
  groups: Set<string>;
  /** "Just me" personal log — posts to no group (Batch 5 B2). */
  justMe: boolean;
  sport: string;
  sportOther: string;
  environment: string;
  goal: string;
  goalOther: string;
  notes: string;
  sportQuery: string;
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-label transition-colors duration-150",
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
 * Phase A — the details form (Batch 3 §1). Pure collector: holds no posting
 * logic, just edits the shared `value`. Groups gain a "Select all" affordance;
 * sport stays searchable over the full list; focus includes the new lighter
 * options ("just for fun", "to win").
 */
export function CheckinDetailsStep({
  groups,
  value,
  onChange,
}: {
  groups: Group[];
  value: CheckinDetails;
  onChange: (next: CheckinDetails) => void;
}) {
  const { t, lang } = useLanguage();
  const set = (patch: Partial<CheckinDetails>) => onChange({ ...value, ...patch });

  const filteredSports = useMemo(() => {
    const q = value.sportQuery.trim().toLowerCase();
    if (!q) return SPORTS;
    return SPORTS.filter(
      (o) =>
        o.en.toLowerCase().includes(q) ||
        o.es.toLowerCase().includes(q) ||
        o.key.includes(q),
    );
  }, [value.sportQuery]);

  const allSelected =
    !value.justMe && groups.length > 0 && value.groups.size === groups.length;

  function toggleGroup(id: string) {
    const next = new Set(value.groups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // Picking a specific group leaves "Just me".
    set({ groups: next, justMe: false });
  }
  function selectAll() {
    set({ groups: new Set(groups.map((g) => g.id)), justMe: false });
  }
  function selectJustMe() {
    set({ groups: new Set(), justMe: true });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Destination (Batch 5 B2): all my groups / specific group(s) / just me.
          No public option by design — "Just me" is a private personal log. */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <Label>{t("cd_destination")}</Label>
          {groups.length > 1 && (
            <button
              type="button"
              onClick={allSelected ? selectJustMe : selectAll}
              className="text-caption font-medium text-volt hover:text-volt-dim"
            >
              {allSelected ? t("cd_clear_all") : t("cd_all_groups")}
            </button>
          )}
        </div>
        {groups.length === 0 ? (
          <p className="rounded-card border border-border bg-surface px-3.5 py-3 text-label text-text-muted">
            {t("cd_just_me_only")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = !value.justMe && value.groups.has(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex items-center gap-2 rounded-pill border py-1.5 pl-1.5 pr-3 transition-colors duration-150",
                    on
                      ? "border-volt bg-volt/15"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <Avatar name={g.name} size="sm" />
                  <span className={cn("text-label", on ? "text-volt" : "text-text-muted")}>
                    {g.name}
                  </span>
                </button>
              );
            })}
            {/* Just me — private personal log. */}
            <button
              type="button"
              onClick={selectJustMe}
              aria-pressed={value.justMe}
              className={cn(
                "flex items-center gap-2 rounded-pill border py-1.5 pl-3 pr-3 transition-colors duration-150",
                value.justMe
                  ? "border-volt bg-volt/15"
                  : "border-border bg-surface hover:border-border-strong",
              )}
            >
              <span aria-hidden>🔒</span>
              <span
                className={cn(
                  "text-label",
                  value.justMe ? "text-volt" : "text-text-muted",
                )}
              >
                {t("cd_just_me")}
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Sport */}
      <section>
        <Label>{t("cd_sport")}</Label>
        <input
          value={value.sportQuery}
          onChange={(e) => set({ sportQuery: e.target.value })}
          placeholder={t("cd_search_sport")}
          className={cn(inputCls, "mb-3")}
        />
        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
          {filteredSports.map((o: Option) => (
            <Chip key={o.key} active={value.sport === o.key} onClick={() => set({ sport: o.key })}>
              <span aria-hidden>{o.icon}</span>
              {o[lang]}
            </Chip>
          ))}
        </div>
        {value.sport === OTHER_KEY && (
          <input
            value={value.sportOther}
            onChange={(e) => set({ sportOther: e.target.value })}
            placeholder={t("cd_other_placeholder")}
            maxLength={40}
            className={cn(inputCls, "mt-3")}
          />
        )}
      </section>

      {/* Environment */}
      <section>
        <Label>{t("cd_environment")}</Label>
        <SegmentedControl
          options={[
            { value: "indoor", label: t("env_indoor") },
            { value: "outdoor", label: t("env_outdoor") },
          ]}
          value={value.environment}
          onChange={(v) => set({ environment: v })}
        />
      </section>

      {/* Focus */}
      <section>
        <Label>{t("cd_goal")}</Label>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((o) => (
            <Chip key={o.key} active={value.goal === o.key} onClick={() => set({ goal: o.key })}>
              <span aria-hidden>{o.icon}</span>
              {o[lang]}
            </Chip>
          ))}
        </div>
        {value.goal === OTHER_KEY && (
          <input
            value={value.goalOther}
            onChange={(e) => set({ goalOther: e.target.value })}
            placeholder={t("cd_other_placeholder")}
            maxLength={40}
            className={cn(inputCls, "mt-3")}
          />
        )}
      </section>

      {/* Notes */}
      <section>
        <Label>{t("cd_notes")}</Label>
        <textarea
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder={t("cd_notes_placeholder")}
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-card border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
        />
      </section>
    </div>
  );
}
