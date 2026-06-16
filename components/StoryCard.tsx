"use client";

import { forwardRef } from "react";
import type { CardTemplateKey, CardToggles } from "@/lib/card-templates";

export type StoryCardData = {
  photoUrl: string;
  sportLabel: string;
  sportIcon: string;
  envLabel: string;
  focusLabel: string;
  focusIcon: string;
  notes: string;
  streak: number;
  dateStr: string;
  streakLabel: string;
  milestoneCaption: string;
};

const VOLT = "#C6F806";
const SHADOW = "0 2px 16px rgba(0,0,0,0.55)";

/** Stack wordmark, placed consistently bottom-center on every card. */
function Brand() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 64,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "#fff",
          textShadow: SHADOW,
          lineHeight: 1,
        }}
      >
        Stack
      </span>
      <span style={{ width: 16, height: 16, borderRadius: 4, background: VOLT, marginBottom: 9 }} />
    </div>
  );
}

function Pill({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 26px",
        borderRadius: 999,
        background: accent ? "rgba(198,248,6,0.18)" : "rgba(255,255,255,0.14)",
        color: accent ? VOLT : "#fff",
        fontSize: 34,
        fontWeight: 600,
        textShadow: SHADOW,
      }}
    >
      {children}
    </span>
  );
}

function scrim(height: number, from = "rgba(0,0,0,0.88)"): React.CSSProperties {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height,
    background: `linear-gradient(to top, ${from}, transparent)`,
  };
}

/**
 * The shareable 1080x1920 story card (Batch 3 §3). Real HTML/CSS so html-to-image
 * renders crisp text + the app font. Templates differ in layout; gradient scrims
 * + text shadows keep details legible over any photo. The photo is always the
 * background; the Stack brand is always present. Element visibility follows the
 * user's toggles.
 */
export const StoryCard = forwardRef<
  HTMLDivElement,
  { template: CardTemplateKey; data: StoryCardData; toggles: CardToggles }
>(function StoryCard({ template, data, toggles }, ref) {
  const showStreak = toggles.streak && data.streak > 0;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        background: "#0A0A0B",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "#fff",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, captured to PNG */}
      <img
        src={data.photoUrl}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {template === "minimal" && (
        <>
          <div style={scrim(720)} />
          {showStreak && (
            <div style={{ position: "absolute", top: 64, right: 64 }}>
              <Pill accent>🔥 {data.streak}</Pill>
            </div>
          )}
          <div style={{ position: "absolute", left: 64, right: 64, bottom: 180, display: "flex", flexDirection: "column", gap: 14 }}>
            {toggles.sportEnv && (
              <div style={{ fontSize: 56, fontWeight: 800, textShadow: SHADOW }}>
                {data.sportIcon} {data.sportLabel}
                {data.envLabel ? ` · ${data.envLabel}` : ""}
              </div>
            )}
            {toggles.focus && (
              <div style={{ fontSize: 40, fontWeight: 600, color: VOLT, textShadow: SHADOW }}>
                {data.focusLabel}
              </div>
            )}
            {toggles.date && (
              <div style={{ fontSize: 32, color: "rgba(255,255,255,0.75)", textShadow: SHADOW }}>
                {data.dateStr}
              </div>
            )}
          </div>
          <Brand />
        </>
      )}

      {template === "bold" && (
        <>
          <div style={scrim(1000, "rgba(0,0,0,0.92)")} />
          <div style={{ position: "absolute", left: 64, right: 64, bottom: 180 }}>
            {showStreak && (
              <div style={{ marginBottom: 24 }}>
                <Pill accent>🔥 {data.streak} {data.streakLabel}</Pill>
              </div>
            )}
            {toggles.sportEnv && (
              <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", textShadow: SHADOW }}>
                {data.sportLabel}
              </div>
            )}
            {toggles.focus && (
              <div style={{ fontSize: 64, fontWeight: 700, color: VOLT, marginTop: 12, textShadow: SHADOW }}>
                {data.focusLabel}
              </div>
            )}
            <div style={{ fontSize: 34, color: "rgba(255,255,255,0.8)", marginTop: 20, textShadow: SHADOW }}>
              {toggles.sportEnv && data.envLabel ? data.envLabel : ""}
              {toggles.sportEnv && data.envLabel && toggles.date ? " · " : ""}
              {toggles.date ? data.dateStr : ""}
            </div>
          </div>
          <Brand />
        </>
      )}

      {template === "stat" && (
        <>
          <div style={scrim(1120, "rgba(0,0,0,0.9)")} />
          <div style={{ position: "absolute", left: 64, right: 64, bottom: 170, display: "flex", flexDirection: "column", gap: 26 }}>
            {showStreak && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <span style={{ fontSize: 150, fontWeight: 800, color: VOLT, lineHeight: 0.9, textShadow: SHADOW }}>
                  {data.streak}
                </span>
                <span style={{ fontSize: 40, fontWeight: 600, color: "rgba(255,255,255,0.85)", textShadow: SHADOW }}>
                  🔥 {data.streakLabel}
                </span>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {toggles.sportEnv && (
                <Pill>{data.sportIcon} {data.sportLabel}{data.envLabel ? ` · ${data.envLabel}` : ""}</Pill>
              )}
              {toggles.focus && <Pill accent>{data.focusIcon} {data.focusLabel}</Pill>}
              {toggles.date && <Pill>{data.dateStr}</Pill>}
            </div>
            {toggles.notes && data.notes && (
              <div style={{ fontSize: 38, fontWeight: 500, color: "#fff", lineHeight: 1.35, textShadow: SHADOW }}>
                “{data.notes}”
              </div>
            )}
          </div>
          <Brand />
        </>
      )}

      {template === "photo" && (
        <>
          <div style={scrim(420, "rgba(0,0,0,0.7)")} />
          {toggles.sportEnv && (
            <div style={{ position: "absolute", left: 64, right: 64, bottom: 170, fontSize: 44, fontWeight: 700, textShadow: SHADOW }}>
              {data.sportIcon} {data.sportLabel}
              {data.envLabel ? ` · ${data.envLabel}` : ""}
            </div>
          )}
          <Brand />
        </>
      )}

      {template === "milestone" && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,11,0.62)" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 64,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 360, fontWeight: 800, color: VOLT, lineHeight: 0.85, textShadow: SHADOW }}>
              {data.streak}
            </div>
            <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, textShadow: SHADOW }}>
              {data.milestoneCaption}
            </div>
            {toggles.sportEnv && (
              <div style={{ fontSize: 40, color: "rgba(255,255,255,0.85)", marginTop: 28, textShadow: SHADOW }}>
                {data.sportIcon} {data.sportLabel}
                {data.envLabel ? ` · ${data.envLabel}` : ""}
              </div>
            )}
          </div>
          <Brand />
        </>
      )}
    </div>
  );
});
