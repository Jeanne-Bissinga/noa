import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  requireRecruiter, getCandidate, getInterview, getEvaluationGrid,
  getCandidateExperiences, getCandidateSkills, getSyntheses,
} from "@/lib/noa/queries";
import { computeAggregateScore } from "@/lib/noa/score";
import { ensureFinalRecommendation } from "../actions";
import { FinalDecisionView } from "./final-decision-view";

export default async function DecisionFinalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const [screeningInterview, topgradingInterview, experiences, skills, syntheses] = await Promise.all([
    getInterview(candidate.id, "screening"),
    getInterview(candidate.id, "topgrading"),
    getCandidateExperiences(candidate.id),
    getCandidateSkills(candidate.id),
    getSyntheses(candidate.id),
  ]);

  const [screeningGrid, topgradingGrid] = await Promise.all([
    screeningInterview ? getEvaluationGrid(screeningInterview.id) : null,
    topgradingInterview ? getEvaluationGrid(topgradingInterview.id) : null,
  ]);

  const score = computeAggregateScore(
    screeningGrid ? { criteria: screeningGrid.criteria, answers: screeningGrid.answers } : null,
    topgradingGrid ? { criteria: topgradingGrid.criteria, answers: topgradingGrid.answers } : null,
  );

  // Persist the computed score onto the candidate as soon as it's computed
  // (idempotent, recomputed every time this page loads until a decision is made).
  if (score !== null && score !== candidate.score) {
    const supabase = await createClient();
    await supabase.from("candidates").update({ score, updated_at: new Date().toISOString() }).eq("id", candidate.id);
    candidate.score = score;
  }

  const noaSynthesis = (interviewId: string | undefined) =>
    syntheses.find((s) => s.interview_id === interviewId && s.authored_by === "noa") ?? null;
  const screeningSynthesis = noaSynthesis(screeningInterview?.id);
  const topgradingSynthesis = noaSynthesis(topgradingInterview?.id);

  // Générée une seule fois (persistée en base) : si aucune synthèse globale
  // n'existe encore pour ce candidat, on la génère maintenant.
  let globalRecommendation = syntheses.find((s) => s.interview_id === null && s.authored_by === "noa") ?? null;
  if (!globalRecommendation) {
    globalRecommendation = await ensureFinalRecommendation(candidate.id, {
      score,
      screeningSynthesis: screeningSynthesis
        ? { content: screeningSynthesis.content ?? "", advice: screeningSynthesis.advice ?? "" }
        : null,
      topgradingSynthesis: topgradingSynthesis
        ? { content: topgradingSynthesis.content ?? "", advice: topgradingSynthesis.advice ?? "" }
        : null,
    });
  }

  return (
    <FinalDecisionView
      candidate={candidate}
      score={score}
      experiences={experiences}
      skills={skills}
      screeningSynthesis={screeningSynthesis}
      topgradingSynthesis={topgradingSynthesis}
      globalRecommendation={globalRecommendation}
    />
  );
}
