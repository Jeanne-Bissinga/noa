"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentRecruiter, getCandidate, getInterview, getEvaluationGrid, getMission,
  getMissionObjectives, getMissionSkills, getCandidateExperiences, getCandidateSkills,
} from "@/lib/noa/queries";
import { getOnboardingByCandidate, getOnboardingGoals, getWorkPreferences } from "@/lib/noa/onboarding/queries";
import { buildPreferenceContext } from "@/lib/noa/onboarding/personalization";
import { buildIntegrationGuide, questionIdsOf } from "@/lib/noa/onboarding/interview-questions";
import {
  buildIntegrationCriteria, parseIntegrationCriteria, renderIntegrationNotes,
} from "@/lib/noa/onboarding/interview-content";
import { generateIntegrationSynthesis } from "@/lib/noa/ai";
import { ERROR_MESSAGE, containsHrVerdict, userError } from "@/lib/noa/errors";
import type {
  Candidate, IntegrationInterviewType, Interview, ManagerConclusion, RecruiterWithCompany,
} from "@/lib/noa/types";

// Écritures des quatre entretiens d'intégration.
//
// Séparées de app/integrations/[id]/actions.ts, qui porte le plan, la date et
// les préférences : deux surfaces d'écriture distinctes.
//
// ─── Ce que ces actions ne font JAMAIS ──────────────────────────────────────
// Elles ne touchent ni `candidates.screening_status`, ni `topgrading_status`,
// ni `score`. Le typage l'interdit déjà — les fonctions du recrutement
// n'acceptent que `RecruitmentInterviewType` — et rien ici n'écrit dans
// `candidates`. Un entretien d'intégration ne redirige pas non plus vers un
// écran de décision : la page rebascule d'elle-même, l'état venant des données.

async function assertOwned(candidateId: string): Promise<{ recruiter: RecruiterWithCompany; candidate: Candidate }> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");
  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }
  return { recruiter, candidate };
}

function revalidate(candidateId: string) {
  // "layout" couvre la fiche et ses quatre sous-routes d'entretien en un appel.
  revalidatePath(`/integrations/${candidateId}`, "layout");
  revalidatePath("/integrations");
}

/** L'entretien du jalon, créé à la demande s'il manque (intégration ancienne). */
async function ensureInterview(
  candidateId: string,
  milestone: IntegrationInterviewType,
): Promise<Interview> {
  const existing = await getInterview(candidateId, milestone);
  if (existing) return existing;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interviews")
    .insert({ candidate_id: candidateId, type: milestone })
    .select("*")
    .single();
  if (error || !data) throw new Error(userError("ensureInterview", error, ERROR_MESSAGE.entretien));
  return data as Interview;
}

// ─── Préparation ────────────────────────────────────────────────────────────

/**
 * Fige le guide de l'entretien : c'est ce qui le fait passer de « à préparer »
 * à « à réaliser ». Idempotente — rejouer remplace le guide, ce qui permet de
 * régénérer après avoir renseigné les préférences de travail.
 */
export async function prepareIntegrationInterview(
  candidateId: string,
  milestone: IntegrationInterviewType,
): Promise<{ error?: string }> {
  const { candidate } = await assertOwned(candidateId);
  const onboarding = await getOnboardingByCandidate(candidateId);
  if (!onboarding) return { error: ERROR_MESSAGE.preparation };

  const preferences = await getWorkPreferences(onboarding.id);
  const context = buildPreferenceContext(onboarding, preferences);
  const sections = buildIntegrationGuide(milestone, context);

  const interview = await ensureInterview(candidate.id, milestone);
  const supabase = await createClient();

  // `topics` porte le guide et `questions` reste vide : on épouse la convention
  // du recrutement — noms trompeurs inclus — plutôt que d'en inventer une
  // seconde pour la même table.
  const { error: guideError } = await supabase.from("interview_guides").upsert(
    { interview_id: interview.id, questions: [], topics: sections },
    { onConflict: "interview_id" },
  );
  if (guideError) return { error: userError("prepareIntegrationInterview.guide", guideError, ERROR_MESSAGE.guide) };

  const existing = await getEvaluationGrid(interview.id);
  const criteria = buildIntegrationCriteria(milestone, sections);
  const { error: gridError } = existing
    ? await supabase
        .from("evaluation_grids")
        .update({ criteria, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : await supabase
        .from("evaluation_grids")
        .insert({ interview_id: interview.id, mission_id: candidate.mission_id, criteria, answers: {} });
  if (gridError) return { error: userError("prepareIntegrationInterview.grid", gridError, ERROR_MESSAGE.grille) };

  revalidate(candidateId);
  return {};
}

// ─── Conduite ───────────────────────────────────────────────────────────────

/** Sauvegarde debouncée de la transcription. Ne change aucun statut. */
export async function saveIntegrationTranscript(
  candidateId: string,
  milestone: IntegrationInterviewType,
  transcript: string,
): Promise<void> {
  await assertOwned(candidateId);
  const interview = await getInterview(candidateId, milestone);
  if (!interview) return;

  const supabase = await createClient();
  await supabase
    .from("interviews")
    .update({ transcript: transcript.trim() || null })
    .eq("id", interview.id);
}

/** Notes par question, debouncées comme la transcription. */
export async function saveIntegrationNotes(
  candidateId: string,
  milestone: IntegrationInterviewType,
  answers: Record<string, string>,
): Promise<{ error?: string }> {
  await assertOwned(candidateId);
  const interview = await getInterview(candidateId, milestone);
  if (!interview) return { error: ERROR_MESSAGE.entretien };

  const grid = await getEvaluationGrid(interview.id);
  const criteria = parseIntegrationCriteria(grid?.criteria);
  if (!grid || !criteria) return { error: ERROR_MESSAGE.grille };

  // Seules les questions réellement préparées sont acceptées : un identifiant
  // inventé ou emprunté à un autre jalon est ignoré.
  const allowed = new Set(questionIdsOf(criteria.sections));
  const clean: Record<string, string> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (allowed.has(id)) clean[id] = value.slice(0, 4000);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("evaluation_grids")
    .update({ answers: clean, updated_at: new Date().toISOString() })
    .eq("id", grid.id);
  if (error) return { error: userError("saveIntegrationNotes", error, ERROR_MESSAGE.grille) };
  return {};
}

/**
 * Clôt l'entretien : notes et transcription figées, statut « terminé »,
 * synthèse rédigée.
 *
 * Ne redirige pas, contrairement à son équivalent du recrutement : l'écran
 * rebascule seul en restitution, puisque sa phase se déduit du statut.
 */
export async function finishIntegrationInterview(
  candidateId: string,
  milestone: IntegrationInterviewType,
  input: { transcript: string; answers: Record<string, string> },
): Promise<{ error?: string }> {
  const { candidate, recruiter } = await assertOwned(candidateId);

  const saved = await saveIntegrationNotes(candidateId, milestone, input.answers);
  if (saved.error) return saved;

  const interview = await getInterview(candidateId, milestone);
  if (!interview) return { error: ERROR_MESSAGE.entretien };
  const grid = await getEvaluationGrid(interview.id);
  const criteria = parseIntegrationCriteria(grid?.criteria);
  if (!criteria) return { error: ERROR_MESSAGE.grille };

  const supabase = await createClient();
  const { error: statusError } = await supabase
    .from("interviews")
    .update({
      status: "termine",
      completed_at: new Date().toISOString(),
      transcript: input.transcript.trim() || null,
    })
    .eq("id", interview.id);
  if (statusError) return { error: userError("finishIntegrationInterview", statusError, ERROR_MESSAGE.entretien) };

  await writeSynthesis({ candidate, recruiter, interview, milestone, criteria, answers: input.answers, transcript: input.transcript });

  revalidate(candidateId);
  return {};
}

/**
 * Rédige et enregistre la synthèse.
 *
 * Remplace au lieu d'empiler : le recrutement insère une ligne à chaque
 * analyse, si bien que relancer duplique et que les écrans compensent en
 * prenant la dernière. Ici il n'y en a jamais deux.
 *
 * Un échec de rédaction ne fait pas échouer l'entretien : il est mené, ses
 * notes sont enregistrées, la synthèse se relance.
 */
async function writeSynthesis(args: {
  candidate: Candidate;
  recruiter: RecruiterWithCompany;
  interview: Interview;
  milestone: IntegrationInterviewType;
  criteria: ReturnType<typeof parseIntegrationCriteria>;
  answers: Record<string, string>;
  transcript: string;
}): Promise<void> {
  const { candidate, recruiter, interview, milestone, criteria, answers, transcript } = args;
  if (!criteria) return;

  try {
    const mission = candidate.mission_id ? await getMission(candidate.mission_id) : null;
    const [objectives, skills, experiences, candidateSkills, onboarding] = await Promise.all([
      mission ? getMissionObjectives(mission.id) : Promise.resolve([]),
      mission ? getMissionSkills(mission.id) : Promise.resolve([]),
      getCandidateExperiences(candidate.id),
      getCandidateSkills(candidate.id),
      getOnboardingByCandidate(candidate.id),
    ]);
    const goals = onboarding ? await getOnboardingGoals(onboarding.id) : [];

    const result = await generateIntegrationSynthesis({
      milestone,
      notes: renderIntegrationNotes(criteria, answers),
      transcript: transcript.trim() || null,
      job: {
        title: mission?.title ?? "",
        missionText: onboarding?.mission_text ?? mission?.mission_text ?? "",
        objectives: objectives.map((o) => o.label).filter((l) => l.trim()),
        skills: skills.map((s) => s.name),
        company: recruiter.company
          ? {
              sector: recruiter.company.sector,
              activityDescription: recruiter.company.activity_description,
              techStack: recruiter.company.tech_stack,
              cultureValues: recruiter.company.culture_values,
              teamSize: recruiter.company.team_size,
              mainObjective: recruiter.company.main_objective,
            }
          : undefined,
      },
      candidate: {
        fullName: `${candidate.first_name} ${candidate.last_name}`,
        title: candidate.title ?? "",
        summary: candidate.summary ?? "",
        experiences: experiences.map((e) => ({
          role: e.role ?? "",
          company: e.company ?? "",
          period: e.period ?? "",
          bullets: e.bullets,
        })),
        skills: candidateSkills.map((s) => s.name),
      },
      milestones: goals
        .filter((g) => g.phase !== "j90")
        .map((g) => `${g.phase.toUpperCase()} · ${g.label} — ${g.status}`),
      outcomes: goals.filter((g) => g.phase === "j90").map((g) => `${g.label} — ${g.status}`),
    });

    // Fusible : si la rédaction produit malgré tout un verdict RH, on préfère
    // ne rien enregistrer plutôt que de l'afficher. Le manager relance, ou
    // rédige lui-même — Noa ne réécrit pas silencieusement.
    if (containsHrVerdict(`${result.content} ${result.nextSteps.join(" ")}`)) {
      userError("writeSynthesis.verdict", new Error("verdict RH filtré dans la synthèse"), ERROR_MESSAGE.synthese);
      return;
    }

    const supabase = await createClient();
    await supabase.from("syntheses").delete().eq("interview_id", interview.id).eq("authored_by", "noa");
    await supabase.from("syntheses").insert({
      candidate_id: candidate.id,
      interview_id: interview.id,
      authored_by: "noa",
      content: result.content,
      advice: result.nextSteps.join("\n"),
    });
  } catch (e) {
    userError("writeSynthesis", e, ERROR_MESSAGE.synthese);
  }
}

/** Relance la rédaction d'une synthèse, depuis l'écran de restitution. */
export async function regenerateIntegrationSynthesis(
  candidateId: string,
  milestone: IntegrationInterviewType,
): Promise<{ error?: string }> {
  const { candidate, recruiter } = await assertOwned(candidateId);
  const interview = await getInterview(candidateId, milestone);
  if (!interview) return { error: ERROR_MESSAGE.entretien };
  const grid = await getEvaluationGrid(interview.id);
  const criteria = parseIntegrationCriteria(grid?.criteria);
  if (!criteria) return { error: ERROR_MESSAGE.grille };

  await writeSynthesis({
    candidate,
    recruiter,
    interview,
    milestone,
    criteria,
    answers: (grid?.answers ?? {}) as Record<string, string>,
    transcript: interview.transcript ?? "",
  });
  revalidate(candidateId);
  return {};
}

// ─── Actions décidées ───────────────────────────────────────────────────────

export async function addIntegrationAction(
  candidateId: string,
  milestone: IntegrationInterviewType,
  input: { label: string; dueDate: string | null; owner: string | null },
): Promise<{ error?: string }> {
  await assertOwned(candidateId);
  const onboarding = await getOnboardingByCandidate(candidateId);
  if (!onboarding) return { error: ERROR_MESSAGE.preparation };

  const label = input.label.trim();
  if (!label) return { error: "L'intitulé de l'action est obligatoire." };

  const interview = await getInterview(candidateId, milestone);
  const supabase = await createClient();
  const { count } = await supabase
    .from("onboarding_actions")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_id", onboarding.id);

  const { error } = await supabase.from("onboarding_actions").insert({
    onboarding_id: onboarding.id,
    source_interview_id: interview?.id ?? null,
    label,
    due_date: input.dueDate || null,
    owner: input.owner?.trim() || null,
    position: count ?? 0,
  });
  if (error) return { error: userError("addIntegrationAction", error, ERROR_MESSAGE.objectif) };

  revalidate(candidateId);
  return {};
}

export async function setIntegrationActionStatus(
  candidateId: string,
  actionId: string,
  status: "todo" | "done" | "cancelled",
): Promise<{ error?: string }> {
  await assertOwned(candidateId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboarding_actions")
    .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", actionId);
  if (error) return { error: userError("setIntegrationActionStatus", error, ERROR_MESSAGE.objectif) };

  revalidate(candidateId);
  return {};
}

export async function removeIntegrationAction(
  candidateId: string,
  actionId: string,
): Promise<{ error?: string }> {
  await assertOwned(candidateId);
  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_actions").delete().eq("id", actionId);
  if (error) return { error: userError("removeIntegrationAction", error, ERROR_MESSAGE.objectif) };

  revalidate(candidateId);
  return {};
}

// ─── Conclusion du manager ──────────────────────────────────────────────────

const CONCLUSIONS: ManagerConclusion[] = ["conforme", "ajustements", "attention"];

export async function saveIntegrationConclusion(
  candidateId: string,
  milestone: IntegrationInterviewType,
  conclusion: string,
  note: string,
): Promise<{ error?: string }> {
  const { recruiter } = await assertOwned(candidateId);
  if (!CONCLUSIONS.includes(conclusion as ManagerConclusion)) {
    return { error: "Conclusion invalide." };
  }

  const interview = await getInterview(candidateId, milestone);
  if (!interview) return { error: ERROR_MESSAGE.entretien };

  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_interview_conclusions").upsert(
    {
      interview_id: interview.id,
      conclusion,
      note: note.trim() || null,
      decided_by: recruiter.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "interview_id" },
  );
  if (error) return { error: userError("saveIntegrationConclusion", error, ERROR_MESSAGE.bilan) };

  // Conclure le J90 clôt l'intégration : c'est le dernier jalon prévu.
  if (milestone === "integration_j90") {
    const onboarding = await getOnboardingByCandidate(candidateId);
    if (onboarding) {
      await supabase
        .from("onboardings")
        .update({ status: "termine", updated_at: new Date().toISOString() })
        .eq("id", onboarding.id);
    }
  }

  revalidate(candidateId);
  return {};
}
