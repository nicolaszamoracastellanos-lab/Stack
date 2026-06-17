"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { localDateKey } from "@/lib/streaks";
import { getWeekStart } from "@/lib/week";
import { cn } from "@/lib/utils";

type Range = "3m" | "1y";
const WEEKS: Record<Range, number> = { "3m": 13, "1y": 53 };

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type Cell = {
  key: string;
  date: Date;
  count: number;
  rest: boolean;
  future: boolean;
};

// Discrete GitHub-style intensity from a day's check-in count. Rest days and
// missed days are handled separately (distinct shape, not just hue) so state is
// never conveyed by color alone — important for color-blind users.
function levelClass(count: number): string {
  if (count >= 3) return "bg-volt";
  if (count === 2) return "bg-volt/60";
  if (count === 1) return "bg-volt/30";
  return "bg-surface-2";
}

/**
 * Check-in history heatmap ("The Stack"). Defaults to the past 3 months for
 * legibility on a phone; toggles to a full year (horizontal scroll). Discrete
 * color steps + a Less→More legend, month + weekday labels, and a per-day
 * tooltip with the exact date and state. Rest days (Section 9) render as a
 * distinct outlined cell.
 */
export function Heatmap({
  counts,
  restDays,
}: {
  counts: Record<string, number>;
  restDays?: Set<string>;
}) {
  const { t, lang } = useLanguage();
  const [range, setRange] = useState<Range>("3m");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Columns are Monday-anchored weeks (Batch 5 A2): each column runs Mon→Sun.
  const thisMonday = getWeekStart(today);
  const start = addDays(thisMonday, -(WEEKS[range] - 1) * 7);

  const weeks: Cell[][] = [];
  let cursor = start;
  while (cursor <= today) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d);
      const key = localDateKey(date);
      week.push({
        key,
        date,
        count: counts[key] ?? 0,
        rest: restDays?.has(key) ?? false,
        future: date > today,
      });
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  const monthLabel = (week: Cell[], i: number): string => {
    const first = week[0].date;
    const prev = i > 0 ? weeks[i - 1][0].date : null;
    if (prev && prev.getMonth() === first.getMonth()) return "";
    return first.toLocaleString(lang, { month: "short" });
  };

  const tooltip = (c: Cell): string => {
    const date = c.date.toLocaleDateString(lang, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const state = c.rest
      ? t("heatmap_rest")
      : c.count > 0
        ? t("heatmap_checked")
        : t("heatmap_missed");
    return `${date} · ${state}`;
  };

  const weekdayRows = [0, 2, 4]; // Mon, Wed, Fri (rows run Mon→Sun)
  const cellSize = range === "3m" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <div>
      {/* Range toggle */}
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-pill border border-border p-0.5">
          {(["3m", "1y"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "rounded-pill px-3 py-1 text-caption font-medium transition-colors",
                range === r
                  ? "bg-surface-2 text-text"
                  : "text-text-dim hover:text-text",
              )}
            >
              {r === "3m" ? "3M" : "1Y"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex gap-1 pl-8">
            {weeks.map((week, i) => (
              <div
                key={i}
                className={cn(
                  "text-[10px] leading-none text-text-dim",
                  range === "3m" ? "w-3.5" : "w-3",
                )}
              >
                {monthLabel(week, i)}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Weekday labels */}
            <div className="flex w-7 flex-col gap-1 pr-1">
              {Array.from({ length: 7 }).map((_, row) => (
                <div
                  key={row}
                  className={cn(
                    "text-[10px] leading-3 text-text-dim",
                    range === "3m" ? "h-3.5" : "h-3",
                  )}
                >
                  {weekdayRows.includes(row)
                    ? // 2026-06-15 is a Monday → row 0 = Mon, 2 = Wed, 4 = Fri.
                      new Date(2026, 5, 15 + row).toLocaleString(lang, {
                        weekday: "short",
                      })[0]
                    : ""}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-1">
                {week.map((c) => (
                  <div
                    key={c.key}
                    title={c.future ? undefined : tooltip(c)}
                    className={cn(
                      "rounded-[3px]",
                      cellSize,
                      c.future
                        ? "bg-transparent"
                        : c.rest
                          ? "border border-border-strong bg-transparent"
                          : levelClass(c.count),
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-dim">
        <span>{t("profile_heatmap_subtitle")}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span>{t("heatmap_less")}</span>
          <span className="h-3 w-3 rounded-[3px] bg-surface-2" />
          <span className="h-3 w-3 rounded-[3px] bg-volt/30" />
          <span className="h-3 w-3 rounded-[3px] bg-volt/60" />
          <span className="h-3 w-3 rounded-[3px] bg-volt" />
          <span>{t("heatmap_more")}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] border border-border-strong bg-transparent" />
          <span>{t("heatmap_rest")}</span>
        </span>
      </div>
    </div>
  );
}
