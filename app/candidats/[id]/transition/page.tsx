import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate } from "@/lib/noa/queries";
import { CandidateTransitionClient, type TransitionType } from "./transition-client";

export default async function CandidateTransitionPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const transitionType: TransitionType =
    type === "topgrading" || type === "final" ? type : "screening";

  return <CandidateTransitionClient candidateId={candidate.id} type={transitionType} />;
}
