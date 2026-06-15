import type { Language } from "@/lib/i18n";

export type Option = { key: string; icon: string; en: string; es: string };

// Stored value: the option `key` for a known choice, or the user's free text
// when they pick "other". Display resolves back through labelFor/iconFor.
export const OTHER_KEY = "other";

export const SPORTS: Option[] = [
  { key: "running", icon: "🏃", en: "Running", es: "Correr" },
  { key: "trail_running", icon: "⛰️", en: "Trail running", es: "Trail running" },
  { key: "treadmill", icon: "🎽", en: "Treadmill running", es: "Cinta" },
  { key: "cycling", icon: "🚴", en: "Cycling", es: "Ciclismo" },
  { key: "indoor_cycling", icon: "🚲", en: "Indoor cycling", es: "Ciclismo indoor" },
  { key: "swimming", icon: "🏊", en: "Swimming", es: "Natación" },
  { key: "weightlifting", icon: "🏋️", en: "Weightlifting", es: "Levantamiento de pesas" },
  { key: "powerlifting", icon: "🏋️", en: "Powerlifting", es: "Powerlifting" },
  { key: "olympic_lifting", icon: "🏋️", en: "Olympic lifting", es: "Halterofilia" },
  { key: "bodybuilding", icon: "💪", en: "Bodybuilding", es: "Culturismo" },
  { key: "hypertrophy", icon: "💪", en: "Hypertrophy", es: "Hipertrofia" },
  { key: "strength", icon: "🏋️", en: "Strength training", es: "Entrenamiento de fuerza" },
  { key: "gym", icon: "🏋️", en: "General gym", es: "Gimnasio" },
  { key: "crossfit", icon: "🤸", en: "CrossFit", es: "CrossFit" },
  { key: "hyrox", icon: "🔥", en: "Hyrox", es: "Hyrox" },
  { key: "functional", icon: "🤸", en: "Functional fitness", es: "Entrenamiento funcional" },
  { key: "calisthenics", icon: "🤸", en: "Calisthenics", es: "Calistenia" },
  { key: "hiit", icon: "🔥", en: "HIIT", es: "HIIT" },
  { key: "circuit", icon: "🔁", en: "Circuit training", es: "Circuito" },
  { key: "soccer", icon: "⚽", en: "Soccer", es: "Fútbol" },
  { key: "basketball", icon: "🏀", en: "Basketball", es: "Baloncesto" },
  { key: "tennis", icon: "🎾", en: "Tennis", es: "Tenis" },
  { key: "padel", icon: "🎾", en: "Padel", es: "Pádel" },
  { key: "pickleball", icon: "🏓", en: "Pickleball", es: "Pickleball" },
  { key: "volleyball", icon: "🏐", en: "Volleyball", es: "Vóleibol" },
  { key: "boxing", icon: "🥊", en: "Boxing", es: "Boxeo" },
  { key: "kickboxing", icon: "🥊", en: "Kickboxing", es: "Kickboxing" },
  { key: "muay_thai", icon: "🥊", en: "Muay Thai", es: "Muay Thai" },
  { key: "bjj", icon: "🥋", en: "BJJ", es: "Jiu-jitsu (BJJ)" },
  { key: "mma", icon: "🥋", en: "MMA", es: "MMA" },
  { key: "wrestling", icon: "🤼", en: "Wrestling", es: "Lucha" },
  { key: "climbing", icon: "🧗", en: "Climbing", es: "Escalada" },
  { key: "bouldering", icon: "🧗", en: "Bouldering", es: "Búlder" },
  { key: "hiking", icon: "🥾", en: "Hiking", es: "Senderismo" },
  { key: "rowing", icon: "🚣", en: "Rowing", es: "Remo" },
  { key: "walking", icon: "🚶", en: "Walking", es: "Caminar" },
  { key: "yoga", icon: "🧘", en: "Yoga", es: "Yoga" },
  { key: "pilates", icon: "🧘", en: "Pilates", es: "Pilates" },
  { key: "mobility", icon: "🤸", en: "Mobility", es: "Movilidad" },
  { key: "stretching", icon: "🤸", en: "Stretching", es: "Estiramiento" },
  { key: "dance", icon: "💃", en: "Dance", es: "Baile" },
  { key: "skiing", icon: "🎿", en: "Skiing", es: "Esquí" },
  { key: "snowboarding", icon: "🏂", en: "Snowboarding", es: "Snowboard" },
  { key: "surfing", icon: "🏄", en: "Surfing", es: "Surf" },
  { key: "golf", icon: "⛳", en: "Golf", es: "Golf" },
  { key: "baseball", icon: "⚾", en: "Baseball", es: "Béisbol" },
  { key: "football", icon: "🏈", en: "Football", es: "Fútbol americano" },
  { key: "rugby", icon: "🏉", en: "Rugby", es: "Rugby" },
  { key: "track", icon: "🏃", en: "Track and field", es: "Atletismo" },
  { key: "triathlon", icon: "🏅", en: "Triathlon", es: "Triatlón" },
  { key: "hybrid", icon: "⚡", en: "Hybrid training", es: "Entrenamiento híbrido" },
  { key: OTHER_KEY, icon: "➕", en: "Other", es: "Otro" },
];

export const GOALS: Option[] = [
  { key: "strength", icon: "💪", en: "Improve strength", es: "Mejorar fuerza" },
  { key: "muscle", icon: "🧱", en: "Build muscle", es: "Ganar músculo" },
  { key: "endurance", icon: "🫀", en: "Improve endurance", es: "Mejorar resistencia" },
  { key: "speed", icon: "⚡", en: "Improve speed", es: "Mejorar velocidad" },
  { key: "efficiency", icon: "⚙️", en: "Improve efficiency", es: "Mejorar eficiencia" },
  { key: "sweat", icon: "💦", en: "Sweat", es: "Sudar" },
  { key: "burn_fat", icon: "🔥", en: "Burn fat", es: "Quemar grasa" },
  { key: "recovery", icon: "🌿", en: "Recovery / active rest", es: "Recuperación" },
  { key: "technique", icon: "🎯", en: "Skill / technique", es: "Técnica" },
  { key: "competition", icon: "🏆", en: "Competition prep", es: "Preparar competencia" },
  { key: OTHER_KEY, icon: "➕", en: "Other", es: "Otro" },
];

/** Translate a stored value; free text (from "other") falls through unchanged. */
export function labelFor(
  list: Option[],
  value: string | null | undefined,
  lang: Language,
): string {
  if (!value) return "";
  const found = list.find((o) => o.key === value);
  return found ? found[lang] : value;
}

/** Icon for a stored value; a tag glyph for free text. */
export function iconFor(list: Option[], value: string | null | undefined): string {
  const found = value ? list.find((o) => o.key === value) : null;
  return found ? found.icon : "🏷️";
}
