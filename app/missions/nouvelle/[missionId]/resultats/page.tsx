import { notFound } from "next/navigation";
import { requireRecruiter, getMission, getMissionObjectives } from "@/lib/noa/queries";
import { ResultsBoard } from "./results-board";

export default async function JobResultsPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  const recruiter = await requireRecruiter();
  const mission = await getMission(missionId);

  if (!mission || mission.company_id !== recruiter.company_id) {
    notFound();
  }

  const objectives = await getMissionObjectives(mission.id);

  return <ResultsBoard mission={mission} objectives={objectives} />;
}
