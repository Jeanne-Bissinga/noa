import { describe, it, expect } from "vitest";
import {
  parseDiscResult, parseMbtiResult, parseBigFiveResult, MBTI_TYPES, mbtiPreferences, BIG_FIVE_TRAITS,
} from "@/lib/noa/onboarding/declared-tests";
import { buildPreferenceContext, preferenceOrientation } from "@/lib/noa/onboarding/personalization";

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

  it("contextualise sans toucher à la question principale", () => {
    const context = buildPreferenceContext(null, {
      status: "completed", assessment_type: "disc", structured_result: { primary: "C", secondary: null }, questionnaire_scores: null,
    });
    expect(context).toEqual({ kind: "disc", primary: "C", secondary: null });
    expect(preferenceOrientation(context, "structure")).toBe("high_preference");
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
    const context = buildPreferenceContext(null, {
      status: "completed", assessment_type: "mbti", structured_result: { type: "ESTP" }, questionnaire_scores: null,
    });
    expect(context.kind).toBe("mbti");
    expect(JSON.stringify(context)).not.toMatch(/primary|secondary/);
  });

  it("lit les quatre préférences, pas un portrait", () => {
    expect(mbtiPreferences("INFJ")).toEqual({ energy: "I", information: "N", decision: "F", organisation: "J" });
    const introverted = buildPreferenceContext(null, {
      status: "completed", assessment_type: "mbti", structured_result: { type: "INTP" }, questionnaire_scores: null,
    });
    const extraverted = buildPreferenceContext(null, {
      status: "completed", assessment_type: "mbti", structured_result: { type: "ESFJ" }, questionnaire_scores: null,
    });
    expect(preferenceOrientation(introverted, "interaction")).toBe("low_preference");
    expect(preferenceOrientation(extraverted, "interaction")).toBe("high_preference");
    expect(preferenceOrientation(introverted, "structure")).toBe("low_preference"); // P
    expect(preferenceOrientation(extraverted, "structure")).toBe("high_preference"); // J
    // Pas de lecture sur ce que les quatre lettres ne disent pas.
    expect(preferenceOrientation(introverted, "autonomy")).toBeNull();
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

  it("ne produit aucun DISC ni score Noa", () => {
    const context = buildPreferenceContext(null, {
      status: "completed", assessment_type: "big_five", structured_result: full, questionnaire_scores: null,
    });
    expect(context.kind).toBe("big_five");
    expect(JSON.stringify(context)).not.toMatch(/primary|secondary|mean|orientation/);
  });

  it("ne personnalise pas sur une valeur intermédiaire", () => {
    const context = buildPreferenceContext(null, {
      status: "completed", assessment_type: "big_five", structured_result: full, questionnaire_scores: null,
    });
    expect(preferenceOrientation(context, "interaction")).toBeNull(); // extraversion medium
    expect(preferenceOrientation(context, "change")).toBe("high_preference"); // openness high
    expect(preferenceOrientation(context, "structure")).toBe("low_preference"); // conscientiousness low
  });
});
