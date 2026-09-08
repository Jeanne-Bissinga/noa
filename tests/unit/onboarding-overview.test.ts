import { describe, it, expect } from "vitest";
import {
  getIntegrationOverview, coarseStepOf, matchesFilter, matchesSearch, requiresManagerAction,
  stepOfInterview, STEP_LABEL, TIMELINE_STEPS,
  type IntegrationOverview, type NextActionKind, type OverviewInput,
} from "@/lib/noa/onboarding/overview";
import type {
  Candidate, IntegrationInterviewType, Interview, Onboarding,
  OnboardingInterviewConclusion, OnboardingWorkPreferences,
} from "@/lib/noa/types";

const NOW = new Date("2026-03-20T12:00:00.000Z");

function candidate(partial: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand", company_id: "co", mission_id: "m", first_name: "Léa", last_name: "Robert",
    email: null, title: "Business Developer", location: null, summary: null, cv_url: null, attachments: [],
    source: null, status: "Recrute", screening_status: "done", topgrading_status: "done", decision_status: "done",
    score: null, created_at: "2026-02-01", updated_at: "2026-02-01", ...partial,
  };
}

function onboarding(partial: Partial<Onboarding> = {}): Onboarding {
  return {
    id: "onb", company_id: "co", candidate_id: "cand", mission_id: "m", manager_id: null, status: "actif",
    start_date: "2026-03-02", mission_text: null, disc_primary: null, disc_secondary: null, disc_source: null,
    disc_assessed_at: null, created_at: "2026-03-01", updated_at: "2026-03-01", ...partial,
  };
}

function interview(type: IntegrationInterviewType, offsetDays: number, partial: Partial<Interview> = {}): Interview {
  const scheduled = new Date(Date.UTC(2026, 2, 2, 9) + offsetDays * 86400000).toISOString();
  return {
    id: type, candidate_id: "cand", type, format: null, duration_minutes: null,
    status: "planifie", recording_status: "none", transcript: null, interviewer_id: null,
    scheduled_at: scheduled, completed_at: null, created_at: "2026-03-01", ...partial,
  };
}

const SCHEDULE: Interview[] = [
  interview("integration_j1", 0),
  interview("integration_j30", 30),
  interview("integration_j60", 60),
  interview("integration_j90", 90),
];

function preferences(partial: Partial<OnboardingWorkPreferences> = {}): OnboardingWorkPreferences {
  return {
    id: "wp", onboarding_id: "onb", status: "invited", source: null, assessment_type: null, structured_result: null,
    questionnaire_answers: null, questionnaire_scores: null, token_hash: "a".repeat(64), token_expires_at: "2099-01-01",
    invited_at: "2026-03-01T10:00:00.000Z", completed_at: null, created_at: "2026-03-01", updated_at: "2026-03-01",
    ...partial,
  };
}

const COMPLETED = preferences({ status: "completed", completed_at: "2026-03-01T10:00:00.000Z" });

function overviewOf(partial: Partial<OverviewInput> = {}): IntegrationOverview {
  return getIntegrationOverview({
    candidate: candidate(),
    onboarding: onboarding(),
    interviews: SCHEDULE,
    preparedInterviewIds: [],
    conclusions: [],
    preferences: COMPLETED,
    now: NOW,
    ...partial,
  });
}

describe("le parcours tient en cinq étapes", () => {
  it("n'a plus aucune étape hebdomadaire", () => {
    expect(TIMELINE_STEPS).toEqual(["avant_arrivee", "j1", "j30", "j60", "j90"]);
    expect(Object.keys(STEP_LABEL)).not.toContain("s1");
    expect(JSON.stringify(STEP_LABEL)).not.toContain("S1");
  });

  it("associe une étape à chacun des quatre entretiens", () => {
    expect(stepOfInterview("integration_j1")).toBe("j1");
    expect(stepOfInterview("integration_j90")).toBe("j90");
    expect(stepOfInterview("screening")).toBeNull();
  });

  it("rend toujours exactement une action, avec un libellé", () => {
    const scenarios: Partial<OverviewInput>[] = [
      { onboarding: null, interviews: [] },
      { onboarding: onboarding({ status: "brouillon" }), interviews: [], preferences: COMPLETED },
      { onboarding: onboarding({ start_date: null }), interviews: [] },
      { preferences: preferences() },
      { onboarding: onboarding({ status: "termine" }) },
    ];
    for (const scenario of scenarios) {
      const o = overviewOf(scenario);
      expect(o.primaryNextAction.kind).toBeTruthy();
      expect(o.primaryNextAction.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("n'attribue jamais deux rangs de tri identiques à deux actions différentes", () => {
    // Sans retard : un entretien en retard remonte la ligne en tête quelle que
    // soit son action, et écraserait donc les rangs qu'on veut distinguer ici.
    const recent = new Date("2026-03-05T12:00:00.000Z");
    const byKind: Record<NextActionKind, Partial<OverviewInput>> = {
      creer_plan: { onboarding: null, interviews: [] },
      verifier_plan: { onboarding: onboarding({ status: "brouillon" }), interviews: [] },
      definir_date: { onboarding: onboarding({ start_date: null }), interviews: [] },
      inviter_preferences: { preferences: null, interviews: [], now: new Date("2026-02-25T12:00:00.000Z") },
      preparer_entretien: { now: recent },
      realiser_entretien: { preparedInterviewIds: ["integration_j1"], now: recent },
      attente_collaborateur: {
        preferences: preferences(),
        interviews: [],
        now: new Date("2026-02-25T12:00:00.000Z"),
      },
      aucune: { onboarding: onboarding({ status: "termine" }), interviews: [] },
    };
    const weights = new Set(
      (Object.keys(byKind) as NextActionKind[]).map((kind) => {
        const o = overviewOf(byKind[kind]);
        expect(o.primaryNextAction.kind).toBe(kind);
        return o.sortWeight;
      }),
    );
    expect(weights.size).toBe(Object.keys(byKind).length);
  });
});

describe("avant l'arrivée", () => {
  it("recruté sans intégration : plan à créer", () => {
    const o = overviewOf({ onboarding: null, interviews: [] });
    expect(o.currentStep).toBe("plan_a_creer");
    expect(o.primaryNextAction.kind).toBe("creer_plan");
    expect(o.dayNumber).toBeNull();
  });

  it("met les préférences en avant avant l'arrivée", () => {
    const o = overviewOf({
      preferences: null,
      interviews: [],
      now: new Date("2026-02-25T12:00:00.000Z"),
    });
    expect(o.primaryNextAction.kind).toBe("inviter_preferences");
    expect(o.currentStep).toBe("avant_arrivee");
  });

  it("laisse préparer plan et préférences dans les deux ordres", () => {
    const planDAbord = overviewOf({ onboarding: onboarding({ status: "brouillon" }), interviews: [] });
    const prefsDAbord = overviewOf({ preferences: null, interviews: [], now: new Date("2026-02-25T12:00:00.000Z") });
    expect(requiresManagerAction(planDAbord.primaryNextAction)).toBe(true);
    expect(requiresManagerAction(prefsDAbord.primaryNextAction)).toBe(true);
  });
});

describe("les quatre entretiens", () => {
  it("réclame de préparer le premier entretien dû", () => {
    const o = overviewOf();
    expect(o.primaryNextAction).toMatchObject({
      kind: "preparer_entretien",
      label: "Préparer l'entretien J1",
      interviewType: "integration_j1",
    });
  });

  it("réclame de le réaliser une fois préparé", () => {
    const o = overviewOf({ preparedInterviewIds: ["integration_j1"] });
    expect(o.primaryNextAction).toMatchObject({
      kind: "realiser_entretien",
      label: "Réaliser l'entretien J1",
    });
  });

  it("situe l'étape par le calendrier, pas par ce qui reste à faire", () => {
    // Au 20 mars, la personne est à J19 : l'étape est J1, et le retard se lit
    // dans l'action, pas dans l'étape.
    expect(overviewOf().currentStep).toBe("j1");
    expect(overviewOf().dayNumber).toBe(19);
  });

  it("un entretien non réalisé bloque la progression vers le suivant", () => {
    // À J45, le J30 est dû et non mené : il reste l'action principale, le J60
    // ne prend pas la main. Une étape ne devient pas faite parce que sa date l'est.
    const j45 = new Date("2026-04-16T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    const o = overviewOf({ interviews: done, now: j45 });
    expect(o.currentStep).toBe("j30");
    expect(o.primaryNextAction.interviewType).toBe("integration_j30");
  });

  it("passe au J60 une fois le J30 mené", () => {
    const j65 = new Date("2026-05-06T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" || i.type === "integration_j30"
        ? { ...i, status: "termine" as const }
        : i,
    );
    const o = overviewOf({ interviews: done, now: j65 });
    expect(o.currentStep).toBe("j60");
    expect(o.primaryNextAction.interviewType).toBe("integration_j60");
  });

  it("signale un entretien en retard et le remonte en tête", () => {
    const j45 = new Date("2026-04-16T12:00:00.000Z");
    const o = overviewOf({ interviews: SCHEDULE, now: j45 });
    expect(o.hasActiveAttention).toBe(true);
    expect(o.sortWeight).toBe(0);
  });

  it("n'alerte pas dans la semaine qui suit la date prévue", () => {
    // Un entretien se cale sur deux agendas : le jour dit n'est pas une échéance.
    const j33 = new Date("2026-04-04T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    expect(overviewOf({ interviews: done, now: j33 }).hasActiveAttention).toBe(false);
  });
});

describe("fin de parcours", () => {
  it("termine, sans action, en bas du tri", () => {
    const o = overviewOf({ onboarding: onboarding({ status: "termine" }) });
    expect(o.currentStep).toBe("termine");
    expect(o.globalStatus).toBe("termine");
    expect(o.primaryNextAction.kind).toBe("aucune");
    expect(o.sortWeight).toBe(90);
  });

  it("conserve les points d'attention d'une intégration terminée", () => {
    const j100 = new Date("2026-06-15T12:00:00.000Z");
    const o = overviewOf({ onboarding: onboarding({ status: "termine" }), now: j100 });
    // La boucle est close : l'alerte reste consultable mais ne remonte plus.
    expect(o.attentionCount).toBeGreaterThan(0);
    expect(o.sortWeight).toBe(90);
  });

  it("relaie un point d'attention conclu par le manager", () => {
    const conclusion: OnboardingInterviewConclusion = {
      id: "c1", interview_id: "integration_j1", conclusion: "attention", note: null,
      decided_by: null, created_at: "2026-03-03", updated_at: "2026-03-03",
    };
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    const o = overviewOf({ interviews: done, conclusions: [conclusion] });
    expect(o.alerts.some((a) => a.id === "integration_j1_conclusion")).toBe(true);
  });
});

describe("filtres et recherche", () => {
  it("classe chaque personne dans les bons filtres", () => {
    const aPreparer = overviewOf({ onboarding: null, interviews: [] });
    const enCours = overviewOf();
    const termine = overviewOf({ onboarding: onboarding({ status: "termine" }) });

    expect(matchesFilter(aPreparer, "a_preparer")).toBe(true);
    expect(matchesFilter(aPreparer, "action_requise")).toBe(true);
    expect(matchesFilter(enCours, "en_cours")).toBe(true);
    expect(matchesFilter(termine, "termines")).toBe(true);
    expect(matchesFilter(termine, "preferences_en_attente")).toBe(false);
    expect([aPreparer, enCours, termine].every((o) => matchesFilter(o, "tous"))).toBe(true);
  });

  it("cherche sans accents ni casse", () => {
    const c = candidate();
    expect(matchesSearch(c, "Business Developer", "lea")).toBe(true);
    expect(matchesSearch(c, null, "ROBERT")).toBe(true);
    expect(matchesSearch(c, null, "Martin")).toBe(false);
  });
});

describe("coarseStepOf", () => {
  it("donne l'étape sans avoir chargé les entretiens", () => {
    expect(coarseStepOf(null)).toBe("plan_a_creer");
    expect(coarseStepOf(onboarding({ status: "brouillon" }))).toBe("plan_a_valider");
    expect(coarseStepOf(onboarding())).toBe("avant_arrivee");
    expect(coarseStepOf(onboarding({ status: "termine" }))).toBe("termine");
  });
});
