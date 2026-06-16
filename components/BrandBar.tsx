"use client";

import { LanguageToggle } from "@/components/LanguageToggle";
import { Wordmark } from "@/components/Wordmark";

/**
 * The brand strip that sits at the top of every primary app tab (home,
 * activity, groups, profile): the Stack wordmark on the left, language toggle
 * on the right. Keeps the logo present throughout the app, not just on the
 * auth/landing screens, and keeps that lockup identical across tabs.
 */
export function BrandBar({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between ${className ?? "mb-7"}`}
    >
      <Wordmark size="sm" />
      <LanguageToggle />
    </div>
  );
}
