"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Landing-page updates signup. Starts as a single volt link; tapping it reveals
 * an inline email field. Submits to /api/subscribe, which stores the address
 * and (best-effort) fires the welcome email. Lives in the footer, kept light so
 * it never competes with the primary CTAs above.
 */
export function WaitlistSignup() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), language: lang }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="text-volt">{t("waitlist_success")}</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-volt underline-offset-4 hover:underline"
      >
        {t("waitlist_link")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder={t("waitlist_placeholder")}
          className="min-w-0 flex-1 rounded-input border border-volt/40 bg-bg px-3 py-2 text-caption text-text placeholder:text-text-dim focus:border-volt focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="shrink-0 rounded-input bg-volt px-3 py-2 text-caption font-medium text-bg hover:bg-volt-dim disabled:opacity-60"
        >
          {state === "sending" ? t("waitlist_submitting") : t("waitlist_submit")}
        </button>
      </div>
      {state === "error" && (
        <span className="text-danger">
          {EMAIL_RE.test(email.trim()) ? t("waitlist_error") : t("waitlist_invalid")}
        </span>
      )}
    </form>
  );
}
