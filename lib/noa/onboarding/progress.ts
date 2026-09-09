// Progression des objectifs d'intégration.
//
// Aucun moteur de KPI : deux natures de résultat seulement (chiffré ou
// qualitatif), et une règle de lecture par nature. Module pur, comme
// lib/noa/score.ts.
import type { OnboardingGoal } from "@/lib/noa/types";

// ─── Objectifs ──────────────────────────────────────────────────────────────

export const GOAL_STATUS_LABEL: Record<OnboardingGoal["status"], string> = {
  non_commence: "Non commencé",
  en_cours: "En progression",
  atteint: "Atteint",
  bloque: "Bloqué",
};

/**
 * Avancement d'un objectif chiffré, en pourcentage entier borné à 100.
 *
 * Renvoie null pour un objectif qualitatif ou sans cible exploitable : c'est
 * `status` qui fait foi dans ce cas, et afficher « 0 % » serait faux (un
 * objectif qualitatif atteint n'a pas de compteur).
 * Le résultat n'est pas borné en dessous de 100 % côté valeur : dépasser sa
 * cible reste visible (172/150), seule la barre est plafonnée.
 */
export function goalProgress(goal: Pick<OnboardingGoal, "kind" | "target_value" | "current_value">): number | null {
  if (goal.kind !== "numeric") return null;
  if (goal.target_value === null || goal.target_value <= 0) return null;
  const current = goal.current_value ?? 0;
  return Math.min(100, Math.round((current / goal.target_value) * 100));
}

/**
 * Lecture en clair d'un objectif chiffré. Formulée comme un constat de
 * trajectoire, jamais comme un jugement sur la personne.
 */
export function progressWording(percent: number | null): string | null {
  if (percent === null) return null;
  if (percent >= 100) return "Atteint";
  if (percent >= 66) return "En bonne voie";
  if (percent >= 33) return "En progression";
  return "Démarrage";
}

export interface GoalsSummary {
  atteints: number;
  partiels: number;
  nonAtteints: number;
  bloques: number;
  total: number;
}

/**
 * Répartition des objectifs pour le bilan J90.
 *
 * « Partiellement atteint » n'est pas un statut stocké : c'est un objectif en
 * cours qui a réellement avancé (statut `en_cours`, ou compteur chiffré
 * au-delà de la moitié de la cible). Un objectif jamais démarré compte comme
 * non atteint, un objectif bloqué est compté à part pour rester visible.
 */
export function summarizeGoals(goals: OnboardingGoal[]): GoalsSummary {
  const summary: GoalsSummary = { atteints: 0, partiels: 0, nonAtteints: 0, bloques: 0, total: goals.length };

  for (const goal of goals) {
    const percent = goalProgress(goal);

    if (goal.status === "atteint" || (percent !== null && percent >= 100)) {
      summary.atteints += 1;
    } else if (goal.status === "bloque") {
      summary.bloques += 1;
    } else if (goal.status === "en_cours" || (percent !== null && percent >= 50)) {
      summary.partiels += 1;
    } else {
      summary.nonAtteints += 1;
    }
  }

  return summary;
}

/** Lecture qualitative d'un avancement, pour les synthèses d'entretien. */
export function scoreWording(percent: number | null): string {
  if (percent === null) return "non mesuré";
  if (percent >= 100) return "atteint";
  if (percent >= 66) return "en bonne voie";
  if (percent >= 33) return "en progression";
  return "au démarrage";
}
