// Shared display labels/colors for mission & candidate statuses, kept in one
// place so dashboard / missions / mission-detail stay visually consistent.
import type { BadgeColor } from "@/components/noa/ui-primitives";
import type { MissionStatus, CandidateStatus, StageStatus } from "@/lib/noa/types";

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

// Catégorie de critère de screening (lib/noa/ai.ts) marquant un prérequis
// éliminatoire, affichée comme badge "Éliminatoire" dans les grilles/guides.
export const ELIMINATOIRE_CRIT = "Prérequis non négociable";
