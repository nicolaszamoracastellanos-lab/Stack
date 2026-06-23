"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ImageCropper } from "@/components/ImageCropper";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Wordmark } from "@/components/Wordmark";
import { useLanguage } from "@/lib/language-context";
import { type TranslationKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { deviceTimezone } from "@/lib/week";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const STEP_KEYS = [
  "username",
  "avatar",
  "display_name",
  "favorite_sport",
  "usual_activity",
  "focus_sport",
  "bio",
] as const;
type StepKey = (typeof STEP_KEYS)[number];
const TOTAL = STEP_KEYS.length;

const META: Record<StepKey, { title: TranslationKey; sub: TranslationKey }> = {
  username: { title: "ob_username_title", sub: "ob_username_sub" },
  avatar: { title: "ob_avatar_title", sub: "ob_avatar_sub" },
  display_name: { title: "ob_name_title", sub: "ob_name_sub" },
  favorite_sport: { title: "ob_sport_title", sub: "ob_sport_sub" },
  usual_activity: { title: "ob_routine_title", sub: "ob_routine_sub" },
  focus_sport: { title: "ob_focus_title", sub: "ob_focus_sub" },
  bio: { title: "ob_bio_title", sub: "ob_bio_sub" },
};

export function OnboardingFlow({
  userId,
  profile,
  next,
}: {
  userId: string;
  profile: Profile | null;
  next?: string;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Prefilled from any existing (incomplete) profile.
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [favoriteSport, setFavoriteSport] = useState(profile?.favorite_sport ?? "");
  const [usualActivity, setUsualActivity] = useState(profile?.usual_activity ?? "");
  const [focusSport, setFocusSport] = useState(profile?.focus_sport ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  const key = STEP_KEYS[step];
  const isLast = step === TOTAL - 1;
  const destination = next && next.startsWith("/") ? next : "/home";

  // ---- avatar upload (via cropper) ----
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }
  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }
  async function onCropped(blob: Blob) {
    closeCropper();
    setError(null);
    setUploading(true);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (upErr) {
      console.error("[onboarding avatar] error:", upErr);
      setError(`Avatar upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  // ---- advance / finish ----
  async function advance() {
    setError(null);

    // Validate the current step.
    if (key === "username") {
      const norm = username.trim().toLowerCase();
      if (!USERNAME_RE.test(norm)) {
        setError(t("error_username_invalid"));
        return;
      }
      setBusy(true);
      const { data: taken } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", norm)
        .neq("id", userId) // allow keeping your own username
        .maybeSingle();
      setBusy(false);
      if (taken) {
        setError(t("error_username_taken"));
        return;
      }
    } else if (key === "avatar") {
      if (!avatarUrl) {
        setError(t("ob_avatar_required"));
        return;
      }
    } else if (key === "display_name" && !displayName.trim()) {
      setError(t("ob_required"));
      return;
    } else if (key === "favorite_sport" && !favoriteSport.trim()) {
      setError(t("ob_required"));
      return;
    } else if (key === "usual_activity" && !usualActivity.trim()) {
      setError(t("ob_required"));
      return;
    } else if (key === "focus_sport" && !focusSport.trim()) {
      setError(t("ob_required"));
      return;
    }
    // bio is optional — no validation.

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    await finish();
  }

  async function finish() {
    setBusy(true);
    const { error: upErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        favorite_sport: favoriteSport.trim(),
        usual_activity: usualActivity.trim(),
        focus_sport: focusSport.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
        // Anchor weeks/quiet-hours to the user's frame (Batch 5 A2).
        timezone: deviceTimezone() || null,
        // They saw the welcome story before reaching profile setup.
        has_seen_welcome: true,
      },
      { onConflict: "id" },
    );
    if (upErr) {
      console.error("[onboarding finish] error:", upErr);
      setBusy(false);
      if (upErr.code === "23505") {
        setStep(0);
        setError(t("error_username_taken"));
      } else {
        setError(`${upErr.code ?? "ERR"}: ${upErr.message}`);
      }
      return;
    }
    // Welcome the new member to the team (best-effort, never blocks). The route
    // sends once and is a no-op if the email is already out or not configured.
    void fetch("/api/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang }),
    }).catch(() => {});

    router.replace(destination);
    router.refresh();
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  const textareaCls =
    "w-full resize-none rounded-input border border-border bg-surface px-3.5 py-3 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30";

  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" aria-label={t("brand")}>
          <Wordmark size="md" />
        </Link>
        <LanguageToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          {/* Progress */}
          <div className="flex gap-1.5">
            {STEP_KEYS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-pill transition-colors duration-200",
                  i <= step ? "bg-volt" : "bg-surface-2",
                )}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-caption text-text-dim">
            {t("ob_step", { n: step + 1, total: TOTAL })}
          </p>

          <h1 className="mt-6 text-h1">{t(META[key].title)}</h1>
          <p className="mt-2 text-body text-text-muted">{t(META[key].sub)}</p>

          {/* Step input */}
          <div className="mt-8">
            {key === "username" && (
              <Input
                prefix="@"
                placeholder={t("username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                maxLength={20}
                autoFocus
              />
            )}

            {key === "avatar" && (
              <div className="flex flex-col items-center gap-5">
                <Avatar
                  name={displayName.trim() || username || "?"}
                  src={avatarUrl}
                  size="xl"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? t("loading") : t("ob_avatar_choose")}
                </Button>
              </div>
            )}

            {key === "display_name" && (
              <Input
                placeholder={t("display_name_placeholder")}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                autoFocus
              />
            )}

            {key === "favorite_sport" && (
              <Input
                placeholder={t("profile_favorite_sport_placeholder")}
                value={favoriteSport}
                onChange={(e) => setFavoriteSport(e.target.value)}
                maxLength={40}
                autoFocus
              />
            )}

            {key === "usual_activity" && (
              <textarea
                className={textareaCls}
                placeholder={t("profile_usual_activity_placeholder")}
                value={usualActivity}
                onChange={(e) => setUsualActivity(e.target.value)}
                rows={3}
                maxLength={120}
              />
            )}

            {key === "focus_sport" && (
              <Input
                placeholder={t("profile_focus_sport_placeholder")}
                value={focusSport}
                onChange={(e) => setFocusSport(e.target.value)}
                maxLength={80}
                autoFocus
              />
            )}

            {key === "bio" && (
              <textarea
                className={textareaCls}
                placeholder={t("profile_bio_placeholder")}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
              />
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <Button variant="secondary" size="lg" onClick={back} disabled={busy}>
                {t("back")}
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={advance}
              disabled={busy || uploading}
            >
              {busy
                ? t("loading")
                : isLast
                  ? t("ob_finish")
                  : t("ob_continue")}
            </Button>
          </div>
        </div>
      </div>

      {cropSrc && (
        <ImageCropper src={cropSrc} shape="circle" onCancel={closeCropper} onCropped={onCropped} />
      )}
    </main>
  );
}
