"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentRecruiter, getCandidate, getInterview, getEvaluationGrid,
  getMission, getMissionObjectives, getMissionSkills, getCandidateExperiences, getCandidateSkills,
} from "@/lib/noa/queries";
import { STATUS_FIELDS } from "@/lib/noa/labels";
import { generateNoaSynthesis } from "@/lib/noa/synthesis";
import { SCREENING_CRITERIA, TOPGRADING_EPISODES, PREP_META, type PrepGridSection, type PrepGuideSection } from "@/lib/noa/interview-content";
import {
  generateScreeningCriteria,
  generateScreeningGuideSections,
  generateTopgradingEpisodes,
  generateTopgradingGuideSections,
  generateInterviewSynthesis,
  evaluateScreeningGrid,
  evaluateTopgradingGrid,
  type JobSpecContext,
  type CandidateContext,
} from "@/lib/noa/ai";
import type { InterviewType, DecisionStage, CandidateStatus, Candidate, RecruiterWithCompany } from "@/lib/noa/types";

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

// ─── Contexte poste + candidat pour la préparation du screening ────────────
async function buildScreeningContext(candidate: Candidate, recruiter: RecruiterWithCompany) {
  const mission = candidate.mission_id ? await getMission(candidate.mission_id) : null;
  const [objectives, skills, experiences, candSkills] = await Promise.all([
    mission ? getMissionObjectives(mission.id) : Promise.resolve([]),
    mission ? getMissionSkills(mission.id) : Promise.resolve([]),
    getCandidateExperiences(candidate.id),
    getCandidateSkills(candidate.id),
  ]);

  const c = recruiter.company;
  const job: JobSpecContext = {
    title: mission?.title ?? "",
    missionText: mission?.mission_text ?? "",
    objectives: objectives.map((o) => o.label).filter((l) => l.trim()),
    skills: skills.map((s) => s.name),
    company: c
      ? {
          sector: c.sector,
          activityDescription: c.activity_description,
          techStack: c.tech_stack,
          cultureValues: c.culture_values,
          teamSize: c.team_size,
          mainObjective: c.main_objective,
        }
      : undefined,
  };

  const cand: CandidateContext = {
    fullName: `${candidate.first_name} ${candidate.last_name}`,
    title: candidate.title ?? "",
    summary: candidate.summary ?? "",
    experiences: experiences.map((e) => ({
      role: e.role ?? "",
      company: e.company ?? "",
      period: e.period ?? "",
      bullets: e.bullets ?? [],
    })),
    skills: candSkills.map((s) => s.name),
  };

  return { job, cand };
}

// Parse "20 min" -> 20. Retombe sur 30 min si le format est vide/inattendu,
// pour que le dosage AI reste raisonnable même sans sélection explicite.
function parseDurationMinutes(duration: string): number {
  const n = parseInt(duration, 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

// ─── Génération noa de la grille d'évaluation de screening (B) ─────────────
// Référentiel de critères, indépendant de la durée de l'entretien.
export async function generateScreeningGrid(candidateId: string): Promise<PrepGridSection[]> {
  const { candidate, recruiter } = await assertOwnedCandidate(candidateId);
  try {
    const { job, cand } = await buildScreeningContext(candidate, recruiter);
    const criteria = await generateScreeningCriteria(job, cand);
    if (criteria.length) {
      return [{ title: "Grille d'évaluation", questions: criteria.map((c) => ({ text: c.text, crit: c.crit })) }];
    }
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Génération de la grille de screening échouée, repli statique : ${err?.message ?? String(e)}`);
  }
  return PREP_META.screening.gridSections;
}

// ─── Génération noa du guide d'entretien de screening (C) ──────────────────
export async function generateScreeningGuide(
  candidateId: string,
  gridSections: PrepGridSection[],
  duration: string,
): Promise<PrepGuideSection[]> {
  const { candidate, recruiter } = await assertOwnedCandidate(candidateId);
  try {
    const { job, cand } = await buildScreeningContext(candidate, recruiter);
    const criteria = (gridSections[0]?.questions ?? []).map((q) => ({ text: q.text, crit: q.crit ?? "" }));
    const sections = await generateScreeningGuideSections(criteria, job, cand, parseDurationMinutes(duration));
    if (sections.length) return sections;
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Génération du guide de screening échouée, repli statique : ${err?.message ?? String(e)}`);
  }
  return PREP_META.screening.guideSections;
}

// ─── Génération noa de la grille d'évaluation de topgrading (B') ───────────
// Référentiel de critères, indépendant de la durée de l'entretien.
export async function generateTopgradingGrid(candidateId: string): Promise<PrepGridSection[]> {
  const { candidate, recruiter } = await assertOwnedCandidate(candidateId);
  try {
    const { job, cand } = await buildScreeningContext(candidate, recruiter);
    const episodes = await generateTopgradingEpisodes(job, cand);
    if (episodes.length) {
      return episodes.map((ep) => ({
        title: ep.company,
        subtitle: ep.role,
        period: ep.period,
        questions: ep.questions.map((q) => ({ text: q })),
      }));
    }
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Génération de la grille de topgrading échouée, repli statique : ${err?.message ?? String(e)}`);
  }
  return PREP_META.topgrading.gridSections;
}

// ─── Génération noa du guide de topgrading (C') ────────────────────────────
export async function generateTopgradingGuide(
  candidateId: string,
  gridSections: PrepGridSection[],
  duration: string,
): Promise<PrepGuideSection[]> {
  const { candidate, recruiter } = await assertOwnedCandidate(candidateId);
  try {
    const { job, cand } = await buildScreeningContext(candidate, recruiter);
    const episodes = gridSections.map((s) => ({
      company: s.title,
      role: s.subtitle ?? "",
      period: s.period ?? "",
      questions: s.questions.map((q) => q.text),
    }));
    const sections = await generateTopgradingGuideSections(episodes, job, cand, parseDurationMinutes(duration));
    if (sections.length) return sections;
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Génération du guide de topgrading échouée, repli statique : ${err?.message ?? String(e)}`);
  }
  return PREP_META.topgrading.guideSections;
}

// ─── Préparation d'entretien (grid edits + guide format/duration) ──────────
export async function savePreparation(
  candidateId: string,
  step: InterviewType,
  gridSections: PrepGridSection[],
  guideSections: PrepGuideSection[],
  format: string,
  duration: string,
) {
  const { candidate } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, step);

  const durationMinutes = duration ? parseInt(duration, 10) || null : null;

  const { error: guideError } = await supabase
    .from("interview_guides")
    .upsert(
      {
        interview_id: interview.id,
        questions: gridSections,
        topics: guideSections,
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

// ─── Save the transcript pasted by the recruiter (from an external recording/
// transcription tool, since noa doesn't record audio itself) ───────────────
export async function saveTranscript(candidateId: string, type: InterviewType, transcript: string) {
  await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, type);
  await supabase
    .from("interviews")
    .update({ transcript: transcript.trim() || null })
    .eq("id", interview.id);
}

// Rend la grille remplie en texte lisible pour la synthèse. Gère les deux formes :
// screening (réponses Oui/Partiel/Non) et topgrading (notes libres par question).
function renderFilledGrid(criteria: unknown, answers: Record<string, string>): string {
  if (!Array.isArray(criteria)) return "";
  const lines: string[] = [];
  for (const raw of criteria) {
    const c = raw as Record<string, unknown>;
    if (Array.isArray(c.qs)) {
      const header = [c.co, c.role, c.period].filter(Boolean).map(String).join(" · ");
      lines.push(`\n[${header}]`);
      for (const rawQ of c.qs) {
        const q = rawQ as Record<string, unknown>;
        const note = (answers[String(q.id)] ?? "").trim();
        lines.push(`Q: ${String(q.q ?? "")}\nNotes: ${note || "(pas de note)"}`);
      }
    } else {
      const a = answers[String(c.id)];
      const crit = c.crit ? ` [${String(c.crit)}]` : "";
      lines.push(`- ${String(c.q ?? "")}${crit} : ${a || "(non répondu)"}`);
    }
  }
  return lines.join("\n");
}

// ─── Finish interview: noa analyse la transcription, remplit lui-même la
// grille d'évaluation (le recruteur n'a rien à cocher/noter), puis rédige la
// synthèse -> redirect vers la décision. Le recruteur se contente de
// consulter le guide et de coller la transcription en amont.
export type FinishInterviewState = { error?: string };

export async function finishInterview(candidateId: string, type: InterviewType, transcript: string): Promise<FinishInterviewState> {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return { error: "Collez la transcription de l'entretien avant de lancer l'analyse." };
  }

  const { candidate, recruiter } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const interview = await getOrCreateInterview(candidateId, type);
  const grid = await getOrCreateEvaluationGrid(interview.id, type, candidate.mission_id);
  const { job, cand } = await buildScreeningContext(candidate, recruiter);

  // noa détermine seul les réponses de la grille à partir de la transcription.
  // Pas de repli automatique possible ici (pas de saisie manuelle à défaut) :
  // en cas d'échec, on redemande au recruteur de relancer l'analyse.
  let answers: Record<string, string>;
  try {
    if (type === "screening") {
      answers = await evaluateScreeningGrid(grid.criteria as { id: string; q: string; crit?: string }[], trimmed, job, cand);
    } else {
      answers = await evaluateTopgradingGrid(grid.criteria as { co: string; qs: { id: string; q: string }[] }[], trimmed, job, cand);
    }
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Évaluation de la grille ${type} échouée : ${err?.message ?? String(e)}`);
    return { error: "noa n'a pas réussi à analyser la transcription. Réessayez dans un instant." };
  }

  await supabase
    .from("evaluation_grids")
    .update({ answers, updated_at: new Date().toISOString() })
    .eq("id", grid.id);

  await supabase
    .from("interviews")
    .update({ status: "termine", completed_at: new Date().toISOString(), transcript: trimmed })
    .eq("id", interview.id);

  // noa rédige la synthèse à partir de la grille qu'il vient de remplir et de
  // la transcription. Repli sur la synthèse rule-based (déterministe) en cas d'échec.
  let content: string;
  let advice: string;
  try {
    const filledGrid = renderFilledGrid(grid.criteria, answers);
    ({ content, advice } = await generateInterviewSynthesis({ type, filledGrid, transcript: trimmed, job, candidate: cand }));
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] Synthèse ${type} échouée, repli rule-based : ${err?.message ?? String(e)}`);
    ({ content, advice } = generateNoaSynthesis(grid.criteria, answers));
  }

  await supabase.from("syntheses").insert({
    candidate_id: candidateId,
    interview_id: interview.id,
    authored_by: "noa",
    content,
    advice,
  });

  revalidatePath(`/candidats/${candidateId}`);
  revalidatePath(`/candidats/${candidateId}/synthese`);
  // L'entretien passe à "termine" : une décision est désormais en attente.
  revalidatePath("/dashboard");
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

  // Vaut pour les trois issues ci-dessous, y compris "reporte" : la décision
  // reste en attente, mais l'étape suivante peut en ouvrir une nouvelle.
  revalidatePath("/dashboard");

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
    // Leave status fields as-is, candidate stays visibly "in progress" on the
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
    redirect(`/candidats/${candidateId}`);
  } else {
    const fields = STATUS_FIELDS["Decision finale"];
    await supabase
      .from("candidates")
      .update({ status: "Decision finale" as CandidateStatus, ...fields, updated_at: new Date().toISOString() })
      .eq("id", candidateId);

    revalidatePath("/candidats");
    revalidatePath(`/candidats/${candidateId}`);
    redirect(`/candidats/${candidateId}`);
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
  revalidatePath("/dashboard");
  redirect("/candidats");
}
