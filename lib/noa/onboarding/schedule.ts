// Calendrier de l'intégration : quand tombe chacun des quatre entretiens.
//
// Module pur, sans base ni horloge implicite — toute fonction qui a besoin de
// « maintenant » le reçoit en argument. C'est ce qui rend le calendrier
// testable et reproductible, et ce qui permet de dérouler un parcours entier
// en changeant seulement la date d'arrivée.
import type { IntegrationInterviewType } from "@/lib/noa/types";

/** Durée de validité du lien d'invitation aux préférences de travail, en jours. */
export const TOKEN_TTL_DAYS = 21;

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Fin de validité d'un lien émis pour une échéance donnée. */
export function tokenExpiryFor(reference: Date): Date {
  return addDays(reference, TOKEN_TTL_DAYS);
}

/**
 * Les quatre entretiens, et le nombre de jours qui les sépare de l'arrivée.
 * J1 tombe le jour même : c'est l'entretien d'alignement, il ouvre le parcours
 * plutôt que d'en mesurer une étape.
 */
export const INTEGRATION_INTERVIEWS: { type: IntegrationInterviewType; offsetDays: number }[] = [
  { type: "integration_j1", offsetDays: 0 },
  { type: "integration_j30", offsetDays: 30 },
  { type: "integration_j60", offsetDays: 60 },
  { type: "integration_j90", offsetDays: 90 },
];

export interface ScheduledInterview {
  type: IntegrationInterviewType;
  scheduledAt: Date;
}

/** Calendrier complet à partir d'une date d'arrivée. */
export function planInterviews(startDate: Date): ScheduledInterview[] {
  return INTEGRATION_INTERVIEWS.map(({ type, offsetDays }) => ({
    type,
    scheduledAt: addDays(startDate, offsetDays),
  }));
}

/**
 * Jour d'intégration atteint : J1 le jour de l'arrivée, J31 un mois plus tard.
 *
 * Renvoie 0 entre la décision de recrutement et l'arrivée, et null tant
 * qu'aucune date n'est fixée : « on ne sait pas encore quand » et « il n'est
 * pas encore arrivé » sont deux choses différentes, et l'écran doit pouvoir les
 * distinguer.
 */
export function dayOfOnboarding(startDate: string | null, now: Date): number | null {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const days = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  return days < 0 ? 0 : days + 1;
}

/** La personne a-t-elle pris son poste ? Faux tant que la date n'est pas fixée. */
export function hasArrived(startDate: string | null, now: Date): boolean {
  const day = dayOfOnboarding(startDate, now);
  return day !== null && day >= 1;
}
