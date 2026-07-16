import { notFound } from "next/navigation";
import { requireRecruiter, getMission } from "@/lib/noa/queries";
import { ResumeForm } from "./resume-form";

export default async function JobSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ missionId: string }>;
  searchParams: Promise<{ noa?: string }>;
}) {
  const { missionId } = await params;
  const { noa } = await searchParams;
  const recruiter = await requireRecruiter();
  const mission = await getMission(missionId);

  if (!mission || mission.company_id !== recruiter.company_id) {
    notFound();
  }

  return <ResumeForm mission={mission} noaFallback={noa === "fallback"} />;
}
