/**
 * Localized push copy (Batch 5 Stage D). EN + ES, no hardcoded English at the
 * send site. Kept separate from lib/i18n (which is the in-app dictionary, loaded
 * client-side) because push copy is built server-side at send time.
 */
import type { NotificationType, PushPayload, Lang } from "@/lib/push/types";

export type CopyVars = {
  name?: string;
  group?: string;
  tier?: string;
};

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
  tier_projection: (lang, v) => ({
    title: "Stack",
    body: v.tier
      ? pick(
          lang,
          `You earned ${v.tier}. Keep it up.`,
          `Alcanzaste ${v.tier}. Sigue así.`,
        )
      : pick(
          lang,
          "Your pace is shifting your tier — check your progress.",
          "Tu ritmo está moviendo tu nivel — revisa tu progreso.",
        ),
  }),
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
