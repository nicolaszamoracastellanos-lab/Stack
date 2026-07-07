import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Splash } from "@/components/Splash";

// v3: one variable typeface for everything. Archivo carries four roles via
// axes — Display (wdth 125 / wght 900 / uppercase), Numeral (wdth 115–120 /
// tabular), Body (wght 500–600) and Micro-label (wght 700 tracking .2em+).
// The `wdth` axis MUST be loaded or `font-stretch` silently renders normal
// width and the whole display language collapses. Geist is retired for UI;
// wordmark image assets (Geist-based) stay untouched.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stack · Show up. Every day.",
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
    <html lang="en" className={archivo.variable}>
      <body className="min-h-dvh bg-bg text-text">
        <LanguageProvider>
          <Splash />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
