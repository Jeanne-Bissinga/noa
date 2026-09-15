// Génération du plan 30-60-90 à partir de ce que la campagne contient déjà.
//
// Principe : le manager ne ressaisit rien. Les résultats attendus à J90 sont
// les objectifs de la Scorecard (mission_objectives) — pas une reformulation,
// les mêmes, rattachés par mission_objective_id. Les priorités J1-J30 sont
// déduites de la campagne (produit, cible, outils, interlocuteurs) et des
// compétences attendues.
//
// Ce module est pur : il ne lit ni n'écrit la base. Il produit une proposition
// que le manager relit, modifie et valide (cf. app/integrations/[id]).
//
// Tous les objectifs proposés sont qualitatifs : ils se suivent par statut
// (non commencé / en progression / atteint / bloqué). Une cible chiffrée n'est
// jamais devinée — seul un manager peut en poser une, explicitement.
import type { MissionObjective, MissionSkill, OnboardingGoalKind, OnboardingPhase } from "@/lib/noa/types";

export interface PlannedGoal {
  missionObjectiveId: string | null;
  phase: OnboardingPhase;
  label: string;
  kind: OnboardingGoalKind;
  metric: string | null;
  targetValue: number | null;
  position: number;
}

export interface GeneratedPlan {
  /** Priorités des 30 premiers jours. */
  priorities: PlannedGoal[];
  /** Résultats à observer entre J30 et J60. */
  midterm: PlannedGoal[];
  /** Résultats attendus à J90, issus de la Scorecard. */
  outcomes: PlannedGoal[];
}

// Repères de prise de poste communs à tout recrutement. Ils ne sortent pas de
// la campagne — la campagne décrit un besoin, pas une arrivée — mais ils sont
// ce qu'un manager écrirait de toute façon, et il peut les réécrire avant
// validation.
//
// Ils ne constituent JAMAIS la totalité des priorités J30 : les premiers
// objectifs de la Scorecard y sont toujours représentés (cf. buildPlan), pour
// que le premier mois prépare réellement les résultats attendus à J90 plutôt
// que de dérouler un onboarding interchangeable.
const BASE_PRIORITIES = [
  "Comprendre le produit et la proposition de valeur",
  "Comprendre la cible et les interlocuteurs clés",
  "Rencontrer les interlocuteurs internes",
];

/** Au-delà, un premier mois n'est plus tenable — et plus personne ne les lit. */
const MAX_PRIORITIES = 6;

/** Nombre d'objectifs de la Scorecard amorcés dès les 30 premiers jours. */
const OUTCOMES_STARTED_AT_J30 = 2;

/**
 * Construit la proposition de plan.
 *
 * `objectives` sont les objectifs de la campagne, dans l'ordre où le recruteur
 * les a définis. Ils irriguent les trois phases, et c'est le point : les deux
 * premiers sont amorcés dès J30, les trois premiers deviennent des jalons
 * intermédiaires à J60, tous sont les résultats attendus à J90. On mesure ainsi
 * une progression avant l'échéance, au lieu de découvrir à J90 qu'un objectif
 * n'a jamais démarré.
 */
export function buildPlan(objectives: MissionObjective[], skills: MissionSkill[] = []): GeneratedPlan {
  // Aucune cible chiffrée n'est déduite du texte de la Scorecard. Ses quatre
  // champs sont de la prose libre, et le prompt qui les génère impose au modèle
  // de toujours chiffrer le seuil — y compris pour un résultat qualitatif. Y
  // chercher un nombre revenait à transformer « 100% des cérémonies réalisées
  // sur 4 sprints » en « cible : 4 », c'est-à-dire une cadence en compteur.
  //
  // `metric` est conservée telle quelle : elle dit ce qui se mesure, elle
  // n'affirme pas une valeur à atteindre. Le manager peut ajouter lui-même une
  // cible depuis le plan, ce qui bascule l'objectif en numérique (updateGoal).
  const outcomes: PlannedGoal[] = objectives.map((o, i) => ({
    missionObjectiveId: o.id,
    phase: "j90" as const,
    label: o.label,
    kind: "qualitative" as const,
    metric: o.metric?.trim() || null,
    targetValue: null,
    position: i,
  }));

  // Une compétence technique attendue devient une priorité de montée en
  // compétence : c'est l'information la plus spécifique au poste dont on
  // dispose pour les 30 premiers jours.
  const technical = skills
    .filter((s) => s.category === "technique")
    .slice(0, 2)
    .map((s) => `Être opérationnel sur ${s.name}`);

  // Amorce des premiers objectifs de la Scorecard. C'est ce qui rattache le
  // premier mois au résultat attendu à J90 : « poser les bases de 150 prospects
  // qualifiés » se relit en fin de mois, « prendre en main les outils » non.
  // Le lien vers l'objectif de campagne est conservé, comme pour J60 et J90.
  const outcomeStarters = objectives.slice(0, OUTCOMES_STARTED_AT_J30).map((o) => ({
    missionObjectiveId: o.id,
    label: `Poser les bases de : ${o.label}`,
  }));

  // Les amorces d'objectifs sont gardées en priorité : ce sont elles qui
  // rendent ce plan propre à ce recrutement-là. Les repères génériques
  // occupent la place restante.
  const generic = [...BASE_PRIORITIES, ...technical]
    .slice(0, Math.max(0, MAX_PRIORITIES - outcomeStarters.length))
    .map((label) => ({ missionObjectiveId: null, label }));

  const priorities: PlannedGoal[] = [...generic, ...outcomeStarters].map((p, i) => ({
    missionObjectiveId: p.missionObjectiveId,
    phase: "j30" as const,
    label: p.label,
    kind: "qualitative" as const,
    metric: null,
    targetValue: null,
    position: i,
  }));

  // Premier vrai jalon de résultat : « avoir commencé », pas « avoir réussi ».
  const midterm: PlannedGoal[] = objectives.slice(0, 3).map((o, i) => ({
    missionObjectiveId: o.id,
    phase: "j60" as const,
    label: `Premiers résultats sur : ${o.label}`,
    kind: "qualitative" as const,
    metric: o.metric?.trim() || null,
    targetValue: null,
    position: i,
  }));

  return { priorities, midterm, outcomes };
}

/** Aplatit la proposition dans l'ordre d'insertion en base. */
export function flattenPlan(plan: GeneratedPlan): PlannedGoal[] {
  return [...plan.priorities, ...plan.midterm, ...plan.outcomes];
}
