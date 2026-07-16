import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getInterview, getEvaluationGrid, getSyntheses } from "@/lib/noa/queries";
import { DecisionView } from "../../decision-view";
import type { TopgradingEpisode } from "@/lib/noa/synthesis";

export default async function TopgradingDecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const interview = await getInterview(candidate.id, "topgrading");
  if (!interview) {
    notFound();
  }

  const grid = await getEvaluationGrid(interview.id);
  const allSyntheses = await getSyntheses(candidate.id);
  const syntheses = allSyntheses.filter((s) => s.interview_id === interview.id);

  const episodes = (grid?.criteria as TopgradingEpisode[]) ?? [];
  const answers = (grid?.answers as Record<string, string>) ?? {};
  const allQuestions = episodes.flatMap((ep) => ep.qs);
  const total = allQuestions.length;
  const answered = allQuestions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const unanswered = total - answered;

  const noaSynthesis = syntheses.find((s) => s.authored_by === "noa") ?? null;

  return (
    <DecisionView
      candidate={candidate}
      stage="topgrading"
      stats={[
        { label: "Points forts", value: `${answered}`, tone: "green" },
        { label: "Points nuancés", value: "-", tone: "yellow" },
        { label: "Points d'attention", value: `${unanswered}`, tone: "red" },
      ]}
      noaSynthesis={noaSynthesis}
      hasTranscript={Boolean(interview.transcript)}
    />
  );
}
