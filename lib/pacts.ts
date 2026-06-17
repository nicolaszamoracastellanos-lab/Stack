import type { Group } from "@/lib/types";
import type { Language } from "@/lib/i18n";
import { SPORTS, labelFor } from "@/lib/workout-options";

/** A group becomes a "pact" once a weekly workout target is set. */
export function isPact(g: Pick<Group, "workouts_per_week">): boolean {
  return g.workouts_per_week != null;
}

export const WHO_PAYS = ["breaker", "any_misser", "last_place"] as const;
export type WhoPays = (typeof WHO_PAYS)[number];

export const STAKE_TYPES = ["money", "favor", "custom"] as const;
export type StakeType = (typeof STAKE_TYPES)[number];

export const DURATION_PRESETS = [4, 8, 12]; // weeks

/** Allowed disciplines as a readable list; empty ⇒ all count. */
export function disciplinesLabel(
  allowed: string[],
  lang: Language,
  allText: string,
): string {
  if (!allowed || allowed.length === 0) return allText;
  return allowed.map((k) => labelFor(SPORTS, k, lang)).join(", ");
}

/** Does a check-in sport count toward the pact? Empty allowed ⇒ everything counts. */
export function disciplineCounts(allowed: string[], sport: string | null): boolean {
  if (!allowed || allowed.length === 0) return true;
  return sport != null && allowed.includes(sport);
}

/**
 * Broken-pact roast lines (Section 4). Playful, never shaming. Natural,
 * genuinely funny Spanish (not machine-translated). {name} is interpolated.
 * Rotated by index so it isn't repetitive.
 */
export const ROAST_LINES: { en: string; es: string }[] = [
  {
    en: "{name} skipped the work this week. Dinner's on them. 🍗",
    es: "{name} se hizo el loco esta semana. La cena la paga {name}. 🍗",
  },
  {
    en: "The chain broke and {name} is the weak link. Pay up. 💸",
    es: "Se rompió la cadena y el eslabón débil fue {name}. A pagar. 💸",
  },
  {
    en: "{name} chose the couch over the gym. Classic. They owe. 🛋️",
    es: "{name} eligió el sofá antes que el gym. Clásico. Ahora paga. 🛋️",
  },
  {
    en: "Plot twist: {name} didn't hit the target. Everyone act surprised. 😏",
    es: "Sorpresa: {name} no cumplió. Todos finjan asombro. 😏",
  },
  {
    en: "{name} folded under pressure. The stake is theirs. 🥲",
    es: "{name} se quebró bajo presión. La apuesta es suya. 🥲",
  },
];

export function roastLine(index: number, name: string, lang: Language): string {
  const line = ROAST_LINES[index % ROAST_LINES.length];
  return line[lang].replaceAll("{name}", name);
}

// // FUTURE: real money — settling a debt is honor-system only today. A future
// phase could attach a payment provider here without changing the ledger shape.
