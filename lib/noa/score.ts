// Deterministic aggregate score (0-100) computed from the two evaluation
// grids (screening + topgrading), used by /candidats/[id]/decision-finale.
//
// Formula:
//   - Screening grid: each criterion answer contributes points, Oui = 1,
//     Partiel = 0.5, Non = 0 (unanswered = 0). Score_screening = sum / count * 100.
//   - Topgrading grid: since Topgrading uses free-text notes (no Oui/Partiel/Non),
//     we treat a non-empty note as "answered" (1 point) and an empty note as
//     "unanswered" (0 points), a completion-quality proxy for how thoroughly
//     the candidate's answers were probed and documented.
//     Score_topgrading = answered / total * 100.
//   - Final score = average of the two stage scores that have data (if only one
//     grid has criteria/answers, the final score is that grid's score alone).
//   - Result is rounded to the nearest integer, clamped to [0, 100].

import type { ScreeningCriterion, TopgradingEpisode, ScreeningAnswer } from "@/lib/noa/synthesis";


/**
 * Grille d'entretien d'intégration : ni notée, ni synthétisée par ce module.
 * Ces entretiens ont leur propre rédaction et n'entrent jamais dans
 * l'évaluation d'un recrutement. La forme objet les rend déjà invisibles aux
 * deux prédicats ci-dessous ; cette garde explicite existe pour que l'erreur
 * se voie si quelqu'un aplatissait un jour la structure.
 */
function isIntegrationCriteria(criteria: unknown): boolean {
  return (
    !!criteria &&
    typeof criteria === "object" &&
    !Array.isArray(criteria) &&
    (criteria as { kind?: unknown }).kind === "integration_interview"
  );
}

function isScreeningCriteria(criteria: unknown): criteria is ScreeningCriterion[] {
  return Array.isArray(criteria) && criteria.length > 0 && typeof (criteria[0] as any)?.q === "string" && !("qs" in (criteria[0] as any));
}

function isTopgradingCriteria(criteria: unknown): criteria is TopgradingEpisode[] {
  return Array.isArray(criteria) && criteria.length > 0 && Array.isArray((criteria[0] as any)?.qs);
}

function scoreScreeningGrid(criteria: ScreeningCriterion[], answers: Record<string, ScreeningAnswer>): number | null {
  if (criteria.length === 0) return null;
  const points = criteria.reduce((sum, c) => {
    const a = answers[c.id];
    if (a === "Oui") return sum + 1;
    if (a === "Partiel") return sum + 0.5;
    return sum;
  }, 0);
  return (points / criteria.length) * 100;
}

function scoreTopgradingGrid(episodes: TopgradingEpisode[], answers: Record<string, string>): number | null {
  const allQuestions = episodes.flatMap((ep) => ep.qs);
  if (allQuestions.length === 0) return null;
  const answered = allQuestions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  return (answered / allQuestions.length) * 100;
}

export type ScoreBreakdown = {
  /** % de critères "Oui"/"Partiel" du screening, null si pas de grille notée. */
  screeningPercent: number | null;
  /** % de questions documentées (note non vide) du topgrading, null si pas de grille notée. */
  topgradingPercent: number | null;
  finalScore: number | null;
};

/**
 * Calcule la note finale ET le détail par étape qui l'explique : afficher
 * "96/100" sans dire qu'il s'agit de 96% de critères validés au screening
 * (et non d'une évaluation qualitative des réponses) donnerait une précision
 * trompeuse à un simple ratio. Cf. échange avec Léa sur la conformité IA Act
 * (transparence de la logique de notation, art. 13).
 */
export function computeScoreBreakdown(
  screening: { criteria: unknown; answers: Record<string, unknown> } | null,
  topgrading: { criteria: unknown; answers: Record<string, unknown> } | null,
): ScoreBreakdown {
  // Un entretien d'intégration ne pèse jamais sur la note d'un recrutement.
  // La garde vit ici plutôt que chez les appelants : cette fonction écrit
  // indirectement `candidates.score`, on ne s'en remet pas à leur prudence.
  if (isIntegrationCriteria(screening?.criteria) || isIntegrationCriteria(topgrading?.criteria)) {
    return { screeningPercent: null, topgradingPercent: null, finalScore: null };
  }

  const screeningPercent = screening && isScreeningCriteria(screening.criteria)
    ? scoreScreeningGrid(screening.criteria, screening.answers as Record<string, ScreeningAnswer>)
    : null;

  const topgradingPercent = topgrading && isTopgradingCriteria(topgrading.criteria)
    ? scoreTopgradingGrid(topgrading.criteria, topgrading.answers as Record<string, string>)
    : null;

  const scores = [screeningPercent, topgradingPercent].filter((s): s is number => s !== null);
  const finalScore = scores.length === 0
    ? null
    : Math.max(0, Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)));

  return { screeningPercent, topgradingPercent, finalScore };
}

export function computeAggregateScore(
  screening: { criteria: unknown; answers: Record<string, unknown> } | null,
  topgrading: { criteria: unknown; answers: Record<string, unknown> } | null,
): number | null {
  return computeScoreBreakdown(screening, topgrading).finalScore;
}
