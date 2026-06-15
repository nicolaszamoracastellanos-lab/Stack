"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { CHECKINS_BUCKET, checkinPhotoPath } from "@/lib/storage";
import { setActiveGroup } from "@/lib/active-group";
import { SPORTS, GOALS, OTHER_KEY, type Option } from "@/lib/workout-options";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-caption font-medium uppercase tracking-wide text-text-dim">
      {children}
    </p>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-label transition-colors duration-150",
        active
          ? "border-volt bg-volt/15 text-volt"
          : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

export function CheckinDetail({
  userId,
  groups,
  activeId,
  photoBlob,
  photoUrl,
  onBack,
}: {
  userId: string;
  groups: Group[];
  activeId: string | null;
  photoBlob: Blob;
  photoUrl: string;
  onBack: () => void;
}) {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(activeId ? [activeId] : []),
  );
  const [sport, setSport] = useState<string>("");
  const [sportOther, setSportOther] = useState("");
  const [sportQuery, setSportQuery] = useState("");
  const [environment, setEnvironment] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [goalOther, setGoalOther] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const filteredSports = useMemo(() => {
    const q = sportQuery.trim().toLowerCase();
    if (!q) return SPORTS;
    return SPORTS.filter(
      (o) =>
        o.en.toLowerCase().includes(q) ||
        o.es.toLowerCase().includes(q) ||
        o.key.includes(q),
    );
  }, [sportQuery]);

  function toggleGroup(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function post() {
    setError(null);
    const groupIds = Array.from(selected);
    if (groupIds.length === 0) return setError(t("cd_err_groups"));
    if (!sport) return setError(t("cd_err_sport"));
    if (sport === OTHER_KEY && !sportOther.trim()) return setError(t("cd_err_other"));
    if (!environment) return setError(t("cd_err_environment"));
    if (!goal) return setError(t("cd_err_goal"));
    if (goal === OTHER_KEY && !goalOther.trim()) return setError(t("cd_err_other"));

    const sportVal = sport === OTHER_KEY ? sportOther.trim() : sport;
    const goalVal = goal === OTHER_KEY ? goalOther.trim() : goal;

    setPosting(true);
    const supabase = createClient();

    // Upload the single photo once (under the user's folder).
    const path = checkinPhotoPath(userId, `${crypto.randomUUID()}.jpg`);
    const { error: upErr } = await supabase.storage
      .from(CHECKINS_BUCKET)
      .upload(path, photoBlob, { contentType: "image/jpeg", upsert: false });
    if (upErr) {
      console.error("[checkin upload] error:", upErr);
      setError(`Photo upload failed: ${upErr.message}`);
      setPosting(false);
      return;
    }

    // One row per selected group, sharing a post_id.
    const postId = crypto.randomUUID();
    const rows = groupIds.map((group_id) => ({
      group_id,
      user_id: userId,
      photo_url: path,
      note: notes.trim() || null,
      sport: sportVal,
      environment,
      goal: goalVal,
      post_id: postId,
    }));
    const { error: insErr } = await supabase.from("checkins").insert(rows);
    if (insErr) {
      console.error("[checkin insert] error:", insErr);
      setError(`${insErr.code ?? "ERR"}: ${insErr.message}`);
      setPosting(false);
      return;
    }

    setActiveGroup(groupIds[0]);
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-6">
      <header className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-label text-text-muted hover:text-text"
        >
          {t("back")}
        </button>
        <h1 className="text-h2">{t("checkin_title")}</h1>
        <span className="w-10" />
      </header>

      {/* Photo preview */}
      <div className="overflow-hidden rounded-card border border-border bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
        <img src={photoUrl} alt="" className="aspect-square w-full object-cover" />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {/* Groups */}
        <section>
          <Label>{t("cd_groups")}</Label>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const on = selected.has(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex items-center gap-2 rounded-pill border py-1.5 pl-1.5 pr-3 transition-colors duration-150",
                    on
                      ? "border-volt bg-volt/15"
                      : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <Avatar name={g.name} size="sm" />
                  <span
                    className={cn(
                      "text-label",
                      on ? "text-volt" : "text-text-muted",
                    )}
                  >
                    {g.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Sport */}
        <section>
          <Label>{t("cd_sport")}</Label>
          <input
            value={sportQuery}
            onChange={(e) => setSportQuery(e.target.value)}
            placeholder={t("cd_search_sport")}
            className="mb-3 w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
          />
          <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
            {filteredSports.map((o: Option) => (
              <Chip
                key={o.key}
                active={sport === o.key}
                onClick={() => setSport(o.key)}
              >
                <span aria-hidden>{o.icon}</span>
                {o[lang]}
              </Chip>
            ))}
          </div>
          {sport === OTHER_KEY && (
            <input
              value={sportOther}
              onChange={(e) => setSportOther(e.target.value)}
              placeholder={t("cd_other_placeholder")}
              maxLength={40}
              className="mt-3 w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
            />
          )}
        </section>

        {/* Environment */}
        <section>
          <Label>{t("cd_environment")}</Label>
          <SegmentedControl
            options={[
              { value: "indoor", label: t("env_indoor") },
              { value: "outdoor", label: t("env_outdoor") },
            ]}
            value={environment}
            onChange={setEnvironment}
          />
        </section>

        {/* Goal */}
        <section>
          <Label>{t("cd_goal")}</Label>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((o) => (
              <Chip key={o.key} active={goal === o.key} onClick={() => setGoal(o.key)}>
                <span aria-hidden>{o.icon}</span>
                {o[lang]}
              </Chip>
            ))}
          </div>
          {goal === OTHER_KEY && (
            <input
              value={goalOther}
              onChange={(e) => setGoalOther(e.target.value)}
              placeholder={t("cd_other_placeholder")}
              maxLength={40}
              className="mt-3 w-full rounded-input border border-border bg-surface px-3.5 py-2.5 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
            />
          )}
        </section>

        {/* Notes */}
        <section>
          <Label>{t("cd_notes")}</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("cd_notes_placeholder")}
            rows={4}
            maxLength={500}
            className="w-full resize-none rounded-card border border-border bg-surface px-4 py-3 text-body text-text placeholder:text-text-dim focus:border-volt focus:outline-none focus:ring-2 focus:ring-volt/30"
          />
        </section>

        {error && (
          <p className="rounded-input border border-danger/40 bg-danger/10 px-3 py-2 text-label text-danger">
            {error}
          </p>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={post}
          disabled={posting}
        >
          {posting ? t("checkin_uploading") : t("checkin_submit")}
        </Button>
      </div>
    </main>
  );
}
