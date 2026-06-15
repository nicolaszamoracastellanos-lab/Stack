"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { useLanguage } from "@/lib/language-context";
import { createClient } from "@/lib/supabase/client";
import { setActiveGroup } from "@/lib/active-group";

type GroupPreview = { id: string; name: string; goal: string | null };
type Status =
  | { kind: "loading" }
  | { kind: "logged_out" }
  | { kind: "invalid" }
  | { kind: "already_member"; group: GroupPreview }
  | { kind: "ready"; group: GroupPreview };

export default function JoinPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();

  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus({ kind: "logged_out" });
        return;
      }

      // Look up the group by code via the SECURITY DEFINER RPC (a non-member
      // can't read the groups table directly).
      const { data, error: rpcError } = await supabase.rpc(
        "group_by_invite_code",
        { _code: code },
      );
      const group = (data as GroupPreview[] | null)?.[0];
      if (rpcError || !group) {
        setStatus({ kind: "invalid" });
        return;
      }

      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setStatus(
        existing
          ? { kind: "already_member", group }
          : { kind: "ready", group },
      );
    })();
  }, [code]);

  async function join(group: GroupPreview) {
    setError(false);
    setJoining(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?next=/join/${code}`);
      return;
    }

    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: user.id });

    // 23505 = already a member; treat as success.
    if (joinError && joinError.code !== "23505") {
      setError(true);
      setJoining(false);
      return;
    }

    setActiveGroup(group.id);
    router.push("/home");
    router.refresh();
  }

  const next = encodeURIComponent(`/join/${code}`);

  if (status.kind === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-label text-text-dim">{t("loading")}</p>
      </main>
    );
  }

  if (status.kind === "logged_out") {
    return (
      <AuthShell title={t("join_title")} subtitle={t("join_login_required")}>
        <div className="flex flex-col gap-3">
          <Link href={`/signup?next=${next}`}>
            <Button variant="primary" size="lg" fullWidth>
              {t("landing_cta_signup")}
            </Button>
          </Link>
          <Link href={`/login?next=${next}`}>
            <Button variant="secondary" size="lg" fullWidth>
              {t("landing_cta_login")}
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (status.kind === "invalid") {
    return (
      <AuthShell title={t("join_title")} subtitle={t("join_invalid_code")}>
        <Link href="/home">
          <Button variant="secondary" size="lg" fullWidth>
            {t("invite_go_home")}
          </Button>
        </Link>
      </AuthShell>
    );
  }

  if (status.kind === "already_member") {
    return (
      <AuthShell title={status.group.name} subtitle={t("join_already_member")}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => {
            setActiveGroup(status.group.id);
            router.push("/home");
            router.refresh();
          }}
        >
          {t("join_go_home")}
        </Button>
      </AuthShell>
    );
  }

  // ready
  return (
    <AuthShell title={t("join_title")} subtitle={t("join_subtitle")}>
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="text-h2">{status.group.name}</p>
        {status.group.goal && (
          <p className="mt-1 text-body text-text-muted">{status.group.goal}</p>
        )}
      </div>

      {error && (
        <p className="mt-4 text-label text-danger">{t("error_generic")}</p>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-6"
        disabled={joining}
        onClick={() => join(status.group)}
      >
        {joining ? t("loading") : t("join_button")}
      </Button>
    </AuthShell>
  );
}
