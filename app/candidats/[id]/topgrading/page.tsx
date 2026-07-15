import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate } from "@/lib/noa/queries";
import { ensureInterviewAndGrid } from "../actions";
import { TopgradingGridView } from "./topgrading-grid-view";
import type { TopgradingEpisode } from "@/lib/noa/synthesis";

export default async function TopgradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const { grid } = await ensureInterviewAndGrid(candidate.id, "topgrading");

  return (
    <TopgradingGridView
      candidate={candidate}
      episodes={grid.criteria as TopgradingEpisode[]}
      initialNotes={grid.answers as Record<string, string>}
    />
  );
}
