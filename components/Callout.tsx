import { cn } from "@/lib/utils";

type Tone = "volt" | "neutral";

const tones: Record<Tone, string> = {
  // The highlight treatment — one per screen, it competes with the CTA.
  volt: "border-volt/30 bg-volt/10",
  neutral: "border-border bg-surface",
};

/**
 * Info/highlight banner — the `border-volt/30 bg-volt/10` treatment that was
 * copy-pasted across a dozen screens, consolidated. Use `neutral` when the
 * screen already has a volt element doing the talking.
 */
export function Callout({
  tone = "volt",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      className={cn("rounded-card border p-4", tones[tone], className)}
      {...props}
    />
  );
}
