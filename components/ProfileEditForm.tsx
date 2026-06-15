"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
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

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const name = displayName.trim() || `@${profile.username}`;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(false);
    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setError(true);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
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
      })
      .eq("id", userId);

    if (updErr) {
      setError(true);
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

        {error && <p className="text-label text-danger">{t("error_generic")}</p>}

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
    </main>
  );
}
