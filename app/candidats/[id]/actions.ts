"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getCandidate, getInterview, getEvaluationGrid } from "@/lib/noa/queries";
import { STATUS_FIELDS } from "@/lib/noa/labels";
import { generateNoaSynthesis } from "@/lib/noa/synthesis";
import { computeAggregateScore } from "@/lib/noa/score";
import { SCREENING_CRITERIA, TOPGRADING_EPISODES, PREP_META, type PrepGridSection } from "@/lib/noa/interview-content";
import type { InterviewType, DecisionStage, CandidateStatus } from "@/lib/noa/types";

async function assertOwnedCandidate(candidateId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }
  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }
  return { recruiter, candidate };
}

// ─── Get-or-create the interviews row for a candidate+type ─────────────────
async function getOrCreateInterview(candidateId: string, type: InterviewType) {
  const supabase = await createClient();
  const existing = await getInterview(candidateId, type);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("interviews")
    .insert({ candidate_id: candidateId, type })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer l'entretien.");
  }
  return data;
}

// ─── Get-or-initialize the evaluation_grids row, seeded with fixed questions ─
async function getOrCreateEvaluationGrid(interviewId: string, type: InterviewType, missionId: string | null) {
  const supabase = await createClient();
  const existing = await getEvaluationGrid(interviewId);
  if (existing) return existing;

  const criteria = type === "screening" ? SCREENING_CRITERIA : TOPGRADING_EPISODES;

  const { data, error } = await supabase
    .from("evaluation_grids")
    .insert({
      interview_id: interviewId,
      mission_id: missionId,
      criteria,
      answers: {},
      notes: {},
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de créer la grille d'évaluation.");
  }
  return data;
}

export async function ensureInterviewAndGrid(candidateId: string, type: InterviewType) {
  const { candidate } = await assertOwnedCandidate(candidateId);
  const interview = await getOrCreateInterview(candidateId, type);
  const grid = await getOrCreateEvaluationGrid(interview.id, type, candidate.mission_id);
  return { interview, grid };
}

// ─── Préparation d'entretien (grid edits + guide format/duration) ──────────
export async function savePreparation(
  candidateId: string,
  step: InterviewType,
  gridSections: PrepGridSection[],
  format: string,
  duration: string,
) {
  const { candidate } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, step);

  const meta = PREP_META[step];
  const durationMinutes = duration ? parseInt(duration, 10) || null : null;

  const { error: guideError } = await supabase
    .from("interview_guides")
    .upsert(
      {
        interview_id: interview.id,
        questions: gridSections,
        topics: meta.guideSections,
        format: format || null,
        duration_minutes: durationMinutes,
      },
      { onConflict: "interview_id" },
    );

  if (guideError) {
    throw new Error(guideError.message);
  }

  await supabase
    .from("interviews")
    .update({ format: format || null, duration_minutes: durationMinutes })
    .eq("id", interview.id);

  // Also refresh the evaluation grid's criteria with the recruiter's edits,
  // so the interview screen reflects what was prepared.
  const grid = await getOrCreateEvaluationGrid(interview.id, step, candidate.mission_id);
  const editedCriteria =
    step === "screening"
      ? gridSections[0]?.questions.map((q, i) => ({
          id: SCREENING_CRITERIA[i]?.id ?? String(i),
          q: q.text,
          crit: q.crit,
          probes: SCREENING_CRITERIA[i]?.probes ?? [],
        }))
      : gridSections.map((section, si) => ({
          co: section.title,
          period: section.period,
          role: section.subtitle,
          qs: section.questions.map((q, qi) => ({
            id: TOPGRADING_EPISODES[si]?.qs[qi]?.id ?? `${si}-${qi}`,
            q: q.text,
            probes: TOPGRADING_EPISODES[si]?.qs[qi]?.probes ?? [],
          })),
        }));

  await supabase.from("evaluation_grids").update({ criteria: editedCriteria, updated_at: new Date().toISOString() }).eq("id", grid.id);

  const statusField = step === "screening" ? "screening_status" : "topgrading_status";
  if (candidate[statusField] === "pending" || candidate[statusField] === "none") {
    await supabase
      .from("candidates")
      .update({ [statusField]: "current", updated_at: new Date().toISOString() })
      .eq("id", candidateId);
  }

  revalidatePath(`/candidats/${candidateId}`);
  revalidatePath(`/candidats/${candidateId}/preparation`);
  redirect(`/candidats/${candidateId}`);
}

// ─── Save grid answers (screening Oui/Partiel/Non, or topgrading notes) ────
export async function saveGridAnswers(candidateId: string, type: InterviewType, answers: Record<string, string>) {
  await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, type);
  const grid = await getEvaluationGrid(interview.id);
  if (!grid) return;

  await supabase
    .from("evaluation_grids")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", grid.id);
}

// ─── Finish interview -> generate noa synthesis -> redirect to decision ────
export async function finishInterview(candidateId: string, type: InterviewType, answers: Record<string, string>) {
  await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, type);
  const grid = await getOrCreateEvaluationGrid(interview.id, type, null);

  await supabase
    .from("evaluation_grids")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", grid.id);

  await supabase
    .from("interviews")
    .update({ status: "termine", completed_at: new Date().toISOString() })
    .eq("id", interview.id);

  const { content, advice } = generateNoaSynthesis(grid.criteria, answers);

  await supabase.from("syntheses").insert({
    candidate_id: candidateId,
    interview_id: interview.id,
    authored_by: "noa",
    content,
    advice,
  });

  revalidatePath(`/candidats/${candidateId}`);
  revalidatePath(`/candidats/${candidateId}/synthese`);
  redirect(`/candidats/${candidateId}/${type}/decision`);
}

// ─── Stage decisions (screening / topgrading) ──────────────────────────────
type StageDecisionAction = "non_retenu" | "reporte" | "retenu";

export async function decideStage(candidateId: string, stage: "screening" | "topgrading", action: StageDecisionAction, reason?: string) {
  const { recruiter } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const statusMap: Record<StageDecisionAction, "non_retenu" | "reporte" | "retenu"> = {
    non_retenu: "non_retenu",
    reporte: "reporte",
    retenu: "retenu",
  };

  await supabase.from("decisions").insert({
    candidate_id: candidateId,
    stage,
    status: statusMap[action],
    reason: reason ?? null,
    decided_by: recruiter.id,
  });

  if (action === "non_retenu") {
    const fields = STATUS_FIELDS["Non retenu"];
    await supabase
      .from("candidates")
      .update({ status: "Non retenu" as CandidateStatus, ...fields, updated_at: new Date().toISOString() })
      .eq("id", candidateId);

    revalidatePath("/candidats");
    revalidatePath(`/candidats/${candidateId}`);
    redirect(`/candidats/${candidateId}`);
  }

  if (action === "reporte") {
    // Leave status fields as-is — candidate stays visibly "in progress" on the
    // current stage; only the decision row is recorded.
    revalidatePath(`/candidats/${candidateId}`);
    redirect(`/candidats/${candidateId}`);
  }

  // action === "retenu"
  if (stage === "screening") {
    const fields = STATUS_FIELDS["Topgrading"];
    await supabase
      .from("candidates")
      .update({ status: "Topgrading" as CandidateStatus, ...fields, updated_at: new Date().toISOString() })
      .eq("id", candidateId);

    revalidatePath("/candidats");
    revalidatePath(`/candidats/${candidateId}`);
    redirect(`/candidats/${candidateId}/transition?type=topgrading`);
  } else {
    const fields = STATUS_FIELDS["Decision finale"];
    await supabase
      .from("candidates")
      .update({ status: "Decision finale" as CandidateStatus, ...fields, updated_at: new Date().toISOString() })
      .eq("id", candidateId);

    revalidatePath("/candidats");
    revalidatePath(`/candidats/${candidateId}`);
    redirect(`/candidats/${candidateId}/transition?type=final`);
  }
}

// ─── Final decision ─────────────────────────────────────────────────────────
export async function decideFinal(candidateId: string, action: "non_retenu" | "retenu", score: number | null) {
  const { recruiter } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  await supabase.from("decisions").insert({
    candidate_id: candidateId,
    stage: "final" as DecisionStage,
    status: action,
    decided_by: recruiter.id,
  });

  const newStatus: CandidateStatus = action === "retenu" ? "Recrute" : "Non retenu";

  await supabase
    .from("candidates")
    .update({
      status: newStatus,
      decision_status: "done",
      score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  revalidatePath("/candidats");
  revalidatePath(`/candidats/${candidateId}`);
  redirect("/candidats");
}
