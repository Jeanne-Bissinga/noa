import { notFound } from "next/navigation";
import {
  requireRecruiter, getCandidate, getCandidateExperiences, getCandidateSkills,
} from "@/lib/noa/queries";
import { createClient } from "@/lib/supabase/server";
import { CandidateDetail } from "./candidate-detail";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const [experiences, skills] = await Promise.all([
    getCandidateExperiences(candidate.id),
    getCandidateSkills(candidate.id),
  ]);

  let cvSignedUrl: string | null = null;
  if (candidate.cv_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("cv-attachments").createSignedUrl(candidate.cv_url, 60 * 10);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  return <CandidateDetail candidate={candidate} experiences={experiences} skills={skills} cvSignedUrl={cvSignedUrl} />;
}
