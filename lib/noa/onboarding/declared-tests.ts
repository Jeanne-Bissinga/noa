// Tests déclarés par le collaborateur : DISC, MBTI, Big Five.
//
// Noa n'administre aucun de ces tests. Le collaborateur reporte un résultat
// obtenu ailleurs, dans un formulaire fermé (aucun champ libre), et Noa le
// stocke tel quel. Les trois modèles ne sont jamais convertis l'un vers
// l'autre ni vers le questionnaire Noa : un MBTI reste un MBTI.
//
// Ce module valide une saisie brute (venant d'un formulaire public, donc de
// personne de confiance) et la transforme en résultat structuré. Il est pur.
import type { BigFiveLevel, BigFiveTrait, DiscProfile } from "@/lib/noa/types";
import { isDiscProfile } from "@/lib/noa/onboarding/disc";

// ─── DISC ───────────────────────────────────────────────────────────────────

export interface DiscResult {
  primary: DiscProfile;
  secondary: DiscProfile | null;
}

export function parseDiscResult(input: unknown): DiscResult | null {
  const raw = input as { primary?: unknown; secondary?: unknown } | null;
  if (!raw || !isDiscProfile(raw.primary)) return null;

  const secondary = raw.secondary === null || raw.secondary === undefined || raw.secondary === ""
    ? null
    : raw.secondary;
  if (secondary !== null && !isDiscProfile(secondary)) return null;
  // Un secondaire identique au principal n'a pas de sens : refusé plutôt
  // qu'ignoré, pour que le formulaire le signale.
  if (secondary === raw.primary) return null;

  return { primary: raw.primary, secondary };
}

// ─── MBTI ───────────────────────────────────────────────────────────────────

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export interface MbtiResult {
  type: MbtiType;
}

export function isMbtiType(value: unknown): value is MbtiType {
  return typeof value === "string" && (MBTI_TYPES as readonly string[]).includes(value);
}

export function parseMbtiResult(input: unknown): MbtiResult | null {
  const raw = input as { type?: unknown } | null;
  if (!raw || !isMbtiType(raw.type)) return null;
  return { type: raw.type };
}

/**
 * Les quatre préférences d'un type MBTI, seule lecture que Noa en fait. Pas
 * de portrait par type : ce qui est utilisé, c'est E/I, S/N, T/F, J/P.
 */
export function mbtiPreferences(type: MbtiType): {
  energy: "E" | "I";
  information: "S" | "N";
  decision: "T" | "F";
  organisation: "J" | "P";
} {
  return {
    energy: type[0] as "E" | "I",
    information: type[1] as "S" | "N",
    decision: type[2] as "T" | "F",
    organisation: type[3] as "J" | "P",
  };
}

// ─── Big Five ───────────────────────────────────────────────────────────────
// Pas de score numérique : les tests Big Five n'ont pas tous la même échelle.
// Trois niveaux par trait, et « stabilité émotionnelle » plutôt que
// « névrosisme » dans l'interface.

export const BIG_FIVE_TRAITS: BigFiveTrait[] = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotional_stability",
];

export const BIG_FIVE_TRAIT_LABEL: Record<BigFiveTrait, string> = {
  openness: "Ouverture",
  conscientiousness: "Conscienciosité",
  extraversion: "Extraversion",
  agreeableness: "Agréabilité",
  emotional_stability: "Stabilité émotionnelle",
};

export const BIG_FIVE_LEVELS: BigFiveLevel[] = ["low", "medium", "high"];

export const BIG_FIVE_LEVEL_LABEL: Record<BigFiveLevel, string> = {
  low: "Faible",
  medium: "Intermédiaire",
  high: "Élevée",
};

export type BigFiveResult = Record<BigFiveTrait, BigFiveLevel>;

export function isBigFiveLevel(value: unknown): value is BigFiveLevel {
  return value === "low" || value === "medium" || value === "high";
}

/** Les cinq traits sont obligatoires : un Big Five partiel n'est pas un résultat. */
export function parseBigFiveResult(input: unknown): BigFiveResult | null {
  const raw = input as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return null;

  const result = {} as BigFiveResult;
  for (const trait of BIG_FIVE_TRAITS) {
    if (!isBigFiveLevel(raw[trait])) return null;
    result[trait] = raw[trait];
  }
  return result;
}
