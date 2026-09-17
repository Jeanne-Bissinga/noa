import { SKILL_CHECK_KIND, splitTopgradingCriteria } from "@/lib/noa/synthesis";
import { containsHrVerdict } from "@/lib/noa/errors";
import { containsForbiddenPreferenceWording } from "@/lib/noa/preferences/briefing";
import type { PrepGuideSection } from "@/lib/noa/interview-content";

// Les critères de compétence de l'entretien technique.
//
// ─── Le problème qu'ils corrigent ───────────────────────────────────────────
// Les critères du premier entretien sont des prérequis : disponibilité, budget,
// stack. Un savoir-être ne s'y vérifie presque jamais, et les deux catégories
// « Relationnelles » et « Savoir-être & valeurs » de la page de comparaison
// restaient vides pour tout le monde. L'entretien technique, lui, fait raconter
// des situations vécues — c'est là que ces compétences se montrent.
//
// ─── La règle que ce module fait respecter ──────────────────────────────────
// Ce qui valide une compétence est le RÉCIT d'une situation vécue, jamais ce que
// la personne a déclaré d'elle-même avant l'entretien. Ce qu'elle a déclaré peut
// choisir la question à poser ; il ne répond jamais à sa place. La garantie
// n'est pas dans un prompt : `evaluateTopgradingSkillChecks` ne reçoit ni
// identifiant de compétence, ni hypothèse — seulement une question et le fait
// attendu.
//
// Module pur : testable sans IA ni base, et importable côté client.

/** Titre du bloc, dans la grille comme dans le guide. */
export const SKILL_CHECK_TITLE = "Compétences attendues";
export const SKILL_CHECK_SUBTITLE = "Vérifiées par un exemple vécu";

/** Au-delà, ce n'est plus un entretien de parcours. */
export const MAX_SKILL_CHECKS = 5;

/**
 * Relances constantes, écrites une fois : ce sont elles qui transforment une
 * affirmation en fait vérifiable. Elles ne dépendent ni du poste ni du candidat,
 * donc rien ne justifie de les faire générer.
 */
export const SKILL_CHECK_PROBES = [
  "Quand cela s'est-il passé, et dans quel contexte ?",
  "Qu'avez-vous fait, vous précisément ?",
  "Qu'est-ce que cela a produit ?",
];

/** Fait attendu par défaut, pour une question qui arrive déjà rédigée. */
export const DEFAULT_SKILL_CHECK_EVIDENCE =
  "Un exemple précis, situé dans le temps, où le candidat dit ce qu'il a fait lui-même et ce que cela a produit.";

export type SkillCheckSeed = { q: string; skillId: string; evidence: string };

/**
 * Fusionne les questions déjà figées avant l'entretien et celles générées depuis
 * la Scorecard.
 *
 * Précédence : la question figée gagne pour SA compétence. C'est celle que le
 * recruteur a vue en préparant l'entretien, et une question figée ne se réécrit
 * pas après coup.
 *
 * Les questions figées sont repassées au filtre de vocabulaire : elles
 * deviennent ici un critère d'évaluation, une surface plus engageante que
 * l'encart de préparation d'où elles viennent, et leur relecture au chargement
 * ne refiltre pas.
 */
export function mergeSkillChecks(
  frozen: { skillId: string; question: string }[],
  generated: { skillId: string; q: string; evidence?: string }[],
): SkillCheckSeed[] {
  const seen = new Set<string>();
  const kept: SkillCheckSeed[] = [];

  const push = (skillId: string, q: string, evidence: string) => {
    if (kept.length >= MAX_SKILL_CHECKS) return;
    if (!skillId.trim() || !q.trim() || seen.has(skillId)) return;
    if (containsHrVerdict(q) || containsForbiddenPreferenceWording(q)) return;
    seen.add(skillId);
    kept.push({ skillId, q: q.trim(), evidence: evidence.trim() || DEFAULT_SKILL_CHECK_EVIDENCE });
  };

  for (const topic of frozen) push(topic.skillId, topic.question, DEFAULT_SKILL_CHECK_EVIDENCE);
  for (const item of generated) push(item.skillId, item.q, item.evidence ?? "");

  return kept;
}

/**
 * Section de guide correspondante, construite SANS IA.
 *
 * C'est ce qui garantit que la question posée est exactement celle qui sera
 * évaluée : la confier au modèle qui rédige le guide la ferait reformuler, et
 * le recruteur poserait alors une autre question que celle notée.
 */
export function skillCheckGuideSection(questions: { text: string }[]): PrepGuideSection | null {
  const asked = questions.map((q) => q.text.trim()).filter(Boolean);
  if (asked.length === 0) return null;
  return {
    title: SKILL_CHECK_TITLE,
    subtitle: SKILL_CHECK_SUBTITLE,
    questions: asked.map((q) => ({ q, probes: [...SKILL_CHECK_PROBES] })),
  };
}

/**
 * Ajoute la section au guide quand elle manque — guide généré comme guide
 * statique de repli. Sans ce filet, un recruteur qui saute la préparation
 * mènerait l'entretien sans jamais voir les questions, et la grille les noterait
 * toutes « Non ».
 */
export function withSkillCheckGuideSection(
  sections: PrepGuideSection[],
  criteria: unknown,
): PrepGuideSection[] {
  if (sections.some((s) => s.title === SKILL_CHECK_TITLE)) return sections;
  const { checks } = splitTopgradingCriteria(criteria);
  const section = skillCheckGuideSection((checks?.qs ?? []).map((q) => ({ text: q.q })));
  return section ? [...sections, section] : sections;
}

/** Le bloc, au format attendu par `evaluation_grids.criteria`. */
export function skillCheckCriteriaBlock(seeds: SkillCheckSeed[], sectionIndex: number) {
  return {
    co: SKILL_CHECK_TITLE,
    role: SKILL_CHECK_SUBTITLE,
    kind: SKILL_CHECK_KIND,
    qs: seeds.map((seed, qi) => ({
      id: `${sectionIndex}-${qi}`,
      q: seed.q,
      probes: [] as string[],
      skillId: seed.skillId,
      evidence: seed.evidence,
    })),
  };
}
