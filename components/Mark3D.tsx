"use client";

import { useEffect, useRef } from "react";

/**
 * The landing hero: the STACK. wordmark extruded in 3D — pure CSS transforms,
 * no WebGL. Ported verbatim from stack_v3_prototype.html (buildDepth + tilt).
 *
 * Structure: a `perspective: 800px` wrapper, one front face, and 16
 * aria-hidden depth layers stepped back 2.2px each with a gray ramp on the
 * letters and a dark-volt ramp on the square period.
 *
 * HARD RULES (shipped-bug territory):
 * - NEVER put a CSS `filter`, `opacity < 1`, or `overflow: hidden` on the
 *   element carrying `transform-style: preserve-3d` (the inner mark). Any of
 *   those flatten the 3D context and the extrusion silently disappears. The
 *   entrance fade lives on the WRAPPER, exactly like the prototype.
 * - The mark rests in a fixed pose (rotateX 16°, rotateY −14°) so the depth
 *   always reads, like a product shot. It NEVER auto-rotates or idles. It
 *   tilts only with pointer/touch (small lerped offsets) and eases back to
 *   the pose — never to flat. Reduced motion: static pose, no tilt.
 */
const LAYERS = 16;
const STEP = 2.2; // px per layer
const BASE_X = 16; // deg
const BASE_Y = -14; // deg

function depthLayerStyle(i: number): React.CSSProperties {
  const p = i / LAYERS;
  const c = Math.round(58 - 40 * p); // gray ramp #3A3A40 -> near-black
  return {
    transform: `translateZ(${-i * STEP}px)`,
    color: `rgb(${c},${c},${c + 4})`,
    // dark volt ramp for the square period on this layer
    ["--sqc" as string]: `rgb(${Math.round(96 - 58 * p)},${Math.round(120 - 78 * p)},5)`,
  };
}

/** The volt rounded-square period — part of the lockup, must never wrap.
 * The front square pulses ONCE after the tagline sequence lands (box-shadow
 * only — a `filter` here would sit inside the preserve-3d subtree). */
function Sq({ front }: { front?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        "ml-[0.07em] inline-block h-[0.155em] w-[0.155em] rounded-[0.045em]" +
        (front ? " sq-pulse-once" : "")
      }
      style={
        front
          ? { background: "#C6F806", boxShadow: "0 0 26px rgba(198,248,6,.65)" }
          : { background: "var(--sqc, #4c6103)" }
      }
    />
  );
}

export function Mark3D({ text = "STACK" }: { text?: string }) {
  const markRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mark.style.transform = `rotateX(${BASE_X}deg) rotateY(${BASE_Y}deg)`;
    if (reduced) return;

    let tX = BASE_X,
      tY = BASE_Y,
      rX = BASE_X,
      rY = BASE_Y;
    let raf = 0;
    const loop = () => {
      rX += (tX - rX) * 0.09;
      rY += (tY - rY) * 0.09;
      mark.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
      raf = requestAnimationFrame(loop);
    };
    // The tilt zone is the wrapper's nearest positioned section — the whole
    // landing screen feels responsive, not just the mark's own box.
    const zone = zoneRef.current?.closest("main") ?? zoneRef.current;
    const onMove = (e: PointerEvent) => {
      if (!zone) return;
      const r = (zone as HTMLElement).getBoundingClientRect();
      tY = BASE_Y + ((e.clientX - r.left) / r.width - 0.5) * 18;
      tX = BASE_X - ((e.clientY - r.top) / r.height - 0.5) * 14;
    };
    const onLeave = () => {
      tX = BASE_X;
      tY = BASE_Y;
    };
    zone?.addEventListener("pointermove", onMove as EventListener);
    zone?.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      zone?.removeEventListener("pointermove", onMove as EventListener);
      zone?.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={zoneRef}
      className="flex h-[280px] items-center justify-center"
      style={{ perspective: "800px" }}
    >
      <div
        ref={markRef}
        className="type-display relative whitespace-nowrap text-[54px] leading-none tracking-[-0.03em]"
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: `rotateX(${BASE_X}deg) rotateY(${BASE_Y}deg)`,
        }}
      >
        <span className="relative z-[2] text-text">
          {text}
          <Sq front />
        </span>
        {Array.from({ length: LAYERS }, (_, idx) => {
          const i = idx + 1;
          return (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute inset-0 select-none"
              style={depthLayerStyle(i)}
            >
              {text}
              <Sq />
            </span>
          );
        })}
      </div>
    </div>
  );
}
