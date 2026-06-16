import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Splash } from "@/components/Splash";

// Geist for UI text, Geist Mono for numbers / streaks / timestamps.
//
// NOTE on the spec: it asked for `next/font/google`, but Geist was only added
// to next/font/google in Next 15. On Next 14 the canonical way to use Geist is
// Vercel's official `geist` package, which itself loads the fonts via next/font
// (local) and exposes the same CSS-variable pattern. Same typeface, same
// mechanism, just the supported import path for this Next version.
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Stack — Show up. Every day.",
  description:
    "A private accountability app for small crews. Check in with a photo, build the streak, never break it alone.",
  // PWA manifest (name, icons, standalone display, dark launch colors).
  manifest: "/manifest.json",
  // The "summit stack" mark, generated from public/favicon.svg by
  // scripts/generate-icons.mjs. The SVG favicon is primary; the .ico is the
  // legacy fallback for browsers that don't take SVG favicons.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Add-to-Home-Screen on iOS launches Stack full-screen with no browser
  // chrome — the real phone-first experience (and it fixes the toolbar
  // overlapping the bottom nav). A black status bar matches the dark theme and
  // the splash with no light band.
  appleWebApp: {
    capable: true,
    title: "Stack",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  // Let content extend into the safe areas so env(safe-area-inset-*) works.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-bg text-text">
        <LanguageProvider>
          <Splash />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
