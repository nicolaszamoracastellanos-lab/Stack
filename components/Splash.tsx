"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { useLanguage } from "@/lib/language-context";

/**
 * Launch splash — the first thing a user sees when Stack opens.
 *
 * Near-black full screen, the wordmark centered with "Show up. Every day."
 * (bilingual, reuses the `landing_tagline` key) directly below. A fast, clean
 * entrance: the wordmark fades and rises a few pixels (~400ms), the tagline
 * follows ~150ms later. Nothing bouncy. After a short, deliberate beat (~1.4s)
 * the whole thing fades into the app. See STACK_BRANDING.md §5.
 *
 * It lives in the root layout, which PERSISTS across in-app (client-side)
 * navigation — so it plays once per launch and never reappears as a per-page
 * loader. Initial render is invisible (opacity 0): no JS / pre-hydration means
 * no splash and, since the page background is already #0A0A0B, no white flash.
 */
const ENTER_MS = 400;
const HOLD_MS = 1400; // deliberate beat before the app takes over
const EXIT_MS = 400;

export function Splash() {
  const { t } = useLanguage();
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Trigger the entrance on the next frame so the transition runs from the
    // initial hidden state.
    const enterRaf = requestAnimationFrame(() => setEntered(true));
    const leaveTimer = setTimeout(() => setLeaving(true), ENTER_MS + HOLD_MS);
    const doneTimer = setTimeout(
      () => setDone(true),
      ENTER_MS + HOLD_MS + EXIT_MS,
    );
    return () => {
      cancelAnimationFrame(enterRaf);
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (done) return null;

  return (
    <div
      // Above all app chrome (the fixed nav uses far lower z-indexes).
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-opacity duration-[400ms] ease-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      // The splash is decorative; keep it out of the a11y tree so screen
      // readers go straight to the app.
      aria-hidden
    >
      <Wordmark
        size="lg"
        style={{ fontSize: "clamp(3.25rem, 13vw, 4.5rem)" }}
        className={`transition-all duration-[400ms] ease-out motion-reduce:transition-opacity motion-reduce:duration-300 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      />
      <p
        className={`mt-5 text-h2 font-semibold tracking-tight text-text-muted transition-all duration-[400ms] ease-out [transition-delay:150ms] motion-reduce:transition-opacity motion-reduce:duration-300 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {t("landing_tagline")}
      </p>
    </div>
  );
}
