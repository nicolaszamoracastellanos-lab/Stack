"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary — replaces the ENTIRE root layout, so no providers,
 * no language context, no Tailwind theme guarantees. Copy is shipped in both
 * languages statically and styles are inline to survive a broken CSS pipeline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          color: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            Stack<span style={{ color: "#C6F806" }}>.</span>
          </p>
          <p style={{ fontSize: 18, margin: "16px 0 4px" }}>Something broke.</p>
          <p style={{ fontSize: 14, color: "#A1A1AA", margin: 0 }}>
            Algo se rompió.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              height: 44,
              padding: "0 24px",
              borderRadius: 10,
              border: "none",
              background: "#C6F806",
              color: "#0A0A0B",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again / Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
