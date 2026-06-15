"use client";

import { useLanguage } from "@/lib/language-context";
import { localDateKey } from "@/lib/streaks";
import { cn } from "@/lib/utils";

const WEEKS = 53; // ~1 year, GitHub-style

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type Day = { date: Date; key: string; inSet: boolean; future: boolean };

/**
 * Check-in history heatmap: one cell per day for the past year, volt on days
 * the user checked in, dim otherwise. This is the visual of the stack growing
 * over time — built to look good enough to screenshot.
 */
export function Heatmap({ daySet }: { daySet: Set<string> }) {
  const { t, lang } = useLanguage();

  // Build the grid anchored to local "today". Columns are weeks (Sun→Sat).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisSunday = addDays(today, -today.getDay());
  const start = addDays(thisSunday, -(WEEKS - 1) * 7);

  const weeks: Day[][] = [];
  let cursor = start;
  while (cursor <= today) {
    const week: Day[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(cursor, d);
      const key = localDateKey(date);
      week.push({ date, key, inSet: daySet.has(key), future: date > today });
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  // Month labels above the columns, placed when the month changes.
  const monthLabel = (week: Day[], i: number): string => {
    const first = week[0].date;
    const prevFirst = i > 0 ? weeks[i - 1][0].date : null;
    if (prevFirst && prevFirst.getMonth() === first.getMonth()) return "";
    return first.toLocaleString(lang, { month: "short" });
  };

  const weekdayLabels = [1, 3, 5]; // Mon, Wed, Fri rows

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          {/* Month labels */}
          <div className="flex gap-1 pl-8">
            {weeks.map((week, i) => (
              <div key={i} className="w-3 text-[10px] leading-none text-text-dim">
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
                  className="h-3 text-[10px] leading-3 text-text-dim"
                >
                  {weekdayLabels.includes(row)
                    ? new Date(2026, 5, 1 + row).toLocaleString(lang, {
                        weekday: "short",
                      })[0]
                    : ""}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.key}
                    title={day.future ? undefined : day.key}
                    className={cn(
                      "h-3 w-3 rounded-[3px]",
                      day.future
                        ? "bg-transparent"
                        : day.inSet
                          ? "bg-volt"
                          : "bg-surface-2",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 text-caption text-text-dim">
        <span>{t("profile_heatmap_subtitle")}</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="h-3 w-3 rounded-[3px] bg-surface-2" />
          <span className="h-3 w-3 rounded-[3px] bg-volt" />
        </span>
      </div>
    </div>
  );
}
