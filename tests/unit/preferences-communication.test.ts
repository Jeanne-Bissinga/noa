import { describe, it, expect } from "vitest";
import {
  buildCommunicationGuidance,
  noaAdvice,
  discAdvice,
  mbtiAdvice,
  bigFiveAdvice,
  INTERVIEW_CONDUCT_ADVICE,
  DISC_CONDUCT_ADVICE,
  MBTI_CONDUCT_ADVICE,
  BIG_FIVE_CONDUCT_ADVICE,
  guidanceSourceLine,
  GUIDANCE_FOOTNOTE,
  MAX_CONDUCT_ADVICE,
  type ConductAdviceItem,
} from "@/lib/noa/preferences/communication";
import { PREFERENCE_RECOMMENDATION } from "@/lib/noa/preferences/scoring";
import { buildPreferenceContext, supportsInterviewTopics, NO_CONTEXT } from "@/lib/noa/preferences/context";
import { WORK_PREFERENCE_DIMENSIONS } from "@/lib/noa/preferences/questions";
import { MBTI_TYPES, BIG_FIVE_TRAITS, BIG_FIVE_LEVEL_LABEL } from "@/lib/noa/preferences/declared-tests";
import { DISC_PROFILES } from "@/lib/noa/preferences/disc";
import { containsForbiddenPreferenceWording } from "@/lib/noa/preferences/briefing";
import type { BigFiveLevel, BigFiveTrait, WorkPreferenceDimension } from "@/lib/noa/types";

// Quatre modèles, quatre jeux de règles, aucun pont.
//
// Chaque source écrit ses conseils dans son propre vocabulaire. Les six
// dimensions Noa n'appartiennent qu'au questionnaire Noa : aucun test déclaré
// ne doit pouvoir en produire une, ni ouvrir un sujet relié à la Scorecard.

type Orientation = "low_preference" | "high_preference" | "mixed";

function noaScores(orientations: Partial<Record<WorkPreferenceDimension, Orientation>>) {
  return Object.fromEntries(
    WORK_PREFERENCE_DIMENSIONS.map((d) => [
      d,
      {
        // La netteté suit l'orientation : highlightPreferences trie dessus.
        mean: orientations[d] === "high_preference" ? 4 : orientations[d] === "low_preference" ? 1 : 2.5,
        standardDeviation: 0,
        orientation: orientations[d] ?? "mixed",
      },
    ]),
  );
}

function contextOf(assessment: "disc" | "mbti" | "big_five" | "noa_work_preferences", result: unknown) {
  return buildPreferenceContext({
    status: "completed",
    assessment_type: assessment,
    structured_result: assessment === "noa_work_preferences" ? null : (result as Record<string, unknown>),
    questionnaire_scores: assessment === "noa_work_preferences" ? (result as Record<string, unknown>) : null,
  });
}

const BIG_FIVE_ALL: Record<BigFiveTrait, BigFiveLevel> = {
  openness: "high",
  conscientiousness: "low",
  extraversion: "high",
  agreeableness: "low",
  emotional_stability: "low",
};

/** Tous les conseils que chaque modèle externe peut produire, un par un. */
function everyDeclaredItem(): ConductAdviceItem[] {
  const items: ConductAdviceItem[] = [];
  for (const primary of DISC_PROFILES) {
    for (const secondary of [null, ...DISC_PROFILES.filter((d) => d !== primary)]) {
      items.push(...discAdvice(primary, secondary, 99));
    }
  }
  for (const type of MBTI_TYPES) items.push(...mbtiAdvice(type, 99));
  for (const trait of BIG_FIVE_TRAITS) {
    for (const level of ["low", "high"] as const) {
      const levels = { ...BIG_FIVE_ALL, [trait]: level };
      items.push(...bigFiveAdvice(levels, 99));
    }
  }
  return items;
}

// ─── Les trois modèles externes ne produisent jamais de dimension Noa ───────

describe("DISC déclaré", () => {
  it("produit des conseils de communication", () => {
    for (const primary of DISC_PROFILES) {
      expect(discAdvice(primary, null).length, primary).toBe(1);
      expect(discAdvice(primary, null)[0].action.trim().length).toBeGreaterThan(0);
    }
    // Principal + secondaire : deux conseils, toujours distincts.
    const deux = discAdvice("C", "S");
    expect(deux).toHaveLength(2);
    expect(deux[0].action).not.toBe(deux[1].action);
  });

  it("ne produit jamais de dimension Noa", () => {
    for (const primary of DISC_PROFILES) {
      for (const secondary of [null, ...DISC_PROFILES.filter((d) => d !== primary)]) {
        for (const item of discAdvice(primary, secondary, 99)) {
          expect(item.source).toBe("disc");
          expect(item.id).toMatch(/^disc:[DISC]$/);
          for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
            expect(item.id, dimension).not.toContain(dimension);
          }
        }
      }
    }
  });

  it("ne produit aucun sujet à approfondir relié à la Scorecard", () => {
    expect(supportsInterviewTopics(contextOf("disc", { primary: "C", secondary: "S" }))).toBe(false);
  });
});

describe("MBTI déclaré", () => {
  it("produit un conseil par axe, pour les seize types", () => {
    for (const type of MBTI_TYPES) {
      const items = mbtiAdvice(type, 99);
      expect(items, type).toHaveLength(4);
      expect(new Set(items.map((i) => i.id)).size, type).toBe(4);
    }
  });

  it("ne produit jamais de dimension Noa", () => {
    for (const type of MBTI_TYPES) {
      for (const item of mbtiAdvice(type, 99)) {
        expect(item.source).toBe("mbti");
        expect(item.id).toMatch(/^mbti:[EISNTFJP]$/);
        for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
          expect(item.id, `${type} / ${dimension}`).not.toContain(dimension);
        }
      }
    }
  });

  it("ne dresse aucun portrait de type", () => {
    // « Les INFJ sont… » est proscrit : les conseils sont indexés par AXE, pas
    // par type, donc deux types partageant un axe partagent ce conseil-là.
    const infj = mbtiAdvice("INFJ", 99).map((i) => i.id);
    const infp = mbtiAdvice("INFP", 99).map((i) => i.id);
    expect(infj.filter((id) => infp.includes(id))).toEqual(["mbti:I", "mbti:N", "mbti:F"]);
    for (const text of Object.values(MBTI_CONDUCT_ADVICE)) {
      expect(text).not.toMatch(/\b[EI][NS][TF][JP]\b/);
    }
  });

  it("ne produit aucun sujet à approfondir relié à la Scorecard", () => {
    expect(supportsInterviewTopics(contextOf("mbti", { type: "INFJ" }))).toBe(false);
  });
});

describe("Big Five déclaré", () => {
  it("produit des conseils à partir des dimensions déclarées", () => {
    const items = bigFiveAdvice(BIG_FIVE_ALL, 99);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.source === "big_five")).toBe(true);
  });

  it("ne produit jamais de dimension Noa", () => {
    for (const trait of BIG_FIVE_TRAITS) {
      for (const level of ["low", "medium", "high"] as const) {
        for (const item of bigFiveAdvice({ ...BIG_FIVE_ALL, [trait]: level }, 99)) {
          expect(item.id).toMatch(/^big_five:[a-z_]+:(low|high)$/);
          for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
            expect(item.id, dimension).not.toContain(`:${dimension}:`);
          }
        }
      }
    }
  });

  it("ne tire aucun conseil de la stabilité émotionnelle", () => {
    // La seule des cinq qui touche à un terrain adjacent à la santé. Elle reste
    // enregistrée telle qu'elle a été déclarée ; elle ne produit rien.
    expect(BIG_FIVE_CONDUCT_ADVICE.emotional_stability).toBeUndefined();
    const neutre: Record<BigFiveTrait, BigFiveLevel> = {
      openness: "medium",
      conscientiousness: "medium",
      extraversion: "medium",
      agreeableness: "medium",
      emotional_stability: "low",
    };
    expect(bigFiveAdvice(neutre, 99)).toEqual([]);
    expect(bigFiveAdvice({ ...neutre, emotional_stability: "high" }, 99)).toEqual([]);
  });

  it("ne dit rien d'un niveau intermédiaire", () => {
    for (const trait of BIG_FIVE_TRAITS) {
      const items = bigFiveAdvice({ ...BIG_FIVE_ALL, [trait]: "medium" }, 99);
      expect(items.some((i) => i.id.startsWith(`big_five:${trait}:`)), trait).toBe(false);
    }
  });

  it("ne produit aucun sujet à approfondir relié à la Scorecard", () => {
    expect(supportsInterviewTopics(contextOf("big_five", BIG_FIVE_ALL))).toBe(false);
  });
});

// ─── Le questionnaire Noa, et lui seul ──────────────────────────────────────

describe("questionnaire Noa", () => {
  it("est le seul à pouvoir ouvrir un sujet relié à la Scorecard", () => {
    const scores = noaScores({ autonomy: "low_preference" });
    expect(supportsInterviewTopics(contextOf("noa_work_preferences", scores))).toBe(true);
    expect(supportsInterviewTopics(NO_CONTEXT)).toBe(false);
  });

  it("est le seul à produire des conseils indexés par dimension Noa", () => {
    const items = noaAdvice(noaScores({ structure: "high_preference", autonomy: "low_preference" }), 99);
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.source === "noa")).toBe(true);
    expect(items.map((i) => i.id).sort()).toEqual(["noa:autonomy:low_preference", "noa:structure:high_preference"]);
  });

  it("n'affiche aucune mise en garde : la personne a répondu elle-même", () => {
    expect(guidanceSourceLine("noa")).toBeNull();
  });

  it("ignore les préférences qui ne sont pas nettes", () => {
    expect(noaAdvice(noaScores({}), 99)).toEqual([]);
  });
});

// ─── La séparation, vue depuis la donnée produite ───────────────────────────

describe("aucun pont entre les modèles", () => {
  it("préfixe chaque conseil par son modèle d'origine", () => {
    for (const item of everyDeclaredItem()) {
      expect(item.source, item.id).not.toBe("noa");
      expect(item.id, item.id).toMatch(/^(disc|mbti|big_five):/);
    }
  });

  it("n'écrit jamais le même conseil dans deux modèles", () => {
    // Un texte partagé trahirait une table partagée, donc une conversion.
    const noaTexts = new Set(
      WORK_PREFERENCE_DIMENSIONS.flatMap((d) => [
        INTERVIEW_CONDUCT_ADVICE[d].low_preference,
        INTERVIEW_CONDUCT_ADVICE[d].high_preference,
      ]),
    );
    for (const item of everyDeclaredItem()) {
      expect(noaTexts.has(item.action), item.id).toBe(false);
    }
  });

  it("porte la prudence une seule fois, au-dessus de la liste", () => {
    // Chaque puce a porté « Le résultat déclaré peut suggérer… ». Répété quatre
    // fois, ce préambule finissait par masquer le conseil lui-même. La mise en
    // garde vit désormais dans guidanceSourceLine, et nulle part ailleurs.
    const PREAMBULES = [
      /le résultat déclaré/i,
      /peut sugg[ée]rer/i,
      /peut indiquer/i,
      /laisse penser/i,
      /le profil (peut|semble)/i,
      /^une préférence pour/i,
    ];
    for (const item of everyDeclaredItem()) {
      for (const preambule of PREAMBULES) {
        expect(item.action, `${item.id} — ${item.action}`).not.toMatch(preambule);
      }
    }
  });
});

// ─── La ligne de source ─────────────────────────────────────────────────────
// La seule mise en garde de l'écran, dite une fois. Elle nomme le modèle et
// jamais le résultat, et n'existe pas pour le questionnaire Noa.

describe("guidanceSourceLine", () => {
  const DECLARES = ["disc", "mbti", "big_five"] as const;

  it("ne dit rien pour le questionnaire Noa", () => {
    // Les réponses viennent de la personne : il n'y a rien à relativiser, et
    // les conseils s'affichent directement.
    expect(guidanceSourceLine("noa")).toBeNull();
  });

  it("n'affiche jamais le résultat déclaré", () => {
    // Ni « INTJ », ni « C/S », ni un niveau Big Five, ni un chiffre.
    const niveaux = Object.values(BIG_FIVE_LEVEL_LABEL);
    for (const source of DECLARES) {
      const line = guidanceSourceLine(source)!;
      expect(line, source).not.toMatch(/\b[EI][NS][TF][JP]\b|\b[DISC]\/[DISC]\b/);
      expect(line, source).not.toMatch(/\d/);
      for (const niveau of niveaux) expect(line, `${source} / ${niveau}`).not.toContain(niveau);
    }
  });

  it("nomme le modèle et porte la nuance", () => {
    for (const source of DECLARES) {
      const line = guidanceSourceLine(source)!;
      expect(line, source).toContain("déclaré");
      expect(line, source).toContain("restent indicatives");
      expect(line.endsWith("."), source).toBe(true);
    }
    expect(guidanceSourceLine("disc")).toContain("DISC");
    expect(guidanceSourceLine("mbti")).toContain("MBTI");
    expect(guidanceSourceLine("big_five")).toContain("Big Five");
  });
});

// ─── Ce qu'aucun conseil ne peut dire, quelle que soit sa source ────────────

describe("ce qu'un conseil ne dit jamais", () => {
  const allTexts = [
    ...WORK_PREFERENCE_DIMENSIONS.flatMap((d) => [
      INTERVIEW_CONDUCT_ADVICE[d].low_preference,
      INTERVIEW_CONDUCT_ADVICE[d].high_preference,
    ]),
    ...everyDeclaredItem().map((i) => i.action),
  ];

  it("ne porte ni chiffre, ni jugement, ni vocabulaire de personnalité", () => {
    for (const text of allTexts) {
      expect(text, text).not.toMatch(/\d/);
      expect(text, text).not.toMatch(/compéten|recommand|recruter|écarter|notation|niveau|convient|adapté/i);
      expect(text, text).not.toMatch(/cette personne est|ce profil est|manque d/i);
      expect(containsForbiddenPreferenceWording(text), text).toBe(false);
    }
  });

  it("ne recoupe jamais les conseils de management", () => {
    // Deux tables, deux usages : mener un entretien d'une heure n'est pas
    // encadrer quelqu'un sur trois mois. Si elles convergent, l'une des deux
    // est au mauvais endroit.
    const management = new Set(
      WORK_PREFERENCE_DIMENSIONS.flatMap((d) => [
        PREFERENCE_RECOMMENDATION[d].low_preference,
        PREFERENCE_RECOMMENDATION[d].high_preference,
      ]),
    );
    for (const text of allTexts) expect(management.has(text), text).toBe(false);
  });

  it("n'écrit jamais deux fois la même phrase", () => {
    const actions = [
      ...WORK_PREFERENCE_DIMENSIONS.flatMap((d) => [
        INTERVIEW_CONDUCT_ADVICE[d].low_preference,
        INTERVIEW_CONDUCT_ADVICE[d].high_preference,
      ]),
      ...Object.values(DISC_CONDUCT_ADVICE),
      ...Object.values(MBTI_CONDUCT_ADVICE),
      ...Object.values(BIG_FIVE_CONDUCT_ADVICE).flatMap((byLevel) => [byLevel!.low, byLevel!.high]),
    ];
    expect(new Set(actions).size).toBe(actions.length);
  });

  it("s'accompagne d'un rappel unique sous la liste", () => {
    expect(GUIDANCE_FOOTNOTE).toBe(
      "Ces conseils servent uniquement à faciliter l'échange et n'entrent pas dans l'évaluation.",
    );
  });

  it("commence par une consigne, pas par une précaution", () => {
    // Un conseil dit ce que le recruteur FAIT. La prudence, elle, est dite une
    // seule fois au-dessus de la liste.
    for (const text of allTexts) {
      expect(text, text).toMatch(/^[A-ZÀÉÈÊÎÔÙ]/);
      expect(text, text).not.toMatch(/^(le résultat|cela|ce profil|une préférence|il se peut)/i);
    }
  });
});

// ─── L'aiguillage ───────────────────────────────────────────────────────────

describe("buildCommunicationGuidance", () => {
  it("ne dit rien sans contexte", () => {
    expect(buildCommunicationGuidance(NO_CONTEXT)).toEqual([]);
    expect(buildCommunicationGuidance(contextOf("mbti", { type: "INFJ" }), 0)).toEqual([]);
  });

  it("plafonne, quelle que soit la source", () => {
    const contexts = [
      contextOf("noa_work_preferences", noaScores({
        structure: "high_preference", autonomy: "low_preference", interaction: "high_preference",
        initiative: "low_preference", change: "high_preference", feedback: "low_preference",
      })),
      contextOf("disc", { primary: "D", secondary: "I" }),
      contextOf("mbti", { type: "ENTJ" }),
      contextOf("big_five", BIG_FIVE_ALL),
    ];
    for (const context of contexts) {
      expect(buildCommunicationGuidance(context).length, context.kind).toBeLessThanOrEqual(MAX_CONDUCT_ADVICE);
      expect(buildCommunicationGuidance(context).length, context.kind).toBeGreaterThan(0);
    }
  });

  it("achemine chaque contexte vers son propre jeu de règles", () => {
    expect(buildCommunicationGuidance(contextOf("disc", { primary: "C", secondary: null }))).toEqual(discAdvice("C", null));
    expect(buildCommunicationGuidance(contextOf("mbti", { type: "INFJ" }))).toEqual(mbtiAdvice("INFJ"));
    expect(buildCommunicationGuidance(contextOf("big_five", BIG_FIVE_ALL))).toEqual(bigFiveAdvice(BIG_FIVE_ALL));
  });
});
