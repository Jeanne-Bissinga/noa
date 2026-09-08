// Frise de l'intégration : Avant l'arrivée, J1, J30, J60, J90.
//
// Module pur, sur le modèle de lib/noa/pending-decisions.ts : l'état de chaque
// étape se déduit des entretiens et de la date d'arrivée, jamais d'un champ de
// statut supplémentaire qu'il faudrait maintenir à jour.
//
// ─── Les cinq étapes existent toujours ──────────────────────────────────────
// La frise ne dépend pas de l'existence des lignes en base : tant que la date
// d'arrivée n'est pas fixée, aucun entretien n'est daté, mais le manager doit
// voir le parcours qui attend la personne.
//
// ─── Date passée ne veut pas dire étape faite ───────────────────────────────
// Un entretien dont la date est dépassée sans avoir eu lieu reste « à faire ».
// C'est la distinction qui manquait le plus au parcours précédent.
import type { IntegrationInterviewType, Interview } from "@/lib/noa/types";
import { hasArrived } from "@/lib/noa/onboarding/schedule";
import {
  TIMELINE_STEPS,
  STEP_SHORT_LABEL,
  stepOfInterview,
  type OnboardingAlert,
  type TimelineStepKey,
} from "@/lib/noa/onboarding/overview";

export type TimelineState = "a_venir" | "en_attente" | "termine" | "attention";

export const TIMELINE_STATE_LABEL: Record<TimelineState, string> = {
  a_venir: "À venir",
  // « À faire » plutôt que « En attente » : l'étape est due et c'est au manager
  // d'agir — le mot doit dire qui doit bouger.
  en_attente: "À faire",
  termine: "Terminé",
  attention: "Point d'attention",
};

export interface TimelineStep {
  key: TimelineStepKey;
  label: string;
  state: TimelineState;
  /** Entretien correspondant, absent pour « Avant l'arrivée ». */
  interview: Interview | null;
  /** Date prévue, quand elle est connue. */
  scheduledAt: string | null;
}

export interface TimelineInput {
  arrivalDate: string | null;
  interviews: Interview[];
  alerts: OnboardingAlert[];
  /** Reste-t-il un préparatif à mener avant l'arrivée ? */
  beforeArrivalPending: boolean;
  now: Date;
}

export function buildTimeline(input: TimelineInput): TimelineStep[] {
  const { arrivalDate, interviews, alerts, beforeArrivalPending, now } = input;
  const arrived = hasArrived(arrivalDate, now);
  const lateSteps = new Set(alerts.filter((a) => a.level === "attention").map((a) => a.id.split("_")[0]));

  return TIMELINE_STEPS.map<TimelineStep>((key) => {
    const label = STEP_SHORT_LABEL[key];

    if (key === "avant_arrivee") {
      const state: TimelineState = arrived ? "termine" : beforeArrivalPending ? "en_attente" : "a_venir";
      return { key, label, state, interview: null, scheduledAt: arrivalDate };
    }

    const interview = interviews.find((i) => stepOfInterview(i.type) === key) ?? null;

    // Pas encore programmé : la date d'arrivée manque, ou le plan n'est pas
    // validé. L'étape existe quand même, elle attend.
    if (!interview) {
      return { key, label, state: "a_venir", interview: null, scheduledAt: null };
    }

    let state: TimelineState;
    if (interview.status === "termine") {
      state = "termine";
    } else if (interview.scheduled_at && new Date(interview.scheduled_at) <= now) {
      // Un retard installé se distingue d'une étape simplement due.
      state = lateSteps.has(interview.type.replace("integration_", "")) ? "attention" : "en_attente";
    } else {
      state = "a_venir";
    }

    return { key, label, state, interview, scheduledAt: interview.scheduled_at };
  });
}

/**
 * Prochaine étape à traiter : la première qui est due, sinon la première à
 * venir. null quand tout est terminé.
 */
export function nextStep(timeline: TimelineStep[]): TimelineStep | null {
  return (
    timeline.find((s) => s.state === "en_attente" || s.state === "attention") ??
    timeline.find((s) => s.state === "a_venir") ??
    null
  );
}

/** Type d'entretien correspondant à une étape de frise, quand elle en a un. */
export function interviewTypeOfStep(key: TimelineStepKey): IntegrationInterviewType | null {
  return key === "avant_arrivee" ? null : (`integration_${key}` as IntegrationInterviewType);
}
