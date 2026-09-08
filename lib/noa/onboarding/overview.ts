// Vue de pilotage des intégrations : où en est chaque personne recrutée.
//
// Une seule fonction, `getIntegrationOverview`, produit tout ce que la liste
// /integrations et la fiche individuelle affichent. Aucun composant ne
// recalcule ces informations de son côté — c'est la condition pour que les
// deux écrans disent toujours la même chose.
//
// ─── Pourquoi trois valeurs ne peuvent plus se contredire ───────────────────
// L'étape courante est décidée en premier : c'est la première étape du parcours
// qui n'est pas franchie. Le statut global n'est pas calculé, il est *projeté*
// depuis l'étape par une table exhaustive. L'action principale sort d'une
// cascade qui rend exactement une valeur, et elle vise la même étape. Étape,
// statut et action ne peuvent donc plus se contredire, ce qu'aucune des deux
// versions précédentes ne garantissait — l'une décidait statut et étape dans
// deux branches indépendantes, l'autre lisait l'étape sur le calendrier pendant
// que l'action lisait ce qui restait à faire.
//
// Module pur : les données sont passées en argument, `now` aussi.
import type {
  Candidate,
  Interview,
  IntegrationInterviewType,
  Onboarding,
  OnboardingInterviewConclusion,
  OnboardingWorkPreferences,
} from "@/lib/noa/types";
import { INTEGRATION_INTERVIEW_SHORT } from "@/lib/noa/labels";
import { dayOfOnboarding } from "@/lib/noa/onboarding/schedule";

// ─── Étapes ─────────────────────────────────────────────────────────────────

/**
 * Positions de la frise, dans l'ordre où elles se franchissent.
 *
 * « Avant l'arrivée » précède J1 : l'intégration commence avant le premier
 * jour, et ses gestes — inviter aux préférences, fixer la date, relire le
 * plan — méritent une place dans le parcours plutôt qu'un coin d'écran.
 */
export const TIMELINE_STEPS = ["avant_arrivee", "j1", "j30", "j60", "j90"] as const;

export type TimelineStepKey = (typeof TIMELINE_STEPS)[number];

/**
 * Étape affichée dans la colonne « Étape actuelle ».
 *
 * Union fermée, jamais une chaîne libre : ajouter une étape casse la
 * compilation partout où un libellé est nécessaire, au lieu de laisser deux
 * écrans diverger en silence.
 */
export type IntegrationStep = TimelineStepKey | "plan_a_creer" | "plan_a_valider" | "termine";

/** Seul endroit du produit où ces étapes portent un libellé. */
export const STEP_LABEL: Record<IntegrationStep, string> = {
  plan_a_creer: "Plan à créer",
  plan_a_valider: "Plan à valider",
  avant_arrivee: "Avant l'arrivée",
  j1: "J1",
  j30: "J30",
  j60: "J60",
  j90: "J90",
  termine: "Terminé",
};

/** Libellé court pour la frise, où la place manque. */
export const STEP_SHORT_LABEL: Record<TimelineStepKey, string> = {
  avant_arrivee: "Avant l'arrivée",
  j1: "J1",
  j30: "J30",
  j60: "J60",
  j90: "J90",
};

/**
 * Fenêtre autour d'un entretien, en jours.
 *
 * Elle sert deux fois, dans les deux sens : un entretien devient actionnable
 * une semaine avant sa date — c'est le moment où l'on prépare un rendez-vous —
 * et il n'est dit en retard qu'une semaine après. Un entretien se cale sur deux
 * agendas : le jour dit n'est pas une échéance.
 */
export const INTERVIEW_WINDOW_DAYS = 7;

const WINDOW_MS = INTERVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Où en est l'étape courante, sur l'axe du temps.
 *
 * L'étape dit *laquelle*, le qualificatif dit *comment elle se présente*. Les
 * deux se composent en une phrase — « J1 en retard », « J30 à préparer » — au
 * lieu d'obliger le lecteur à croiser une colonne d'étape et une colonne de
 * date.
 */
export type StepQualifier = "a_venir" | "a_preparer" | "a_realiser" | "en_retard";

export const STEP_QUALIFIER_LABEL: Record<StepQualifier, string> = {
  a_venir: "à venir",
  a_preparer: "à préparer",
  a_realiser: "à réaliser",
  en_retard: "en retard",
};

// ─── Statut global ──────────────────────────────────────────────────────────
// Trois valeurs, un seul axe. « Point d'attention » n'en fait pas partie :
// c'est un fait porté par hasActiveAttention, orthogonal au cycle de vie.
// Les avoir mélangés obligeait à effacer les alertes d'une intégration
// terminée, faute de pouvoir exprimer « terminé ET en attention ».
export type GlobalStatus = "preparation" | "en_cours" | "termine";

/**
 * Cycle de vie DÉDUIT de l'étape, jamais calculé en parallèle. C'est la
 * garantie structurelle : une seule décision est prise — l'étape — et le
 * statut n'est plus qu'une projection.
 */
const STATUS_OF_STEP: Record<IntegrationStep, GlobalStatus> = {
  plan_a_creer: "preparation",
  plan_a_valider: "preparation",
  avant_arrivee: "preparation",
  j1: "en_cours",
  j30: "en_cours",
  j60: "en_cours",
  j90: "en_cours",
  termine: "termine",
};

export type WorkPreferencesDisplayStatus = "non_invite" | "invitation_envoyee" | "complete";

export const WORK_PREFERENCES_STATUS_LABEL: Record<WorkPreferencesDisplayStatus, string> = {
  non_invite: "Non invité",
  invitation_envoyee: "Invitation envoyée",
  complete: "Complété",
};

// ─── Action principale ──────────────────────────────────────────────────────

export type NextActionKind =
  | "creer_plan"
  | "verifier_plan"
  | "definir_date"
  | "inviter_preferences"
  | "preparer_entretien"
  | "realiser_entretien"
  | "attente_collaborateur"
  | "aucune";

export interface NextAction {
  kind: NextActionKind;
  label: string;
  /** Entretien concerné, quand l'action en vise un. */
  interviewId: string | null;
  /** Type de cet entretien, pour construire son lien sans le rechercher. */
  interviewType: IntegrationInterviewType | null;
}

const AUCUNE: NextAction = {
  kind: "aucune",
  label: "Aucune action nécessaire",
  interviewId: null,
  interviewType: null,
};

/**
 * Actions qui demandent un geste du manager, par opposition à l'attente.
 *
 * Une table et non un tableau : ajouter une action oblige à dire si elle
 * relève du filtre « Action requise », au lieu de l'en exclure par oubli.
 */
const REQUIRES_MANAGER: Record<NextActionKind, boolean> = {
  creer_plan: true,
  verifier_plan: true,
  definir_date: true,
  inviter_preferences: true,
  preparer_entretien: true,
  realiser_entretien: true,
  attente_collaborateur: false,
  aucune: false,
};

export function requiresManagerAction(action: NextAction): boolean {
  return REQUIRES_MANAGER[action.kind];
}

/**
 * Rang de tri, dérivé de l'action et non du cycle de vie.
 *
 * Table exhaustive : chaque ligne tombe dans exactement un rang, puisque
 * l'action principale rend exactement une valeur. L'ancien barème mélangeait
 * les deux et faisait tomber au même rang une ligne « en cours » avec un point
 * dû et une ligne « préférences en attente ».
 */
const ACTION_WEIGHT: Record<NextActionKind, number> = {
  realiser_entretien: 10,
  preparer_entretien: 20,
  inviter_preferences: 30,
  verifier_plan: 40,
  creer_plan: 45,
  definir_date: 50,
  attente_collaborateur: 70,
  aucune: 80,
};

// Un retard passe devant tout le reste, puis les signalements du manager. Ces
// deux rangs sont hors du barème d'action : ils disent l'urgence, pas le geste.
const OVERDUE_WEIGHT = 0;
const ATTENTION_WEIGHT = 5;
const TERMINE_WEIGHT = 90;

// ─── Résultat ───────────────────────────────────────────────────────────────

export interface IntegrationOverview {
  candidateId: string;
  onboardingId: string | null;
  /** Cycle de vie. Sert aux filtres et au tri — plus aucun badge ne l'affiche. */
  globalStatus: GlobalStatus;
  /** Première étape du parcours qui n'est pas franchie. */
  currentStep: IntegrationStep;
  /** Comment cette étape se présente. null avant l'arrivée et après la clôture. */
  stepQualifier: StepQualifier | null;
  /** Étapes non menées dont la date est dépassée, délai de grâce déduit. */
  overdueCount: number;
  /** Toujours exactement une action : jamais zéro, jamais deux. */
  primaryNextAction: NextAction;
  /** Date d'arrivée. null = « À définir ». */
  startDate: string | null;
  /** Jour d'intégration. null tant que la date est inconnue, 0 avant l'arrivée. */
  dayNumber: number | null;
  workPreferencesStatus: WorkPreferencesDisplayStatus;
  /** Signalements du manager, texte compris : un seul calcul pour les deux écrans. */
  alerts: OnboardingAlert[];
  hasActiveAttention: boolean;
  attentionCount: number;
  /** Date du prochain entretien non mené. null sans calendrier. */
  nextDueAt: string | null;
  lastActivityAt: string | null;
  sortWeight: number;
  /** Le plan a-t-il été validé ? Sert aux cartes « Avant son arrivée ». */
  planValidated: boolean;
}

export interface OverviewInput {
  candidate: Candidate;
  onboarding: Onboarding | null;
  /** Les quatre entretiens d'intégration, dans n'importe quel ordre. */
  interviews: Interview[];
  /** Entretiens dont le guide a été préparé. */
  preparedInterviewIds: string[];
  conclusions: OnboardingInterviewConclusion[];
  preferences: OnboardingWorkPreferences | null;
  now: Date;
}

/** Position de frise correspondant à un entretien d'intégration. */
export function stepOfInterview(type: string): TimelineStepKey | null {
  const key = type.replace("integration_", "");
  return (TIMELINE_STEPS as readonly string[]).includes(key) ? (key as TimelineStepKey) : null;
}

function preferencesStatus(preferences: OnboardingWorkPreferences | null): WorkPreferencesDisplayStatus {
  if (!preferences) return "non_invite";
  return preferences.status === "completed" ? "complete" : "invitation_envoyee";
}

function lastActivity(input: OverviewInput): string | null {
  const dates = input.interviews.map((i) => i.completed_at).filter((d): d is string => Boolean(d));
  if (input.preferences?.completed_at) dates.push(input.preferences.completed_at);
  else if (input.preferences?.invited_at) dates.push(input.preferences.invited_at);
  return dates.sort().at(-1) ?? null;
}

/** Entretiens triés par date, du premier au dernier. */
function ordered(interviews: Interview[]): Interview[] {
  return interviews
    .slice()
    .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
}

/**
 * Le premier entretien du parcours qui n'a pas été mené.
 *
 * L'ordre chronologique fait le travail : tant que le J30 n'est pas terminé, il
 * reste le premier de la liste, et le J60 ne prend jamais la main — même si sa
 * propre date est passée. Une étape ne devient pas faite parce que sa date
 * l'est.
 */
function firstUnfinishedInterview(interviews: Interview[]): Interview | null {
  return ordered(interviews).find((i) => i.status !== "termine") ?? null;
}

/** Un entretien est actionnable dès une semaine avant sa date. */
function isActionable(interview: Interview, now: Date): boolean {
  if (!interview.scheduled_at) return false;
  return new Date(interview.scheduled_at).getTime() - WINDOW_MS <= now.getTime();
}

/** Entretiens non menés dont la date est dépassée, délai de grâce déduit. */
function overdueInterviews(interviews: Interview[], now: Date): Interview[] {
  return interviews.filter(
    (i) =>
      i.status !== "termine" &&
      i.scheduled_at !== null &&
      new Date(i.scheduled_at).getTime() + WINDOW_MS < now.getTime(),
  );
}

/**
 * Étape courante : la première étape obligatoire qui n'est pas franchie.
 *
 * Elle se lisait auparavant sur le calendrier — la dernière étape dont la date
 * était passée. Au jour 94 sans aucun entretien mené, la fiche affichait donc
 * « J90 » et demandait « Réaliser l'entretien J1 » : deux phrases qui se
 * contredisaient. C'est désormais la même étape qui nomme la situation et qui
 * porte l'action. Le temps écoulé reste lisible à côté, en « jour N sur 90 ».
 */
export function currentStepOf(
  onboarding: Onboarding | null,
  interviews: Interview[],
  now: Date,
): IntegrationStep {
  if (!onboarding) return "plan_a_creer";
  if (onboarding.status === "termine") return "termine";
  if (onboarding.status === "brouillon") return "plan_a_valider";
  if (!onboarding.start_date) return "avant_arrivee";
  if (new Date(`${onboarding.start_date}T00:00:00`) > now) return "avant_arrivee";

  const pending = firstUnfinishedInterview(interviews);
  if (pending) return stepOfInterview(pending.type) ?? "j1";

  // Les quatre entretiens sont menés sans que le bilan soit enregistré : la
  // dernière étape reste le J90, qui porte cette clôture. Sans calendrier du
  // tout, le parcours commence au J1.
  return interviews.length > 0 ? "j90" : "j1";
}

/**
 * Comment se présente l'étape courante : à venir, à préparer, à réaliser ou en
 * retard. `null` avant l'arrivée et une fois le parcours clos, où le temps
 * n'est pas la bonne grille de lecture.
 */
function stepQualifierOf(
  pending: Interview | null,
  prepared: Set<string>,
  now: Date,
): StepQualifier | null {
  if (!pending?.scheduled_at) return null;
  const due = new Date(pending.scheduled_at).getTime();
  if (due + WINDOW_MS < now.getTime()) return "en_retard";
  if (due - WINDOW_MS > now.getTime()) return "a_venir";
  return prepared.has(pending.id) ? "a_realiser" : "a_preparer";
}

/**
 * L'unique action mise en avant.
 *
 * Ce n'est ni une machine à états ni un verrou : les trois gestes
 * d'avant-arrivée restent réalisables à tout moment, dans n'importe quel ordre.
 * La cascade choisit seulement lequel mettre en avant.
 */
function primaryNextActionOf(args: {
  onboarding: Onboarding | null;
  interviews: Interview[];
  prepared: Set<string>;
  prefStatus: WorkPreferencesDisplayStatus;
  now: Date;
}): NextAction {
  const { onboarding, interviews, prepared, prefStatus, now } = args;

  if (!onboarding) {
    return { kind: "creer_plan", label: "Préparer le plan", interviewId: null, interviewType: null };
  }
  if (onboarding.status === "termine") return AUCUNE;

  // 1. Un entretien proche passe devant tout : c'est un rendez-vous daté, et
  //    c'est le moment où l'information se perd si on tarde. La fenêtre s'ouvre
  //    une semaine avant, pour que « J30 à préparer » et « Préparer J30 »
  //    apparaissent ensemble plutôt que l'un après l'autre.
  const pending = firstUnfinishedInterview(interviews);
  if (pending && isActionable(pending, now)) {
    const step = stepOfInterview(pending.type);
    const jalon = step ? STEP_LABEL[step] : "";
    const isPrepared = prepared.has(pending.id);
    return {
      kind: isPrepared ? "realiser_entretien" : "preparer_entretien",
      label: isPrepared ? `Réaliser l'entretien ${jalon}` : `Préparer l'entretien ${jalon}`,
      interviewId: pending.id,
      interviewType: pending.type as IntegrationInterviewType,
    };
  }

  // 2. Préférences jamais demandées — avant même la validation du plan. C'est
  //    la seule action dont la réponse ne dépend pas du manager : on lance en
  //    premier ce qui met du temps à revenir, et ce qui sert à préparer le J1.
  if (prefStatus === "non_invite") {
    return { kind: "inviter_preferences", label: "Inviter à compléter", interviewId: null, interviewType: null };
  }

  if (onboarding.status === "brouillon") {
    return { kind: "verifier_plan", label: "Vérifier le plan", interviewId: null, interviewType: null };
  }

  if (!onboarding.start_date) {
    return { kind: "definir_date", label: "Définir la date d'arrivée", interviewId: null, interviewType: null };
  }

  if (prefStatus === "invitation_envoyee") {
    return {
      kind: "attente_collaborateur",
      label: "En attente du collaborateur",
      interviewId: null,
      interviewType: null,
    };
  }

  return AUCUNE;
}

// ─── Points d'attention ─────────────────────────────────────────────────────
// Un point d'attention est un signalement du manager, coché en concluant un
// entretien. Rien d'autre n'en produit : un entretien en retard n'en est pas
// un, puisque le retard se lit déjà dans la situation de la personne et dans le
// compte des étapes dépassées. Les mélanger revenait à noyer les trois
// signalements de la semaine sous vingt rappels de calendrier.

export interface OnboardingAlert {
  id: string;
  title: string;
  detail: string;
}

function computeAlerts(
  interviews: Interview[],
  conclusions: OnboardingInterviewConclusion[],
): OnboardingAlert[] {
  const alerts: OnboardingAlert[] = [];

  for (const interview of ordered(interviews)) {
    if (!stepOfInterview(interview.type)) continue;

    const conclusion = conclusions.find((c) => c.interview_id === interview.id);
    if (conclusion?.conclusion !== "attention") continue;

    const short = INTEGRATION_INTERVIEW_SHORT[interview.type as IntegrationInterviewType];
    alerts.push({
      id: `${interview.type}_conclusion`,
      title: "Point d'attention",
      detail: `Vous avez signalé un point d'attention à l'issue de l'entretien ${short}.`,
    });
  }

  return alerts;
}

export function getIntegrationOverview(input: OverviewInput): IntegrationOverview {
  const { candidate, onboarding, now } = input;

  const interviews = onboarding ? input.interviews : [];
  const prepared = new Set(input.preparedInterviewIds);

  // Une seule décision — l'étape — dont le statut découle.
  const currentStep = currentStepOf(onboarding, interviews, now);
  const globalStatus = STATUS_OF_STEP[currentStep];

  const prefStatus = preferencesStatus(input.preferences);
  const alerts = computeAlerts(interviews, input.conclusions);
  const primaryNextAction = primaryNextActionOf({ onboarding, interviews, prepared, prefStatus, now });

  // Le qualificatif ne vaut que pour les quatre jalons : avant l'arrivée comme
  // après la clôture, le temps n'est pas la grille de lecture.
  const pending = firstUnfinishedInterview(interviews);
  const onInterviewStep = currentStep !== "termine" && globalStatus === "en_cours";
  const stepQualifier = onInterviewStep ? stepQualifierOf(pending, prepared, now) : null;
  const overdueCount = globalStatus === "termine" ? 0 : overdueInterviews(interviews, now).length;

  const nextScheduled = pending?.scheduled_at ?? null;

  // Une intégration terminée reste en bas même avec un signalement : la boucle
  // est close, le point reste consultable mais n'appelle plus de geste.
  const sortWeight =
    globalStatus === "termine"
      ? TERMINE_WEIGHT
      : overdueCount > 0
      ? OVERDUE_WEIGHT
      : alerts.length > 0
      ? ATTENTION_WEIGHT
      : ACTION_WEIGHT[primaryNextAction.kind];

  return {
    candidateId: candidate.id,
    onboardingId: onboarding?.id ?? null,
    globalStatus,
    currentStep,
    stepQualifier,
    overdueCount,
    primaryNextAction,
    startDate: onboarding?.start_date ?? null,
    dayNumber: dayOfOnboarding(onboarding?.start_date ?? null, now),
    workPreferencesStatus: prefStatus,
    alerts,
    hasActiveAttention: alerts.length > 0,
    attentionCount: alerts.length,
    nextDueAt: nextScheduled,
    lastActivityAt: lastActivity(input),
    sortWeight,
    planValidated: onboarding !== null && onboarding.status !== "brouillon",
  };
}

/**
 * Étape lisible sans le calendrier, pour la carte « Intégration » de la fiche
 * de recrutement : elle n'a chargé que l'onboarding, pas les entretiens.
 */
export function coarseStepOf(onboarding: Onboarding | null): IntegrationStep {
  if (!onboarding) return "plan_a_creer";
  if (onboarding.status === "termine") return "termine";
  if (onboarding.status === "brouillon") return "plan_a_valider";
  return "avant_arrivee";
}

// ─── Filtres et recherche ───────────────────────────────────────────────────

/**
 * Quatre filtres qui se partagent la liste, sans recouvrement.
 *
 * Les sept précédents mélangeaient deux axes — le cycle de vie et l'urgence —
 * si bien qu'un même dossier était compté dans quatre pilules et qu'aucun
 * compteur ne voulait dire quelque chose. Ici, chaque personne tombe dans
 * exactement un des trois filtres autres que « Tous », dont les compteurs
 * s'additionnent pour donner le sien.
 */
export type OverviewFilter = "tous" | "a_faire" | "en_cours" | "termines";

export const OVERVIEW_FILTER_LABEL: Record<OverviewFilter, string> = {
  tous: "Tous",
  a_faire: "À faire",
  en_cours: "En cours",
  termines: "Terminés",
};

export function matchesFilter(overview: IntegrationOverview, filter: OverviewFilter): boolean {
  const closed = overview.globalStatus === "termine";
  switch (filter) {
    case "tous":
      return true;
    case "a_faire":
      return !closed && requiresManagerAction(overview.primaryNextAction);
    case "en_cours":
      return !closed && !requiresManagerAction(overview.primaryNextAction);
    case "termines":
      return closed;
  }
}

/**
 * La situation en une phrase : l'étape, et comment elle se présente.
 *
 * Seul endroit où les deux se composent — la liste et la fiche affichent la
 * même chaîne, elles ne peuvent pas la formuler différemment.
 */
export function situationLabel(overview: IntegrationOverview): string {
  const step = STEP_LABEL[overview.currentStep];
  return overview.stepQualifier ? `${step} ${STEP_QUALIFIER_LABEL[overview.stepQualifier]}` : step;
}

/** Recherche insensible à la casse et aux accents sur prénom, nom, poste. */
export function matchesSearch(candidate: Candidate, missionTitle: string | null, query: string): boolean {
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const needle = fold(query.trim());
  if (!needle) return true;
  const haystack = fold(
    [candidate.first_name, candidate.last_name, candidate.title ?? "", missionTitle ?? ""].join(" "),
  );
  return haystack.includes(needle);
}
