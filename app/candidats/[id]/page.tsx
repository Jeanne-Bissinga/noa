import { notFound } from "next/navigation";
import {
  requireRecruiter, getCandidate, getCandidateExperiences, getCandidateSkills,
  getInterview, getDecisions,
} from "@/lib/noa/queries";
import { getWorkPreferencesByCandidate } from "@/lib/noa/preferences/queries";
import { stepStatusOf } from "@/lib/noa/preferences/status";
import { buildPreferenceContext } from "@/lib/noa/preferences/context";
import { buildCommunicationGuidance } from "@/lib/noa/preferences/communication";
import { createClient } from "@/lib/supabase/server";
import { CandidateDetail } from "./candidate-detail";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const [experiences, skills, screeningInterview, topgradingInterview, decisions, preferences] = await Promise.all([
    getCandidateExperiences(candidate.id),
    getCandidateSkills(candidate.id),
    getInterview(candidate.id, "screening"),
    getInterview(candidate.id, "topgrading"),
    getDecisions(candidate.id),
    getWorkPreferencesByCandidate(candidate.id),
  ]);

  let cvSignedUrl: string | null = null;
  if (candidate.cv_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("cv-attachments").createSignedUrl(candidate.cv_url, 60 * 10);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <CandidateDetail
      candidate={candidate}
      experiences={experiences}
      skills={skills}
      cvSignedUrl={cvSignedUrl}
      screeningStarted={Boolean(screeningInterview)}
      screeningInterviewDone={screeningInterview?.status === "termine"}
      topgradingStarted={Boolean(topgradingInterview)}
      topgradingInterviewDone={topgradingInterview?.status === "termine"}
      decisions={decisions}
      preferencesStatus={stepStatusOf(preferences)}
      preferencesGuidance={buildCommunicationGuidance(buildPreferenceContext(preferences))}
      preferencesInvitedAt={preferences?.invited_at ?? null}
      preferencesExpiresAt={preferences?.token_expires_at ?? null}
    />
  );
}
