import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate } from "@/lib/noa/queries";
import { ensureInterviewAndGrid } from "../actions";
import { TopgradingGridView } from "./topgrading-grid-view";
import { PREP_META, type PrepGuideSection } from "@/lib/noa/interview-content";

export default async function TopgradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const { interview, guide } = await ensureInterviewAndGrid(candidate.id, "topgrading");
  const guideSections = (guide?.topics as PrepGuideSection[] | undefined)?.length
    ? (guide!.topics as PrepGuideSection[])
    : PREP_META.topgrading.guideSections;

  return (
    <TopgradingGridView
      candidate={candidate}
      guideSections={guideSections}
      initialTranscript={interview.transcript}
    />
  );
}
