import { describe, it, expect } from "vitest";
import { goalProgress, progressWording, summarizeGoals } from "@/lib/noa/onboarding/progress";
import type { OnboardingGoal } from "@/lib/noa/types";

function goal(partial: Partial<OnboardingGoal>): OnboardingGoal {
  return {
    id: partial.id ?? "g",
    onboarding_id: "onb",
    mission_objective_id: partial.mission_objective_id ?? null,
    phase: partial.phase ?? "j90",
    label: partial.label ?? "Objectif",
    kind: partial.kind ?? "qualitative",
    metric: null,
    target_value: partial.target_value ?? null,
    current_value: partial.current_value ?? null,
    status: partial.status ?? "non_commence",
    position: 0,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };
}



describe("goalProgress", () => {
  it("calcule l'avancement d'un objectif chiffré", () => {
    expect(goalProgress(goal({ kind: "numeric", target_value: 150, current_value: 105 }))).toBe(70);
  });

  it("traite une valeur absente comme un démarrage à zéro", () => {
    expect(goalProgress(goal({ kind: "numeric", target_value: 150, current_value: null }))).toBe(0);
  });

  it("plafonne un dépassement à 100 %", () => {
    expect(goalProgress(goal({ kind: "numeric", target_value: 150, current_value: 172 }))).toBe(100);
  });

  it("ne calcule rien pour un objectif qualitatif", () => {
    expect(goalProgress(goal({ kind: "qualitative", status: "atteint" }))).toBeNull();
  });

  it("ne divise pas par une cible nulle ou absente", () => {
    expect(goalProgress(goal({ kind: "numeric", target_value: 0, current_value: 5 }))).toBeNull();
    expect(goalProgress(goal({ kind: "numeric", target_value: null, current_value: 5 }))).toBeNull();
  });

  it("traduit l'avancement en langage courant", () => {
    expect(progressWording(100)).toBe("Atteint");
    expect(progressWording(70)).toBe("En bonne voie");
    expect(progressWording(40)).toBe("En progression");
    expect(progressWording(10)).toBe("Démarrage");
    expect(progressWording(null)).toBeNull();
  });
});

describe("summarizeGoals", () => {
  it("répartit les objectifs par issue", () => {
    const summary = summarizeGoals([
      goal({ id: "a", kind: "numeric", target_value: 150, current_value: 172 }),
      goal({ id: "b", status: "atteint" }),
      goal({ id: "c", status: "en_cours" }),
      goal({ id: "d", kind: "numeric", target_value: 10, current_value: 6 }),
      goal({ id: "e", status: "bloque" }),
      goal({ id: "f", status: "non_commence" }),
    ]);
    expect(summary).toEqual({ atteints: 2, partiels: 2, nonAtteints: 1, bloques: 1, total: 6 });
  });

  it("compte un objectif jamais démarré comme non atteint", () => {
    expect(summarizeGoals([goal({ kind: "numeric", target_value: 100, current_value: 0 })]).nonAtteints).toBe(1);
  });
});
