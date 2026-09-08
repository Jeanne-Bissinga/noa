// Vue de pilotage des intégrations : où en est chaque personne recrutée.
//
// Une seule fonction, `getIntegrationOverview`, produit tout ce que la liste
// /integrations et la fiche individuelle affichent. Aucun composant ne
// recalcule ces informations de son côté — c'est la condition pour que les
// deux écrans disent toujours la même chose.
//
// ─── Pourquoi trois valeurs ne peuvent plus se contredire ───────────────────
// L'étape courante est décidée en premier, à partir du calendrier. Le statut
// global n'est pas calculé : il est *projeté* depuis l'étape par une table
// exhaustive. L'action principale sort d'une cascade qui rend exactement une
// valeur. L'ancienne version décidait le statut et l'étape dans deux branches
// indépendantes, d'où le badge « Plan à valider » posé au-dessus d'une étape
// « Plan à préparer » pour le même onboarding.
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
  avant_arrivee: "Préparation avant arrivée",
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

const ATTENTION_WEIGHT = 0;
const TERMINE_WEIGHT = 90;

// ─── Résultat ───────────────────────────────────────────────────────────────

export interface IntegrationOverview {
  candidateId: string;
  onboardingId: string | null;
  /** Cycle de vie. Sert aux filtres et au tri — plus aucun badge ne l'affiche. */
  globalStatus: GlobalStatus;
  currentStep: IntegrationStep;
  /** Toujours exactement une action : jamais zéro, jamais deux. */
  primaryNextAction: NextAction;
  /** Date d'arrivée. null = « À définir ». */
  startDate: string | null;
  /** Jour d'intégration. null tant que la date est inconnue, 0 avant l'arrivée. */
  dayNumber: number | null;
  workPreferencesStatus: WorkPreferencesDisplayStatus;
  /** Alertes actives, texte compris : un seul calcul pour la liste et la fiche. */
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
 * Étape atteinte : le dernier entretien dont la date est passée.
 *
 * Fondée sur le calendrier, volontairement, et non sur ce qui reste à faire.
 * « Où en est-on » est une question de dates ; « que faut-il faire » est celle
 * à laquelle répond l'action principale, séparément. Au jour 45 avec un J30
 * jamais mené, l'étape est donc J30 et l'action « Réaliser l'entretien J30 » —
 * ce qui se lit exactement comme un retard.
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

  let reached: TimelineStepKey = "avant_arrivee";
  for (const interview of ordered(interviews)) {
    if (!interview.scheduled_at || new Date(interview.scheduled_at) > now) continue;
    const step = stepOfInterview(interview.type);
    if (step && TIMELINE_STEPS.indexOf(step) > TIMELINE_STEPS.indexOf(reached)) reached = step;
  }
  // La date d'arrivée est passée : on est au moins à J1, même si l'entretien
  // n'a pas encore de créneau enregistré.
  return reached === "avant_arrivee" ? "j1" : reached;
}

/**
 * Le premier entretien dû qui n'a pas été mené.
 *
 * L'ordre chronologique fait le travail : tant que le J30 n'est pas terminé, il
 * reste le premier de la liste, et le J60 ne prend jamais la main — même si sa
 * propre date est passée. Une étape ne devient pas faite parce que sa date
 * l'est.
 */
function firstPendingInterview(interviews: Interview[], now: Date): Interview | null {
  return (
    ordered(interviews).find(
      (i) => i.status !== "termine" && i.scheduled_at !== null && new Date(i.scheduled_at) <= now,
    ) ?? null
  );
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
    return { kind: "creer_plan", label: "Préparer l'intégration", interviewId: null, interviewType: null };
  }
  if (onboarding.status === "termine") return AUCUNE;

  // 1. Un entretien dû passe devant tout : c'est un rendez-vous daté, et c'est
  //    le moment où l'information se perd si on tarde.
  const pending = firstPendingInterview(interviews, now);
  if (pending) {
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
// Déterministes, et fondés sur des faits du parcours plutôt que sur des
// réponses à un questionnaire : un entretien passé sans avoir été mené, ou une
// conclusion de manager marquée « point d'attention ». Rien ici ne juge la
// personne.

export interface OnboardingAlert {
  id: string;
  level: "attention" | "info";
  title: string;
  detail: string;
}

function computeAlerts(interviews: Interview[], conclusions: OnboardingInterviewConclusion[], now: Date): OnboardingAlert[] {
  const alerts: OnboardingAlert[] = [];

  for (const interview of ordered(interviews)) {
    const step = stepOfInterview(interview.type);
    if (!step) continue;
    const short = INTEGRATION_INTERVIEW_SHORT[interview.type as IntegrationInterviewType];

    // Une semaine de battement avant de parler de retard : un entretien se cale
    // sur deux agendas, le jour dit n'est pas une échéance.
    if (
      interview.status !== "termine" &&
      interview.scheduled_at &&
      new Date(interview.scheduled_at).getTime() + 7 * 24 * 60 * 60 * 1000 < now.getTime()
    ) {
      alerts.push({
        id: `${interview.type}_retard`,
        level: "attention",
        title: "Entretien en retard",
        detail: `L'entretien ${short} était prévu et n'a pas encore eu lieu.`,
      });
    }

    const conclusion = conclusions.find((c) => c.interview_id === interview.id);
    if (conclusion?.conclusion === "attention") {
      alerts.push({
        id: `${interview.type}_conclusion`,
        level: "info",
        title: "Point d'attention",
        detail: `Vous avez signalé un point d'attention à l'issue de l'entretien ${short}.`,
      });
    }
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
  const alerts = computeAlerts(interviews, input.conclusions, now);
  const primaryNextAction = primaryNextActionOf({ onboarding, interviews, prepared, prefStatus, now });

  const nextScheduled = ordered(interviews).find((i) => i.status !== "termine")?.scheduled_at ?? null;

  // Une intégration terminée reste en bas même avec une alerte : la boucle est
  // close, l'alerte reste consultable mais n'appelle plus de geste.
  const sortWeight =
    globalStatus === "termine"
      ? TERMINE_WEIGHT
      : alerts.length > 0
      ? ATTENTION_WEIGHT
      : ACTION_WEIGHT[primaryNextAction.kind];

  return {
    candidateId: candidate.id,
    onboardingId: onboarding?.id ?? null,
    globalStatus,
    currentStep,
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

export type OverviewFilter =
  | "tous"
  | "action_requise"
  | "a_preparer"
  | "en_cours"
  | "preferences_en_attente"
  | "attention"
  | "termines";

export const OVERVIEW_FILTER_LABEL: Record<OverviewFilter, string> = {
  tous: "Tous",
  action_requise: "Action requise",
  a_preparer: "À préparer",
  en_cours: "En cours",
  preferences_en_attente: "Préférences en attente",
  attention: "Points d'attention",
  termines: "Terminés",
};

export function matchesFilter(overview: IntegrationOverview, filter: OverviewFilter): boolean {
  switch (filter) {
    case "tous":
      return true;
    case "action_requise":
      return requiresManagerAction(overview.primaryNextAction);
    case "a_preparer":
      return overview.globalStatus === "preparation";
    case "en_cours":
      return overview.globalStatus === "en_cours";
    case "preferences_en_attente":
      return overview.globalStatus !== "termine" && overview.workPreferencesStatus !== "complete";
    case "attention":
      return overview.hasActiveAttention;
    case "termines":
      return overview.globalStatus === "termine";
  }
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
