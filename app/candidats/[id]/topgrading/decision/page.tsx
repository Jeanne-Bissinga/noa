import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getInterview, getEvaluationGrid, getSyntheses, getDecisions } from "@/lib/noa/queries";
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

  // `pop()`, pas `find()` : getSyntheses trie par created_at croissant et
  // finishInterview INSÈRE une ligne à chaque analyse au lieu de remplacer la
  // précédente. `find()` renvoyait donc la toute première synthèse, et relancer
  // une analyse n'avait aucun effet visible. La dernière fait foi.
  const noaSynthesis = syntheses.filter((s) => s.authored_by === "noa").pop() ?? null;

  const decisions = await getDecisions(candidate.id);
  // "reporte" postpones the decision — it isn't final, so the CTAs must stay
  // visible. Only "retenu"/"non_retenu" close out the stage for good.
  const stageDecision = decisions.filter((d) => d.stage === "topgrading" && d.status !== "reporte").pop() ?? null;

  return (
    <DecisionView
      candidate={candidate}
      stage="topgrading"
      stats={[
        { label: "Points forts", value: `${answered}`, tone: "green" },
        { label: "Points nuancés", value: "-", tone: "yellow" },
        { label: "Points d'attention", value: `${unanswered}`, tone: "red" },
      ]}
      gridRows={episodes.flatMap((ep) =>
        ep.qs.map((q) => ({
          id: q.id,
          question: q.q,
          group: [ep.co, ep.role, ep.period].filter(Boolean).join(" · "),
          answer: answers[q.id] ?? null,
        })),
      )}
      noaSynthesis={noaSynthesis}
      hasTranscript={Boolean(interview.transcript)}
      decision={stageDecision}
    />
  );
}
