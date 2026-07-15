// Deterministic aggregate score (0-100) computed from the two evaluation
// grids (screening + topgrading), used by /candidats/[id]/decision-finale.
//
// Formula:
//   - Screening grid: each criterion answer contributes points — Oui = 1,
//     Partiel = 0.5, Non = 0 (unanswered = 0). Score_screening = sum / count * 100.
//   - Topgrading grid: since Topgrading uses free-text notes (no Oui/Partiel/Non),
//     we treat a non-empty note as "answered" (1 point) and an empty note as
//     "unanswered" (0 points) — a completion-quality proxy for how thoroughly
//     the candidate's answers were probed and documented.
//     Score_topgrading = answered / total * 100.
//   - Final score = average of the two stage scores that have data (if only one
//     grid has criteria/answers, the final score is that grid's score alone).
//   - Result is rounded to the nearest integer, clamped to [0, 100].

import type { ScreeningCriterion, TopgradingEpisode, ScreeningAnswer } from "@/lib/noa/synthesis";

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

export function computeAggregateScore(
  screening: { criteria: unknown; answers: Record<string, unknown> } | null,
  topgrading: { criteria: unknown; answers: Record<string, unknown> } | null,
): number | null {
  const scores: number[] = [];

  if (screening && isScreeningCriteria(screening.criteria)) {
    const s = scoreScreeningGrid(screening.criteria, screening.answers as Record<string, ScreeningAnswer>);
    if (s !== null) scores.push(s);
  }

  if (topgrading && isTopgradingCriteria(topgrading.criteria)) {
    const s = scoreTopgradingGrid(topgrading.criteria, topgrading.answers as Record<string, string>);
    if (s !== null) scores.push(s);
  }

  if (scores.length === 0) return null;

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}
