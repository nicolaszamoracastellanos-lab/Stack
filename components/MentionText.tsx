"use client";

import Link from "next/link";
import { Fragment } from "react";
import { MENTION_RE } from "@/lib/mentions";

/**
 * Renders a body with mention tokens (`@[name](uid)`) as styled, volt-accent
 * tokens that link to the member's profile (STACK_BATCH6 Stage 4).
 */
export function MentionText({ body }: { body: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  const re = new RegExp(MENTION_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const start = m.index;
    if (start > last) parts.push(<Fragment key={i++}>{body.slice(last, start)}</Fragment>);
    const name = m[1];
    const uid = m[2];
    parts.push(
      <Link
        key={i++}
        href={`/u/${uid}`}
        className="font-medium text-volt hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        @{name}
      </Link>,
    );
    last = start + m[0].length;
  }
  if (last < body.length) parts.push(<Fragment key={i++}>{body.slice(last)}</Fragment>);
  return <>{parts}</>;
}
