"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import {
  CheckinDetailsStep,
  type CheckinDetails,
} from "@/components/CheckinDetailsStep";
import { CheckinPhotoStep } from "@/components/CheckinPhotoStep";
import { CheckinCardStep } from "@/components/CheckinCardStep";
import { StoryCard, type StoryCardData } from "@/components/StoryCard";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET, checkinPhotoPath } from "@/lib/storage";
import { setActiveGroup } from "@/lib/active-group";
import { composeCheckinPhoto } from "@/lib/photo";
import { emitPush } from "@/lib/push/emit";
import { SPORTS, GOALS, OTHER_KEY, iconFor, labelFor } from "@/lib/workout-options";
import {
  CARD_TEMPLATES,
  DEFAULT_TOGGLES,
  isMilestone,
  type CardTemplateKey,
  type CardToggles,
} from "@/lib/card-templates";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

const TEMPLATE_KEYS = new Set(CARD_TEMPLATES.map((tpl) => tpl.key));

type Order = "details" | "photo";
type Step = "details" | "photo" | "review";

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

/**
 * Redesigned multi-step check-in (Batch 3 §1). Two phases — details and photo —
 * in a user-chosen, remembered order (default details-first so the details can
 * be burned onto the share card), then a review/post step.
 *
 * // PHASE 4 hook: the review step becomes the story-card generator (§3) and
 * posting moves behind save/share.
 */
export function CheckinFlow({
  userId,
  groups,
  initialDestination,
  initialOrder,
  streakAfter,
  initialTemplate,
  initialSelfieMirror,
}: {
  userId: string;
  groups: Group[];
  /** Seeds the destination selector: last-posted groups, or Just me (Batch 5 B2). */
  initialDestination: { justMe: boolean; groupIds: string[] };
  initialOrder: Order;
  /** Streak the user will have once this check-in posts (drives the card). */
  streakAfter: number;
  initialTemplate: string;
  /** Per-user selfie-mirror preference; seeds the review-step Mirror toggle. */
  initialSelfieMirror: boolean;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [order, setOrder] = useState<Order>(initialOrder);
  const [template, setTemplate] = useState<CardTemplateKey>(
    TEMPLATE_KEYS.has(initialTemplate as CardTemplateKey)
      ? (initialTemplate as CardTemplateKey)
      : "minimal",
  );
  const [toggles, setToggles] = useState<CardToggles>(DEFAULT_TOGGLES);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const milestone = isMilestone(streakAfter);
  const [stepIdx, setStepIdx] = useState(0);
  const sequence: Step[] =
    order === "photo" ? ["photo", "details", "review"] : ["details", "photo", "review"];
  const step = sequence[stepIdx];

  const [details, setDetails] = useState<CheckinDetails>(() => ({
    groups: new Set(initialDestination.justMe ? [] : initialDestination.groupIds),
    justMe: initialDestination.justMe,
    sport: "",
    sportOther: "",
    environment: "",
    goal: "",
    goalOther: "",
    notes: "",
    sportQuery: "",
  }));
  const [photo, setPhoto] = useState<
    { blob: Blob; url: string; dataUrl: string } | null
  >(null);

  // The un-watermarked cropped capture (1080×1920). The posted photo is composed
  // from this on demand so the Mirror toggle can flip without re-cropping and
  // without ever mirroring the watermark (Batch 5 A1).
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [mirror, setMirror] = useState(initialSelfieMirror);
  const photoUrlRef = useRef<string | null>(null);

  function handlePhoto(blob: Blob) {
    setCroppedBlob(blob);
  }

  // Compose the final photo whenever the capture or the mirror choice changes.
  // The card uses a data-URL copy so html-to-image has nothing to fetch
  // (blob: URLs break with cacheBust and can taint the export on iOS).
  useEffect(() => {
    if (!croppedBlob) return;
    let cancelled = false;
    (async () => {
      const blob = await composeCheckinPhoto({
        srcBlob: croppedBlob,
        mirror,
        outputW: 1080,
        outputH: 1920,
      });
      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      const reader = new FileReader();
      reader.onload = () => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
        photoUrlRef.current = url;
        setPhoto({ blob, url, dataUrl: reader.result as string });
      };
      reader.readAsDataURL(blob);
    })();
    return () => {
      cancelled = true;
    };
  }, [croppedBlob, mirror]);

  function toggleMirror(next: boolean) {
    setMirror(next);
    // Remember the choice (best-effort; degrades if column missing).
    createClient()
      .from("profiles")
      .update({ selfie_mirror_default: next })
      .eq("id", userId);
  }
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Capture the true-size (1080x1920) card node to a PNG blob. Real HTML → PNG
  // via html-to-image. On iOS Safari the first pass can come back blank while
  // images/fonts settle, so we warm up once and use the second pass.
  async function generateCardBlob(): Promise<Blob | null> {
    const node = cardRef.current;
    if (!node) return null;
    try {
      // Loaded on demand so the heavy lib stays out of the check-in route's
      // initial JS bundle.
      const { toPng } = await import("html-to-image");
      try {
        await document.fonts.ready;
      } catch {
        /* fonts API unavailable — proceed */
      }
      // No cacheBust (it corrupts data/blob URLs). Captured from a dedicated
      // off-screen full-size node, so the scaled preview can't interfere.
      const base = {
        width: 1080,
        height: 1920,
        pixelRatio: 1,
        backgroundColor: "#0A0A0B",
      };
      let dataUrl: string;
      try {
        await toPng(node, base); // iOS Safari warm-up pass
        dataUrl = await toPng(node, base);
      } catch (fontErr) {
        // Font embedding can throw on iOS Safari — retry with system fonts so
        // the card still exports (slightly off-brand beats not working).
        console.error("[card] capture failed, retrying without fonts", fontErr);
        dataUrl = await toPng(node, { ...base, skipFonts: true });
      }
      return await (await fetch(dataUrl)).blob();
    } catch (err) {
      console.error("[card] export failed", err);
      return null;
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Honest constraint: a PWA can't post to the IG Stories composer directly, so
  // we save / open the native share sheet and the user posts it themselves.
  // PHASE 4: a native wrapper could deep-link into Instagram.
  async function exportCard(mode: "save" | "share") {
    setError(null);
    setCardBusy(true);
    const blob = await generateCardBlob();
    setCardBusy(false);
    if (!blob) return setError(t("card_export_failed"));

    const file = new File([blob], "stack-story.png", { type: "image/png" });
    if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Stack", text: t("card_share_text") });
      } catch {
        /* user dismissed the sheet */
      }
    } else {
      downloadBlob(blob, "stack-story.png");
    }
    if (mode === "save") setSaved(true);
  }

  function changeOrder(next: Order) {
    setOrder(next);
    setStepIdx(0);
    // Remember the preference (best-effort; degrades if column missing).
    createClient().from("profiles").update({ checkin_order: next }).eq("id", userId);
  }

  function changeTemplate(next: CardTemplateKey) {
    setTemplate(next);
    createClient().from("profiles").update({ card_template: next }).eq("id", userId);
  }

  const cardData: StoryCardData = useMemo(
    () => ({
      // Data URL (not blob:) so html-to-image embeds it without a fetch.
      photoUrl: photo?.dataUrl ?? "",
      sportLabel:
        details.sport === OTHER_KEY
          ? details.sportOther
          : labelFor(SPORTS, details.sport, lang),
      sportIcon: iconFor(SPORTS, details.sport),
      envLabel: details.environment
        ? t(details.environment === "indoor" ? "env_indoor" : "env_outdoor")
        : "",
      focusLabel:
        details.goal === OTHER_KEY
          ? details.goalOther
          : labelFor(GOALS, details.goal, lang),
      focusIcon: iconFor(GOALS, details.goal),
      notes: details.notes.trim(),
      streak: streakAfter,
      dateStr: new Date().toLocaleDateString(lang, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      streakLabel: t("streak_label"),
      milestoneCaption: t("card_milestone_caption", { n: streakAfter }),
    }),
    [photo, details, streakAfter, lang, t],
  );

  function validateDetails(): string | null {
    if (!details.justMe && details.groups.size === 0) return t("cd_err_groups");
    if (!details.sport) return t("cd_err_sport");
    if (details.sport === OTHER_KEY && !details.sportOther.trim()) return t("cd_err_other");
    if (!details.environment) return t("cd_err_environment");
    if (!details.goal) return t("cd_err_goal");
    if (details.goal === OTHER_KEY && !details.goalOther.trim()) return t("cd_err_other");
    return null;
  }

  function next() {
    setError(null);
    if (step === "details") {
      const e = validateDetails();
      if (e) return setError(e);
    }
    if (step === "photo" && !photo) return setError(t("cd_err_photo"));
    setStepIdx((i) => Math.min(sequence.length - 1, i + 1));
  }

  function back() {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  }

  async function post() {
    const e = validateDetails();
    if (e) return setError(e);
    if (!photo) return setError(t("cd_err_photo"));

    setError(null);
    setPosting(true);
    const supabase = createClient();
    // Post the FINAL edited image: the rendered story card (photo + streak,
    // session details, template and toggles the user set on the review screen),
    // so the feed shows exactly what they edited, not the bare photo. Falls back
    // to the plain composed photo if card rendering fails, so a post never dies.
    const cardBlob = await generateCardBlob();
    const blob = cardBlob ?? photo.blob;
    const ext = cardBlob ? "png" : "jpg";
    const contentType = cardBlob ? "image/png" : "image/jpeg";
    const path = checkinPhotoPath(userId, `${crypto.randomUUID()}.${ext}`);
    const { error: upErr } = await supabase.storage
      .from(CHECKINS_BUCKET)
      .upload(path, blob, { contentType, upsert: false });
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      setPosting(false);
      return;
    }

    const sportVal = details.sport === OTHER_KEY ? details.sportOther.trim() : details.sport;
    const goalVal = details.goal === OTHER_KEY ? details.goalOther.trim() : details.goal;
    const postId = crypto.randomUUID();
    // "Just me" → a single personal-log row with no group (Batch 5 B2).
    const targets: (string | null)[] = details.justMe
      ? [null]
      : Array.from(details.groups);
    const rows = targets.map((group_id) => ({
      group_id,
      user_id: userId,
      photo_url: path,
      note: details.notes.trim() || null,
      sport: sportVal,
      environment: details.environment,
      goal: goalVal,
      post_id: postId,
    }));
    const { error: insErr } = await supabase.from("checkins").insert(rows);
    if (insErr) {
      setError(`${insErr.code ?? "ERR"}: ${insErr.message}`);
      setPosting(false);
      return;
    }
    // Notify groupmates (one notification + push per row). Solo posts notify
    // no one. postId lets the notification deep-link to the post.
    if (!details.justMe) {
      const targetIds = Array.from(details.groups);
      emitPush({ event: "checkin", groupIds: targetIds, postId });
      setActiveGroup(targetIds[0]);
    }
    router.push("/home");
    router.refresh();
  }

  const stepName: Record<Step, string> = {
    details: t("cd_step_details"),
    photo: t("cd_step_photo"),
    review: t("cd_step_review"),
  };

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        {stepIdx > 0 ? (
          <button type="button" onClick={back} className="text-label text-text-muted hover:text-text">
            {t("back")}
          </button>
        ) : (
          <Link href="/home" className="text-label text-text-muted hover:text-text">
            {t("back")}
          </Link>
        )}
        <h1 className="text-h2">{t("checkin_title")}</h1>
        <span className="font-mono text-caption text-text-dim nums">
          {stepIdx + 1}/{sequence.length}
        </span>
      </header>

      {/* Step rail */}
      <div className="mb-6 flex items-center gap-2">
        {sequence.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "h-1.5 flex-1 rounded-pill transition-colors",
                i <= stepIdx ? "bg-volt" : "bg-surface-2",
              )}
            />
          </div>
        ))}
      </div>

      {/* Order toggle — only on the first step, before committing to an order. */}
      {stepIdx === 0 && (
        <div className="mb-6">
          <SegmentedControl
            options={[
              { value: "details", label: t("cd_order_details_first") },
              { value: "photo", label: t("cd_order_photo_first") },
            ]}
            value={order}
            onChange={(v) => changeOrder(v as Order)}
          />
        </div>
      )}

      {/* Active step */}
      {step !== "review" && (
        <p className="mb-4 text-caption font-medium uppercase tracking-wide text-text-dim">
          {stepName[step]}
        </p>
      )}

      {step === "details" && (
        <CheckinDetailsStep groups={groups} value={details} onChange={setDetails} />
      )}

      {step === "photo" && (
        <CheckinPhotoStep
          photoUrl={photo?.url ?? null}
          onCapture={handlePhoto}
          mirror={mirror}
          onToggleMirror={toggleMirror}
        />
      )}

      {step === "review" && photo && (
        <>
          <CheckinCardStep
            data={cardData}
            template={template}
            onTemplate={changeTemplate}
            toggles={toggles}
            onToggles={setToggles}
            milestone={milestone}
          />
          {/* Dedicated off-screen full-size node captured for export — kept out
              of the scaled preview so transforms can't interfere. */}
          <div
            aria-hidden
            style={{ position: "fixed", left: "-99999px", top: 0, pointerEvents: "none" }}
          >
            <StoryCard ref={cardRef} template={template} data={cardData} toggles={toggles} />
          </div>
        </>
      )}

      {error && (
        <p className="mt-5 rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="mt-8">
        {step === "review" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => exportCard("save")}
                disabled={cardBusy}
              >
                {cardBusy ? t("card_generating") : t("card_save")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => exportCard("share")}
                disabled={cardBusy}
              >
                {t("card_share_btn")}
              </Button>
            </div>
            {saved ? (
              <p className="rounded-input border border-volt/30 bg-volt/10 px-3 py-2 text-center text-label text-volt">
                {t("card_saved")}
              </p>
            ) : (
              <p className="text-center text-caption text-text-dim">{t("card_hint")}</p>
            )}
            <Button variant="primary" size="lg" fullWidth onClick={post} disabled={posting}>
              {posting ? t("checkin_uploading") : t("checkin_submit")}
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={next}>
            {t("cd_next")}
          </Button>
        )}
      </div>
    </main>
  );
}
