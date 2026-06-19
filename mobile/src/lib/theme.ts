/**
 * Stack design tokens, ported from the web app's tailwind.config.ts so the
 * native app shares one visual language. No raw hex outside this file.
 */
export const colors = {
  bg: "#0A0A0B",
  surface: "#141416",
  surface2: "#1C1C1F",
  border: "#26262A",
  borderStrong: "#3A3A40",
  text: "#FAFAFA",
  textMuted: "#A1A1AA",
  textDim: "#5C5C66",
  // The accent — streak alive, primary actions, the live signal.
  volt: "#C6F806",
  voltDim: "#9BC400",
  // Streak broken / destructive / "you missed".
  danger: "#FF4D4D",
  dangerDim: "#CC3D3D",
} as const;

export const radius = {
  card: 12,
  input: 10,
  btn: 10,
  pill: 9999,
} as const;

export const space = (n: number) => n * 4;

export const type = {
  display: { fontSize: 56, lineHeight: 58, fontWeight: "700" as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, lineHeight: 37, fontWeight: "700" as const, letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: "600" as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "500" as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "400" as const },
} as const;
