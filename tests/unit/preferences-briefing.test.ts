import { describe, it, expect } from "vitest";
import {
  keepGroundedTopics,
  parsePreferenceBriefing,
  briefingMatchesScorecard,
  containsForbiddenPreferenceWording,
  MAX_TOPICS,
  type RawTopic,
} from "@/lib/noa/preferences/briefing";
import { buildPreferenceContext, supportsInterviewTopics, NO_CONTEXT } from "@/lib/noa/preferences/context";
import { WORK_PREFERENCE_DIMENSIONS } from "@/lib/noa/preferences/questions";
import type { MissionSkill } from "@/lib/noa/types";

// La règle centrale, vérifiée ici plutôt que promise dans un prompt :
//   préférence -> hypothèse -> question -> faits -> évaluation.
// Un sujet à approfondir n'existe que rattaché à une compétence réellement
// attendue pour le poste.

const SCORECARD: Pick<MissionSkill, "id" | "name" | "category">[] = [
  { id: "skill-auto", name: "Autonomie sur un périmètre produit", category: "comportementale" },
  { id: "skill-coord", name: "Coordination avec l'équipe produit", category: "relationnelle" },
  { id: "skill-sql", name: "Optimisation PostgreSQL", category: "technique" },
];

const ALL_DIMENSIONS = [...WORK_PREFERENCE_DIMENSIONS];

function topic(partial: Partial<RawTopic> = {}): RawTopic {
  return {
    scorecard_skill_id: "skill-auto",
    dimension: "autonomy",
    hypothesis: "Les préférences déclarées suggèrent un goût pour des repères au démarrage.",
    rationale: "L'autonomie est attendue sur ce poste, il vaut la peine de le vérifier.",
    question: "Parlez-moi d'une situation où vous avez avancé sans toutes les consignes.",
    ...partial,
  };
}

describe("ancrage sur la Scorecard", () => {
  it("garde un sujet rattaché à une compétence réelle", () => {
    const kept = keepGroundedTopics([topic()], SCORECARD, ALL_DIMENSIONS);
    expect(kept).toHaveLength(1);
    expect(kept[0].skillId).toBe("skill-auto");
  });

  it("rejette un identifiant de compétence inconnu", () => {
    // Le schéma d'outil contraint déjà skillId par énumération. C'est ici que
    // la contrainte devient une garantie : un schéma est une demande.
    expect(keepGroundedTopics([topic({ scorecard_skill_id: "skill-inventee" })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    expect(keepGroundedTopics([topic({ scorecard_skill_id: "" })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    expect(keepGroundedTopics([topic({ scorecard_skill_id: null })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
  });

  it("ne produit aucun sujet quand la Scorecard est vide", () => {
    expect(keepGroundedTopics([topic()], [], ALL_DIMENSIONS)).toEqual([]);
  });

  it("fige le libellé depuis la Scorecard, pas depuis la réponse du modèle", () => {
    const kept = keepGroundedTopics([topic()], SCORECARD, ALL_DIMENSIONS);
    expect(kept[0].skillName).toBe("Autonomie sur un périmètre produit");
    expect(kept[0].skillCategory).toBe("comportementale");
  });

  it("n'ouvre pas de sujet sur une dimension qui n'est pas nettement exprimée", () => {
    // « mixed » ne porte pas de préférence : un sujet appuyé dessus s'appuie
    // sur rien.
    expect(keepGroundedTopics([topic({ dimension: "autonomy" })], SCORECARD, ["structure"])).toEqual([]);
    expect(keepGroundedTopics([topic({ dimension: "inexistante" })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
  });

  it("ne traite qu'une fois la même compétence, et plafonne", () => {
    const many = [
      topic(),
      topic({ hypothesis: "Une autre lecture de la même chose." }),
      topic({ scorecard_skill_id: "skill-coord", dimension: "interaction" }),
      topic({ scorecard_skill_id: "skill-sql", dimension: "change" }),
    ];
    const kept = keepGroundedTopics(many, SCORECARD, ALL_DIMENSIONS);
    expect(kept.length).toBeLessThanOrEqual(MAX_TOPICS);
    expect(new Set(kept.map((t) => t.skillId)).size).toBe(kept.length);
  });

  it("rejette un sujet incomplet", () => {
    for (const champ of ["hypothesis", "rationale", "question"] as const) {
      expect(keepGroundedTopics([topic({ [champ]: "   " })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
      expect(keepGroundedTopics([topic({ [champ]: undefined })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    }
  });
});

describe("ce qu'un sujet ne peut jamais dire", () => {
  it("rejette un verdict RH", () => {
    for (const verdict of [
      "Il faut écarter ce candidat.",
      "Recommandation : recruter.",
      "La période d'essai risque d'être difficile.",
    ]) {
      expect(keepGroundedTopics([topic({ rationale: verdict })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    }
  });

  it("rejette une valeur chiffrée sur la personne", () => {
    for (const chiffre of ["Adéquation estimée : 70 %.", "Un score de 8/10 sur ce point.", "Compatibilité de 84 %."]) {
      expect(containsForbiddenPreferenceWording(chiffre)).toBe(true);
      expect(keepGroundedTopics([topic({ hypothesis: chiffre })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    }
  });

  it("rejette le vocabulaire de la personnalité", () => {
    for (const mot of [
      "Son profil comportemental indique...",
      "D'après son test de personnalité...",
      "Un trait de caractère marqué.",
      "Cette analyse de personnalité suggère...",
    ]) {
      expect(containsForbiddenPreferenceWording(mot)).toBe(true);
    }
  });

  it("rejette ces mots même seuls, accentués et sans chiffre", () => {
    // Le trou que ces cas épinglent : `\w` de JavaScript est limité à l'ASCII,
    // donc « é » n'est pas une lettre pour `\b`, et un `\b` final rendait
    // `personnalité`, `compatibilité` et `probabilité` inatteignables. Les
    // formes accentuées ne passaient que grâce à un motif voisin — « test de
    // personnalité » ou la présence d'un chiffre. Sans cet appui, elles
    // traversaient le filtre.
    for (const mot of [
      "Sa personnalité le porte vers les sujets exploratoires.",
      "Compatibilité forte avec le poste.",
      "Probabilité de réussite élevée.",
    ]) {
      expect(containsForbiddenPreferenceWording(mot), mot).toBe(true);
      expect(keepGroundedTopics([topic({ hypothesis: mot })], SCORECARD, ALL_DIMENSIONS)).toEqual([]);
    }
  });

  it("laisse passer une formulation légitime voisine", () => {
    // Le filtre doit rester un filtre, pas une censure : ces phrases décrivent
    // une préférence sans porter de jugement ni de mesure.
    for (const mot of [
      "Apprécie que le cadre de travail soit posé tôt.",
      "Cherche des retours réguliers pendant la mission.",
    ]) {
      expect(containsForbiddenPreferenceWording(mot), mot).toBe(false);
    }
  });

  it("rejette la formulation en manque", () => {
    // « Apprécie disposer de repères » est acceptable ; « manque d'autonomie »
    // ne l'est pas — c'est la différence entre une préférence et un jugement.
    expect(containsForbiddenPreferenceWording("Sarah manque d'autonomie.")).toBe(true);
    expect(containsForbiddenPreferenceWording("Apprécie disposer de repères au démarrage.")).toBe(false);
  });
});

describe("relecture d'un briefing stocké", () => {
  it("fait disparaître un sujet dont la compétence a quitté la Scorecard", () => {
    const stored = { version: 1, topics: keepGroundedTopics([topic()], SCORECARD, ALL_DIMENSIONS), scorecardSkillIds: ["skill-auto"] };
    expect(parsePreferenceBriefing(stored, SCORECARD)).toHaveLength(1);
    expect(parsePreferenceBriefing(stored, [SCORECARD[1], SCORECARD[2]])).toEqual([]);
  });

  it("ne lève pas sur une valeur absente ou malformée", () => {
    for (const raw of [null, undefined, {}, { topics: "x" }, []]) {
      expect(parsePreferenceBriefing(raw, SCORECARD)).toEqual([]);
    }
  });

  it("détecte une Scorecard modifiée depuis la génération", () => {
    const stored = { version: 1, topics: [], scorecardSkillIds: ["skill-auto", "skill-coord"] };
    expect(briefingMatchesScorecard(stored, ["skill-coord", "skill-auto"])).toBe(true);
    expect(briefingMatchesScorecard(stored, ["skill-auto"])).toBe(false);
    expect(briefingMatchesScorecard(stored, ["skill-auto", "skill-coord", "skill-sql"])).toBe(false);
    expect(briefingMatchesScorecard(null, [])).toBe(false);
  });
});

describe("les tests déclarés n'ouvrent aucun sujet d'évaluation", () => {
  const declared = (type: "disc" | "mbti" | "big_five", result: Record<string, unknown>) =>
    buildPreferenceContext({
      status: "completed",
      assessment_type: type,
      structured_result: result,
      questionnaire_scores: null,
    });

  it("ne peuvent jamais désigner un critère à évaluer", () => {
    // Un test déclaré parle dans le vocabulaire de son modèle. Il peut aider à
    // conduire l'échange (cf. preferences-communication.test.ts), jamais à
    // désigner ce qu'il faut évaluer : cela demanderait une traduction vers les
    // dimensions Noa, qui n'existe plus.
    expect(supportsInterviewTopics(declared("disc", { primary: "D", secondary: null }))).toBe(false);
    expect(supportsInterviewTopics(declared("mbti", { type: "INFJ" }))).toBe(false);
    expect(supportsInterviewTopics(declared("big_five", {
      openness: "high", conscientiousness: "high", extraversion: "low",
      agreeableness: "medium", emotional_stability: "medium",
    }))).toBe(false);
    expect(supportsInterviewTopics(NO_CONTEXT)).toBe(false);
  });
});
