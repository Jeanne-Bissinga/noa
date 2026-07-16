// Single source of truth for "une décision est en attente".
//
// A stage is waiting on the recruiter as soon as its interview is finished but
// no closing decision has been recorded for it. "reporte" ("Décider plus tard")
// explicitly does NOT close a stage, so it must keep counting as pending —
// same rule as the decision screens (app/candidats/[id]/*/decision/page.tsx).
//
// The final stage has no interview: it is pending from the moment the candidate
// reaches "Decision finale" until decideFinal() sets decision_status = "done".
import type { Candidate, Decision, DecisionStage, Interview } from "@/lib/noa/types";

export interface PendingDecision {
  candidate: Candidate;
  stage: DecisionStage;
}

// Decisions that actually close a stage. A "reporte" row leaves it open.
const CLOSING_STATUSES = new Set(["retenu", "non_retenu"]);

function isStageClosed(decisions: Decision[], stage: DecisionStage): boolean {
  return decisions.some((d) => d.stage === stage && CLOSING_STATUSES.has(d.status));
}

// The stage a candidate currently sits on, per candidates.status.
const STAGE_OF_STATUS = {
  Screening: "screening",
  Topgrading: "topgrading",
  "Decision finale": "final",
} as const;

/**
 * Returns the stage a candidate is waiting on, or null if nothing is pending.
 *
 * Only the candidate's *current* stage can be pending: a finished interview
 * further back in the process has already been settled to get here. Gating on
 * status also keeps a stale interview row from resurrecting a decision the
 * recruiter has moved past.
 */
export function pendingStageFor(
  candidate: Candidate,
  interviews: Interview[],
  decisions: Decision[],
): DecisionStage | null {
  // "Non retenu" / "Recrute": process over, nothing left to decide.
  const stage = STAGE_OF_STATUS[candidate.status as keyof typeof STAGE_OF_STATUS];
  if (!stage) return null;

  // The final stage has no interview to wait on.
  if (stage === "final") {
    return candidate.decision_status === "done" ? null : "final";
  }

  // Screening / topgrading: pending once the interview is done and no
  // retenu/non_retenu has closed it.
  const interview = interviews.find((i) => i.type === stage);
  if (interview?.status === "termine" && !isStageClosed(decisions, stage)) {
    return stage;
  }

  return null;
}

/**
 * Fans the rule out over a whole company. `interviews`/`decisions` are the flat
 * rows for every candidate passed in; they get grouped by candidate_id here.
 */
export function pendingDecisions(
  candidates: Candidate[],
  interviews: Interview[],
  decisions: Decision[],
): PendingDecision[] {
  const result: PendingDecision[] = [];

  for (const candidate of candidates) {
    const stage = pendingStageFor(
      candidate,
      interviews.filter((i) => i.candidate_id === candidate.id),
      decisions.filter((d) => d.candidate_id === candidate.id),
    );
    if (stage) result.push({ candidate, stage });
  }

  return result;
}
