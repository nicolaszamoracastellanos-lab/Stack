import type { Language } from "@/lib/i18n";

/**
 * Minimal transactional email via Resend's REST API — no SDK dependency, just
 * fetch. Sending is BEST-EFFORT: if RESEND_API_KEY isn't configured the call is
 * a no-op that returns false, so signups still succeed and the welcome email
 * simply switches on once the key + a verified sender domain are in place.
 *
 *   RESEND_API_KEY   server-side key from resend.com
 *   EMAIL_FROM       e.g. "Stack <hello@stack-app.online>" (defaults below)
 */
const FROM = process.env.EMAIL_FROM ?? "Stack <hello@stack-app.online>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Brand palette (kept in sync with tailwind.config.ts) for the email shell.
const C = {
  bg: "#0A0A0B",
  surface: "#141416",
  border: "#26262A",
  text: "#FAFAFA",
  muted: "#A1A1AA",
  dim: "#5C5C66",
  volt: "#C6F806",
};

type Copy = {
  subject: string;
  preheader: string;
  badge: string;
  heading: string;
  intro: string;
  missionLabel: string;
  mission: string;
  howLabel: string;
  steps: string[];
  newspaper: string;
  signoff: string;
  team: string;
};

const COPY: Record<Language, Copy> = {
  en: {
    subject: "Welcome to the Stack 🏔️",
    preheader: "You're on the list. Here's what we're building together.",
    badge: "THE STACK NEWSPAPER",
    heading: "You're in.",
    intro:
      "Welcome to Stack — the place where you and your inner circle show up every day, stack workouts together, and never let each other quit.",
    missionLabel: "WHY STACK",
    mission:
      "Motivation fades. Accountability doesn't. Stack turns your training into something your crew can see — so the streak, not an algorithm, is what keeps you going. Put something on the line, make it interesting, and become the person who doesn't quit.",
    howLabel: "HOW IT WORKS RIGHT NOW",
    steps: [
      "Create a Stack and bring in your inner circle.",
      "Set the challenge — workouts per week — and put a penalty on the line for whoever loses the streak or the challenge.",
      "Check in with a photo. Your crew sees it. Your streak grows.",
      "Miss a day and everyone knows. That gentle pressure is the whole point.",
    ],
    newspaper:
      "This is the Stack newspaper. We'll only email you when there's something worth showing up for — new features, the iOS & Android launch, and stories from the crews stacking together.",
    signoff: "Now go stack one.",
    team: "Created by the Stack team.",
  },
  es: {
    subject: "Bienvenido a Stack 🏔️",
    preheader: "Ya estás en la lista. Esto es lo que construimos juntos.",
    badge: "EL PERIÓDICO DE STACK",
    heading: "Ya estás dentro.",
    intro:
      "Bienvenido a Stack — el lugar donde tú y tu círculo cercano se presentan todos los días, suman entrenamientos juntos y no se dejan rendir.",
    missionLabel: "POR QUÉ STACK",
    mission:
      "La motivación se acaba. La responsabilidad no. Stack convierte tu entrenamiento en algo que tu grupo puede ver — para que sea la racha, y no un algoritmo, lo que te mantenga. Pon algo en juego, hazlo interesante y conviértete en quien no se rinde.",
    howLabel: "CÓMO FUNCIONA HOY",
    steps: [
      "Crea un Stack y suma a tu círculo cercano.",
      "Define el reto — entrenamientos por semana — y pon un castigo en juego para quien pierda la racha o el reto.",
      "Haz check-in con una foto. Tu grupo la ve. Tu racha crece.",
      "Si fallas un día, todos se enteran. Esa presión sana es justo el punto.",
    ],
    newspaper:
      "Este es el periódico de Stack. Solo te escribiremos cuando haya algo que valga la pena — nuevas funciones, el lanzamiento en iOS y Android, e historias de los grupos que suman juntos.",
    signoff: "Ahora ve y suma uno.",
    team: "Creado por el equipo de Stack.",
  },
};

export function welcomeEmail(language?: string | null): {
  subject: string;
  html: string;
  text: string;
} {
  const lang: Language = language === "es" ? "es" : "en";
  const c = COPY[lang];

  const stepsHtml = c.steps
    .map(
      (s, i) => `
      <tr>
        <td valign="top" style="padding:0 12px 14px 0;">
          <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:${C.volt};color:${C.bg};font-weight:700;font-size:13px;">${i + 1}</span>
        </td>
        <td valign="top" style="padding:0 0 14px 0;color:${C.text};font-size:15px;line-height:1.5;">${s}</td>
      </tr>`,
    )
    .join("");

  const stepsText = c.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const html = `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${c.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.bg};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${c.preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px 8px 28px;">
                <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${C.text};">
                  Stack<span style="color:${C.volt};">.</span>
                </div>
                <div style="margin-top:18px;font-size:11px;letter-spacing:0.14em;color:${C.volt};font-weight:700;">${c.badge}</div>
                <h1 style="margin:8px 0 0 0;font-size:28px;line-height:1.15;color:${C.text};font-weight:800;">${c.heading}</h1>
                <p style="margin:14px 0 0 0;font-size:15px;line-height:1.6;color:${C.muted};">${c.intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <div style="font-size:11px;letter-spacing:0.12em;color:${C.dim};font-weight:700;">${c.missionLabel}</div>
                <p style="margin:8px 0 0 0;font-size:15px;line-height:1.6;color:${C.text};">${c.mission}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0 28px;">
                <div style="font-size:11px;letter-spacing:0.12em;color:${C.dim};font-weight:700;padding-bottom:14px;">${c.howLabel}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${stepsHtml}</table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <div style="border-top:1px solid ${C.border};padding-top:20px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:${C.muted};">${c.newspaper}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 32px 28px;">
                <p style="margin:0;font-size:16px;font-weight:700;color:${C.volt};">${c.signoff}</p>
                <p style="margin:18px 0 0 0;font-size:12px;color:${C.dim};">${c.team}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${c.heading}

${c.intro}

${c.missionLabel}
${c.mission}

${c.howLabel}
${stepsText}

${c.newspaper}

${c.signoff}
— ${c.team}`;

  return { subject: c.subject, html, text };
}
