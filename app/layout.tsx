import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";

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
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-bg text-text">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
