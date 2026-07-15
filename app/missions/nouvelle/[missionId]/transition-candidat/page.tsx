import { notFound } from "next/navigation";
import { requireRecruiter, getMission } from "@/lib/noa/queries";
import { TransitionCandidatClient } from "./transition-candidat-client";

export default async function TransitionCandidatPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const recruiter = await requireRecruiter();

  const mission = await getMission(missionId);
  if (!mission || mission.company_id !== recruiter.company_id) {
    notFound();
  }

  return <TransitionCandidatClient missionId={mission.id} />;
}
