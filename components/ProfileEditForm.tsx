"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ImageCropper } from "@/components/ImageCropper";
import { Toggle } from "@/components/Toggle";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function ProfileEditForm({
  userId,
  profile,
}: {
  userId: string;
  profile: Profile;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [favoriteSport, setFavoriteSport] = useState(profile.favorite_sport ?? "");
  const [usualActivity, setUsualActivity] = useState(profile.usual_activity ?? "");
  const [focusSport, setFocusSport] = useState(profile.focus_sport ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [showStats, setShowStats] = useState(profile.show_stats ?? true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Holds the REAL error string during this debugging pass — never generic.
  const [error, setError] = useState<string | null>(null);
  // Object URL of the picked file while the cropper is open.
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const name = displayName.trim() || `@${profile.username}`;

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    // Open the cropper instead of uploading the raw file directly.
    setCropSrc(URL.createObjectURL(file));
    // Allow re-picking the same file later.
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
      console.error("[avatar upload] error:", upErr);
      setError(`Avatar upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function replayTour() {
    await supabase
      .from("profiles")
      .update({ has_completed_tour: false })
      .eq("id", userId);
    router.push("/home");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        favorite_sport: favoriteSport.trim() || null,
        usual_activity: usualActivity.trim() || null,
        focus_sport: focusSport.trim() || null,
        avatar_url: avatarUrl,
        show_stats: showStats,
      })
      .eq("id", userId);

    if (updErr) {
      console.error("[profile save] error:", updErr);
      setError(`${updErr.code ?? "ERR"}: ${updErr.message}`);
      setSaving(false);
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-h2">{t("profile_edit_title")}</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-label text-text-muted hover:text-text"
        >
          {t("back")}
        </button>
      </header>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar name={name} src={avatarUrl} size="lg" />
          <div>
            <p className="text-label text-text-muted">{t("profile_avatar_label")}</p>
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
              className="mt-1"
            >
              {uploading ? t("loading") : t("profile_avatar_change")}
            </Button>
          </div>
        </div>

        <Input
          label={t("display_name_label")}
          placeholder={t("display_name_placeholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-label text-text-muted">{t("profile_bio_label")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("profile_bio_placeholder")}
            rows={3}
            maxLength={200}
            className="w-full resize-none rounded-input border border-border bg-surface px-3.5 py-3 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
          />
        </div>

        <Input
          label={t("profile_favorite_sport_label")}
          placeholder={t("profile_favorite_sport_placeholder")}
          value={favoriteSport}
          onChange={(e) => setFavoriteSport(e.target.value)}
          maxLength={40}
        />
        <Input
          label={t("profile_usual_activity_label")}
          placeholder={t("profile_usual_activity_placeholder")}
          value={usualActivity}
          onChange={(e) => setUsualActivity(e.target.value)}
          maxLength={80}
        />
        <Input
          label={t("profile_focus_sport_label")}
          placeholder={t("profile_focus_sport_placeholder")}
          value={focusSport}
          onChange={(e) => setFocusSport(e.target.value)}
          maxLength={80}
        />

        {/* Privacy */}
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="text-caption font-medium uppercase tracking-wide text-text-dim">
            {t("privacy_label")}
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <label className="text-body text-text" htmlFor="show-stats">
              {t("privacy_show_stats")}
            </label>
            <Toggle
              checked={showStats}
              onChange={setShowStats}
              label={t("privacy_show_stats")}
            />
          </div>
          <p className="mt-3 text-caption leading-relaxed text-text-muted">
            {t("privacy_explainer")}
          </p>
        </div>

        {/* Replay the feature tour */}
        <button
          type="button"
          onClick={replayTour}
          className="text-left text-label text-text-muted underline-offset-4 hover:text-text hover:underline"
        >
          {t("tour_replay")}
        </button>

        {error && (
          <p className="rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={saving || uploading}
        >
          {saving ? t("loading") : t("profile_save")}
        </Button>
      </form>

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          shape="circle"
          onCancel={closeCropper}
          onCropped={onCropped}
        />
      )}
    </main>
  );
}
