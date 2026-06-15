"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  /** Optional fixed prefix shown inside the field, e.g. "@" for usernames. */
  prefix?: string;
};

/**
 * Dark input with a hairline border and a volt focus ring. Pass `label`,
 * `hint` or `error` and it wires up the ids and aria for you.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-label text-text-muted">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center rounded-input border bg-surface transition-colors duration-150",
          "focus-within:border-volt focus-within:ring-2 focus-within:ring-volt/30",
          error ? "border-danger" : "border-border hover:border-border-strong",
        )}
      >
        {prefix && (
          <span className="pl-3.5 text-body text-text-dim select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full bg-transparent px-3.5 py-3 text-body text-text",
            "placeholder:text-text-dim focus:outline-none",
            prefix && "pl-1.5",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-caption text-text-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
