// Contexte de préférences : ce que Noa sait de la manière de travailler d'une
// personne, et ce qu'il en fait.
//
// Une seule représentation, `PreferenceContext`, quelle que soit la source
// (questionnaire Noa, DISC, MBTI, Big Five, colonnes historiques). Les
// consommateurs — texte d'aide des questions de suivi, suggestions manager —
// n'ont pas à savoir d'où vient l'information.
//
// ─── Ce que le contexte peut, et ne peut pas ────────────────────────────────
// Il ne change JAMAIS une question principale, un indicateur mesuré, un
// objectif ni un critère. Il n'est qu'une hypothèse initiale d'accompagnement :
// ce qui ressort des entretiens réels prime (cf. interview-history.ts).
//
// Aucun modèle n'est converti vers un autre. Un MBTI est lu par ses quatre
// préférences, un Big Five par ses niveaux, jamais traduits en DISC ni en
// scores Noa.
import type {
  BigFiveLevel,
  BigFiveTrait,
  DiscProfile,
  Onboarding,
  OnboardingWorkPreferences,
  PreferenceOrientation,
  WorkPreferenceDimension,
} from "@/lib/noa/types";
import { isDiscProfile } from "@/lib/noa/onboarding/disc";
import {
  mbtiPreferences,
  parseBigFiveResult,
  parseDiscResult,
  parseMbtiResult,
  type MbtiType,
} from "@/lib/noa/onboarding/declared-tests";
import { parseWorkPreferenceScores, type WorkPreferenceScores } from "@/lib/noa/onboarding/work-preferences";

export type PreferenceContext =
  | { kind: "none" }
  | { kind: "noa"; scores: WorkPreferenceScores }
  | { kind: "disc"; primary: DiscProfile; secondary: DiscProfile | null }
  | { kind: "mbti"; type: MbtiType }
  | { kind: "big_five"; levels: Record<BigFiveTrait, BigFiveLevel> };

export const NO_CONTEXT: PreferenceContext = { kind: "none" };

/**
 * Construit le contexte à partir de ce qui est stocké. Priorité aux
 * préférences complétées ; à défaut, les colonnes DISC historiques de
 * l'onboarding ; sinon aucun contexte — et tout fonctionne quand même.
 */
export function buildPreferenceContext(
  onboarding: Pick<Onboarding, "disc_primary" | "disc_secondary"> | null,
  preferences: Pick<OnboardingWorkPreferences, "status" | "assessment_type" | "structured_result" | "questionnaire_scores"> | null,
): PreferenceContext {
  if (preferences?.status === "completed") {
    switch (preferences.assessment_type) {
      case "noa_work_preferences": {
        const scores = parseWorkPreferenceScores(preferences.questionnaire_scores);
        if (scores) return { kind: "noa", scores };
        break;
      }
      case "disc": {
        const disc = parseDiscResult(preferences.structured_result);
        if (disc) return { kind: "disc", ...disc };
        break;
      }
      case "mbti": {
        const mbti = parseMbtiResult(preferences.structured_result);
        if (mbti) return { kind: "mbti", type: mbti.type };
        break;
      }
      case "big_five": {
        const levels = parseBigFiveResult(preferences.structured_result);
        if (levels) return { kind: "big_five", levels };
        break;
      }
    }
  }

  // Repli : DISC saisi avant l'existence des préférences de travail.
  if (onboarding && isDiscProfile(onboarding.disc_primary)) {
    return {
      kind: "disc",
      primary: onboarding.disc_primary,
      secondary: isDiscProfile(onboarding.disc_secondary) ? onboarding.disc_secondary : null,
    };
  }

  return NO_CONTEXT;
}

// ─── Orientation d'une préférence Noa, lue depuis n'importe quel contexte ───
// Chaque source est projetée — avec prudence — sur les six préférences Noa,
// uniquement pour choisir un texte d'aide. Une valeur intermédiaire (Big Five
// « medium », score « mixed ») ne produit aucune personnalisation.

export function preferenceOrientation(
  context: PreferenceContext,
  dimension: WorkPreferenceDimension,
): PreferenceOrientation | null {
  switch (context.kind) {
    case "none":
      return null;

    case "noa":
      return context.scores[dimension].orientation;

    case "disc": {
      // Lecture légère : D = résultats et marge d'action, I = échanges,
      // S = progressivité et accompagnement, C = précision et critères.
      const p = context.primary;
      const table: Partial<Record<WorkPreferenceDimension, Partial<Record<DiscProfile, PreferenceOrientation>>>> = {
        structure: { C: "high_preference", D: "low_preference" },
        autonomy: { D: "high_preference", S: "low_preference" },
        interaction: { I: "high_preference", C: "low_preference" },
        initiative: { D: "high_preference", S: "low_preference" },
        change: { D: "high_preference", S: "low_preference" },
        feedback: { I: "high_preference", S: "high_preference" },
      };
      return table[dimension]?.[p] ?? null;
    }

    case "mbti": {
      // Quatre préférences, pas seize portraits : E/I → interactions,
      // J/P → structure, T/F → nature des retours, S/N → concret / global.
      const prefs = mbtiPreferences(context.type);
      if (dimension === "interaction") return prefs.energy === "E" ? "high_preference" : "low_preference";
      if (dimension === "structure") return prefs.organisation === "J" ? "high_preference" : "low_preference";
      if (dimension === "change") return prefs.organisation === "P" ? "high_preference" : "low_preference";
      return null;
    }

    case "big_five": {
      const level = (trait: BigFiveTrait): PreferenceOrientation | null =>
        context.levels[trait] === "high" ? "high_preference" : context.levels[trait] === "low" ? "low_preference" : null;
      if (dimension === "change") return level("openness");
      if (dimension === "structure") return level("conscientiousness");
      if (dimension === "interaction") return level("extraversion");
      // Stabilité émotionnelle basse → accompagnement plus rapproché.
      if (dimension === "feedback") {
        const stability = context.levels.emotional_stability;
        return stability === "low" ? "high_preference" : null;
      }
      return null;
    }
  }
}

/** Libellé de la source, pour la fiche manager. */
export function contextSourceLabel(context: PreferenceContext): string | null {
  switch (context.kind) {
    case "none":
      return null;
    case "noa":
      return "Questionnaire Noa";
    case "disc":
      return "Test déclaré · DISC";
    case "mbti":
      return "Test déclaré · MBTI";
    case "big_five":
      return "Test déclaré · Big Five";
  }
}
