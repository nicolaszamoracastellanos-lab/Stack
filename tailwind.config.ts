import type { Config } from "tailwindcss";

/**
 * Stack design tokens.
 *
 * Every color, type size, radius and animation in the app pulls from here.
 * No hardcoded hex values are allowed inside components — if you reach for a
 * raw color, add a token instead. The accent `volt` is the soul of the brand;
 * use it sparingly. When a streak breaks or is at risk, the UI flips to
 * `danger`. That single color swap carries the emotional story of the app.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — dark, near black, structured by hairline borders.
        bg: "#0A0A0B",
        surface: {
          DEFAULT: "#141416",
          2: "#1C1C1F",
        },
        border: {
          DEFAULT: "#26262A",
          strong: "#3A3A40",
        },
        // Text hierarchy.
        text: {
          DEFAULT: "#FAFAFA",
          muted: "#A1A1AA",
          dim: "#5C5C66",
        },
        // The accent. Streak alive, primary actions, the live signal.
        volt: {
          DEFAULT: "#C6F806",
          dim: "#9BC400",
        },
        // Streak broken, destructive actions, the "you missed" state.
        danger: {
          DEFAULT: "#FF4D4D",
          dim: "#CC3D3D",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      // Type scale from the spec. Each entry carries its own line-height,
      // tracking and weight so a single utility class sets the whole style.
      fontSize: {
        display: ["64px", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        card: "12px",
        input: "10px",
        btn: "10px",
        pill: "9999px",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      keyframes: {
        // New feed items slide in from the top with a quick fade.
        "slide-fade-in": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Subtle pulse used by the live signal dot.
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "slide-fade-in": "slide-fade-in 200ms ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
