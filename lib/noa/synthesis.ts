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
export type TopgradingQuestion = {
  id: string;
  q: string;
  probes?: string[];
  /** mission_skills.id de la compétence attendue que ce critère vérifie. Bloc de critères uniquement. */
  skillId?: string;
  /** Ce que la réponse doit contenir pour valoir « Oui ». Bloc de critères uniquement. */
  evidence?: string;
};
export type TopgradingEpisode = {
  co: string;
  period?: string;
  role?: string;
  qs: TopgradingQuestion[];
  /** Présent uniquement sur le bloc de critères rattachés à la Scorecard. */
  kind?: typeof SKILL_CHECK_KIND;
};

/**
 * Discriminant du bloc de critères à réponse fermée rattachés à la Scorecard,
 * rangé EN DERNIER dans `criteria` pour que `criteria[0]` reste un épisode et
 * que les prédicats de forme ci-dessous continuent de trancher correctement.
 *
 * Il garde la forme d'un épisode (`qs`) plutôt qu'une forme propre : les
 * lecteurs de grille sont canardés sur la présence de `qs`, et une forme
 * étrangère les ferait lever au lieu de les faire ignorer le bloc.
 */
export const SKILL_CHECK_KIND = "skill_checks";

/**
 * Sépare le parcours chronologique du bloc de critères. Tolère une grille
 * absente, malformée, ou antérieure au bloc — auquel cas `checks` vaut null et
 * tout se comporte comme avant.
 */
export function splitTopgradingCriteria(criteria: unknown): {
  episodes: TopgradingEpisode[];
  checks: TopgradingEpisode | null;
} {
  if (!Array.isArray(criteria)) return { episodes: [], checks: null };
  const blocks = criteria.filter(
    (raw): raw is TopgradingEpisode => !!raw && typeof raw === "object" && Array.isArray((raw as TopgradingEpisode).qs),
  );
  return {
    episodes: blocks.filter((b) => b.kind !== SKILL_CHECK_KIND),
    checks: blocks.find((b) => b.kind === SKILL_CHECK_KIND) ?? null,
  };
}

export type ScreeningAnswer = "Oui" | "Partiel" | "Non";


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
  if (isIntegrationCriteria(criteria)) {
    return {
      content: "Cet entretien d'intégration n'entre pas dans l'évaluation du recrutement.",
      advice: "",
    };
  }

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
  allBlocks: TopgradingEpisode[],
  answers: Record<string, string>,
): { content: string; advice: string } {
  // Le bloc de critères se raconte à part : ses réponses sont des verdicts, pas
  // des notes prises au fil du parcours. Les mélanger ferait passer un « Non »
  // pour une question documentée, et ferait apparaître le titre du bloc dans la
  // liste des entreprises.
  const { episodes, checks } = splitTopgradingCriteria(allBlocks);
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

  const verdicts = (checks?.qs ?? []).map((q) => String(answers[q.id] ?? ""));
  if (verdicts.length > 0) {
    const count = (value: string) => verdicts.filter((v) => v === value).length;
    parts.push(
      `Sur ${verdicts.length} compétence${verdicts.length > 1 ? "s" : ""} vérifiée${verdicts.length > 1 ? "s" : ""} par un exemple vécu, ${count("Oui")} validée${count("Oui") > 1 ? "s" : ""}, ${count("Partiel")} partielle${count("Partiel") > 1 ? "s" : ""}, ${count("Non")} non validée${count("Non") > 1 ? "s" : ""}.`,
    );
  }

  const content = parts.join(" ");

  // `advice` reste calculé sur le seul parcours : son barème a été écrit pour un
  // taux de documentation, et une grille sans bloc doit produire exactement le
  // même texte qu'avant.
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
