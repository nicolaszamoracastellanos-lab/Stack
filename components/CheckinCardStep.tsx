"use client";

import { StoryCard, type StoryCardData } from "@/components/StoryCard";
import { useLanguage } from "@/lib/language-context";
import {
  CARD_TEMPLATES,
  MILESTONE_TEMPLATE,
  type CardTemplate,
  type CardTemplateKey,
  type CardToggles,
} from "@/lib/card-templates";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PREVIEW_W = 288;

const TOGGLE_ITEMS: { key: keyof CardToggles; labelKey: TranslationKey }[] = [
  { key: "sportEnv", labelKey: "card_toggle_sport" },
  { key: "focus", labelKey: "card_toggle_focus" },
  { key: "notes", labelKey: "card_toggle_notes" },
  { key: "streak", labelKey: "card_toggle_streak" },
  { key: "date", labelKey: "card_toggle_date" },
];

/**
 * Story-card step (Batch 3 §3). Live preview of the 1080x1920 card (scaled down),
 * a template picker (4 base + a milestone variant when a streak milestone is
 * hit), and element toggles. The true-size node captured for export is rendered
 * separately, off-screen, by CheckinFlow.
 */
export function CheckinCardStep({
  data,
  template,
  onTemplate,
  toggles,
  onToggles,
  milestone,
}: {
  data: StoryCardData;
  template: CardTemplateKey;
  onTemplate: (k: CardTemplateKey) => void;
  toggles: CardToggles;
  onToggles: (t: CardToggles) => void;
  milestone: boolean;
}) {
  const { t } = useLanguage();

  const templates: CardTemplate[] = milestone
    ? [MILESTONE_TEMPLATE, ...CARD_TEMPLATES]
    : CARD_TEMPLATES;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Live preview (scaled down from the true 1080x1920 node). */}
      <div
        className="overflow-hidden rounded-card ring-1 ring-border"
        style={{ width: PREVIEW_W, height: (PREVIEW_W * 16) / 9 }}
      >
        <div
          style={{
            transform: `scale(${PREVIEW_W / 1080})`,
            transformOrigin: "top left",
            width: 1080,
            height: 1920,
          }}
        >
          <StoryCard template={template} data={data} toggles={toggles} />
        </div>
      </div>

      {/* Template picker */}
      <div className="w-full">
        <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("card_template_label")}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {templates.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => onTemplate(tpl.key)}
              className={cn(
                "shrink-0 rounded-pill border px-4 py-2 text-label transition-colors",
                template === tpl.key
                  ? "border-volt bg-volt/15 text-volt"
                  : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
                tpl.milestoneOnly && "border-volt/40",
              )}
            >
              {tpl.milestoneOnly && "🏆 "}
              {t(tpl.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Element toggles */}
      <div className="w-full">
        <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
          {t("card_show_label")}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOGGLE_ITEMS.map((item) => {
            const on = toggles[item.key];
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={on}
                onClick={() => onToggles({ ...toggles, [item.key]: !on })}
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-label transition-colors",
                  on
                    ? "border-volt bg-volt/15 text-volt"
                    : "border-border bg-surface text-text-dim hover:border-border-strong hover:text-text",
                )}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
