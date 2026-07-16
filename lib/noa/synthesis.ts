// Deterministic, rule-based "noa synthesis" text generator.
//
// This intentionally does NOT call any LLM/AI API, it is plain string
// templating over the grid's criteria/answers, per the approved phase-4 plan.
//
// Two grid shapes are supported (see lib/noa/queries + the screening/topgrading
// routes for how `criteria`/`answers` are populated):
//   - Screening: criteria = flat array of { id, q, crit, probes[] }
//                answers  = { [id]: "Oui" | "Partiel" | "Non" }
//   - Topgrading: criteria = array of episodes { co, period, role, qs: [{ id, q, probes[] }] }
//                 answers  = { [id]: string } (free-text notes per question)

export type ScreeningCriterion = { id: string; q: string; crit?: string; probes?: string[] };
export type TopgradingQuestion = { id: string; q: string; probes?: string[] };
export type TopgradingEpisode = { co: string; period?: string; role?: string; qs: TopgradingQuestion[] };

export type ScreeningAnswer = "Oui" | "Partiel" | "Non";

function isScreeningCriteria(criteria: unknown): criteria is ScreeningCriterion[] {
  return Array.isArray(criteria) && criteria.length > 0 && typeof (criteria[0] as any)?.q === "string" && !("qs" in (criteria[0] as any));
}

function isTopgradingCriteria(criteria: unknown): criteria is TopgradingEpisode[] {
  return Array.isArray(criteria) && criteria.length > 0 && Array.isArray((criteria[0] as any)?.qs);
}

/**
 * Generates a French, rule-based synthesis (content + advice) from a grid's
 * criteria/answers. Works for both the screening shape (Oui/Partiel/Non per
 * criterion) and the topgrading shape (free-text notes per question, across
 * episodes), the output style adapts to the shape it detects.
 */
export function generateNoaSynthesis(
  criteria: unknown,
  answers: Record<string, unknown>,
): { content: string; advice: string } {
  if (isScreeningCriteria(criteria)) {
    return generateScreeningSynthesis(criteria, answers as Record<string, ScreeningAnswer>);
  }
  if (isTopgradingCriteria(criteria)) {
    return generateTopgradingSynthesis(criteria, answers as Record<string, string>);
  }
  return {
    content: "Aucune grille d'évaluation n'a pu être analysée pour cet entretien.",
    advice: "Complétez la grille d'entretien pour obtenir une synthèse.",
  };
}

function generateScreeningSynthesis(
  criteria: ScreeningCriterion[],
  answers: Record<string, ScreeningAnswer>,
): { content: string; advice: string } {
  const oui = criteria.filter((c) => answers[c.id] === "Oui");
  const partiel = criteria.filter((c) => answers[c.id] === "Partiel");
  const non = criteria.filter((c) => answers[c.id] === "Non");
  const total = criteria.length;

  const parts: string[] = [];
  parts.push(
    `Sur ${total} critère${total > 1 ? "s" : ""} évalué${total > 1 ? "s" : ""}, ${oui.length} ${oui.length > 1 ? "sont validés" : "est validé"} (Oui), ${partiel.length} ${partiel.length > 1 ? "sont partiels" : "est partiel"} et ${non.length} ${non.length > 1 ? "ne sont pas validés" : "n'est pas validé"}.`,
  );

  if (oui.length > 0) {
    parts.push(`Points forts : ${oui.map((c) => c.q).join(" ; ")}.`);
  }
  const vigilance = [...partiel, ...non];
  if (vigilance.length > 0) {
    parts.push(
      `Points de vigilance : ${vigilance
        .map((c) => `${c.q} (${answers[c.id] === "Non" ? "non validé" : "partiel"})`)
        .join(" ; ")}.`,
    );
  }

  const content = parts.join(" ");

  let advice: string;
  if (non.length === 0 && partiel.length === 0) {
    advice = "Tous les critères sont validés. Le profil peut avancer sans réserve vers l'étape suivante.";
  } else if (non.length === 0 && partiel.length <= 1) {
    advice = "La grande majorité des critères sont validés. Le profil mérite d'avancer, en gardant un point de vigilance à creuser à l'étape suivante.";
  } else if (non.length >= 1 && non.length <= Math.ceil(total / 3)) {
    advice = "Le profil présente un ou plusieurs points d'attention. Une décision d'avancer reste possible, mais ces points devront être creusés en priorité au prochain entretien.";
  } else {
    advice = "Plusieurs critères ne sont pas validés. La prudence est recommandée avant de faire avancer ce profil.";
  }

  return { content, advice };
}

function generateTopgradingSynthesis(
  episodes: TopgradingEpisode[],
  answers: Record<string, string>,
): { content: string; advice: string } {
  const allQuestions = episodes.flatMap((ep) => ep.qs.map((q) => ({ ep, q })));
  const total = allQuestions.length;
  const answered = allQuestions.filter(({ q }) => (answers[q.id] ?? "").trim().length > 0);
  const unanswered = allQuestions.filter(({ q }) => (answers[q.id] ?? "").trim().length === 0);

  const parts: string[] = [];
  parts.push(
    `Sur ${total} question${total > 1 ? "s" : ""} posée${total > 1 ? "s" : ""} au fil des ${episodes.length} épisode${episodes.length > 1 ? "s" : ""} du parcours (${episodes.map((e) => e.co).join(", ")}), ${answered.length} ${answered.length > 1 ? "ont reçu" : "a reçu"} une réponse notée par le recruteur.`,
  );

  if (answered.length > 0) {
    parts.push(
      `Points forts : réponses documentées sur ${answered.map(({ ep, q }) => `« ${q.q} » (${ep.co})`).join(" ; ")}.`,
    );
  }
  if (unanswered.length > 0) {
    parts.push(
      `Points de vigilance : aucune note prise sur ${unanswered.map(({ ep, q }) => `« ${q.q} » (${ep.co})`).join(" ; ")}, à reprendre si besoin lors de la décision.`,
    );
  }

  const content = parts.join(" ");

  const ratio = total > 0 ? answered.length / total : 0;
  let advice: string;
  if (ratio === 1) {
    advice = "L'ensemble du parcours a été documenté avec des réponses concrètes. Le profil peut être évalué en confiance pour la décision.";
  } else if (ratio >= 0.7) {
    advice = "La majeure partie du parcours est documentée. Quelques zones restent à éclaircir mais ne remettent pas en cause une décision favorable.";
  } else if (ratio >= 0.4) {
    advice = "Une partie significative du parcours reste peu documentée. Il est recommandé d'approfondir ces points avant de statuer.";
  } else {
    advice = "Peu de réponses ont été notées sur ce parcours. La décision devrait être prise avec prudence, ou l'entretien complété.";
  }

  return { content, advice };
}
