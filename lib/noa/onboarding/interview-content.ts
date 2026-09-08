// Formes stockées d'un entretien d'intégration, et la garde qui les protège.
//
// ─── Pourquoi un OBJET et non un tableau ────────────────────────────────────
// lib/noa/synthesis.ts et lib/noa/score.ts reconnaissent la forme d'une grille
// STRUCTURELLEMENT : `isScreeningCriteria` accepte tout tableau dont le premier
// élément porte `.q` sans `.qs`. Un socle d'intégration à plat — qui porte
// exactement `.q` — serait donc compté comme du Screening, noté sur
// Oui/Partiel/Non, et nourrirait `candidates.score`.
//
// Les deux détecteurs commencent par `Array.isArray` : un objet leur est
// invisible par construction, avant même toute garde explicite. Ceinture et
// bretelles, la garde explicite existe quand même (isIntegrationCriteria),
// pour que le jour où quelqu'un aplatit cette structure, l'erreur se voie.
import type { IntegrationInterviewType } from "@/lib/noa/types";
import type { IntegrationSection } from "@/lib/noa/onboarding/interview-questions";

export interface IntegrationCriteria {
  /** Discriminant lu par les gardes de synthesis.ts et score.ts. */
  kind: "integration_interview";
  version: 1;
  milestone: IntegrationInterviewType;
  sections: IntegrationSection[];
}

export function buildIntegrationCriteria(
  milestone: IntegrationInterviewType,
  sections: IntegrationSection[],
): IntegrationCriteria {
  return { kind: "integration_interview", version: 1, milestone, sections };
}

/** Relit une grille d'intégration, en refusant tout ce qui n'a pas la forme attendue. */
export function parseIntegrationCriteria(raw: unknown): IntegrationCriteria | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Partial<IntegrationCriteria>;
  if (value.kind !== "integration_interview" || !Array.isArray(value.sections)) return null;
  return {
    kind: "integration_interview",
    version: 1,
    milestone: value.milestone as IntegrationInterviewType,
    sections: value.sections as IntegrationSection[],
  };
}

/**
 * Une grille d'entretien d'intégration ? Utilisée par les modules de
 * recrutement pour s'écarter : ces entretiens ont leur propre rédaction et
 * n'entrent jamais dans la note d'un candidat.
 */
export function isIntegrationCriteria(criteria: unknown): boolean {
  return (
    !!criteria &&
    typeof criteria === "object" &&
    !Array.isArray(criteria) &&
    (criteria as { kind?: unknown }).kind === "integration_interview"
  );
}

/** Rend les notes d'un entretien en texte, pour la synthèse. */
export function renderIntegrationNotes(
  criteria: IntegrationCriteria,
  answers: Record<string, string>,
): string {
  return criteria.sections
    .map((section) => {
      const lines = section.questions
        .map((question) => {
          const answer = (answers[question.id] ?? "").trim();
          return `Q: ${question.q}\nNotes: ${answer || "(non abordé)"}`;
        })
        .join("\n\n");
      return `[${section.title}]\n${lines}`;
    })
    .join("\n\n");
}
