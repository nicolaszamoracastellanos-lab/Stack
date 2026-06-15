"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useLanguage } from "@/lib/language-context";

/**
 * Lets a user join a group by pasting either a raw invite code (e.g. "AB3K9P")
 * or a full invite link (".../join/AB3K9P"). Normalizes it and routes to the
 * /join/[code] confirmation screen.
 */
export function JoinByCode() {
  const { t } = useLanguage();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function extractCode(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // Pull the code out of a pasted invite URL, else use the raw input.
    const fromUrl = trimmed.match(/\/join\/([^/?#\s]+)/i);
    const candidate = (fromUrl ? fromUrl[1] : trimmed).toUpperCase();
    // Keep only the invite alphabet characters.
    const cleaned = candidate.replace(/[^A-Z0-9]/g, "");
    return cleaned.length >= 4 ? cleaned : null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    const code = extractCode(value);
    if (!code) {
      setError(true);
      return;
    }
    router.push(`/join/${code}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder={t("join_code_placeholder")}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            error={error ? t("join_code_invalid") : undefined}
          />
        </div>
        <Button type="submit" variant="secondary" size="md" className="h-11 shrink-0">
          {t("join_code_submit")}
        </Button>
      </div>
    </form>
  );
}
