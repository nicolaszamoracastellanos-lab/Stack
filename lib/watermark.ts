/**
 * Burns the Stack "Stack." wordmark into the bottom-left corner of a square
 * check-in photo, so the picture itself carries the brand — in the feed, and in
 * anything the user exports or screenshots (the Strava / BeReal model).
 *
 * Design follows the watermark research: a FIXED corner (always bottom-left),
 * a CONSISTENT size, and kept SUBTLE — a soft drop shadow keeps the white mark
 * legible on light backgrounds without a heavy scrim over the photo.
 *
 * Fails open: if anything goes wrong (no canvas, asset won't load) it returns
 * the original photo rather than blocking the check-in over a watermark.
 */

const WATERMARK_SRC = "/wordmark-watermark.png";

// Tuning — all relative to the photo's pixel size so it scales with output res.
const MARK_WIDTH_RATIO = 0.3; // wordmark width as a fraction of the photo width
const PADDING_RATIO = 0.045; // inset from the bottom-left edges
const SHADOW_BLUR_RATIO = 0.012;
const MARK_OPACITY = 0.95;

let cachedMark: Promise<HTMLImageElement> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadWatermark(): Promise<HTMLImageElement> {
  if (!cachedMark) cachedMark = loadImage(WATERMARK_SRC);
  return cachedMark;
}

export async function watermarkPhoto(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const photo = await loadImage(url);
    const w = photo.naturalWidth;
    const h = photo.naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;

    ctx.drawImage(photo, 0, 0, w, h);

    const mark = await loadWatermark();
    const markW = Math.round(w * MARK_WIDTH_RATIO);
    const markH = Math.round((mark.naturalHeight / mark.naturalWidth) * markW);
    const pad = Math.round(w * PADDING_RATIO);

    ctx.save();
    ctx.globalAlpha = MARK_OPACITY;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = Math.round(w * SHADOW_BLUR_RATIO);
    ctx.shadowOffsetY = Math.round(w * 0.003);
    ctx.drawImage(mark, pad, h - pad - markH, markW, markH);
    ctx.restore();

    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? blob), "image/jpeg", 0.9),
    );
  } catch {
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
