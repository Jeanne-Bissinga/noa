import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
import {
  WORK_PREFERENCE_QUESTIONS,
  WORK_PREFERENCE_DIMENSIONS,
  ANSWER_SCALE,
  isAnswerValue,
  firstUnansweredIndex,
  questionsForDimensions,
  parseSelectedDimensions,
} from "@/lib/noa/preferences/questions";
import {
  scoreWorkPreferences,
  scoredDimensions,
  normalizeAnswer,
  orientationOf,
  highlightPreferences,
  parseWorkPreferenceScores,
  MAX_RECOMMENDATIONS,
  PREFERENCE_LABEL,
  PREFERENCE_RECOMMENDATION,
} from "@/lib/noa/preferences/scoring";
import type { WorkPreferenceDimension } from "@/lib/noa/types";

function answersWhere(fn: (q: (typeof WORK_PREFERENCE_QUESTIONS)[number]) => number): Record<string, number> {
  return Object.fromEntries(WORK_PREFERENCE_QUESTIONS.map((q) => [q.id, fn(q)]));
}

describe("questionnaire", () => {
  it("compte exactement 24 questions, 6 dimensions, 4 questions par dimension", () => {
    expect(WORK_PREFERENCE_QUESTIONS).toHaveLength(24);
    expect(WORK_PREFERENCE_DIMENSIONS).toHaveLength(6);
    for (const d of WORK_PREFERENCE_DIMENSIONS) {
      expect(WORK_PREFERENCE_QUESTIONS.filter((q) => q.dimension === d)).toHaveLength(4);
    }
  });

  it("n'a aucun identifiant ni texte en double", () => {
    expect(new Set(WORK_PREFERENCE_QUESTIONS.map((q) => q.id)).size).toBe(24);
    expect(new Set(WORK_PREFERENCE_QUESTIONS.map((q) => q.text)).size).toBe(24);
  });

  it("respecte le sens de scoring attendu pour chaque question", () => {
    const reverse = WORK_PREFERENCE_QUESTIONS.filter((q) => q.scoring === "reverse").map((q) => q.id);
    expect(reverse).toEqual(["q4", "q8", "q9", "q13", "q17", "q18", "q19", "q20", "q21", "q22", "q23", "q24"]);
  });

  it("n'offre que 4 réponses, sans neutre", () => {
    expect(ANSWER_SCALE.map((a) => a.value)).toEqual([1, 2, 3, 4]);
    expect(ANSWER_SCALE.map((a) => a.label)).toEqual(["Pas d'accord", "Plutôt pas d'accord", "Plutôt d'accord", "D'accord"]);
    expect([0, 5, 2.5, "3", null].some(isAnswerValue)).toBe(false);
  });

  it("reprend à la première question sans réponse", () => {
    expect(firstUnansweredIndex({})).toBe(0);
    expect(firstUnansweredIndex({ q1: 3, q2: 2 })).toBe(2);
    // Une réponse invalide compte comme absente.
    expect(firstUnansweredIndex({ q1: 3, q2: 9 })).toBe(1);
    expect(firstUnansweredIndex(answersWhere(() => 3))).toBeNull();
  });
});

describe("scoring", () => {
  it("inverse les questions reverse", () => {
    expect(normalizeAnswer(4, "direct")).toBe(4);
    expect(normalizeAnswer(4, "reverse")).toBe(1);
    expect(normalizeAnswer(1, "reverse")).toBe(4);
  });

  it("refuse un questionnaire incomplet ou invalide", () => {
    const partial = answersWhere(() => 3);
    delete partial.q12;
    expect(scoreWorkPreferences(partial)).toBeNull();
    expect(scoreWorkPreferences({ ...answersWhere(() => 3), q5: 5 })).toBeNull();
  });

  it("calcule la moyenne par dimension selon la formule attendue", () => {
    // structure = (q1 + q7 + reverse(q13) + reverse(q19)) / 4
    const answers = answersWhere(() => 3);
    Object.assign(answers, { q1: 4, q7: 4, q13: 1, q19: 2 });
    const scores = scoreWorkPreferences(answers);
    expect(scores?.structure?.mean).toBe((4 + 4 + 4 + 3) / 4);
  });

  it("lit une préférence haute quand les quatre réponses vont dans le même sens", () => {
    const answers = answersWhere((q) => (q.dimension === "feedback" ? (q.scoring === "direct" ? 4 : 1) : 3));
    const scores = scoreWorkPreferences(answers);
    expect(scores?.feedback?.mean).toBe(4);
    expect(scores?.feedback?.standardDeviation).toBe(0);
    expect(scores?.feedback?.orientation).toBe("high_preference");
  });

  it("lit une préférence basse", () => {
    const answers = answersWhere((q) => (q.dimension === "autonomy" ? (q.scoring === "direct" ? 1 : 4) : 3));
    expect(scoreWorkPreferences(answers)?.autonomy?.orientation).toBe("low_preference");
  });

  it("lit « mixed » quand la moyenne est nette mais les réponses dispersées", () => {
    // 4-4-4-1 : moyenne 3.25, mais écart-type 1.3.
    const answers = answersWhere(() => 3);
    Object.assign(answers, { q2: 4, q14: 4, q8: 1, q20: 4 }); // interaction : 4,4,4,1 normalisés
    const scores = scoreWorkPreferences(answers);
    expect(scores?.interaction?.mean).toBe(3.25);
    expect(scores?.interaction?.orientation).toBe("mixed");
  });

  it("lit « mixed » quand tout est au milieu", () => {
    const scores = scoreWorkPreferences(answersWhere(() => 3));
    expect(WORK_PREFERENCE_DIMENSIONS.every((d) => scores?.[d]?.orientation === "mixed")).toBe(true);
  });

  it("applique les seuils d'orientation", () => {
    expect(orientationOf(3.25, 0.75)).toBe("high_preference");
    expect(orientationOf(3.25, 0.76)).toBe("mixed");
    expect(orientationOf(1.75, 0.5)).toBe("low_preference");
    expect(orientationOf(2.5, 0)).toBe("mixed");
  });

  it("borne les moyennes entre 1 et 4", () => {
    for (const level of [1, 2, 3, 4] as const) {
      const scores = scoreWorkPreferences(answersWhere(() => level));
      for (const d of WORK_PREFERENCE_DIMENSIONS) {
        expect(scores?.[d]?.mean).toBeGreaterThanOrEqual(1);
        expect(scores?.[d]?.mean).toBeLessThanOrEqual(4);
      }
    }
  });

  it("ne produit jamais de DISC", () => {
    const scores = scoreWorkPreferences(answersWhere(() => 4));
    const serialized = JSON.stringify(scores);
    expect(serialized).not.toMatch(/"(D|I|S|C)"|disc|primary|secondary/);
    expect(Object.keys(scores ?? {})).toEqual(WORK_PREFERENCE_DIMENSIONS);
  });

  it("relit des scores stockés et refuse une forme inattendue", () => {
    const scores = scoreWorkPreferences(answersWhere(() => 4));
    expect(parseWorkPreferenceScores(JSON.parse(JSON.stringify(scores)))).toEqual(scores);
    expect(parseWorkPreferenceScores({ structure: { mean: 3 } })).toBeNull();
    expect(parseWorkPreferenceScores(null)).toBeNull();
  });
});

describe("lecture manager", () => {
  it("propose au plus 3 suggestions, les plus marquées d'abord", () => {
    // Toutes les dimensions hautes, avec des intensités différentes.
    const answers = answersWhere((q) => {
      const strength: Record<WorkPreferenceDimension, number> = { structure: 4, autonomy: 4, interaction: 4, initiative: 4, change: 4, feedback: 4 };
      const v = strength[q.dimension];
      return q.scoring === "direct" ? v : 5 - v;
    });
    // Rendre "change" et "feedback" moins nets (3.25 nets)
    Object.assign(answers, { q4: 2, q22: 2, q17: 2, q23: 2 });
    const scores = scoreWorkPreferences(answers)!;
    const highlights = highlightPreferences(scores);
    expect(highlights.length).toBeLessThanOrEqual(MAX_RECOMMENDATIONS);
    expect(highlights.map((h) => h.dimension)).not.toContain("change");
    expect(highlights.map((h) => h.dimension)).not.toContain("feedback");
  });

  it("n'affiche aucune suggestion quand rien n'est marqué", () => {
    expect(highlightPreferences(scoreWorkPreferences(answersWhere(() => 3))!)).toEqual([]);
  });

  it("a un libellé et une recommandation pour chaque orientation nette", () => {
    for (const d of WORK_PREFERENCE_DIMENSIONS) {
      expect(PREFERENCE_LABEL[d].low_preference).toBeTruthy();
      expect(PREFERENCE_LABEL[d].mixed).toBeTruthy();
      expect(PREFERENCE_LABEL[d].high_preference).toBeTruthy();
      expect(PREFERENCE_RECOMMENDATION[d].low_preference).toBeTruthy();
      expect(PREFERENCE_RECOMMENDATION[d].high_preference).toBeTruthy();
    }
  });

  it("ne qualifie jamais la personne", () => {
    const forbidden = /cette personne est|cette personne sera|ce profil est|bon profil|mauvais profil|incohéren|contradictoire|score faible/i;
    const texts = WORK_PREFERENCE_DIMENSIONS.flatMap((d) => [
      ...Object.values(PREFERENCE_LABEL[d]),
      ...Object.values(PREFERENCE_RECOMMENDATION[d]),
    ]);
    for (const t of texts) expect(t).not.toMatch(forbidden);
  });
});


// ─── Minimisation : poser moins de questions, à terme ───────────────────────
// Le moteur sait déjà travailler sur un sous-ensemble de dimensions. Rien ne
// l'active : la sélection dynamique attend que la correspondance Scorecard ->
// dimensions soit assez fiable pour qu'une question retirée ne soit pas une
// question qui manquait.

describe("sous-ensemble de dimensions", () => {
  it("ne pose que les questions des dimensions demandées", () => {
    expect(questionsForDimensions()).toHaveLength(24);
    expect(questionsForDimensions(WORK_PREFERENCE_DIMENSIONS)).toHaveLength(24);
    expect(questionsForDimensions(["structure", "autonomy", "change"])).toHaveLength(12);
    expect(questionsForDimensions(["structure"]).map((q) => q.id)).toEqual(["q1", "q7", "q13", "q19"]);
    expect(questionsForDimensions([])).toEqual([]);
  });

  it("conserve l'ordre du questionnaire dans un sous-ensemble", () => {
    const ids = questionsForDimensions(["autonomy", "structure"]).map((q) => q.id);
    expect(ids).toEqual([...ids].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))));
  });

  it("score un sous-ensemble sans exiger les 24 réponses", () => {
    const partiel: Record<string, number> = {};
    for (const q of questionsForDimensions(["structure", "autonomy"])) {
      partiel[q.id] = q.scoring === "direct" ? 4 : 1;
    }
    const scores = scoreWorkPreferences(partiel, ["structure", "autonomy"]);
    expect(scoredDimensions(scores!)).toEqual(["structure", "autonomy"]);
    expect(scores?.structure?.orientation).toBe("high_preference");
    // Sans argument, les 24 restent exigées : le comportement d'avant.
    expect(scoreWorkPreferences(partiel)).toBeNull();
  });

  it("refuse un sous-ensemble incomplet", () => {
    const partiel: Record<string, number> = {};
    for (const q of questionsForDimensions(["structure"])) partiel[q.id] = 3;
    expect(scoreWorkPreferences(partiel, ["structure", "autonomy"])).toBeNull();
    expect(scoreWorkPreferences(partiel, [])).toBeNull();
  });

  it("reprend à la bonne place dans le questionnaire réellement posé", () => {
    const questions = questionsForDimensions(["structure"]);
    expect(firstUnansweredIndex({}, questions)).toBe(0);
    expect(firstUnansweredIndex({ q1: 3 }, questions)).toBe(1);
    expect(firstUnansweredIndex({ q1: 3, q7: 3, q13: 3, q19: 3 }, questions)).toBeNull();
  });

  it("relit une sélection stockée en rétablissant l'ordre canonique", () => {
    expect(parseSelectedDimensions(["change", "structure", "change"])).toEqual(["structure", "change"]);
    expect(parseSelectedDimensions(null)).toBeNull();
    expect(parseSelectedDimensions([])).toBeNull();
    expect(parseSelectedDimensions(["inexistante"])).toBeNull();
    expect(parseSelectedDimensions("structure")).toBeNull();
  });

  it("relit des scores partiels, et rejette une entrée à moitié écrite", () => {
    expect(parseWorkPreferenceScores({ structure: { mean: 3.5, standardDeviation: 0.2, orientation: "high_preference" } }))
      .toEqual({ structure: { mean: 3.5, standardDeviation: 0.2, orientation: "high_preference" } });
    expect(parseWorkPreferenceScores({ structure: { mean: 3.5 } })).toBeNull();
    expect(parseWorkPreferenceScores({})).toBeNull();
    expect(parseWorkPreferenceScores({ inconnue: { mean: 1 } })).toBeNull();
  });

  it("n'est pas activé : le parcours public pose toujours les 24 questions", () => {
    const page = readFileSync(path.join(ROOT, "app/integration/preferences/[token]/page.tsx"), "utf8");
    expect(page).toContain("questionsForDimensions()");
    const actions = readFileSync(path.join(ROOT, "app/integration/preferences/[token]/actions.ts"), "utf8");
    expect(actions).toMatch(/scoreWorkPreferences\(ctx\.preferences\.answers\)/);
  });
});
