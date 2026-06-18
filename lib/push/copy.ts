/**
 * Localized push copy (Batch 5 Stage D). EN + ES, no hardcoded English at the
 * send site. Kept separate from lib/i18n (which is the in-app dictionary, loaded
 * client-side) because push copy is built server-side at send time.
 */
import type { NotificationType, PushPayload, Lang } from "@/lib/push/types";

export type CopyVars = {
  name?: string;
  group?: string;
  /** Tier display NAME (already localized), used by tier_projection copy. */
  tier?: string;
  /** Projection direction for tier_projection. */
  direction?: "up" | "down";
  /** True for a confirmed tier change ("You earned X"). */
  confirmed?: boolean;
  /** Short text preview (comment / mention body). */
  snippet?: string;
};

const TIER_NAMES: Record<string, { en: string; es: string }> = {
  gold: { en: "Gold", es: "Oro" },
  silver: { en: "Silver", es: "Plata" },
  volt: { en: "Volt", es: "Volt" },
  bronze: { en: "Bronze", es: "Bronce" },
  purple: { en: "Purple", es: "Púrpura" },
  amber: { en: "Amber", es: "Ámbar" },
  slate: { en: "Slate", es: "Pizarra" },
};

/** Localized tier display name (server-side; mirrors the in-app i18n names). */
export function localizedTierName(key: string, lang: Lang): string {
  const t = TIER_NAMES[key];
  return t ? (lang === "es" ? t.es : t.en) : key;
}

type Builder = (lang: Lang, v: CopyVars) => { title: string; body: string };

const pick = <T,>(lang: Lang, en: T, es: T): T => (lang === "es" ? es : en);

const BUILDERS: Record<NotificationType, Builder> = {
  group_post: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} just stacked up in ${v.group ?? "your group"}.`,
      `${v.name ?? "Alguien"} acaba de sumar en ${v.group ?? "tu grupo"}.`,
    ),
  }),
  group_join: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} joined ${v.group ?? "your group"}.`,
      `${v.name ?? "Alguien"} se unió a ${v.group ?? "tu grupo"}.`,
    ),
  }),
  member_workout: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "A teammate"} logged their first workout today.`,
      `${v.name ?? "Alguien del equipo"} registró su primer entrenamiento de hoy.`,
    ),
  }),
  self_nudge: (lang) => ({
    title: "Stack",
    body: pick(
      lang,
      "Late in the day — still time to keep your streak.",
      "Ya es tarde — aún hay tiempo para mantener tu racha.",
    ),
  }),
  at_risk: (lang) => ({
    title: pick(lang, "About to lose your streak", "A punto de perder tu racha"),
    body: pick(
      lang,
      "You've used all your rest days this week. Train today to keep it alive.",
      "Ya usaste todos tus descansos de la semana. Entrena hoy para conservarla.",
    ),
  }),
  member_nudge: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} nudged you to work out.`,
      `${v.name ?? "Alguien"} te dio un empujón para entrenar.`,
    ),
  }),
  nudge: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} nudged you to work out.`,
      `${v.name ?? "Alguien"} te dio un empujón para entrenar.`,
    ),
  }),
  reaction: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} reacted to your check-in.`,
      `${v.name ?? "Alguien"} reaccionó a tu registro.`,
    ),
  }),
  comment: (lang, v) => ({
    title: "Stack",
    body: v.snippet
      ? pick(
          lang,
          `${v.name ?? "Someone"} commented: ${v.snippet}`,
          `${v.name ?? "Alguien"} comentó: ${v.snippet}`,
        )
      : pick(
          lang,
          `${v.name ?? "Someone"} commented on your check-in.`,
          `${v.name ?? "Alguien"} comentó tu registro.`,
        ),
  }),
  mention: (lang, v) => ({
    title: "Stack",
    body: v.snippet
      ? pick(
          lang,
          `${v.name ?? "Someone"} mentioned you: ${v.snippet}`,
          `${v.name ?? "Alguien"} te mencionó: ${v.snippet}`,
        )
      : pick(
          lang,
          `${v.name ?? "Someone"} mentioned you.`,
          `${v.name ?? "Alguien"} te mencionó.`,
        ),
  }),
  tier_change: (lang, v) => ({
    title: "Stack",
    body: v.tier
      ? pick(lang, `You earned ${v.tier} 🟢`, `Alcanzaste ${v.tier} 🟢`)
      : pick(
          lang,
          "Your confirmed tier changed.",
          "Tu nivel confirmado cambió.",
        ),
  }),
  invite_accepted: (lang, v) => ({
    title: "Stack",
    body: pick(
      lang,
      `${v.name ?? "Someone"} accepted your invite to ${v.group ?? "your group"}.`,
      `${v.name ?? "Alguien"} aceptó tu invitación a ${v.group ?? "tu grupo"}.`,
    ),
  }),
  tier_projection: (lang, v) => {
    if (v.confirmed && v.tier) {
      return {
        title: "Stack",
        body: pick(lang, `You earned ${v.tier} 🟢`, `Alcanzaste ${v.tier} 🟢`),
      };
    }
    if (v.direction === "up") {
      return {
        title: "Stack",
        body: pick(
          lang,
          `You're going harder than your goal — keep it up and you'll reach ${v.tier ?? "the next tier"}.`,
          `Vas más fuerte que tu meta — sigue así y llegarás a ${v.tier ?? "el siguiente nivel"}.`,
        ),
      };
    }
    if (v.direction === "down") {
      return {
        title: "Stack",
        body: pick(
          lang,
          `This week was lighter. If it continues, your tier steps down to ${v.tier ?? "a lower tier"}.`,
          `Esta semana fue más floja. Si sigue así, tu nivel baja a ${v.tier ?? "uno menor"}.`,
        ),
      };
    }
    return {
      title: "Stack",
      body: pick(
        lang,
        "Your pace is shifting your tier — check your progress.",
        "Tu ritmo está moviendo tu nivel — revisa tu progreso.",
      ),
    };
  },
};

export function buildNotification(
  type: NotificationType,
  lang: Lang,
  vars: CopyVars = {},
  url = "/home",
): PushPayload {
  const { title, body } = BUILDERS[type](lang, vars);
  return { title, body, url, tag: type, type };
}
