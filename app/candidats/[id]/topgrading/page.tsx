import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate } from "@/lib/noa/queries";
import { ensureInterviewAndGrid } from "../actions";
import { TopgradingGridView } from "./topgrading-grid-view";
import { PREP_META, type PrepGuideSection } from "@/lib/noa/interview-content";
import { withSkillCheckGuideSection } from "@/lib/noa/skill-checks";

export default async function TopgradingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const { interview, grid, guide } = await ensureInterviewAndGrid(candidate.id, "topgrading");
  const base = (guide?.topics as PrepGuideSection[] | undefined)?.length
    ? (guide!.topics as PrepGuideSection[])
    : PREP_META.topgrading.guideSections;
  // Filet pour le recruteur qui saute la préparation : sans lui, la grille
  // porterait des critères jamais posés, que l'analyse noterait tous « Non ».
  const guideSections = withSkillCheckGuideSection(base, grid.criteria);

  return (
    <TopgradingGridView
      candidate={candidate}
      guideSections={guideSections}
      initialTranscript={interview.transcript}
    />
  );
}
