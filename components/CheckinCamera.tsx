"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ImageCropper } from "@/components/ImageCropper";
import { CheckinDetail } from "@/components/CheckinDetail";
import { useLanguage } from "@/lib/language-context";
import { watermarkPhoto } from "@/lib/watermark";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

type Phase = "starting" | "live" | "denied" | "crop" | "detail";
type Facing = "environment" | "user";

const CAPTURE_MAX_WIDTH = 1280; // raw frame cap; cropper exports the square

/** Empty state when the user has no group to check in to. */
export function CheckinNoGroup() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
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
  userId,
  groups,
  activeId,
}: {
  userId: string;
  groups: Group[];
  activeId: string | null;
}) {
  const { t } = useLanguage();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("starting");
  const [facing, setFacing] = useState<Facing>("environment");
  const [raw, setRaw] = useState<{ blob: Blob; url: string } | null>(null);
  const [cropped, setCropped] = useState<{ blob: Blob; url: string } | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (mode: Facing) => {
      stopStream();
      setPhase("starting");
      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({ video: { facingMode: mode }, audio: false })
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
        setPhase("denied");
      }
    },
    [stopStream],
  );

  // Start on mount; release on unmount.
  useEffect(() => {
    startCamera("environment");
    return () => stopStream();
  }, [startCamera, stopStream]);

  // Re-attach the running stream to the <video> when we return to the live
  // phase (the element unmounts during crop/detail). The stream keeps running.
  useEffect(() => {
    if (phase === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase]);

  function flipCamera() {
    const nextFacing: Facing = facing === "environment" ? "user" : "environment";
    setFacing(nextFacing);
    startCamera(nextFacing);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (facing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setRaw({ blob, url: URL.createObjectURL(blob) });
        setPhase("crop");
      },
      "image/jpeg",
      0.92,
    );
  }

  // ---- Permission denied ----
  if (phase === "denied") {
    return (
      <main className="mx-auto flex min-h-[80dvh] w-full max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-h2 text-danger">{t("checkin_permission_denied")}</p>
        <p className="mt-3 text-body text-text-muted">
          {t("checkin_permission_help")}
        </p>
        <div className="mt-8 flex gap-3">
          <Button variant="primary" size="lg" onClick={() => startCamera(facing)}>
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

  // ---- Detail screen (after framing the photo) ----
  if (phase === "detail" && cropped) {
    return (
      <CheckinDetail
        userId={userId}
        groups={groups}
        activeId={activeId}
        photoBlob={cropped.blob}
        photoUrl={cropped.url}
        onBack={() => {
          URL.revokeObjectURL(cropped.url);
          setCropped(null);
          setPhase("live");
        }}
      />
    );
  }

  // ---- Camera (live + cropper overlay) ----
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-h2">{t("checkin_title")}</h1>
        <Link href="/home" className="text-label text-text-muted hover:text-text">
          {t("back")}
        </Link>
      </header>

      <div className="relative mt-6 aspect-square w-full overflow-hidden rounded-card border border-border bg-surface-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full object-cover",
            facing === "user" && "scale-x-[-1]",
          )}
        />
        {phase === "live" && (
          <button
            type="button"
            onClick={flipCamera}
            aria-label={t("checkin_flip")}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-pill bg-bg/60 text-text backdrop-blur transition-colors duration-150 hover:bg-bg/80"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path
                d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.2l.9-1.4A1 1 0 0 1 8.4 4h7.2a1 1 0 0 1 .8.6L17.3 6h1.2A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth={1.6} />
            </svg>
          </button>
        )}
        {phase === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-label text-text-dim">{t("checkin_starting_camera")}</p>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
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

      {/* Cropper overlay (square) after capture. */}
      {phase === "crop" && raw && (
        <ImageCropper
          src={raw.url}
          shape="square"
          outputSize={1080}
          onCancel={() => {
            URL.revokeObjectURL(raw.url);
            setRaw(null);
            setPhase("live");
          }}
          onCropped={async (blob) => {
            URL.revokeObjectURL(raw.url);
            setRaw(null);
            // Burn the Stack wordmark into the bottom-left before we move on, so
            // the feed photo and any export carry the brand. Fails open.
            const stamped = await watermarkPhoto(blob);
            setCropped({ blob: stamped, url: URL.createObjectURL(stamped) });
            setPhase("detail");
          }}
        />
      )}
    </main>
  );
}
