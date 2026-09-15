// Shared display labels/colors for mission & candidate statuses, kept in one
// place so dashboard / missions / mission-detail stay visually consistent.
import type { BadgeColor } from "@/components/noa/ui-primitives";
import type { MissionStatus, CandidateStatus, StageStatus, Interview, InterviewType, IntegrationInterviewType, RecruitmentInterviewType, DecisionStage, DecisionStatus } from "@/lib/noa/types";

export const MISSION_STATUS_LABEL: Record<MissionStatus, string> = {
  brouillon: "En attente de candidat",
  en_cours: "Recrutement en cours",
  pourvu: "Poste pourvu",
  annule: "Annulée",
};

export const MISSION_STATUS_COLOR: Record<MissionStatus, BadgeColor> = {
  brouillon: "yellow",
  en_cours: "violet",
  pourvu: "green",
  annule: "gray",
};

export const MISSION_STATUS_DOT: Record<MissionStatus, string> = {
  brouillon: "bg-[#FEE831]",
  en_cours: "bg-[#CCB8FF]",
  pourvu: "bg-[#75DA9F]",
  annule: "bg-gray-300",
};

// Libellés affichés aux recruteurs : "Screening"/"Topgrading" restent les
// valeurs internes (statut BDD, routes, clés de logique), mais l'UI doit
// parler le langage courant du recrutement (retours utilisateurs de Manal).
export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  Screening: "Premier entretien",
  Topgrading: "Entretien technique",
  "Decision finale": "Décision finale",
  "Non retenu": "Non retenu",
  Recrute: "Recruté",
};

export const CANDIDATE_BADGE: Record<CandidateStatus, BadgeColor> = {
  Screening: "blue",
  Topgrading: "violet",
  "Decision finale": "green",
  "Non retenu": "red",
  Recrute: "green",
};

export const CANDIDATE_AVATAR_COLOR: Record<CandidateStatus, string> = {
  Screening: "bg-[#99BAF8]/20 text-[#3a6fd4]",
  Topgrading: "bg-[#CCB8FF]/20 text-[#6b4ec4]",
  "Decision finale": "bg-[#75DA9F]/20 text-[#1e8f52]",
  "Non retenu": "bg-red-50 text-red-400",
  Recrute: "bg-[#75DA9F]/20 text-[#1e8f52]",
};

// Candidate stage-status mapping applied whenever candidates.status changes
// (kanban drag & drop in /candidats, and the screening/topgrading/final
// decision Server Actions in /candidats/[id]). Kept in a plain module (not a
// "use server" actions file) so it can be imported as a value from either.
//   Screening        -> screening_status=current,  topgrading_status=pending, decision_status=pending
//   Topgrading        -> screening_status=done,      topgrading_status=current, decision_status=pending
//   Decision finale   -> screening_status=done,      topgrading_status=done,    decision_status=current
//   Non retenu        -> statuses left as-is except decision_status=done (process stopped)
//   Recrute           -> same as Non retenu: process over, all stages done
export const STATUS_FIELDS: Record<CandidateStatus, { screening_status: StageStatus; topgrading_status: StageStatus; decision_status: StageStatus }> = {
  Screening: { screening_status: "current", topgrading_status: "pending", decision_status: "pending" },
  Topgrading: { screening_status: "done", topgrading_status: "current", decision_status: "pending" },
  "Decision finale": { screening_status: "done", topgrading_status: "done", decision_status: "current" },
  "Non retenu": { screening_status: "done", topgrading_status: "done", decision_status: "done" },
  Recrute: { screening_status: "done", topgrading_status: "done", decision_status: "done" },
};

// ─── Kanban: quels déplacements le drag & drop autorise ────────────────────
//
// Faire avancer un candidat EST une décision : elle doit être prise depuis les
// écrans de décision (decideStage / decideFinal), qui écrivent une ligne dans
// `decisions` avec son auteur, sa date et son motif. Le kanban n'a pas ce
// contexte — il ne doit donc jamais avancer un candidat, sans quoi le statut
// progresse sans trace de décision.
//
// Les retours en arrière restent permis : ce sont des corrections, pas des
// décisions. Ils réouvrent l'étape visée (voir reopenStagesFrom dans
// app/candidats/actions.ts).
const CANDIDATE_STATUS_RANK: Record<CandidateStatus, number> = {
  Screening: 0,
  Topgrading: 1,
  "Decision finale": 2,
  "Non retenu": 3,
  Recrute: 3,
};

// Issues terminales : uniquement atteignables via une décision actée.
const TERMINAL_STATUSES: CandidateStatus[] = ["Non retenu", "Recrute"];

export type MoveCheck = { ok: true } | { ok: false; reason: string };

/**
 * Dit si le kanban peut appliquer ce changement de statut. Partagé par le
 * board (pour refuser le drop sans faire clignoter la carte) et par la Server
 * Action (source de vérité — le board ne protège rien à lui seul).
 */
export function canMoveCandidate(from: CandidateStatus, to: CandidateStatus): MoveCheck {
  if (from === to) return { ok: true };

  if (TERMINAL_STATUSES.includes(to)) {
    return {
      ok: false,
      reason: `« ${to} » est une décision : prenez-la depuis la fiche du candidat pour qu'elle soit tracée.`,
    };
  }

  if (CANDIDATE_STATUS_RANK[to] > CANDIDATE_STATUS_RANK[from]) {
    return {
      ok: false,
      reason: `Faire passer un candidat en « ${to} » est une décision : prenez-la depuis sa fiche pour qu'elle soit tracée.`,
    };
  }

  return { ok: true };
}

export const REASON_LABEL: Record<string, string> = {
  scale: "Scale / Croissance",
  replacement: "Remplacement",
  reorg: "Réorganisation",
  newrole: "Création de poste",
  other: "Autre",
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export const initials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

// Sous-étape à l'intérieur de Screening/Topgrading, pour les kanbans (page
// Candidats + fiche mission) : sans ça, une carte "Screening" ne dit pas si
// le candidat en est à préparer l'entretien, à le passer, ou en attente de
// décision. Partagé avec la logique équivalente de candidate-frise.tsx.
export type SubStep = "prep" | "interview" | "decision";

export const SUB_STEP_LABEL: Record<SubStep, string> = {
  prep: "Préparation",
  interview: "Entretien",
  decision: "Décision à prendre",
};

export function subStepFor(interview: Interview | undefined): SubStep {
  if (!interview) return "prep";
  if (interview.status !== "termine") return "interview";
  return "decision";
}

// Catégorie de critère de screening (lib/noa/ai.ts) marquant un prérequis
// éliminatoire, affichée comme badge "Éliminatoire" dans les grilles/guides.
export const ELIMINATOIRE_CRIT = "Prérequis non négociable";


// ─── Entretiens ─────────────────────────────────────────────────────────────
// Une seule table de libellés pour les six types. Elle était recopiée dans
// quatre écrans, qui divergeaient dès qu'on en modifiait un.

export const INTERVIEW_LABEL: Record<InterviewType, string> = {
  screening: "Premier entretien",
  topgrading: "Entretien technique",
  integration_j1: "Entretien J1",
  integration_j30: "Entretien J30",
  integration_j60: "Entretien J60",
  integration_j90: "Entretien J90",
};

/** Sous-titre affiché sous le titre de chaque entretien d'intégration. */
export const INTEGRATION_INTERVIEW_SUBTITLE: Record<IntegrationInterviewType, string> = {
  integration_j1: "Aligner les attentes et préparer les premières semaines.",
  integration_j30: "Vérifier que les conditions sont réunies pour réussir la prise de poste.",
  integration_j60: "Confronter la prise de poste aux premiers résultats attendus.",
  integration_j90: "Faire le bilan des 90 premiers jours et définir la suite.",
};

/** Jalon court, pour la frise et les tableaux où la place manque. */
export const INTEGRATION_INTERVIEW_SHORT: Record<IntegrationInterviewType, string> = {
  integration_j1: "J1",
  integration_j30: "J30",
  integration_j60: "J60",
  integration_j90: "J90",
};

/**
 * Ce que le manager lit avant d'inviter quelqu'un à décrire ses préférences.
 *
 * Une chaîne construite ici, et non du texte JSX. Écrite dans la modale sur
 * deux lignes de source, « {firstName} peut renseigner… » perdait l'espace
 * après le prénom : un bloc de texte JSX qui déborde sur une deuxième ligne est
 * reflué en rognant les blancs de bord de chaque ligne, y compris celui qui
 * précédait le premier mot. L'écran affichait « Alexpeut ». Un gabarit de
 * chaîne ne peut pas perdre cet espace.
 */
export function workPreferencesInviteIntro(firstName: string): string {
  return (
    `${firstName} peut renseigner le résultat d'un test DISC, MBTI ou Big Five déjà réalisé. ` +
    `S'il n'en a pas, il peut répondre au questionnaire Noa de 24 questions.`
  );
}

const RECRUITMENT_TYPES: RecruitmentInterviewType[] = ["screening", "topgrading"];

export function isRecruitmentInterview(type: string): type is RecruitmentInterviewType {
  return (RECRUITMENT_TYPES as string[]).includes(type);
}

export function isIntegrationInterview(type: string): type is IntegrationInterviewType {
  return type.startsWith("integration_");
}

/**
 * Valide un paramètre d'URL en type d'entretien de recrutement.
 *
 * Le même ternaire était réécrit dans trois pages, dont une qui retombait
 * silencieusement sur « screening » pour toute valeur inconnue — un `j30` y
 * serait devenu un screening.
 */
export function parseRecruitmentInterviewType(value: string | undefined): RecruitmentInterviewType | null {
  return value && isRecruitmentInterview(value) ? value : null;
}

// ─── Décisions ──────────────────────────────────────────────────────────────
// Une seule table de libellés pour l'historique des décisions (page de
// comparaison des candidats), plutôt que de faire parler les valeurs
// internes de la table `decisions` directement à l'écran.

export const DECISION_STAGE_LABEL: Record<DecisionStage, string> = {
  screening: "Premier entretien",
  topgrading: "Entretien technique",
  final: "Décision finale",
};

export const DECISION_STATUS_LABEL: Record<DecisionStatus, string> = {
  retenu: "Retenu",
  non_retenu: "Non retenu",
  reporte: "Reporté",
};

export const DECISION_STATUS_COLOR: Record<DecisionStatus, BadgeColor> = {
  retenu: "green",
  non_retenu: "red",
  reporte: "yellow",
};
