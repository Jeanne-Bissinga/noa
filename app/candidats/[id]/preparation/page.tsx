import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getInterview, getInterviewGuide } from "@/lib/noa/queries";
import { PREP_META } from "@/lib/noa/interview-content";
import { PreparationView } from "./preparation-view";
import type { InterviewType } from "@/lib/noa/types";

export default async function PreparationPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const stepType: InterviewType = step === "topgrading" ? "topgrading" : "screening";

  const interview = await getInterview(candidate.id, stepType);
  const guide = interview ? await getInterviewGuide(interview.id) : null;
  const meta = PREP_META[stepType];

  return (
    <PreparationView
      candidate={candidate}
      step={stepType}
      meta={meta}
      existingGuide={guide}
    />
  );
}
