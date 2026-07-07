"use client";

import { useEffect, useState } from "react";
import { useCountUp } from "@/lib/use-count-up";

/**
 * The consistency ring — the emotional center of Home, ported verbatim from
 * stack_v3_prototype.html §Home: 270px, 16px stroke, round caps, volt with a
 * hard drop-shadow glow, drawing from 0 to value over 850ms ease-out while
 * the percentage counts up at 84px in the numeral role. A faint radial volt
 * ambience sits behind it. Wired to real weekly consistency data.
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
  const SIZE = 270;
  const STROKE = 16;
  const R = 118; // prototype geometry: viewBox 270, r 118
  const C = 2 * Math.PI * R;
  const v = Math.max(0, Math.min(1, value));

  // First paint renders the ring empty; the next frame sets the real value so
  // the CSS transition draws it in (850ms, ease-out cubic like the prototype).
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const offset = drawn ? C * (1 - v) : C;
  const displayed = useCountUp(drawn ? percent : 0, 850);

  return (
    <div className="relative flex flex-col items-center pb-2 pt-3.5">
      {/* Faint radial volt ambience behind the ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[40%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(198,248,6,.10), transparent 62%)",
        }}
      />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="relative h-[270px] w-[270px] -rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-surface-2"
          stroke="currentColor"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="text-volt"
          stroke="currentColor"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 850ms cubic-bezier(0.33,1,0.68,1)",
            filter: "drop-shadow(0 0 10px rgba(198,248,6,0.75))",
          }}
        />
      </svg>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%] text-center">
        <span className="type-numeral block text-[84px] leading-none tracking-[-0.04em] text-text">
          {displayed}
          <span className="text-[30px] font-extrabold tracking-normal text-text-muted">
            %
          </span>
        </span>
        {sublabel && (
          <span className="nums mt-1 block text-[15px] font-extrabold text-volt">
            {sublabel}
          </span>
        )}
        <span className="eyebrow mt-1.5 block whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}
