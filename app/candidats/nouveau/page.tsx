import { notFound } from "next/navigation";
import { requireRecruiter, getMission } from "@/lib/noa/queries";
import { AddCandidateForm } from "./add-candidate-form";

export default async function AddCandidatePage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission: missionId } = await searchParams;
  const recruiter = await requireRecruiter();

  const mission = missionId ? await getMission(missionId) : null;
  if (missionId && (!mission || mission.company_id !== recruiter.company_id)) {
    notFound();
  }

  return <AddCandidateForm mission={mission} />;
}
