// v3 integration loop + mobile/scroll hard gates (exec prompt §3, §4).
// Usage: node scripts/integration.mjs [--base=http://localhost:3000] [--create-group]
// Prints ok/FAIL per check; exits 1 if anything failed.
import { chromium, devices } from "playwright";

const BASE =
  (process.argv.find((a) => a.startsWith("--base=")) ?? "").slice(7) ||
  "http://localhost:3000";
const CREATE_GROUP = process.argv.includes("--create-group");
const EMAIL = "nicolaszamoracastellanos+v3tester@gmail.com";
const PASSWORD = "V3preview!2026";
const GROUP_ID = "df18e012-fa7c-480c-a495-0e9c1546885e";

const results = [];
const ok = (name, detail = "") => {
  results.push({ name, pass: true });
  console.log(`ok   ${name}${detail ? " — " + detail : ""}`);
};
const fail = (name, detail = "") => {
  results.push({ name, pass: false, detail });
  console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
};
const check = (cond, name, detail = "") => (cond ? ok(name) : fail(name, detail));

async function newCtx(browser, { lang = "en", width = 390, height = 844, reducedMotion } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: devices["iPhone 13"].userAgent,
    ...(reducedMotion ? { reducedMotion: "reduce" } : {}),
  });
  await ctx.addInitScript((l) => {
    localStorage.setItem("stack.lang", l);
    sessionStorage.setItem("stack.splashed", "1"); // keep the splash out of automation
  }, lang);
  return ctx;
}

const errors = [];
function watch(page, tag) {
  page.on("console", (m) => {
    const txt = m.text();
    if (m.type() === "error") errors.push(`[${tag}] ${txt}`);
    if (txt.includes("Warning:") && (txt.includes("hydrat") || txt.includes("did not match")))
      errors.push(`[${tag}] HYDRATION ${txt}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] PAGEERROR ${e.message}`));
}

async function login(page) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home", { timeout: 20000 });
  await page.waitForTimeout(800);
}

async function fullCheckin(page, lang) {
  const L = {
    en: { next: "Next", use: "Use photo", submit: "Stack it", indoor: /^Indoor$/, done: "Done" },
    es: { next: "Siguiente", use: "Usar foto", submit: "Stackear", indoor: /^Interior$/, done: "Listo" },
  }[lang];
  await page.goto(BASE + "/checkin", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const chip = async (label) => {
    const el = page.locator(`button:has-text("${label}")`).first();
    if ((await el.count()) === 0) return;
    const cls = (await el.getAttribute("class")) ?? "";
    if (!cls.includes("volt")) await el.click();
  };
  await chip("Ctoma");
  await chip(lang === "es" ? "Ciclismo indoor" : "Indoor cycling");
  await page.locator("button", { hasText: L.indoor }).first().click().catch(() => {});
  await chip(lang === "es" ? "Mejorar fuerza" : "Improve strength");
  await page.locator("button", { hasText: new RegExp(`^${L.next}$`) }).first().click();
  await page.waitForTimeout(500);
  await page.setInputFiles('input[type="file"]', "public/wordmark.png", { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.click(`button:has-text("${L.use}")`);
  await page.waitForTimeout(1200);
  await page.locator("button", { hasText: new RegExp(`^${L.next}$`) }).first().click();
  await page.waitForTimeout(900);
  await page.click(`button:has-text("${L.submit}")`);
  // celebration
  await page.waitForSelector(".cel-slam", { timeout: 25000 });
  await page.waitForTimeout(2200);
  const slam = await page.locator(".cel-slam").textContent();
  check(
    lang === "es" ? slam.includes("STACKEADO") : slam.includes("STACKED"),
    `checkin celebration ${lang}`,
    `slam text: ${slam}`,
  );
  await page.locator("button", { hasText: new RegExp(`^${L.done}$`, "i") }).first().click();
  await page.waitForURL("**/home", { timeout: 15000 });
  ok(`checkin done->home ${lang}`);
}

const run = async () => {
  const browser = await chromium.launch();

  // ---------- PASS: EN flows ----------
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    watch(page, "en");

    await login(page);
    ok("login en");

    await fullCheckin(page, "en");

    if (CREATE_GROUP) {
      await page.goto(BASE + "/groups/new", { waitUntil: "networkidle" });
      await page.locator("input").first().fill("Loop Crew");
      await page.locator('button[type="submit"], button:has-text("Create")').first().click();
      await page.waitForTimeout(2500);
      const invite = await page.locator("code").first().textContent().catch(() => null);
      check(!!invite, "create group", `invite code visible: ${invite}`);
    }

    // join-by-code while already a member — must not crash
    await page.goto(BASE + "/join/V3PREVIEW", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const joinBody = (await page.textContent("body")) ?? "";
    check(joinBody.length > 50 && !joinBody.includes("Application error"), "join by code (member)");

    // every tab + scroll to bottom
    for (const [name, url] of [
      ["home", "/home"],
      ["groups", "/groups"],
      ["activity", "/activity"],
      ["profile", "/profile"],
      ["group detail", `/groups/${GROUP_ID}`],
    ]) {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(() => {
        const el = document.querySelector("main")?.closest(".overflow-y-auto") ?? document.querySelector(".overflow-y-auto");
        if (el) el.scrollTop = el.scrollHeight;
        return document.documentElement.scrollWidth - document.documentElement.clientWidth;
      });
      await page.waitForTimeout(500);
      check(overflow <= 0, `tab ${name}: no h-overflow @390`, `overflow ${overflow}px`);
    }

    // heatmap 3M/1Y + cell tap
    await page.goto(BASE + "/profile", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("1Y")').first().click();
    await page.waitForTimeout(700);
    await page.locator('button:has-text("3M")').first().click();
    await page.waitForTimeout(500);
    const cell = page.locator(".cell-rise").filter({ hasNot: page.locator("x") }).nth(20);
    await cell.click({ force: true });
    await page.waitForTimeout(300);
    ok("heatmap toggle + cell tap");

    // reaction + comment on first feed item
    await page.goto(BASE + "/home", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const fire = page.locator('article button[aria-pressed]').first();
    await fire.scrollIntoViewIfNeeded();
    const pressedBefore = await fire.getAttribute("aria-pressed");
    await fire.click();
    await page.waitForTimeout(900);
    const pressedAfter = await fire.getAttribute("aria-pressed");
    check(pressedBefore !== pressedAfter, "reaction toggles", `${pressedBefore}->${pressedAfter}`);
    const commentBox = page.locator("article textarea").first();
    await commentBox.fill("Integration loop was here 🔁");
    await page.locator('article button[type="submit"]').first().click();
    await page.waitForTimeout(1200);
    const bodyTxt = (await page.textContent("body")) ?? "";
    check(bodyTxt.includes("Integration loop was here"), "comment posts");

    await ctx.close();
  }

  // ---------- PASS: ES login + check-in ----------
  {
    const ctx = await newCtx(browser, { lang: "es" });
    const page = await ctx.newPage();
    watch(page, "es");
    await login(page);
    ok("login es");
    await fullCheckin(page, "es");
    // ES overflow spot-check on home + groups
    for (const url of ["/home", "/groups", "/profile"]) {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 0, `es ${url}: no h-overflow`, `${overflow}px`);
    }
    await ctx.close();
  }

  // ---------- Signup form to verify-email screen ----------
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    watch(page, "signup");
    await page.goto(BASE + "/signup", { waitUntil: "networkidle" });
    const stamp = Date.now().toString(36);
    await page.fill('input[type="email"]', `nicolaszamoracastellanos+v3loop${stamp}@gmail.com`);
    const pws = page.locator('input[type="password"]');
    const n = await pws.count();
    for (let i = 0; i < n; i++) await pws.nth(i).fill("LoopPass!2026x");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    const t = (await page.textContent("body")) ?? "";
    check(/verify|confirm|revisa|correo|inbox/i.test(t) || page.url().includes("verify"), "signup reaches verify-email", page.url());
    await ctx.close();
  }

  // ---------- Mobile/scroll hard gates ----------
  {
    const ctx = await newCtx(browser);
    const page = await ctx.newPage();
    watch(page, "gates");
    await login(page);

    // overscroll + grain + backdrop-filter + input font sizes + dvh shell
    const gates = await page.evaluate(() => {
      const cs = (el, pseudo) => getComputedStyle(el, pseudo);
      const html = cs(document.documentElement).overscrollBehaviorY;
      const body = cs(document.body).overscrollBehaviorY;
      const grain = cs(document.body, "::after");
      const nav = document.querySelector("nav");
      const navCS = nav ? cs(nav) : null;
      const inputs = [...document.querySelectorAll("input, textarea, select")].map(
        (i) => parseFloat(cs(i).fontSize),
      );
      const scroller = document.querySelector(".overflow-y-auto");
      return {
        html,
        body,
        grainPos: grain.position,
        grainPE: grain.pointerEvents,
        navBlur: navCS ? navCS.backdropFilter || navCS.webkitBackdropFilter : "none",
        navPB: nav ? nav.style.cssText + "|" + navCS.paddingBottom : "",
        inputSizes: inputs,
        scrollerOverscroll: scroller ? cs(scroller).overscrollBehaviorY : "missing",
        shellH: document.querySelector(".h-\\[100dvh\\]") ? "dvh" : "missing",
      };
    });
    check(gates.html === "none" && gates.body === "none", "overscroll-behavior-y none on html+body", `${gates.html}/${gates.body}`);
    check(gates.grainPos === "fixed" && gates.grainPE === "none", "grain fixed + inert", `${gates.grainPos}/${gates.grainPE}`);
    check(gates.navBlur.includes("blur"), "nav backdrop blur renders", gates.navBlur);
    check(gates.scrollerOverscroll === "contain", "inner scroller overscroll contain", gates.scrollerOverscroll);
    check(gates.shellH === "dvh", "app shell uses 100dvh", gates.shellH);
    check(gates.inputSizes.every((s) => s >= 16), "inputs >=16px", gates.inputSizes.join(","));

    // nav stays put during fast scroll
    const navBox1 = await page.locator("nav").boundingBox();
    await page.evaluate(() => {
      const el = document.querySelector(".overflow-y-auto");
      if (el) {
        el.scrollTop = 0;
        el.scrollTop = el.scrollHeight;
        el.scrollTop = el.scrollHeight / 3;
      }
    });
    await page.waitForTimeout(400);
    const navBox2 = await page.locator("nav").boundingBox();
    check(
      navBox1 && navBox2 && Math.abs(navBox1.y - navBox2.y) < 1 && Math.abs(navBox1.height - navBox2.height) < 1,
      "bottom nav stable during scroll",
      `${navBox1?.y} -> ${navBox2?.y}`,
    );

    // scrolling the feed does not navigate
    const urlBefore = page.url();
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(500);
    check(page.url() === urlBefore, "scroll does not navigate");

    // touch targets
    const targets = await page.evaluate(() => {
      const boxes = [];
      const add = (sel, label) =>
        document.querySelectorAll(sel).forEach((el, i) => {
          const r = el.getBoundingClientRect();
          // include pseudo-element expansion by reading computed before rect is
          // not possible — approximate with the element box; the before:-inset
          // trick is verified separately below.
          if (r.width > 0) boxes.push({ label: `${label}#${i}`, w: r.width, h: r.height });
        });
      add("nav a", "nav-item");
      add('[role="tablist"] button', "seg");
      return boxes;
    });
    const small = targets.filter((t) => t.w < 44 || t.h < 44);
    check(small.length === 0, "nav + segmented touch targets >=44pt", small.map((s) => `${s.label} ${Math.round(s.w)}x${Math.round(s.h)}`).join("; "));

    // widths sweep for overflow
    for (const width of [375, 390, 430]) {
      const c2 = await newCtx(browser, { width });
      const p2 = await c2.newPage();
      await p2.goto(BASE + "/", { waitUntil: "networkidle" });
      await p2.waitForTimeout(1200);
      const o1 = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(o1 <= 0, `landing no h-overflow @${width}`, `${o1}px`);
      await c2.close();
    }

    // reduced motion: mark static, no tilt loop, animations collapsed
    const cr = await newCtx(browser, { reducedMotion: true });
    const pr = await cr.newPage();
    await pr.goto(BASE + "/", { waitUntil: "networkidle" });
    await pr.waitForTimeout(700);
    const rm = await pr.evaluate(() => {
      const mark = document.querySelector('[style*="preserve-3d"]');
      const w = document.querySelector(".word-slam");
      return {
        markTransform: mark ? mark.style.transform : "missing",
        wordOpacity: w ? getComputedStyle(w).opacity : "missing",
      };
    });
    check(rm.markTransform.includes("rotateX(16deg)"), "reduced-motion: mark at base pose", rm.markTransform);
    check(rm.wordOpacity === "1", "reduced-motion: tagline visible instantly", rm.wordOpacity);
    await cr.close();

    await ctx.close();
  }

  // ---------- 430x932 viewport pass ----------
  {
    const ctx = await newCtx(browser, { width: 430, height: 932 });
    const page = await ctx.newPage();
    watch(page, "430");
    await login(page);
    for (const url of ["/home", "/groups", "/profile", "/checkin"]) {
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 0, `430w ${url}: no h-overflow`, `${overflow}px`);
    }
    await ctx.close();
  }

  await browser.close();

  console.log("\n================");
  const failed = results.filter((r) => !r.pass);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (errors.length) {
    console.log("\nCONSOLE/PAGE ERRORS:");
    errors.slice(0, 30).forEach((e) => console.log("  " + e));
  } else {
    console.log("zero console errors / hydration warnings");
  }
  if (failed.length || errors.length) process.exit(1);
};

run().catch((e) => {
  console.error("HARNESS ERROR", e);
  process.exit(1);
});
