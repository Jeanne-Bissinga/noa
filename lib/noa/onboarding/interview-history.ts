// Continuité d'un entretien au suivant.
//
// C'est ce qui fait la valeur du parcours : le J30 s'ouvre sur ce qui a été dit
// au J1, le J60 sur le J30, le J90 sur le J60. Sans cela, quatre entretiens
// isolés valent moins qu'un seul bien préparé.
//
// ─── Le terrain prime sur le profil, sans jamais le réécrire ────────────────
// Les préférences de travail sont une hypothèse de départ. Quand un entretien
// dit autre chose, c'est l'entretien qui compte — mais le profil n'est jamais
// modifié rétroactivement : ce serait effacer ce que la personne a déclaré.
// La précédence est un ordre de lecture, pas une écriture.
import type {
  IntegrationInterviewType,
  Interview,
  OnboardingAction,
  OnboardingInterviewConclusion,
  Synthesis,
} from "@/lib/noa/types";

/**
 * Jalon précédent. Table exhaustive : ajouter un jalon oblige à dire ce qui le
 * précède, plutôt que de le laisser sans historique par oubli.
 */
export const PREVIOUS_MILESTONE: Record<IntegrationInterviewType, IntegrationInterviewType | null> = {
  integration_j1: null,
  integration_j30: "integration_j1",
  integration_j60: "integration_j30",
  integration_j90: "integration_j60",
};

export interface MilestoneDigest {
  milestone: IntegrationInterviewType;
  interviewId: string;
  completedAt: string | null;
  synthesis: Synthesis | null;
  conclusion: OnboardingInterviewConclusion | null;
  /** Actions décidées à ce jalon, avec leur état d'aujourd'hui. */
  actions: OnboardingAction[];
}

export interface InterviewHistory {
  interviews: Interview[];
  syntheses: Synthesis[];
  conclusions: OnboardingInterviewConclusion[];
  actions: OnboardingAction[];
}

/** Ce qu'il faut reprendre du jalon précédent. null s'il n'a pas eu lieu. */
export function previousDigest(
  history: InterviewHistory,
  milestone: IntegrationInterviewType,
): MilestoneDigest | null {
  const previous = PREVIOUS_MILESTONE[milestone];
  if (!previous) return null;

  const interview = history.interviews.find((i) => i.type === previous);
  // Un entretien planifié mais jamais mené n'a rien à transmettre.
  if (!interview || interview.status !== "termine") return null;

  return {
    milestone: previous,
    interviewId: interview.id,
    completedAt: interview.completed_at,
    synthesis: history.syntheses.find((s) => s.interview_id === interview.id) ?? null,
    conclusion: history.conclusions.find((c) => c.interview_id === interview.id) ?? null,
    actions: history.actions.filter((a) => a.source_interview_id === interview.id),
  };
}

/** Tous les digests des jalons déjà menés, du plus ancien au plus récent. */
export function completedDigests(history: InterviewHistory): MilestoneDigest[] {
  const order: IntegrationInterviewType[] = [
    "integration_j1",
    "integration_j30",
    "integration_j60",
    "integration_j90",
  ];

  return order
    .map((milestone) => {
      const interview = history.interviews.find((i) => i.type === milestone);
      if (!interview || interview.status !== "termine") return null;
      return {
        milestone,
        interviewId: interview.id,
        completedAt: interview.completed_at,
        synthesis: history.syntheses.find((s) => s.interview_id === interview.id) ?? null,
        conclusion: history.conclusions.find((c) => c.interview_id === interview.id) ?? null,
        actions: history.actions.filter((a) => a.source_interview_id === interview.id),
      };
    })
    .filter((d): d is MilestoneDigest => d !== null);
}

/** Actions encore ouvertes, tous jalons confondus. Le fil rouge du parcours. */
export function openActions(history: InterviewHistory): OnboardingAction[] {
  return history.actions.filter((a) => a.status === "todo");
}
