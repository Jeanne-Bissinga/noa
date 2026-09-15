import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import * as context from "@/lib/noa/preferences/context";

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}
import {
  parseDiscResult, parseMbtiResult, parseBigFiveResult, MBTI_TYPES, mbtiPreferences, BIG_FIVE_TRAITS,
} from "@/lib/noa/preferences/declared-tests";
import { buildPreferenceContext } from "@/lib/noa/preferences/context";
import { WORK_PREFERENCE_DIMENSIONS } from "@/lib/noa/preferences/questions";

describe("DISC déclaré", () => {
  it("accepte un principal seul ou avec un secondaire différent", () => {
    expect(parseDiscResult({ primary: "C" })).toEqual({ primary: "C", secondary: null });
    expect(parseDiscResult({ primary: "C", secondary: "" })).toEqual({ primary: "C", secondary: null });
    expect(parseDiscResult({ primary: "C", secondary: "S" })).toEqual({ primary: "C", secondary: "S" });
  });

  it("refuse un secondaire identique au principal", () => {
    expect(parseDiscResult({ primary: "C", secondary: "C" })).toBeNull();
  });

  it("refuse un profil inconnu ou absent", () => {
    expect(parseDiscResult({ primary: "X" })).toBeNull();
    expect(parseDiscResult({ secondary: "S" })).toBeNull();
    expect(parseDiscResult({ primary: "C", secondary: "Z" })).toBeNull();
    expect(parseDiscResult(null)).toBeNull();
  });

  it("reste un DISC, sans traduction vers les dimensions Noa", () => {
    const context = buildPreferenceContext({
      status: "completed", assessment_type: "disc", structured_result: { primary: "C", secondary: null }, questionnaire_scores: null,
    });
    expect(context).toEqual({ kind: "disc", primary: "C", secondary: null });
    // Le contexte porte les lettres déclarées et rien d'autre : ni dimension
    // Noa, ni orientation, ni moyenne.
    const serialized = JSON.stringify(context);
    for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
      expect(serialized, dimension).not.toContain(dimension);
    }
    expect(serialized).not.toMatch(/orientation|mean|preference/i);
  });
});

describe("MBTI déclaré", () => {
  it("accepte les 16 types, et rien d'autre", () => {
    expect(MBTI_TYPES).toHaveLength(16);
    for (const t of MBTI_TYPES) expect(parseMbtiResult({ type: t })).toEqual({ type: t });
    expect(parseMbtiResult({ type: "XXXX" })).toBeNull();
    expect(parseMbtiResult({ type: "infj" })).toBeNull();
    expect(parseMbtiResult({ type: "" })).toBeNull();
    expect(parseMbtiResult(null)).toBeNull();
  });

  it("ne produit aucun DISC", () => {
    const context = buildPreferenceContext({
      status: "completed", assessment_type: "mbti", structured_result: { type: "ESTP" }, questionnaire_scores: null,
    });
    expect(context.kind).toBe("mbti");
    expect(JSON.stringify(context)).not.toMatch(/primary|secondary/);
  });

  it("lit les quatre axes, pas un portrait", () => {
    expect(mbtiPreferences("INFJ")).toEqual({ energy: "I", information: "N", decision: "F", organisation: "J" });
    expect(mbtiPreferences("ESTP")).toEqual({ energy: "E", information: "S", decision: "T", organisation: "P" });
  });

  it("ne produit aucune dimension Noa", () => {
    for (const type of MBTI_TYPES) {
      const context = buildPreferenceContext({
        status: "completed", assessment_type: "mbti", structured_result: { type }, questionnaire_scores: null,
      });
      const serialized = JSON.stringify(context);
      for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
        expect(serialized, `${type} / ${dimension}`).not.toContain(dimension);
      }
    }
  });
});

describe("Big Five déclaré", () => {
  const full = { openness: "high", conscientiousness: "low", extraversion: "medium", agreeableness: "medium", emotional_stability: "low" } as const;

  it("exige les cinq dimensions", () => {
    expect(BIG_FIVE_TRAITS).toHaveLength(5);
    expect(parseBigFiveResult(full)).toEqual(full);
    const { agreeableness: _omit, ...partial } = full;
    void _omit;
    expect(parseBigFiveResult(partial)).toBeNull();
  });

  it("n'accepte que low / medium / high", () => {
    expect(parseBigFiveResult({ ...full, openness: "very_high" })).toBeNull();
    expect(parseBigFiveResult({ ...full, openness: 4 })).toBeNull();
  });

  it("ne produit ni DISC, ni score, ni dimension Noa", () => {
    const context = buildPreferenceContext({
      status: "completed", assessment_type: "big_five", structured_result: full, questionnaire_scores: null,
    });
    expect(context.kind).toBe("big_five");
    const serialized = JSON.stringify(context);
    expect(serialized).not.toMatch(/primary|secondary|mean|orientation/);
    for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
      expect(serialized, dimension).not.toContain(dimension);
    }
  });

  it("garde les cinq dimensions telles qu'elles ont été déclarées", () => {
    const context = buildPreferenceContext({
      status: "completed", assessment_type: "big_five", structured_result: full, questionnaire_scores: null,
    });
    // Rien n'est agrégé, rien n'est converti : ce qui entre ressort à
    // l'identique. La lecture prudente se fait au moment du conseil, pas ici.
    expect(context).toEqual({ kind: "big_five", levels: full });
  });
});


// ─── Aucun pont entre les modèles ───────────────────────────────────────────
// La garantie est structurelle : il n'existe plus de fonction qui traduise un
// modèle externe vers les six dimensions Noa. Elle a existé, sous le nom
// `preferenceOrientation` ; ce test empêche qu'elle revienne par un merge.

describe("séparation des modèles", () => {
  it("n'expose plus de fonction de projection", () => {
    expect(Object.keys(context)).not.toContain("preferenceOrientation");
    expect(Object.keys(context).sort()).toEqual([
      "NO_CONTEXT",
      "buildPreferenceContext",
      "supportsInterviewTopics",
    ]);
  });

  it("ne mentionne plus les dimensions Noa dans le module de contexte", () => {
    const source = readFileSync(path.resolve(__dirname, "../../lib/noa/preferences/context.ts"), "utf8");
    // Le mot peut rester dans un commentaire qui explique la règle ; c'est le
    // TYPE, donc toute structure indexée par dimension, qui ne doit plus exister.
    expect(source).not.toMatch(/WorkPreferenceDimension/);
  });

  it("n'appelle plus de projection nulle part", () => {
    for (const dir of ["app", "lib"]) {
      for (const file of walk(path.resolve(__dirname, "../..", dir))) {
        expect(readFileSync(file, "utf8"), file).not.toContain("preferenceOrientation");
      }
    }
  });
});
