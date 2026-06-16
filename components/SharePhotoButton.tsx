"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { shareOrDownloadImage } from "@/lib/share-image";
import { cn } from "@/lib/utils";

/**
 * Circular share/save control overlaid on a check-in photo. Used on the capture
 * preview (local blob) and on posted photos in the feed + activity grid (remote
 * signed URL). `stopPropagation` so it never triggers a surrounding tap target.
 */
export function SharePhotoButton({
  src,
  filename,
  className,
  size = "md",
}: {
  src: string | Blob;
  filename?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const box = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await shareOrDownloadImage(src, filename);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={t("cd_share")}
      className={cn(
        "flex items-center justify-center rounded-pill bg-bg/60 text-text backdrop-blur transition-colors duration-150 hover:bg-bg/80 disabled:opacity-50",
        box,
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className={icon} fill="none" aria-hidden>
        <path
          d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
