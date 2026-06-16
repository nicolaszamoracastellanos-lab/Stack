// Generates every raster icon asset from the two source SVGs
// (public/favicon.svg and public/icon-maskable.svg). Run after changing either
// source: `node scripts/generate-icons.mjs`. The PNGs/ICO are committed to
// /public; @resvg/resvg-js is a devDependency used only here.
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const OUT = "public";

function rasterize(svgPath, size) {
  const svg = readFileSync(svgPath, "utf8");
  const r = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  });
  return r.render().asPng();
}

// Minimal ICO writer: wraps PNG images (PNG-in-ICO, supported by every modern
// browser) into a single .ico. Each entry's width/height byte is the pixel
// size (0 == 256).
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4); // image count

  const entries = [];
  const datas = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // size of image data
    entry.writeUInt32LE(offset, 12); // offset of image data
    entries.push(entry);
    datas.push(png);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...datas]);
}

const FAVICON = `${OUT}/favicon.svg`;
const MASKABLE = `${OUT}/icon-maskable.svg`;

// PWA standard icons + apple touch icon, all from the rounded master.
const targets = [
  { file: "icon-192.png", src: FAVICON, size: 192 },
  { file: "icon-512.png", src: FAVICON, size: 512 },
  { file: "apple-touch-icon.png", src: FAVICON, size: 180 },
  // Maskable: full-bleed background, the platform supplies the mask shape.
  { file: "icon-maskable-512.png", src: MASKABLE, size: 512 },
];

for (const { file, src, size } of targets) {
  const png = rasterize(src, size);
  writeFileSync(`${OUT}/${file}`, png);
  console.log(`  ${file.padEnd(24)} ${size}px  ${(png.length / 1024).toFixed(1)}kb`);
}

// favicon.ico — multi-size (16/32/48) for crisp browser tabs at any DPI.
const ico = buildIco([16, 32, 48].map((size) => ({ size, png: rasterize(FAVICON, size) })));
writeFileSync(`${OUT}/favicon.ico`, ico);
console.log(`  favicon.ico              16/32/48  ${(ico.length / 1024).toFixed(1)}kb`);

// --- Wordmark export (fixed asset for README / social cards) ----------------
// The live <Wordmark> component is primary; this is the same lockup frozen as a
// file. The volt square is placed from a measured "Stack" width so it matches
// the component's baseline placement. Geist (800) must be present to re-render
// the SVG; the PNG is self-contained.
const SANS = "node_modules/geist/dist/fonts/geist-sans";
const wordmarkFonts = [`${SANS}/Geist-Bold.ttf`, `${SANS}/Geist-Black.ttf`];

function measureWidth(svg) {
  return new Resvg(svg, {
    font: { fontFiles: wordmarkFonts, loadSystemFonts: false, defaultFontFamily: "Geist" },
  }).getBBox().width;
}

const FS = 160;
const pad = FS * 0.5;
const baseline = pad + FS * 0.78;
const textW = measureWidth(
  `<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="${FS}" font-family="Geist" font-weight="800" font-size="${FS}" letter-spacing="${-0.02 * FS}">Stack</text></svg>`,
);
const sq = 0.16 * FS;
const gap = 0.04 * FS;
const lockupW = textW + gap + sq;
const W = Math.ceil(lockupW + pad * 2);
const H = Math.ceil(FS + pad * 2);

const wordmarkSvg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stack">
  <text x="${pad}" y="${baseline}" font-family="Geist, system-ui, sans-serif" font-weight="800" font-size="${FS}" letter-spacing="${-0.02 * FS}" fill="#FAFAFA">Stack</text>
  <rect x="${pad + textW + gap}" y="${baseline - sq}" width="${sq}" height="${sq}" rx="${0.18 * sq}" fill="#C6F806"/>
</svg>
`;
writeFileSync(`${OUT}/wordmark.svg`, wordmarkSvg);

const wordmarkPng = new Resvg(wordmarkSvg, {
  fitTo: { mode: "width", value: W * 2 },
  background: "#0A0A0B",
  font: { fontFiles: wordmarkFonts, loadSystemFonts: false, defaultFontFamily: "Geist" },
}).render().asPng();
writeFileSync(`${OUT}/wordmark.png`, wordmarkPng);
console.log(`  wordmark.svg/.png        ${W}x${H}  (measured "Stack" ${textW.toFixed(0)}px)`);

console.log("done.");
