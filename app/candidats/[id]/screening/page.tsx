import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate } from "@/lib/noa/queries";
import { ensureInterviewAndGrid } from "../actions";
import { ScreeningGridView } from "./screening-grid-view";
import type { ScreeningCriterion } from "@/lib/noa/synthesis";

export default async function ScreeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const { interview, grid } = await ensureInterviewAndGrid(candidate.id, "screening");

  return (
    <ScreeningGridView
      candidate={candidate}
      criteria={grid.criteria as ScreeningCriterion[]}
      initialTranscript={interview.transcript}
    />
  );
}
