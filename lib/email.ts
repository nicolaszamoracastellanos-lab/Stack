import type { Language } from "@/lib/i18n";

/**
 * Minimal transactional email via Resend's REST API — no SDK dependency, just
 * fetch. Sending is BEST-EFFORT: if RESEND_API_KEY isn't configured the call is
 * a no-op that returns false, so signups still succeed and emails simply switch
 * on once the key + a verified sender domain are in place.
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

/** Dark, volt-accented card wrapping any email body. */
function shell(lang: Language, preheader: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:${C.bg};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${C.surface};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px 8px 28px;">
                <div style="font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${C.text};">
                  Stack<span style="color:${C.volt};">.</span>
                </div>
              </td>
            </tr>
            ${inner}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function label(text: string): string {
  return `<div style="font-size:11px;letter-spacing:0.12em;color:${C.dim};font-weight:700;">${text}</div>`;
}

function stepsHtml(items: string[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${items
    .map(
      (s, i) => `
      <tr>
        <td valign="top" style="padding:0 12px 14px 0;">
          <span style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:${C.volt};color:${C.bg};font-weight:700;font-size:13px;">${i + 1}</span>
        </td>
        <td valign="top" style="padding:0 0 14px 0;color:${C.text};font-size:15px;line-height:1.5;">${s}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

// ---------------------------------------------------------------------------
// Waitlist welcome (public landing signup)
// ---------------------------------------------------------------------------

type WaitlistCopy = {
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

const WAITLIST: Record<Language, WaitlistCopy> = {
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
  const c = WAITLIST[lang];

  const inner = `
    <tr>
      <td style="padding:18px 28px 0 28px;">
        ${label(c.badge).replace(C.dim, C.volt)}
        <h1 style="margin:8px 0 0 0;font-size:28px;line-height:1.15;color:${C.text};font-weight:800;">${c.heading}</h1>
        <p style="margin:14px 0 0 0;font-size:15px;line-height:1.6;color:${C.muted};">${c.intro}</p>
      </td>
    </tr>
    <tr><td style="padding:24px 28px 0 28px;">${label(c.missionLabel)}
      <p style="margin:8px 0 0 0;font-size:15px;line-height:1.6;color:${C.text};">${c.mission}</p></td></tr>
    <tr><td style="padding:24px 28px 0 28px;">
      <div style="padding-bottom:14px;">${label(c.howLabel)}</div>
      ${stepsHtml(c.steps)}</td></tr>
    <tr><td style="padding:8px 28px 0 28px;">
      <div style="border-top:1px solid ${C.border};padding-top:20px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:${C.muted};">${c.newspaper}</p></div></td></tr>
    <tr><td style="padding:24px 28px 32px 28px;">
      <p style="margin:0;font-size:16px;font-weight:700;color:${C.volt};">${c.signoff}</p>
      <p style="margin:18px 0 0 0;font-size:12px;color:${C.dim};">${c.team}</p></td></tr>`;

  const text = `${c.heading}

${c.intro}

${c.missionLabel}
${c.mission}

${c.howLabel}
${c.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${c.newspaper}

${c.signoff}
— ${c.team}`;

  return { subject: c.subject, html: shell(lang, c.preheader, inner), text };
}

// ---------------------------------------------------------------------------
// Onboarding welcome (sent when a new member finishes creating their profile)
// ---------------------------------------------------------------------------

type OnboardingCopy = {
  subject: string;
  preheader: string;
  badge: string;
  heading: (name: string) => string;
  intro: string;
  doLabel: string;
  features: string[];
  comingLabel: string;
  coming: string;
  founderLabel: string;
  founderNote: string;
  signature: string;
};

const QUOTE = {
  text: "Enjoy the journey, not just the destination. Life is a marathon, not a sprint.",
  author: "Phillip C. McGraw",
};

const ONBOARDING: Record<Language, OnboardingCopy> = {
  en: {
    subject: "Welcome to the Stack team 🏔️",
    preheader: "Everything you can do — plus a note from our founder.",
    badge: "WELCOME TO THE TEAM",
    heading: (name) => (name ? `Welcome, ${name}.` : "Welcome to the team."),
    intro:
      "You're officially on the Stack team — where you and your inner circle show up every day and don't let each other quit. Here's everything you can do right now:",
    doLabel: "WHAT YOU CAN DO",
    features: [
      "Create or join a Stack — your crew of people who'll notice the second you stop.",
      "Set a challenge — workouts per week — and put a penalty on the line for whoever loses the streak or the challenge.",
      "Check in with a photo on every workout. Your crew sees it, and your streak grows.",
      "React, comment, and nudge teammates who haven't shown up yet.",
      "Track everything — your streak, the group streak, the leaderboard, your stats, and your full check-in history.",
      "Talk it out in group chat and keep the energy high.",
    ],
    comingLabel: "WHAT'S NEXT",
    coming:
      "You'll be among the FIRST to know the moment Stack lands in the iOS App Store — and there's so much more on the way. Get excited. This is just the beginning, and we're glad you're here for it.",
    founderLabel: "A NOTE FROM OUR FOUNDER",
    founderNote:
      "Thank you for trusting us — it genuinely means the world to me and to the whole team. We built Stack to make showing up easier when someone's in it with you, and I truly hope it helps you reach your goals, stay consistent, and have real fun in the process. We're so glad you're here. Let's get after it, together.",
    signature: "— Nicolas Zamora C., Founder and CEO of Stack",
  },
  es: {
    subject: "Bienvenido al equipo de Stack 🏔️",
    preheader: "Todo lo que puedes hacer — y una nota de nuestro fundador.",
    badge: "BIENVENIDO AL EQUIPO",
    heading: (name) => (name ? `Bienvenido, ${name}.` : "Bienvenido al equipo."),
    intro:
      "Ya eres parte oficial del equipo de Stack — donde tú y tu círculo cercano se presentan todos los días y no se dejan rendir. Esto es todo lo que puedes hacer ahora mismo:",
    doLabel: "LO QUE PUEDES HACER",
    features: [
      "Crea o únete a un Stack — tu grupo de gente que se dará cuenta en el momento en que pares.",
      "Define un reto — entrenamientos por semana — y pon un castigo en juego para quien pierda la racha o el reto.",
      "Haz check-in con una foto en cada entrenamiento. Tu grupo la ve y tu racha crece.",
      "Reacciona, comenta y dale un empujón a los compañeros que aún no se presentan.",
      "Lleva la cuenta de todo — tu racha, la racha del grupo, la tabla de líderes, tus estadísticas y tu historial completo.",
      "Conversa en el chat del grupo y mantén la energía arriba.",
    ],
    comingLabel: "LO QUE VIENE",
    coming:
      "Serás de los PRIMEROS en enterarte en cuanto Stack llegue al App Store de iOS — y viene muchísimo más en camino. Emociónate. Esto apenas empieza, y nos alegra que estés aquí.",
    founderLabel: "UNA NOTA DE NUESTRO FUNDADOR",
    founderNote:
      "Gracias por confiar en nosotros — de verdad significa muchísimo para mí y para todo el equipo. Creamos Stack para que presentarse sea más fácil cuando alguien lo vive contigo, y espero de corazón que te ayude a alcanzar tus metas, mantener la constancia y divertirte de verdad en el proceso. Nos alegra mucho tenerte aquí. Vamos con todo, juntos.",
    signature: "— Nicolas Zamora C., Fundador y CEO de Stack",
  },
};

export function onboardingEmail(
  language?: string | null,
  name?: string | null,
): { subject: string; html: string; text: string } {
  const lang: Language = language === "es" ? "es" : "en";
  const c = ONBOARDING[lang];
  const cleanName = (name ?? "").trim().split(/\s+/)[0] ?? "";

  const inner = `
    <tr>
      <td style="padding:18px 28px 0 28px;">
        ${label(c.badge).replace(C.dim, C.volt)}
        <h1 style="margin:8px 0 0 0;font-size:28px;line-height:1.15;color:${C.text};font-weight:800;">${c.heading(cleanName)}</h1>
        <p style="margin:14px 0 0 0;font-size:15px;line-height:1.6;color:${C.muted};">${c.intro}</p>
      </td>
    </tr>
    <tr><td style="padding:24px 28px 0 28px;">
      <div style="padding-bottom:14px;">${label(c.doLabel)}</div>
      ${stepsHtml(c.features)}</td></tr>
    <tr><td style="padding:16px 28px 0 28px;">
      <div style="border:1px solid ${C.volt};border-radius:12px;padding:18px 18px;background:rgba(198,248,6,0.06);">
        ${label(c.comingLabel).replace(C.dim, C.volt)}
        <p style="margin:8px 0 0 0;font-size:15px;line-height:1.6;color:${C.text};">${c.coming}</p></div></td></tr>
    <tr><td style="padding:24px 28px 0 28px;">
      <div style="border-top:1px solid ${C.border};padding-top:20px;">
        ${label(c.founderLabel)}
        <p style="margin:10px 0 0 0;font-size:15px;line-height:1.6;color:${C.text};">${c.founderNote}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:18px;">
          <tr><td style="border-left:3px solid ${C.volt};padding:2px 0 2px 14px;">
            <p style="margin:0;font-size:15px;font-style:italic;line-height:1.55;color:${C.text};">“${QUOTE.text}”</p>
            <p style="margin:8px 0 0 0;font-size:12px;color:${C.muted};">— ${QUOTE.author}</p>
          </td></tr>
        </table>
        <p style="margin:18px 0 0 0;font-size:14px;font-weight:700;color:${C.volt};">${c.signature}</p></div></td></tr>
    <tr><td style="padding:24px 28px 32px 28px;"></td></tr>`;

  const text = `${c.heading(cleanName)}

${c.intro}

${c.doLabel}
${c.features.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${c.comingLabel}
${c.coming}

${c.founderLabel}
${c.founderNote}

"${QUOTE.text}" — ${QUOTE.author}

${c.signature}`;

  return { subject: c.subject, html: shell(lang, c.preheader, inner), text };
}
