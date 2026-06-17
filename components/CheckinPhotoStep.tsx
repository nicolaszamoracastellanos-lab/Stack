"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { ImageCropper } from "@/components/ImageCropper";
import { useLanguage } from "@/lib/language-context";

/**
 * Phase B — the photo (Batch 3 §1/§2). Capture uses a native file input with
 * `capture="environment"`, which on mobile opens the system camera and returns
 * the FULL-resolution photo. Tradeoff vs. a getUserMedia video frame-grab: we
 * lose the custom in-app shutter/flip UI, but gain reliably crisp, full-res
 * images on iOS Safari (where frame-grabs are downscaled and soft). Falls back
 * to the photo library on devices without a camera. The result is framed to
 * 9:16; the watermark (and any selfie mirror) is burned in later by the review
 * step's compose pass (Batch 5 A1), so the cropper here exports un-watermarked.
 */
export function CheckinPhotoStep({
  photoUrl,
  onCapture,
}: {
  photoUrl: string | null;
  onCapture: (blob: Blob) => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />

      {photoUrl ? (
        <div className="flex flex-col items-center gap-4">
          <div className="overflow-hidden rounded-card border border-border bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              src={photoUrl}
              alt=""
              className="aspect-[9/16] max-h-[60dvh] w-auto object-cover"
            />
          </div>
          <Button variant="secondary" onClick={pick}>
            {t("checkin_retake")}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          className="flex aspect-[9/16] max-h-[60dvh] w-full flex-col items-center justify-center gap-4 rounded-card border border-dashed border-border-strong bg-surface text-text-muted transition-colors hover:border-volt hover:text-text"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-volt text-bg">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden>
              <path
                d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l.9-1.4A1 1 0 0 1 8.4 4h7.2a1 1 0 0 1 .8.6L17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth={1.9} />
            </svg>
          </span>
          <span className="text-body font-medium">{t("cd_take_photo")}</span>
          <span className="px-8 text-center text-caption text-text-dim">
            {t("cd_photo_hint")}
          </span>
        </button>
      )}

      {rawSrc && (
        <ImageCropper
          src={rawSrc}
          shape="rect"
          aspectW={9}
          aspectH={16}
          outputW={1080}
          outputH={1920}
          onCancel={() => {
            URL.revokeObjectURL(rawSrc);
            setRawSrc(null);
          }}
          onCropped={(blob) => {
            URL.revokeObjectURL(rawSrc);
            setRawSrc(null);
            onCapture(blob);
          }}
        />
      )}
    </div>
  );
}
