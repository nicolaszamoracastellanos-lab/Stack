"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";

const FRAME = 280; // on-screen crop viewport (px)
const OUT = 512; // exported avatar size (px)

/**
 * Facebook-style avatar cropper. Drag to pan, slider to zoom, a circular guide
 * shows the avatar crop. Exports a square JPEG so the round avatar always looks
 * intentional. Touch-first (pointer events + a zoom slider).
 */
export function ImageCropper({
  src,
  onCancel,
  onCropped,
}: {
  src: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(
    null,
  );

  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  // Scale that makes the image exactly cover the frame at zoom = 1.
  const coverScale = nat ? Math.max(FRAME / nat.w, FRAME / nat.h) : 1;
  const dw = nat ? nat.w * coverScale * zoom : 0;
  const dh = nat ? nat.h * coverScale * zoom : 0;

  function clamp(o: { x: number; y: number }, w: number, h: number) {
    return {
      x: Math.min(0, Math.max(FRAME - w, o.x)),
      y: Math.min(0, Math.max(FRAME - h, o.y)),
    };
  }

  // Center the image once we know its natural size.
  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    const cs = Math.max(FRAME / w, FRAME / h);
    const iw = w * cs;
    const ih = h * cs;
    setNat({ w, h });
    setZoom(1);
    setOffset({ x: (FRAME - iw) / 2, y: (FRAME - ih) / 2 });
  }

  // Zoom anchored to the frame center so it feels natural.
  function changeZoom(nextZoom: number) {
    if (!nat) return;
    const fc = FRAME / 2;
    const ratio = nextZoom / zoom;
    const nw = nat.w * coverScale * nextZoom;
    const nh = nat.h * coverScale * nextZoom;
    const next = clamp(
      { x: fc - (fc - offset.x) * ratio, y: fc - (fc - offset.y) * ratio },
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
      clamp(
        { x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) },
        dw,
        dh,
      ),
    );
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  async function usephoto() {
    if (!imgRef.current || !nat) return;
    setBusy(true);
    const s = coverScale * zoom;
    // Source rectangle currently framed.
    const sx = -offset.x / s;
    const sy = -offset.y / s;
    const sSize = FRAME / s;

    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (blob) onCropped(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  // Lock background scroll while the cropper is open.
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
            style={{ width: FRAME, height: FRAME }}
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
            {/* Circular guide: dim everything outside the avatar circle. */}
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
          </div>
        </div>

        {/* Zoom */}
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={usephoto}
            disabled={busy}
          >
            {busy ? t("loading") : t("cropper_use")}
          </Button>
        </div>
      </div>
    </div>
  );
}
