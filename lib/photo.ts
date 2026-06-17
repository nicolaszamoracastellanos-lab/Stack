/**
 * Client-side photo compositing helpers (Batch 5 A1).
 *
 * Shared by the cropper (avatars + check-ins) and the check-in mirror toggle.
 * The Stack wordmark watermark is drawn in a deterministic canvas pass so it is
 * never itself mirrored when a selfie is flipped — only the photo flips.
 */

const WATERMARK_SRC = "/wordmark-watermark.png";

export function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

let cachedMark: Promise<HTMLImageElement> | null = null;
function loadWatermark(): Promise<HTMLImageElement> {
  if (!cachedMark) cachedMark = loadImageEl(WATERMARK_SRC);
  return cachedMark;
}

/**
 * Composite the Stack wordmark bottom-left into `ctx`. Best-effort: if the asset
 * fails to load the photo simply ships without the burn-in. Always drawn in the
 * canvas's own (un-mirrored) coordinate space so the mark stays readable.
 */
export async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  outputW: number,
  outputH: number,
): Promise<void> {
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

/**
 * Re-compose an already-cropped check-in photo, optionally mirrored, with the
 * watermark applied on top. `mirror` flips the PHOTO horizontally via a
 * deterministic `ctx.scale(-1, 1)` transform so the stored file truly matches
 * the user's choice (not a CSS-only preview). The watermark is drawn after the
 * transform is reset, so it is never mirrored.
 *
 * `srcBlob` is expected to already be at output dimensions (the cropper exports
 * 1080×1920), so this is a single 1:1 redraw — no extra resampling beyond the
 * flip, one re-encode.
 */
export async function composeCheckinPhoto({
  srcBlob,
  mirror,
  outputW,
  outputH,
}: {
  srcBlob: Blob;
  mirror: boolean;
  outputW: number;
  outputH: number;
}): Promise<Blob> {
  const url = URL.createObjectURL(srcBlob);
  try {
    const img = await loadImageEl(url);
    const canvas = document.createElement("canvas");
    canvas.width = outputW;
    canvas.height = outputH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return srcBlob; // canvas unavailable — fall back to the source

    ctx.imageSmoothingQuality = "high";
    ctx.save();
    if (mirror) {
      ctx.translate(outputW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, 0, 0, outputW, outputH);
    ctx.restore();

    await drawWatermark(ctx, outputW, outputH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    return blob ?? srcBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
