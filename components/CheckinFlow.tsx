"use client";

import { useMemo, useRef, useState } from "react";
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
import type { StoryCardData } from "@/components/StoryCard";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET, checkinPhotoPath } from "@/lib/storage";
import { setActiveGroup } from "@/lib/active-group";
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
  activeId,
  initialOrder,
  streakAfter,
  initialTemplate,
}: {
  userId: string;
  groups: Group[];
  activeId: string | null;
  initialOrder: Order;
  /** Streak the user will have once this check-in posts (drives the card). */
  streakAfter: number;
  initialTemplate: string;
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

  function changeTemplate(next: CardTemplateKey) {
    setTemplate(next);
    createClient().from("profiles").update({ card_template: next }).eq("id", userId);
  }

  const cardData: StoryCardData = useMemo(
    () => ({
      photoUrl: photo?.url ?? "",
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
        <CheckinCardStep
          ref={cardRef}
          data={cardData}
          template={template}
          onTemplate={changeTemplate}
          toggles={toggles}
          onToggles={setToggles}
          milestone={milestone}
        />
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
