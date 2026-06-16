"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

/**
 * Error boundary for the logged-in app. Surfaces the real error message (and
 * digest) instead of a blank "client-side exception" screen, with a recover
 * action. Note: in production, errors thrown in Server Components are sanitized
 * by Next to a digest only — client-side errors show their message.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[80dvh] w-full max-w-xl flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-h2">Something broke.</p>
      <p className="max-w-md break-words rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-label text-danger">
        {error.message || "Unknown error"}
        {error.digest ? ` (digest ${error.digest})` : ""}
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <Link href="/home">
          <Button variant="secondary">Home</Button>
        </Link>
      </div>
    </main>
  );
}
