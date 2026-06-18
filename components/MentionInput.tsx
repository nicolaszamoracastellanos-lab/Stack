"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { formatMention, type MentionMember } from "@/lib/mentions";

/**
 * Textarea with `@` autocomplete of GROUP MEMBERS ONLY (STACK_BATCH6 Stage 4).
 * Selecting a member inserts an `@[name](uid)` token. Group-scoped: it only ever
 * offers the members passed in.
 */
export function MentionInput({
  value,
  onChange,
  members,
  placeholder,
  onSubmit,
  rows = 1,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  members: MentionMember[];
  placeholder?: string;
  onSubmit?: () => void;
  rows?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(0);

  function detect(text: string, caret: number) {
    const upto = text.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at < 0) return setQuery(null);
    const before = at === 0 ? " " : upto[at - 1];
    if (!/\s/.test(before)) return setQuery(null);
    const q = upto.slice(at + 1);
    if (/\s/.test(q) || q.length > 30) return setQuery(null);
    setAnchor(at);
    setQuery(q);
  }

  function pick(m: MentionMember) {
    const caret = ref.current?.selectionStart ?? value.length;
    const before = value.slice(0, anchor);
    const after = value.slice(caret);
    const token = formatMention(m.name, m.id) + " ";
    onChange(before + token + after);
    setQuery(null);
    requestAnimationFrame(() => {
      ref.current?.focus();
      const pos = (before + token).length;
      ref.current?.setSelectionRange(pos, pos);
    });
  }

  const filtered =
    query !== null
      ? members
          .filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6)
      : [];
  const open = query !== null && filtered.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      {open && (
        <ul className="absolute bottom-full left-0 z-20 mb-1 max-h-48 w-full overflow-y-auto rounded-card border border-border bg-surface-2 p-1 shadow-lg">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m);
                }}
                className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left hover:bg-surface"
              >
                <Avatar name={m.name} src={m.avatarUrl ?? null} size="sm" />
                <span className="truncate text-label text-text">{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target.value, e.target.selectionStart ?? e.target.value.length);
        }}
        onKeyDown={(e) => {
          if (open && e.key === "Enter") {
            e.preventDefault();
            pick(filtered[0]);
            return;
          }
          if (e.key === "Enter" && !e.shiftKey && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className={className}
      />
    </div>
  );
}
