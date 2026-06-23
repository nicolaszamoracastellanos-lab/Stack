"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { useLanguage } from "@/lib/language-context";
import { type TranslationKey } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { generateInviteCode } from "@/lib/utils";
import { inviteLink as buildInviteLink } from "@/lib/site";
import { setActiveGroup } from "@/lib/active-group";
import { PenaltyPopup } from "@/components/PenaltyIntro";

type Created = { id: string; code: string };

export default function NewGroupPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    // Insert the group, retrying if the random invite code happens to collide.
    let groupId: string | null = null;
    let code = "";
    for (let attempt = 0; attempt < 4 && !groupId; attempt++) {
      code = generateInviteCode();
      const { data, error: insertError } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          goal: goal.trim() || null,
          invite_code: code,
          created_by: user.id,
          owner_id: user.id,
        })
        .select("id")
        .single();

      if (!insertError && data) {
        groupId = data.id;
      } else if (insertError && insertError.code !== "23505") {
        // Anything other than a unique-collision is a real failure.
        setError("error_generic");
        setLoading(false);
        return;
      }
    }

    if (!groupId) {
      setError("error_generic");
      setLoading(false);
      return;
    }

    // Add the creator as the first member.
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, user_id: user.id });
    if (memberError) {
      setError("error_generic");
      setLoading(false);
      return;
    }

    setActiveGroup(groupId);
    setCreated({ id: groupId, code });
    setLoading(false);
  }

  // Always build the invite link on the canonical domain (stack-app.online).
  const inviteLink = created ? buildInviteLink(created.code) : "";

  async function copy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the link is visible to copy manually.
    }
  }

  // ---- Invite reveal (after creation) ----
  if (created) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        <PenaltyPopup groupId={created.id} />
        <h1 className="text-h1">{t("invite_title")}</h1>
        <p className="mt-2 text-body text-text-muted">{t("invite_subtitle")}</p>

        <Card elevated className="mt-8">
          <p className="text-label text-text-muted">{t("invite_link_label")}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-input border border-border bg-bg px-3 py-2.5 font-mono text-label text-text">
              {inviteLink}
            </code>
            <Button variant="primary" onClick={copy}>
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>

          <p className="mt-5 text-label text-text-muted">
            {t("invite_code_label")}
          </p>
          <p className="mt-1 font-mono text-display tracking-[0.2em] text-volt">
            {created.code}
          </p>
        </Card>

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          className="mt-8"
          onClick={() => {
            router.push("/home");
            router.refresh();
          }}
        >
          {t("invite_go_home")}
        </Button>
      </main>
    );
  }

  // ---- Create form ----
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="text-h1">{t("creategroup_title")}</h1>
      <p className="mt-2 text-body text-text-muted">
        {t("creategroup_subtitle")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4" noValidate>
        <Input
          label={t("group_name_label")}
          placeholder={t("group_name_placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
        />
        <Input
          label={t("goal_label")}
          placeholder={t("goal_placeholder")}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={80}
        />

        {error && <p className="text-label text-danger">{t(error)}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !name.trim()}
        >
          {loading ? t("loading") : t("creategroup_submit")}
        </Button>
      </form>
    </main>
  );
}
