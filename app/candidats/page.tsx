import { requireRecruiter, getCandidates, getInterviewsForCandidates, getMissions } from "@/lib/noa/queries";
import { CandidatesBoard } from "./candidates-board";

export default async function CandidatesPage() {
  const recruiter = await requireRecruiter();
  const candidates = await getCandidates(recruiter.company_id);
  const missions = await getMissions(recruiter.company_id);
  const interviews = await getInterviewsForCandidates(candidates.map((c) => c.id));

  return <CandidatesBoard candidates={candidates} interviews={interviews} hasMission={missions.length > 0} />;
}
