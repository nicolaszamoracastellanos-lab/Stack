"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";

// Burned-in watermark asset (Stack wordmark, transparent). Drawn in the SAME
// pass as the crop so the photo is encoded only once (no double compression).
const WATERMARK_SRC = "/wordmark-watermark.png";
let cachedMark: Promise<HTMLImageElement> | null = null;
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function loadWatermark() {
  if (!cachedMark) cachedMark = loadImage(WATERMARK_SRC);
  return cachedMark;
}

/**
 * Drag-to-pan, zoom-slider image cropper. Exports a single high-quality JPEG at
 * an arbitrary aspect ratio: 1:1 circle avatars and 9:16 story-format check-in
 * photos (Batch 3). When `watermark` is set, the Stack wordmark is composited
 * bottom-left in the same canvas pass — one encode, no recompression.
 */
export function ImageCropper({
  src,
  onCancel,
  onCropped,
  shape = "rect",
  aspectW = 1,
  aspectH = 1,
  outputW = 512,
  outputH = 512,
  watermark = false,
}: {
  src: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
  shape?: "circle" | "rect";
  aspectW?: number;
  aspectH?: number;
  outputW?: number;
  outputH?: number;
  watermark?: boolean;
}) {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  // On-screen crop viewport, sized to the target aspect within a max box.
  const aspect = aspectW / aspectH;
  const FRAME_W = aspect >= 1 ? 300 : Math.round(440 * aspect);
  const FRAME_H = aspect >= 1 ? Math.round(300 / aspect) : 440;

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  const coverScale = nat ? Math.max(FRAME_W / nat.w, FRAME_H / nat.h) : 1;
  const dw = nat ? nat.w * coverScale * zoom : 0;
  const dh = nat ? nat.h * coverScale * zoom : 0;

  function clamp(o: { x: number; y: number }, w: number, h: number) {
    return {
      x: Math.min(0, Math.max(FRAME_W - w, o.x)),
      y: Math.min(0, Math.max(FRAME_H - h, o.y)),
    };
  }

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    const cs = Math.max(FRAME_W / w, FRAME_H / h);
    setNat({ w, h });
    setZoom(1);
    setOffset({ x: (FRAME_W - w * cs) / 2, y: (FRAME_H - h * cs) / 2 });
  }

  function changeZoom(nextZoom: number) {
    if (!nat) return;
    const fcx = FRAME_W / 2;
    const fcy = FRAME_H / 2;
    const ratio = nextZoom / zoom;
    const nw = nat.w * coverScale * nextZoom;
    const nh = nat.h * coverScale * nextZoom;
    const next = clamp(
      { x: fcx - (fcx - offset.x) * ratio, y: fcy - (fcy - offset.y) * ratio },
      nw,
      nh,
    );
    setZoom(nextZoom);
    setOffset(next);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setOffset(
      clamp({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) }, dw, dh),
    );
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function usephoto() {
    if (!imgRef.current || !nat) return;
    setBusy(true);
    const s = coverScale * zoom;
    const sx = -offset.x / s;
    const sy = -offset.y / s;
    const sw = FRAME_W / s;
    const sh = FRAME_H / s;

    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, outputW, outputH);

    if (watermark) {
      try {
        const mark = await loadWatermark();
        const markW = Math.round(outputW * 0.3);
        const markH = Math.round((mark.naturalHeight / mark.naturalWidth) * markW);
        const pad = Math.round(outputW * 0.045);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = Math.round(outputW * 0.012);
        ctx.shadowOffsetY = Math.round(outputW * 0.003);
        ctx.drawImage(mark, pad, outputH - pad - markH, markW, markH);
        ctx.restore();
      } catch {
        /* asset failed to load — ship the photo without the burn-in */
      }
    }

    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.92,
    );
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-6">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-5">
        <h2 className="text-h2">{t("cropper_title")}</h2>

        <div className="mt-5 flex justify-center">
          <div
            className="relative overflow-hidden rounded-md bg-bg touch-none"
            style={{ width: FRAME_W, height: FRAME_H }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              className="absolute max-w-none select-none"
              style={{ width: dw, height: dh, left: offset.x, top: offset.y }}
            />
            {shape === "circle" && (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-md"
                  style={{
                    boxShadow: "0 0 0 9999px rgba(10,10,11,0.55)",
                    clipPath: "circle(50% at 50% 50%)",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/30"
                />
              </>
            )}
            {shape === "rect" && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-md border border-white/20"
              />
            )}
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label={t("cropper_zoom")}
          className="mt-5 w-full accent-volt"
        />

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="lg" onClick={onCancel} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" fullWidth onClick={usephoto} disabled={busy}>
            {busy ? t("loading") : t("cropper_use")}
          </Button>
        </div>
      </div>
    </div>
  );
}
