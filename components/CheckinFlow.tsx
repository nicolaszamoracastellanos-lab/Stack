"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import {
  CheckinDetailsStep,
  type CheckinDetails,
} from "@/components/CheckinDetailsStep";
import { CheckinPhotoStep } from "@/components/CheckinPhotoStep";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET, checkinPhotoPath } from "@/lib/storage";
import { setActiveGroup } from "@/lib/active-group";
import { SPORTS, GOALS, OTHER_KEY, iconFor, labelFor } from "@/lib/workout-options";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

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
  activeId,
  initialOrder,
}: {
  userId: string;
  groups: Group[];
  activeId: string | null;
  initialOrder: Order;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [order, setOrder] = useState<Order>(initialOrder);
  const [stepIdx, setStepIdx] = useState(0);
  const sequence: Step[] =
    order === "photo" ? ["photo", "details", "review"] : ["details", "photo", "review"];
  const step = sequence[stepIdx];

  const [details, setDetails] = useState<CheckinDetails>(() => ({
    groups: new Set(activeId ? [activeId] : []),
    sport: "",
    sportOther: "",
    environment: "",
    goal: "",
    goalOther: "",
    notes: "",
    sportQuery: "",
  }));
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  function changeOrder(next: Order) {
    setOrder(next);
    setStepIdx(0);
    // Remember the preference (best-effort; degrades if column missing).
    createClient().from("profiles").update({ checkin_order: next }).eq("id", userId);
  }

  function validateDetails(): string | null {
    if (details.groups.size === 0) return t("cd_err_groups");
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
    const path = checkinPhotoPath(userId, `${crypto.randomUUID()}.jpg`);
    const { error: upErr } = await supabase.storage
      .from(CHECKINS_BUCKET)
      .upload(path, photo.blob, { contentType: "image/jpeg", upsert: false });
    if (upErr) {
      setError(`Photo upload failed: ${upErr.message}`);
      setPosting(false);
      return;
    }

    const sportVal = details.sport === OTHER_KEY ? details.sportOther.trim() : details.sport;
    const goalVal = details.goal === OTHER_KEY ? details.goalOther.trim() : details.goal;
    const postId = crypto.randomUUID();
    const rows = Array.from(details.groups).map((group_id) => ({
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
    setActiveGroup(Array.from(details.groups)[0]);
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
          onCapture={(blob, url) => {
            if (photo) URL.revokeObjectURL(photo.url);
            setPhoto({ blob, url });
          }}
        />
      )}

      {step === "review" && photo && (
        <div className="flex flex-col gap-5">
          <div className="mx-auto overflow-hidden rounded-card border border-border bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img src={photo.url} alt="" className="aspect-[9/16] max-h-[55dvh] w-auto object-cover" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-2 px-3 py-1.5 text-label font-semibold text-text">
              <span aria-hidden>{iconFor(SPORTS, details.sport)}</span>
              {details.sport === OTHER_KEY
                ? details.sportOther
                : labelFor(SPORTS, details.sport, lang)}
            </span>
            <span className="rounded-pill border border-border bg-bg px-2.5 py-1 text-caption text-text-muted">
              {t(details.environment === "indoor" ? "env_indoor" : "env_outdoor")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-pill border border-volt/30 bg-volt/10 px-2.5 py-1 text-caption font-medium text-volt">
              <span aria-hidden>{iconFor(GOALS, details.goal)}</span>
              {details.goal === OTHER_KEY ? details.goalOther : labelFor(GOALS, details.goal, lang)}
            </span>
          </div>
          {details.notes.trim() && (
            <p className="whitespace-pre-wrap text-body text-text-muted">{details.notes.trim()}</p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="mt-8">
        {step === "review" ? (
          <Button variant="primary" size="lg" fullWidth onClick={post} disabled={posting}>
            {posting ? t("checkin_uploading") : t("checkin_submit")}
          </Button>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={next}>
            {t("cd_next")}
          </Button>
        )}
      </div>
    </main>
  );
}
