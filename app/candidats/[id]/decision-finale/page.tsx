import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRecruiter, getCandidate, getInterview, getEvaluationGrid } from "@/lib/noa/queries";
import { computeAggregateScore } from "@/lib/noa/score";
import { FinalDecisionView } from "./final-decision-view";

export default async function DecisionFinalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const [screeningInterview, topgradingInterview] = await Promise.all([
    getInterview(candidate.id, "screening"),
    getInterview(candidate.id, "topgrading"),
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

  return <FinalDecisionView candidate={candidate} score={score} />;
}
