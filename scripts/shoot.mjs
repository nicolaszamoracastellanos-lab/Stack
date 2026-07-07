// Screenshot harness for the v3 redesign. Reused for before/after captures and
// the integration loops. Not shipped to prod — dev tooling only.
//
// Usage: node scripts/shoot.mjs <outdir> [--checkin] [--lang=es] [--width=390]
import { chromium, devices } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SHOOT_BASE ?? "http://localhost:3000";
const EMAIL = "nicolaszamoracastellanos+v3tester@gmail.com";
const PASSWORD = "V3preview!2026";
const GROUP_ID = "df18e012-fa7c-480c-a495-0e9c1546885e";
const outdir = process.argv[2] ?? "screenshots/before";
const doCheckin = process.argv.includes("--checkin");
const lang = (process.argv.find((a) => a.startsWith("--lang=")) ?? "--lang=en").slice(7);
const width = Number((process.argv.find((a) => a.startsWith("--width=")) ?? "--width=390").slice(8));

fs.mkdirSync(outdir, { recursive: true });

const consoleErrors = [];
function watch(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${tag}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${tag}] PAGEERROR ${e.message}`));
}

async function shot(page, name, { settle = 1400 } = {}) {
  await page.waitForTimeout(settle); // let entrance animations finish
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  await page.screenshot({ path: path.join(outdir, `${name}.png`) });
  const note = overflow > 0 ? `  !! H-OVERFLOW ${overflow}px` : "";
  console.log(`shot ${name}${note}`);
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 13"].userAgent,
  });
  // set language before any page script runs
  await ctx.addInitScript((l) => {
    window.localStorage.setItem("stack.lang", l);
  }, lang);
  const page = await ctx.newPage();
  watch(page, "public");

  const sfx = lang === "es" ? "-es" : "";

  // ---------- public routes ----------
  for (const [name, url] of [
    ["landing", "/"],
    ["login", "/login"],
    ["signup", "/signup"],
    ["forgot-password", "/forgot-password"],
    ["install", "/install"],
    ["join", "/join/V3PREVIEW"],
  ]) {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await shot(page, name + sfx);
  }

  // ---------- login ----------
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 20000 });

  // ---------- authed routes ----------
  for (const [name, url] of [
    ["home", "/home"],
    ["activity", "/activity"],
    ["groups", "/groups"],
    ["groups-new", "/groups/new"],
    ["group-detail", `/groups/${GROUP_ID}`],
    ["group-pact", `/groups/${GROUP_ID}/pact`],
    ["notifications", "/notifications"],
    ["profile", "/profile"],
    ["profile-edit", "/profile/edit"],
    ["settings-notifications", "/settings/notifications"],
    ["tiers", "/tiers"],
    ["checkin-step1", "/checkin"],
  ]) {
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await shot(page, name + sfx);
  }

  // ---------- full check-in flow ----------
  if (doCheckin) {
    await page.goto(BASE + "/checkin", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // details: group chip should be preselected or tap it; sport/env/goal chips
    // click a chip only if it isn't already selected (volt = active)
    const clickChip = async (label) => {
      const el = page.locator(`button:has-text("${label}")`).first();
      if ((await el.count()) === 0) return;
      const cls = (await el.getAttribute("class")) ?? "";
      if (!cls.includes("volt")) await el.click();
    };
    await clickChip("Ctoma");
    await clickChip(lang === "es" ? "Ciclismo indoor" : "Indoor cycling");
    await page
      .locator("button", { hasText: lang === "es" ? /^Interior$/ : /^Indoor$/ })
      .first()
      .click()
      .catch(() => {});
    await clickChip(lang === "es" ? "Mejorar fuerza" : "Improve strength");
    await shot(page, "checkin-details-filled" + sfx, { settle: 400 });
    await page.click(`button:has-text("${lang === "es" ? "Siguiente" : "Next"}")`);
    await page.waitForTimeout(600);
    // photo: feed the file input directly
    await page.setInputFiles('input[type="file"]', "public/wordmark.png");
    await page.waitForTimeout(1200);
    await shot(page, "checkin-cropper" + sfx, { settle: 400 });
    await page.click(`button:has-text("${lang === "es" ? "Usar foto" : "Use photo"}")`);
    await page.waitForTimeout(1500);
    await shot(page, "checkin-photo" + sfx, { settle: 400 });
    await page.click(`button:has-text("${lang === "es" ? "Siguiente" : "Next"}")`);
    await page.waitForTimeout(1200);
    await shot(page, "checkin-review" + sfx);
    await page.click(`button:has-text("${lang === "es" ? "Stackear" : "Stack it"}")`);
    // celebration screen (v3) or home redirect (v2)
    await page.waitForTimeout(4000);
    await shot(page, "checkin-after-post" + sfx);
    await page.goto(BASE + "/home", { waitUntil: "networkidle" });
    await shot(page, "home-after-checkin" + sfx);
  }

  if (consoleErrors.length) {
    console.log("\nCONSOLE ERRORS:");
    for (const e of consoleErrors) console.log("  " + e);
  } else {
    console.log("\nno console errors");
  }
  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
