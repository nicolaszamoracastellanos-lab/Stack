"use client";

import { useEffect, useState } from "react";
import { useCountUp } from "@/lib/use-count-up";

/**
 * The consistency ring — the emotional center of Home. Fills most of the
 * viewport width, draws itself in from zero on load while the percentage
 * counts up in a massive numeral, with a soft volt glow riding the progress
 * arc. Everything else on the screen whispers so this can scream.
 */
export function ConsistencyRing({
  value,
  percent,
  label,
  sublabel,
}: {
  value: number; // 0..1
  percent: number; // 0..100, shown in the center
  label: string;
  sublabel?: string;
}) {
  // Drawn on a fixed 320 viewBox; CSS scales it to ~70vw (capped) so the
  // geometry stays crisp at any size.
  const SIZE = 320;
  const STROKE = 22;
  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));

  // First paint renders the ring empty; the next frame sets the real value so
  // the CSS transition draws it in. After that, updates animate natively.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const offset = drawn ? c * (1 - v) : c;
  const displayed = useCountUp(drawn ? percent : 0, 800);

  return (
    <div
      className="relative"
      style={{ width: "min(70vw, 340px)", height: "min(70vw, 340px)" }}
    >
      {/* Faint radial volt ambience behind the ring. */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-pill"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(198,248,6,0.08), transparent 65%)",
        }}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative h-full w-full -rotate-90"
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          className="text-surface-2"
          stroke="currentColor"
        />
        {/* Progress arc with a soft glow riding it. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={r}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-volt"
          stroke="currentColor"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)",
            filter: "drop-shadow(0 0 10px rgba(198,248,6,0.45))",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono nums leading-none tracking-tight">
          <span className="text-display-xl text-text">{displayed}</span>
          <span className="text-h1 text-text-muted">%</span>
        </span>
        <span className="eyebrow mt-2 max-w-[9rem] text-center">
          {label}
        </span>
        {sublabel && (
          <span className="mt-1 font-mono text-label text-volt nums">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
