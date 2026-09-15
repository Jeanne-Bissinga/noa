import { describe, it, expect } from "vitest";
import { buildIntegrationGuide, questionIdsOf } from "@/lib/noa/onboarding/interview-questions";
import {
  buildIntegrationCriteria, isIntegrationCriteria, parseIntegrationCriteria, renderIntegrationNotes,
} from "@/lib/noa/onboarding/interview-content";
import { interviewPhaseOf } from "@/lib/noa/onboarding/interview-phase";
import {
  PREVIOUS_MILESTONE, completedDigests, openActions, previousDigest,
} from "@/lib/noa/onboarding/interview-history";
import { generateNoaSynthesis } from "@/lib/noa/synthesis";
import { computeAggregateScore } from "@/lib/noa/score";
import { containsHrVerdict } from "@/lib/noa/errors";
import { NO_CONTEXT, type PreferenceContext } from "@/lib/noa/onboarding/personalization";
import { scoreWorkPreferences } from "@/lib/noa/onboarding/work-preferences";
import { WORK_PREFERENCE_QUESTIONS } from "@/lib/noa/onboarding/work-preferences-questions";
import { INTEGRATION_INTERVIEW_SUBTITLE, INTERVIEW_LABEL, isIntegrationInterview } from "@/lib/noa/labels";
import type {
  IntegrationInterviewType, Interview, OnboardingAction, OnboardingInterviewConclusion, Synthesis,
  WorkPreferenceDimension,
} from "@/lib/noa/types";

const MILESTONES: IntegrationInterviewType[] = [
  "integration_j1",
  "integration_j30",
  "integration_j60",
  "integration_j90",
];

/** Contexte Noa où une seule dimension est nettement orientée. */
function noaContext(dimension: WorkPreferenceDimension, level: 1 | 4): PreferenceContext {
  const answers: Record<string, number> = {};
  for (const q of WORK_PREFERENCE_QUESTIONS) {
    answers[q.id] = q.dimension === dimension ? (q.scoring === "direct" ? level : 5 - level) : 3;
  }
  const scores = scoreWorkPreferences(answers);
  if (!scores) throw new Error("scoring impossible");
  return { kind: "noa", scores };
}

// ─── Les quatre entretiens ──────────────────────────────────────────────────

describe("le parcours compte exactement quatre entretiens", () => {
  it("les nomme et les décrit tous", () => {
    for (const milestone of MILESTONES) {
      expect(INTERVIEW_LABEL[milestone]).toBeTruthy();
      expect(INTEGRATION_INTERVIEW_SUBTITLE[milestone]).toBeTruthy();
      expect(isIntegrationInterview(milestone)).toBe(true);
    }
    expect(isIntegrationInterview("screening")).toBe(false);
    expect(isIntegrationInterview("topgrading")).toBe(false);
  });

  it("relie chaque jalon à son prédécesseur, le J1 n'en ayant pas", () => {
    expect(PREVIOUS_MILESTONE.integration_j1).toBeNull();
    expect(PREVIOUS_MILESTONE.integration_j30).toBe("integration_j1");
    expect(PREVIOUS_MILESTONE.integration_j60).toBe("integration_j30");
    expect(PREVIOUS_MILESTONE.integration_j90).toBe("integration_j60");
  });
});

// ─── Le socle de questions ──────────────────────────────────────────────────

describe("socle de questions", () => {
  it("sert un guide complet à chaque jalon, même sans préférences", () => {
    for (const milestone of MILESTONES) {
      const sections = buildIntegrationGuide(milestone, NO_CONTEXT);
      expect(sections.length).toBeGreaterThan(0);
      const ids = questionIdsOf(sections);
      expect(ids.length).toBeGreaterThanOrEqual(5);
      expect(new Set(ids).size).toBe(ids.length);
      expect(sections.every((s) => s.questions.every((q) => q.q.trim().length > 0))).toBe(true);
    }
  });

  it("pose exactement le même socle quelles que soient les préférences", () => {
    // C'est ce qui rend deux entretiens J30 comparables entre eux.
    const contexts: PreferenceContext[] = [
      NO_CONTEXT,
      { kind: "disc", primary: "C", secondary: null },
      { kind: "mbti", type: "INFJ" },
      noaContext("structure", 4),
    ];
    for (const milestone of MILESTONES) {
      const reference = questionIdsOf(buildIntegrationGuide(milestone, NO_CONTEXT));
      for (const context of contexts) {
        const ids = questionIdsOf(buildIntegrationGuide(milestone, context));
        // Le socle est intact et dans le même ordre ; seule une question
        // complémentaire peut s'ajouter à la fin.
        expect(ids.slice(0, reference.length)).toEqual(reference);
      }
    }
  });

  it("ajoute au plus une question complémentaire", () => {
    for (const milestone of MILESTONES) {
      for (const context of [noaContext("initiative", 4), noaContext("interaction", 1), noaContext("change", 1)]) {
        const sections = buildIntegrationGuide(milestone, context);
        const extra = sections.flatMap((s) => s.questions).filter((q) => q.fromPreferences);
        expect(extra.length).toBeLessThanOrEqual(1);
      }
    }
  });

  it("ajoute un texte d'aide sans toucher à la question", () => {
    const structured = buildIntegrationGuide("integration_j1", noaContext("structure", 4));
    const loose = buildIntegrationGuide("integration_j1", noaContext("structure", 1));
    const generic = buildIntegrationGuide("integration_j1", NO_CONTEXT);

    const find = (sections: typeof structured, id: string) =>
      sections.flatMap((s) => s.questions).find((q) => q.id === id);

    expect(find(structured, "attentes.clarte")?.q).toBe(find(generic, "attentes.clarte")?.q);
    expect(find(structured, "attentes.clarte")?.helper).toContain("critères de réussite");
    expect(find(loose, "attentes.clarte")?.helper).not.toBe(find(structured, "attentes.clarte")?.helper);
    expect(find(generic, "attentes.clarte")?.helper).toBeUndefined();
  });
});

// ─── La forme stockée, et le piège qu'elle évite ────────────────────────────

describe("forme de la grille d'intégration", () => {
  const criteria = buildIntegrationCriteria("integration_j30", buildIntegrationGuide("integration_j30", NO_CONTEXT));

  it("est un objet, invisible aux détecteurs de forme du recrutement", () => {
    // Les deux détecteurs commencent par Array.isArray : un objet leur échappe
    // par construction, avant même la garde explicite.
    expect(Array.isArray(criteria)).toBe(false);
    expect(isIntegrationCriteria(criteria)).toBe(true);
  });

  it("n'est jamais synthétisée comme un entretien de recrutement", () => {
    const result = generateNoaSynthesis(criteria, { "attentes.clarte": "des notes libres" });
    expect(result.content).toContain("n'entre pas dans l'évaluation du recrutement");
    expect(result.advice).toBe("");
  });

  it("n'entre jamais dans la note d'un candidat", () => {
    // computeAggregateScore écrit indirectement candidates.score : la garde
    // vit dans la fonction, pas dans la prudence de ses appelants.
    expect(computeAggregateScore({ criteria, answers: {} }, null)).toBeNull();
    expect(computeAggregateScore(null, { criteria, answers: {} })).toBeNull();
  });

  it("montre pourquoi la forme plate aurait été un piège", () => {
    // Non-régression : ce que la grille aurait été si on l'avait aplatie.
    const aplatie = [{ id: "a", q: "Une question", crit: "Critère" }];
    expect(isIntegrationCriteria(aplatie)).toBe(false);
    const result = generateNoaSynthesis(aplatie, { a: "des notes libres" });
    // Elle aurait été comptée comme du Screening, et « des notes libres »
    // aurait valu « Non ».
    expect(result.content).not.toContain("n'entre pas dans l'évaluation");
  });

  it("se relit après un aller-retour en base", () => {
    const parsed = parseIntegrationCriteria(JSON.parse(JSON.stringify(criteria)));
    expect(parsed?.milestone).toBe("integration_j30");
    expect(questionIdsOf(parsed!.sections)).toEqual(questionIdsOf(criteria.sections));
  });

  it("refuse une forme inattendue", () => {
    expect(parseIntegrationCriteria(null)).toBeNull();
    expect(parseIntegrationCriteria([])).toBeNull();
    expect(parseIntegrationCriteria({ kind: "autre", sections: [] })).toBeNull();
  });

  it("rend les notes en texte, en signalant ce qui n'a pas été abordé", () => {
    const rendered = renderIntegrationNotes(criteria, { "prise_de_poste.clarte": "Tout est clair." });
    expect(rendered).toContain("Tout est clair.");
    expect(rendered).toContain("(non abordé)");
  });
});

// ─── Les trois phases de l'écran ────────────────────────────────────────────

describe("phase d'un entretien", () => {
  it("préparation tant qu'aucun guide n'existe", () => {
    expect(interviewPhaseOf(null, false)).toBe("preparation");
    expect(interviewPhaseOf({ status: "planifie" }, false)).toBe("preparation");
  });

  it("conduite une fois le guide figé", () => {
    expect(interviewPhaseOf({ status: "planifie" }, true)).toBe("conduite");
  });

  it("restitution une fois l'entretien mené, même sans guide", () => {
    // Un entretien conclu se relit toujours.
    expect(interviewPhaseOf({ status: "termine" }, true)).toBe("restitution");
    expect(interviewPhaseOf({ status: "termine" }, false)).toBe("restitution");
  });
});

// ─── Continuité d'un entretien au suivant ───────────────────────────────────

function interview(type: IntegrationInterviewType, status: Interview["status"] = "planifie"): Interview {
  return {
    id: type, candidate_id: "cand", type, format: null, duration_minutes: null,
    status, recording_status: "none", transcript: null, interviewer_id: null,
    scheduled_at: "2026-03-02T09:00:00.000Z",
    completed_at: status === "termine" ? "2026-03-02T10:00:00.000Z" : null,
    created_at: "2026-03-01",
  };
}

function action(sourceId: string, partial: Partial<OnboardingAction> = {}): OnboardingAction {
  return {
    id: Math.random().toString(), onboarding_id: "onb", source_interview_id: sourceId,
    label: "Organiser une session CRM", due_date: null, owner: null, status: "todo",
    position: 0, created_at: "2026-03-02", completed_at: null, ...partial,
  };
}

describe("continuité", () => {
  const synthesis: Synthesis = {
    id: "s1", candidate_id: "cand", interview_id: "integration_j1", authored_by: "noa",
    content: "Bonne prise de contact.", advice: "Organiser une session CRM", created_at: "2026-03-02",
  };
  const conclusion: OnboardingInterviewConclusion = {
    id: "c1", interview_id: "integration_j1", conclusion: "conforme", note: null,
    decided_by: null, created_at: "2026-03-02", updated_at: "2026-03-02",
  };

  const history = {
    interviews: [interview("integration_j1", "termine"), interview("integration_j30")],
    syntheses: [synthesis],
    conclusions: [conclusion],
    actions: [action("integration_j1"), action("integration_j1", { status: "done" })],
  };

  it("le J30 voit ce qui a été dit au J1", () => {
    const digest = previousDigest(history, "integration_j30");
    expect(digest?.milestone).toBe("integration_j1");
    expect(digest?.synthesis?.content).toBe("Bonne prise de contact.");
    expect(digest?.conclusion?.conclusion).toBe("conforme");
    expect(digest?.actions).toHaveLength(2);
  });

  it("le J1 n'a rien à reprendre", () => {
    expect(previousDigest(history, "integration_j1")).toBeNull();
  });

  it("un entretien planifié mais jamais mené ne transmet rien", () => {
    expect(previousDigest(history, "integration_j60")).toBeNull();
  });

  it("ne remonte que les actions encore ouvertes", () => {
    expect(openActions(history)).toHaveLength(1);
    expect(openActions(history).every((a) => a.status === "todo")).toBe(true);
  });

  it("liste les entretiens déjà menés, du plus ancien au plus récent", () => {
    expect(completedDigests(history).map((d) => d.milestone)).toEqual(["integration_j1"]);
  });
});

// ─── Aucun verdict RH ───────────────────────────────────────────────────────

describe("filtre de verdict RH", () => {
  it("attrape les formulations qu'un modèle produit réellement", () => {
    const interdits = [
      "Le bilan penche vers un no-go.",
      "Il faudrait envisager de ne pas confirmer la période d'essai.",
      "C'est une erreur de casting.",
      "Envisager un licenciement serait prématuré.",
      "Mieux vaut se séparer de la personne.",
      "Ce recrutement est un mauvais recrutement.",
      "Recommandation : ne pas confirmer l'embauche.",
      "Une rupture anticipée est à envisager.",
    ];
    for (const phrase of interdits) {
      expect(containsHrVerdict(phrase), phrase).toBe(true);
    }
  });

  it("laisse passer le vocabulaire légitime de l'intégration", () => {
    const permis = [
      "La période a été dense et la montée en compétence est réelle.",
      "Il a essayé une nouvelle organisation de son pipeline.",
      "Les résultats sont en progression, un ajustement reste utile.",
      "Le rythme d'accompagnement mérite d'être revu.",
      "Un point de vigilance subsiste sur la prise en main du CRM.",
      "La confirmation des jalons J60 est à faire lors du prochain échange.",
    ];
    for (const phrase of permis) {
      expect(containsHrVerdict(phrase), phrase).toBe(false);
    }
  });
});

// ─── Les préférences ne touchent aucun objectif ─────────────────────────────

describe("personnalité et objectifs", () => {
  it("aucune préférence ne modifie un objectif ni un résultat attendu", () => {
    // Le guide change, les objectifs jamais : ils viennent de la Scorecard.
    for (const milestone of MILESTONES) {
      for (const context of [NO_CONTEXT, noaContext("autonomy", 4), { kind: "disc", primary: "D", secondary: null } as PreferenceContext]) {
        const sections = buildIntegrationGuide(milestone, context);
        const serialized = JSON.stringify(sections);
        expect(serialized).not.toMatch(/target_value|current_value|mission_objective_id|outcome/i);
      }
    }
  });
});
