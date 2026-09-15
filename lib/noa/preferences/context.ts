// Contexte de préférences : ce qu'un candidat a déclaré de sa manière de
// travailler, et ce que Noa a le droit d'en faire.
//
// Une seule représentation, `PreferenceContext`, quelle que soit la source
// (questionnaire Noa, DISC, MBTI, Big Five). Les consommateurs — conseils de
// conduite d'entretien, sujets à approfondir — n'ont pas à savoir d'où vient
// l'information.
//
// ─── Ce que le contexte peut, et ne peut pas ────────────────────────────────
// Il ne modifie JAMAIS un score, une note de compétence, un critère de la
// Scorecard, un classement ni une décision. Il ne produit qu'une hypothèse à
// vérifier : ce qui ressort de l'entretien prime toujours.
//
// ─── Aucune traduction entre modèles, pour aucun usage ──────────────────────
// Un DISC reste un DISC, un MBTI se lit par ses quatre axes, un Big Five par
// ses dimensions. AUCUN n'est traduit vers les six dimensions Noa, pas même
// pour choisir la formulation d'un conseil.
//
// Ce module a porté une telle projection. Elle partait d'une bonne intention —
// une seule table de conseils pour toutes les sources — et produisait une
// affirmation fausse : un candidat déclarant un DISC « C » se voyait attribuer
// « structure : préférence haute », une réponse qu'il n'avait jamais donnée.
// Les conseils sont désormais écrits par modèle, à partir de ce que le modèle
// dit lui-même (cf. preferences/communication.ts).
//
// Les six dimensions Noa n'appartiennent qu'au questionnaire Noa. Lui seul
// peut aussi ouvrir un « sujet à approfondir » relié à la Scorecard : c'est ce
// que dit `supportsInterviewTopics`.
import type {
  BigFiveLevel,
  BigFiveTrait,
  DiscProfile,
  OnboardingWorkPreferences,
} from "@/lib/noa/types";
import {
  parseBigFiveResult,
  parseDiscResult,
  parseMbtiResult,
  type MbtiType,
} from "@/lib/noa/preferences/declared-tests";
import { parseWorkPreferenceScores, type WorkPreferenceScores } from "@/lib/noa/preferences/scoring";

export type PreferenceContext =
  | { kind: "none" }
  | { kind: "noa"; scores: WorkPreferenceScores }
  | { kind: "disc"; primary: DiscProfile; secondary: DiscProfile | null }
  | { kind: "mbti"; type: MbtiType }
  | { kind: "big_five"; levels: Record<BigFiveTrait, BigFiveLevel> };

export const NO_CONTEXT: PreferenceContext = { kind: "none" };

/**
 * Construit le contexte à partir de ce qui est stocké. Sans préférences
 * complétées, aucun contexte — et tout fonctionne quand même.
 *
 * Le repli sur les colonnes DISC historiques de `onboardings` a disparu avec
 * le module d'intégration, et c'est voulu : un profil DISC saisi par un manager
 * n'est pas une préférence déclarée par la personne. Lui prêter des mots
 * qu'elle n'a pas écrits était la seule chose que ce repli permettait.
 */
export function buildPreferenceContext(
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

  return NO_CONTEXT;
}

/**
 * Ce contexte peut-il ouvrir un sujet à approfondir relié à la Scorecard ?
 *
 * Seul le questionnaire Noa le peut. Ses six dimensions viennent de réponses
 * données par la personne, sur des situations de travail concrètes ; c'est ce
 * qui permet d'en tirer une hypothèse qu'on pourra lui soumettre.
 *
 * Un test déclaré dit autre chose, dans un autre vocabulaire. Il peut aider à
 * mener la conversation (preferences/communication.ts), jamais à désigner ce
 * qu'il faut évaluer.
 */
export function supportsInterviewTopics(context: PreferenceContext): boolean {
  return context.kind === "noa";
}

// `contextSourceLabel` vivait ici : il rendait « Test déclaré · MBTI » au-dessus
// du résultat brut, sur une carte qui affichait aussi « Type déclaré : INTJ ».
// Cette carte a disparu — le manager doit savoir de quel modèle vient un
// conseil, pas lire l'étiquette du candidat. La source se dit désormais dans la
// phrase qui accompagne les conseils (preferences/communication.ts,
// `guidanceSourceLine`), donc à l'endroit où elle sert à quelque chose.
