// Parcours des 90 jours : Avant l'arrivée, J1, J30, J60, J90.
//
// Module pur, sur le modèle de lib/noa/pending-decisions.ts : l'état de chaque
// étape se déduit des entretiens et de la date d'arrivée, jamais d'un champ de
// statut supplémentaire qu'il faudrait maintenir à jour.
//
// ─── Les cinq étapes existent toujours ──────────────────────────────────────
// Le parcours ne dépend pas de l'existence des lignes en base : tant que la
// date d'arrivée n'est pas fixée, aucun entretien n'est daté, mais le manager
// doit voir le chemin qui attend la personne.
//
// ─── Une seule étape est mise en avant ──────────────────────────────────────
// La première non menée, et elle seule. Les suivantes restent neutres même si
// leur date est passée : trois étapes signalées en même temps ne disent pas où
// reprendre. Le retard, lui, se lit dans le qualificatif de l'étape courante et
// dans le compte des échéances dépassées, calculés par overview.ts.
import type { IntegrationInterviewType, Interview } from "@/lib/noa/types";
import { hasArrived } from "@/lib/noa/onboarding/schedule";
import {
  TIMELINE_STEPS,
  STEP_SHORT_LABEL,
  stepOfInterview,
  type TimelineStepKey,
} from "@/lib/noa/onboarding/overview";

export type TimelineState = "a_venir" | "courante" | "termine";

export const TIMELINE_STATE_LABEL: Record<TimelineState, string> = {
  // « En attente » et non « À venir » : la date de ces étapes peut très bien
  // être passée, seule leur place dans l'ordre les met en retrait.
  a_venir: "En attente",
  courante: "À faire",
  termine: "Terminé",
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
  /** Reste-t-il un préparatif à mener avant l'arrivée ? */
  beforeArrivalPending: boolean;
  now: Date;
}

export function buildTimeline(input: TimelineInput): TimelineStep[] {
  const { arrivalDate, interviews, beforeArrivalPending, now } = input;
  const arrived = hasArrived(arrivalDate, now);

  // La première étape non menée, dans l'ordre du parcours et non dans celui du
  // calendrier : un J30 sauté garde la main tant qu'il n'a pas eu lieu. Tant
  // qu'aucun entretien n'est programmé, aucune étape n'est mise en avant — il
  // n'y a rien à faire dans un parcours qui n'a pas encore de dates.
  const currentKey = TIMELINE_STEPS.find((key) => {
    if (key === "avant_arrivee") return false;
    const interview = interviews.find((i) => stepOfInterview(i.type) === key);
    return interview !== undefined && interview.status !== "termine";
  });

  return TIMELINE_STEPS.map<TimelineStep>((key) => {
    const label = STEP_SHORT_LABEL[key];

    if (key === "avant_arrivee") {
      const state: TimelineState = arrived ? "termine" : beforeArrivalPending ? "courante" : "a_venir";
      return { key, label, state, interview: null, scheduledAt: arrivalDate };
    }

    const interview = interviews.find((i) => stepOfInterview(i.type) === key) ?? null;

    // Pas encore programmé : la date d'arrivée manque, ou le plan n'est pas
    // validé. L'étape existe quand même, elle attend.
    const state: TimelineState =
      interview?.status === "termine" ? "termine" : key === currentKey ? "courante" : "a_venir";

    return { key, label, state, interview, scheduledAt: interview?.scheduled_at ?? null };
  });
}

/**
 * Prochaine étape à traiter : celle qui est en cours, sinon la première à
 * venir. null quand tout est terminé.
 */
export function nextStep(timeline: TimelineStep[]): TimelineStep | null {
  return (
    timeline.find((s) => s.state === "courante") ??
    timeline.find((s) => s.state === "a_venir") ??
    null
  );
}

/** Type d'entretien correspondant à une étape du parcours, quand elle en a un. */
export function interviewTypeOfStep(key: TimelineStepKey): IntegrationInterviewType | null {
  return key === "avant_arrivee" ? null : (`integration_${key}` as IntegrationInterviewType);
}
