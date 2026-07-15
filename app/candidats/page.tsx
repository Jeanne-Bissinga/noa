import { requireRecruiter, getCandidates } from "@/lib/noa/queries";
import { CandidatesBoard } from "./candidates-board";

export default async function CandidatesPage() {
  const recruiter = await requireRecruiter();
  const candidates = await getCandidates(recruiter.company_id);

  return <CandidatesBoard candidates={candidates} />;
}
