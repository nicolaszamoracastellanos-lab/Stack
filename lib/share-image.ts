/**
 * Export a check-in photo. Posted photos come from remote (signed) URLs, so we
 * fetch them into a blob first; the capture-preview passes a local blob
 * directly. On mobile this opens the native share sheet (Save Image,
 * Instagram, Messages…); on desktop it falls back to a download.
 *
 * Every posted photo already has the Stack wordmark burned in, so whatever the
 * user shares carries the brand.
 */
async function toFile(src: string | Blob, filename: string): Promise<File> {
  const blob = typeof src === "string" ? await (await fetch(src)).blob() : src;
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export async function shareOrDownloadImage(
  src: string | Blob,
  filename = "stack-checkin.jpg",
): Promise<void> {
  let file: File;
  try {
    file = await toFile(src, filename);
  } catch {
    // Couldn't fetch the bytes (CORS/offline) — at least open the image so the
    // user can long-press to save it.
    if (typeof src === "string") window.open(src, "_blank");
    return;
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
    return;
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
