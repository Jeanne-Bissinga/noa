import { notFound } from "next/navigation";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, BackLink } from "@/components/noa/ui-primitives";
import { initials } from "@/lib/noa/labels";
import { requireRecruiter, getCandidate, getInterview } from "@/lib/noa/queries";
import type { InterviewType } from "@/lib/noa/types";

const STEP_LABEL: Record<InterviewType, string> = {
  screening: "Screening",
  topgrading: "Topgrading",
};

export default async function CandidateTranscriptPage({
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

  const stepType: InterviewType | null = step === "screening" || step === "topgrading" ? step : null;
  const interview = stepType ? await getInterview(candidate.id, stepType) : null;

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = "bg-[#99BAF8]/20 text-[#3a6fd4]";

  return (
    <AppLayout headerTitle={`Entretien — ${stepType ? STEP_LABEL[stepType] : name}`}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={stepType ? `/candidats/${candidate.id}/synthese?step=${stepType}` : `/candidats/${candidate.id}`} />

        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lecture seule</span>
          <span className="text-[10px] text-gray-300">— Cet entretien ne peut pas être modifié</span>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
            <Avatar initials={initials(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <p className="text-sm font-bold text-[#010101]">{name}</p>
              <p className="text-[10px] text-gray-400">{stepType ? STEP_LABEL[stepType] : "—"}</p>
            </div>
          </div>

          {!interview || !interview.transcript ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm font-semibold text-[#010101] mb-1">Aucune transcription disponible</p>
              <p className="text-xs text-gray-400">La transcription apparaîtra ici une fois l'entretien enregistré et transcrit.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{interview.transcript}</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
