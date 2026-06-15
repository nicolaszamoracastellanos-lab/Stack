"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET, checkinPhotoPath } from "@/lib/storage";
import { setActiveGroup } from "@/lib/active-group";

type Phase = "starting" | "live" | "denied" | "captured" | "uploading";

const MAX_WIDTH = 1080; // cap upload size; gym photos don't need full sensor res

/** Empty state when the user has no active group to check in to. */
export function CheckinNoGroup() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-h2">{t("checkin_title")}</p>
      <p className="mt-3 text-body text-text-muted">{t("checkin_no_group")}</p>
      <Link href="/home" className="mt-8">
        <Button variant="primary" size="lg">
          {t("home_create_group")}
        </Button>
      </Link>
    </main>
  );
}

export function CheckinCamera({
  groupId,
  userId,
  groupName,
}: {
  groupId: string;
  userId: string;
  groupName: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("starting");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setPhase("starting");
    try {
      // Prefer the rear camera (proof of the gym, not a selfie); fall back to
      // any camera (e.g. a laptop webcam).
      const stream = await navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .catch(() =>
          navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
        );
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPhase("live");
    } catch {
      // Permission denied, no camera, or insecure context.
      setPhase("denied");
    }
  }, []);

  // Start on mount; always release the camera on unmount.
  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhoto({ blob, url: URL.createObjectURL(blob) });
        setPhase("captured");
      },
      "image/jpeg",
      0.85,
    );
  }

  function retake() {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    setError(false);
    setPhase("live");
  }

  async function submit() {
    if (!photo) return;
    setError(false);
    setPhase("uploading");

    const supabase = createClient();
    const filename = `${crypto.randomUUID()}.jpg`;
    const path = checkinPhotoPath(groupId, userId, filename);

    const { error: uploadError } = await supabase.storage
      .from(CHECKINS_BUCKET)
      .upload(path, photo.blob, { contentType: "image/jpeg", upsert: false });
    if (uploadError) {
      setError(true);
      setPhase("captured");
      return;
    }

    // Store the object PATH (not a URL); the feed signs it on read.
    const { error: insertError } = await supabase.from("checkins").insert({
      group_id: groupId,
      user_id: userId,
      photo_url: path,
      note: note.trim() || null,
    });
    if (insertError) {
      setError(true);
      setPhase("captured");
      return;
    }

    // Make sure home opens on the group we just checked into.
    setActiveGroup(groupId);
    stopStream();
    router.push("/home");
    router.refresh();
  }

  // ---- Permission denied ----
  if (phase === "denied") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-h2 text-danger">{t("checkin_permission_denied")}</p>
        <p className="mt-3 text-body text-text-muted">
          {t("checkin_permission_help")}
        </p>
        <div className="mt-8 flex gap-3">
          <Button variant="primary" size="lg" onClick={startCamera}>
            {t("checkin_capture")}
          </Button>
          <Link href="/home">
            <Button variant="secondary" size="lg">
              {t("back")}
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">{t("checkin_title")}</h1>
          <p className="mt-1 text-caption text-text-dim">{groupName}</p>
        </div>
        <Link href="/home" className="text-label text-text-muted hover:text-text">
          {t("back")}
        </Link>
      </header>

      {/* Viewport: live preview or the captured still. Square, framed. */}
      <div className="relative mt-6 aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={
            phase === "captured"
              ? "hidden"
              : "h-full w-full object-cover"
          }
        />
        {phase === "captured" && photo && (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img
            src={photo.url}
            alt={t("checkin_title")}
            className="h-full w-full object-cover"
          />
        )}
        {phase === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-label text-text-dim">
              {t("checkin_starting_camera")}
            </p>
          </div>
        )}
      </div>

      {/* Captured: note + actions. Live: the capture button. */}
      {phase === "captured" || phase === "uploading" ? (
        <div className="mt-6 flex flex-col gap-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("checkin_note_placeholder")}
            rows={2}
            maxLength={140}
            disabled={phase === "uploading"}
            className="w-full resize-none rounded-input border border-border bg-surface px-3.5 py-3 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
          />
          {error && (
            <p className="text-label text-danger">{t("error_generic")}</p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={retake}
              disabled={phase === "uploading"}
            >
              {t("checkin_retake")}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={submit}
              disabled={phase === "uploading"}
            >
              {phase === "uploading" ? t("checkin_uploading") : t("checkin_submit")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 flex justify-center">
          {/* Big round shutter. Two taps from intent to done. */}
          <button
            type="button"
            onClick={capture}
            disabled={phase !== "live"}
            aria-label={t("checkin_capture")}
            className="flex h-20 w-20 items-center justify-center rounded-pill bg-volt transition-transform duration-150 active:scale-95 disabled:opacity-40"
          >
            <span className="h-16 w-16 rounded-pill border-4 border-bg" />
          </button>
        </div>
      )}
    </main>
  );
}
