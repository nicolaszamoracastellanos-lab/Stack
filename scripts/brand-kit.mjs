// Builds a self-contained brand-assets/ folder for press / video (Higgs Field).
// Copies the committed icons + wordmarks and renders high-res exports from the
// source SVGs. Run: node scripts/brand-kit.mjs
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const PUB = "public";
const OUT = "brand-assets";
mkdirSync(`${OUT}/icon`, { recursive: true });
mkdirSync(`${OUT}/wordmark`, { recursive: true });

const BG = "#0A0A0B"; // brand background (near-black)
const SANS = "node_modules/geist/dist/fonts/geist-sans";
const fonts = [`${SANS}/Geist-Bold.ttf`, `${SANS}/Geist-Black.ttf`];

function png(svgPath, { size, background = "transparent", useFonts = false }) {
  const svg = readFileSync(svgPath, "utf8");
  return new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background,
    ...(useFonts
      ? { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: "Geist" } }
      : {}),
  })
    .render()
    .asPng();
}

// --- App icon (the rounded "summit / stack" mark) -------------------------
for (const [name, opts] of [
  ["icon-1024-transparent.png", { size: 1024 }],
  ["icon-1024-on-dark.png", { size: 1024, background: BG }],
  ["icon-2048-transparent.png", { size: 2048 }],
  ["icon-maskable-1024.png", { size: 1024 }],
]) {
  const src = name.includes("maskable") ? `${PUB}/icon-maskable.svg` : `${PUB}/favicon.svg`;
  writeFileSync(`${OUT}/icon/${name}`, png(src, opts));
}

// --- Wordmark ("Stack" + volt square) -------------------------------------
for (const [name, opts] of [
  ["wordmark-1600-transparent.png", { size: 1600, useFonts: true }],
  ["wordmark-1600-on-dark.png", { size: 1600, background: BG, useFonts: true }],
  ["wordmark-3200-transparent.png", { size: 3200, useFonts: true }],
]) {
  writeFileSync(`${OUT}/wordmark/${name}`, png(`${PUB}/wordmark.svg`, opts));
}

// --- Copy the committed source/raster assets in ---------------------------
const copies = [
  ["favicon.svg", "icon/icon-source.svg"],
  ["icon-maskable.svg", "icon/icon-maskable-source.svg"],
  ["icon-192.png", "icon/icon-192.png"],
  ["icon-512.png", "icon/icon-512.png"],
  ["icon-maskable-512.png", "icon/icon-maskable-512.png"],
  ["apple-touch-icon.png", "icon/apple-touch-icon-180.png"],
  ["favicon.ico", "icon/favicon.ico"],
  ["wordmark.svg", "wordmark/wordmark-source.svg"],
  ["wordmark.png", "wordmark/wordmark-on-dark.png"],
  ["wordmark-watermark.png", "wordmark/wordmark-watermark-transparent.png"],
];
for (const [from, to] of copies) copyFileSync(`${PUB}/${from}`, `${OUT}/${to}`);

console.log("brand-assets/ built.");
