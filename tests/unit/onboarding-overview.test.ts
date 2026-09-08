import { describe, it, expect } from "vitest";
import {
  getIntegrationOverview, coarseStepOf, matchesFilter, matchesSearch, requiresManagerAction,
  situationLabel, stepOfInterview, STEP_LABEL, TIMELINE_STEPS,
  type IntegrationOverview, type NextActionKind, type OverviewFilter, type OverviewInput,
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

  it("situe l'étape sur la première non menée, et le temps écoulé à côté", () => {
    // Au 20 mars, la personne est à J19 et son J1 n'a pas eu lieu : l'étape est
    // J1. Le temps écoulé se lit séparément, il ne fait pas avancer le parcours.
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

  it("reste au J1 au jour 94 quand aucun entretien n'a eu lieu", () => {
    // Le cas qui a motivé la correction : la règle du calendrier affichait
    // « J90 » pendant que l'action demandait de réaliser le J1.
    const j94 = new Date("2026-06-04T12:00:00.000Z");
    const o = overviewOf({ now: j94 });
    expect(o.currentStep).toBe("j1");
    expect(o.stepQualifier).toBe("en_retard");
    expect(o.primaryNextAction.interviewType).toBe("integration_j1");
    expect(situationLabel(o)).toBe("J1 en retard");
  });

  it("compte les échéances dépassées sans les confondre avec l'étape courante", () => {
    // Au jour 94 : J1, J30 et J60 sont dépassés ; le J90, prévu quatre jours
    // plus tôt, est encore dans son délai de grâce.
    const j94 = new Date("2026-06-04T12:00:00.000Z");
    expect(overviewOf({ now: j94 }).overdueCount).toBe(3);
  });

  it("saute au premier jalon non mené, pas au dernier dont la date est passée", () => {
    // Jour 70, J1 mené et J30 sauté : l'ancienne règle disait « J60 ».
    const j70 = new Date("2026-05-11T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    const o = overviewOf({ interviews: done, now: j70 });
    expect(o.currentStep).toBe("j30");
    expect(o.stepQualifier).toBe("en_retard");
  });

  it("ouvre l'entretien une semaine avant sa date, pour qu'il y ait de quoi préparer", () => {
    // Jour 27, J1 mené : le J30 tombe dans quatre jours. La situation et
    // l'action doivent dire la même chose au même moment.
    const j27 = new Date("2026-03-29T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    const o = overviewOf({ interviews: done, now: j27 });
    expect(situationLabel(o)).toBe("J30 à préparer");
    expect(o.primaryNextAction.kind).toBe("preparer_entretien");
  });

  it("laisse un jalon lointain « à venir », sans rien réclamer", () => {
    // Jour 44, J1 et J30 menés : le J60 est encore à trois semaines.
    const j44 = new Date("2026-04-15T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" || i.type === "integration_j30"
        ? { ...i, status: "termine" as const }
        : i,
    );
    const o = overviewOf({ interviews: done, now: j44 });
    expect(situationLabel(o)).toBe("J60 à venir");
    expect(requiresManagerAction(o.primaryNextAction)).toBe(false);
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

  it("remonte un retard en tête sans en faire un point d'attention", () => {
    // Un point d'attention est un signalement du manager. Le retard se dit
    // ailleurs — dans la situation, et dans le compte des étapes dépassées.
    const j45 = new Date("2026-04-16T12:00:00.000Z");
    const o = overviewOf({ interviews: SCHEDULE, now: j45 });
    expect(o.sortWeight).toBe(0);
    expect(o.overdueCount).toBeGreaterThan(0);
    expect(o.hasActiveAttention).toBe(false);
    expect(o.alerts).toHaveLength(0);
  });

  it("ne parle pas de retard dans la semaine qui suit la date prévue", () => {
    // Un entretien se cale sur deux agendas : le jour dit n'est pas une échéance.
    const j33 = new Date("2026-04-04T12:00:00.000Z");
    const done = SCHEDULE.map((i) =>
      i.type === "integration_j1" ? { ...i, status: "termine" as const } : i,
    );
    const o = overviewOf({ interviews: done, now: j33 });
    expect(o.overdueCount).toBe(0);
    expect(o.stepQualifier).not.toBe("en_retard");
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

  it("conserve les points d'attention d'un parcours terminé", () => {
    const conclusion: OnboardingInterviewConclusion = {
      id: "c1", interview_id: "integration_j30", conclusion: "attention", note: null,
      decided_by: null, created_at: "2026-04-02", updated_at: "2026-04-02",
    };
    const j100 = new Date("2026-06-15T12:00:00.000Z");
    const o = overviewOf({
      onboarding: onboarding({ status: "termine" }),
      conclusions: [conclusion],
      now: j100,
    });
    // La boucle est close : le signalement reste consultable mais ne remonte
    // plus, et un parcours clos ne compte plus d'échéance dépassée.
    expect(o.attentionCount).toBe(1);
    expect(o.overdueCount).toBe(0);
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
    const aFaire = overviewOf({ onboarding: null, interviews: [] });
    // J1 et J30 menés, J60 encore loin : rien n'est attendu du manager.
    const enCours = overviewOf({
      interviews: SCHEDULE.map((i) =>
        i.type === "integration_j1" || i.type === "integration_j30"
          ? { ...i, status: "termine" as const }
          : i,
      ),
      now: new Date("2026-04-15T12:00:00.000Z"),
    });
    const termine = overviewOf({ onboarding: onboarding({ status: "termine" }) });

    expect(matchesFilter(aFaire, "a_faire")).toBe(true);
    expect(matchesFilter(enCours, "en_cours")).toBe(true);
    expect(matchesFilter(termine, "termines")).toBe(true);
    expect([aFaire, enCours, termine].every((o) => matchesFilter(o, "tous"))).toBe(true);
  });

  it("partage la liste entre les trois filtres, sans recouvrement", () => {
    // Les sept filtres précédents comptaient un même dossier jusqu'à quatre
    // fois : aucun compteur ne voulait dire quelque chose.
    const trois: OverviewFilter[] = ["a_faire", "en_cours", "termines"];
    const population = [
      overviewOf({ onboarding: null, interviews: [] }),
      overviewOf(),
      overviewOf({ preferences: preferences(), interviews: [], now: new Date("2026-02-25T12:00:00.000Z") }),
      overviewOf({ interviews: SCHEDULE, now: new Date("2026-06-04T12:00:00.000Z") }),
      overviewOf({ onboarding: onboarding({ status: "termine" }) }),
    ];
    for (const o of population) {
      expect(trois.filter((f) => matchesFilter(o, f))).toHaveLength(1);
    }
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
