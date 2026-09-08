import { describe, it, expect } from "vitest";
import { buildTimeline, interviewTypeOfStep, nextStep } from "@/lib/noa/onboarding/timeline";
import type { IntegrationInterviewType, Interview } from "@/lib/noa/types";

function interview(type: IntegrationInterviewType, offsetDays: number, partial: Partial<Interview> = {}): Interview {
  return {
    id: type, candidate_id: "cand", type, format: null, duration_minutes: null,
    status: "planifie", recording_status: "none", transcript: null, interviewer_id: null,
    scheduled_at: new Date(Date.UTC(2026, 2, 2, 9) + offsetDays * 86400000).toISOString(),
    completed_at: null, created_at: "2026-03-01", ...partial,
  };
}

const NOW = new Date("2026-03-20T12:00:00.000Z");

const INTERVIEWS = [
  interview("integration_j1", 0, { status: "termine" }),
  interview("integration_j30", 30),
  interview("integration_j60", 60),
  interview("integration_j90", 90),
];

const build = (over: Partial<Parameters<typeof buildTimeline>[0]> = {}) =>
  buildTimeline({
    arrivalDate: "2026-03-02",
    interviews: INTERVIEWS,
    beforeArrivalPending: false,
    now: NOW,
    ...over,
  });

describe("buildTimeline", () => {
  it("rend exactement cinq étapes, dans l'ordre", () => {
    expect(build().map((s) => s.key)).toEqual(["avant_arrivee", "j1", "j30", "j60", "j90"]);
    expect(build().map((s) => s.label)).toEqual(["Avant l'arrivée", "J1", "J30", "J60", "J90"]);
  });

  it("n'a plus aucune étape hebdomadaire", () => {
    expect(JSON.stringify(build().map((s) => s.key))).not.toMatch(/s[1-4]/);
  });

  it("rend les cinq étapes même sans calendrier", () => {
    // Le manager doit voir le parcours qui attend la personne, même avant que
    // la date d'arrivée ne soit fixée.
    const timeline = build({ arrivalDate: null, interviews: [] });
    expect(timeline).toHaveLength(5);
    expect(timeline.slice(1).every((s) => s.state === "a_venir")).toBe(true);
  });

  it("marque la préparation « à faire » tant qu'un préparatif reste", () => {
    const timeline = build({ arrivalDate: null, interviews: [], beforeArrivalPending: true });
    expect(timeline[0].state).toBe("courante");
    // Les préférences n'appartiennent pas à la chronologie : elles ne bloquent
    // jamais le J1.
    expect(timeline[1].state).toBe("a_venir");
  });

  it("distingue mené, en cours, et en attente", () => {
    const states = Object.fromEntries(build().map((s) => [s.key, s.state]));
    expect(states.avant_arrivee).toBe("termine");
    expect(states.j1).toBe("termine");
    expect(states.j30).toBe("courante");
    expect(states.j60).toBe("a_venir");
  });

  it("ne marque pas une étape terminée parce que sa date est passée", () => {
    // C'est la distinction qui manquait au parcours précédent.
    const j45 = new Date("2026-04-16T12:00:00.000Z");
    const states = Object.fromEntries(build({ now: j45 }).map((s) => [s.key, s.state]));
    expect(states.j30).not.toBe("termine");
  });

  it("ne met en avant qu'une seule étape, même quand plusieurs dates sont dépassées", () => {
    // Au jour 95 sans aucun entretien mené, les quatre dates sont derrière
    // nous. Signaler les quatre ne dirait pas où reprendre : seule la première
    // non menée prend la main, les autres restent en attente.
    const j95 = new Date("2026-06-05T12:00:00.000Z");
    const rien = INTERVIEWS.map((i) => ({ ...i, status: "planifie" as const }));
    const states = Object.fromEntries(build({ now: j95, interviews: rien }).map((s) => [s.key, s.state]));
    expect(states.j1).toBe("courante");
    expect([states.j30, states.j60, states.j90]).toEqual(["a_venir", "a_venir", "a_venir"]);
  });

  it("ne met aucune étape en avant tant qu'aucun entretien n'est programmé", () => {
    // Le plan n'est pas validé : le parcours se lit, mais rien n'y est « à
    // faire » — le geste attendu est ailleurs, dans les préparatifs.
    const timeline = build({ interviews: [] });
    expect(timeline.slice(1).every((s) => s.state === "a_venir")).toBe(true);
  });

  it("laisse la préparation à venir avant la date d'arrivée", () => {
    const timeline = build({ arrivalDate: "2026-04-01", interviews: [] });
    expect(timeline[0].state).toBe("a_venir");
    expect(timeline[1].state).toBe("a_venir");
  });
});

describe("nextStep", () => {
  it("désigne l'étape en cours, sinon la première à venir", () => {
    const j45 = new Date("2026-04-16T12:00:00.000Z");
    expect(nextStep(build({ now: j45 }))?.key).toBe("j30");
    expect(nextStep(build())?.key).toBe("j30");
  });
});

describe("interviewTypeOfStep", () => {
  it("relie chaque étape à son entretien, sauf la préparation", () => {
    expect(interviewTypeOfStep("j1")).toBe("integration_j1");
    expect(interviewTypeOfStep("j90")).toBe("integration_j90");
    expect(interviewTypeOfStep("avant_arrivee")).toBeNull();
  });
});
