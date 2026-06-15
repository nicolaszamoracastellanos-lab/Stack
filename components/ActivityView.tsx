"use client";

import { useLanguage } from "@/lib/language-context";

type ActivityItem = {
  id: string;
  photoUrl: string;
  note: string | null;
  createdAt: string;
};

export function ActivityView({ items }: { items: ActivityItem[] }) {
  const { t, lang } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <h1 className="text-h1">{t("activity_title")}</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border px-4 py-12 text-center">
          <p className="text-body text-text-dim">{t("activity_empty")}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-md bg-surface-2"
              title={
                item.note
                  ? `${item.note} · ${new Date(item.createdAt).toLocaleDateString(lang)}`
                  : new Date(item.createdAt).toLocaleDateString(lang)
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- signed storage urls */}
              <img
                src={item.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              {/* Date chip */}
              <span className="absolute bottom-1 left-1 rounded bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] leading-none text-text">
                {new Date(item.createdAt).toLocaleDateString(lang, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
