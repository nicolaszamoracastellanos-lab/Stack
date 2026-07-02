"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: React.ReactNode;
  /** Bottom sheet on phones (default) or centered card. */
  variant?: "sheet" | "center";
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * The one overlay primitive: dialog semantics, focus trap, Escape-to-close,
 * scrim tap to dismiss, body scroll lock. Bottom sheet on phones, centered
 * card on larger screens — touch-first either way.
 */
export function Modal({
  open,
  onClose,
  label,
  children,
  variant = "sheet",
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Move focus into the dialog so keyboard/screen-reader users land inside.
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      // Cycle focus inside the panel.
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-bg/80 backdrop-blur-sm",
        variant === "sheet"
          ? "items-end justify-center sm:items-center"
          : "items-center justify-center",
      )}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[85dvh] w-full overflow-y-auto border border-border bg-surface p-5",
          "animate-slide-fade-in focus:outline-none",
          variant === "sheet"
            ? "rounded-t-card pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-card sm:pb-5"
            : "mx-4 max-w-md rounded-card",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
