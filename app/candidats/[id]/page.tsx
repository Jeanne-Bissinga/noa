import { notFound } from "next/navigation";
import {
  requireRecruiter, getCandidate, getCandidateExperiences, getCandidateSkills,
  getInterview, getDecisions, getEvaluationGrid, getCandidates,
} from "@/lib/noa/queries";
import { computeScoreBreakdown } from "@/lib/noa/score";
import { getWorkPreferencesByCandidate } from "@/lib/noa/preferences/queries";
import { stepStatusOf } from "@/lib/noa/preferences/status";
import { buildCommunicationGuidance } from "@/lib/noa/preferences/communication";
import { buildPreferenceContext } from "@/lib/noa/preferences/context";
import { createClient } from "@/lib/supabase/server";
import { CandidateDetail } from "./candidate-detail";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const [experiences, skills, screeningInterview, topgradingInterview, decisions, missionCandidates, preferences] = await Promise.all([
    getCandidateExperiences(candidate.id),
    getCandidateSkills(candidate.id),
    getInterview(candidate.id, "screening"),
    getInterview(candidate.id, "topgrading"),
    getDecisions(candidate.id),
    getCandidates(recruiter.company_id, { missionId: candidate.mission_id }),
    getWorkPreferencesByCandidate(candidate.id),
  ]);
  // Comparer n'a de sens qu'à partir de deux candidats sur la même mission.
  const compareHref = missionCandidates.length >= 2 ? `/missions/${candidate.mission_id}/comparaison` : null;

  let cvSignedUrl: string | null = null;
  if (candidate.cv_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("cv-attachments").createSignedUrl(candidate.cv_url, 60 * 10);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  const [screeningGrid, topgradingGrid] = await Promise.all([
    screeningInterview ? getEvaluationGrid(screeningInterview.id) : null,
    topgradingInterview ? getEvaluationGrid(topgradingInterview.id) : null,
  ]);
  const scoreBreakdown = computeScoreBreakdown(
    screeningGrid ? { criteria: screeningGrid.criteria, answers: screeningGrid.answers } : null,
    topgradingGrid ? { criteria: topgradingGrid.criteria, answers: topgradingGrid.answers } : null,
  );

  return (
    <CandidateDetail
      candidate={candidate}
      experiences={experiences}
      skills={skills}
      cvSignedUrl={cvSignedUrl}
      scoreBreakdown={scoreBreakdown}
      compareHref={compareHref}
      screeningStarted={Boolean(screeningInterview)}
      screeningInterviewDone={screeningInterview?.status === "termine"}
      topgradingStarted={Boolean(topgradingInterview)}
      topgradingInterviewDone={topgradingInterview?.status === "termine"}
      decisions={decisions}
      integrationStep={coarseStepOf(onboarding)}
    />
  );
}
