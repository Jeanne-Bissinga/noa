import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getInterview, getEvaluationGrid, getSyntheses, getDecisions } from "@/lib/noa/queries";
import { DecisionView } from "../../decision-view";
import type { ScreeningCriterion, ScreeningAnswer } from "@/lib/noa/synthesis";

export default async function ScreeningDecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const interview = await getInterview(candidate.id, "screening");
  if (!interview) {
    notFound();
  }

  const grid = await getEvaluationGrid(interview.id);
  const allSyntheses = await getSyntheses(candidate.id);
  const syntheses = allSyntheses.filter((s) => s.interview_id === interview.id);

  const criteria = (grid?.criteria as ScreeningCriterion[]) ?? [];
  const answers = (grid?.answers as Record<string, ScreeningAnswer>) ?? {};

  const oui = criteria.filter((c) => answers[c.id] === "Oui").length;
  const partiel = criteria.filter((c) => answers[c.id] === "Partiel").length;
  const non = criteria.filter((c) => answers[c.id] === "Non").length;
  const total = criteria.length;

  const noaSynthesis = syntheses.find((s) => s.authored_by === "noa") ?? null;

  const decisions = await getDecisions(candidate.id);
  // "reporte" postpones the decision — it isn't final, so the CTAs must stay
  // visible. Only "retenu"/"non_retenu" close out the stage for good.
  const stageDecision = decisions.filter((d) => d.stage === "screening" && d.status !== "reporte").pop() ?? null;

  return (
    <DecisionView
      candidate={candidate}
      stage="screening"
      stats={[
        { label: "Prérequis validés", value: `${oui}/${total}`, tone: "green" },
        { label: "Critères partiels", value: `${partiel}/${total}`, tone: "yellow" },
        { label: "Points d'attention", value: `${non}/${total}`, tone: "red" },
      ]}
      noaSynthesis={noaSynthesis}
      hasTranscript={Boolean(interview.transcript)}
      decision={stageDecision}
    />
  );
}
