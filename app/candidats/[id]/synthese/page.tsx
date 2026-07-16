import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, BackLink } from "@/components/noa/ui-primitives";
import { initials } from "@/lib/noa/labels";
import {
  requireRecruiter, getCandidate, getSyntheses, getInterview,
} from "@/lib/noa/queries";
import type { InterviewType } from "@/lib/noa/types";

const STEP_LABEL: Record<InterviewType, string> = {
  screening: "Screening",
  topgrading: "Topgrading",
};

export default async function CandidateSynthesisPage({
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
  const allSyntheses = await getSyntheses(candidate.id);
  const syntheses = interview
    ? allSyntheses.filter((s) => s.interview_id === interview.id)
    : allSyntheses;

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = "bg-[#99BAF8]/20 text-[#3a6fd4]";

  return (
    <AppLayout headerTitle={`Synthèse, ${stepType ? STEP_LABEL[stepType] : name}`}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/candidats/${candidate.id}`} />

        <Card className="p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar initials={initials(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <p className="text-sm font-bold text-[#010101]">{name}</p>
              <p className="text-[10px] text-gray-400">{stepType ? STEP_LABEL[stepType] : "Toutes étapes"}</p>
            </div>
          </div>

          {syntheses.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm font-semibold text-[#010101] mb-1">Aucune synthèse disponible</p>
              <p className="text-xs text-gray-400">La synthèse sera générée une fois l'entretien terminé et analysé par noa.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {syntheses.map((synthesis) => (
                <div key={synthesis.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {synthesis.authored_by === "noa" ? "Synthèse noa" : "Synthèse recruteur"}
                    </span>
                  </div>
                  {synthesis.content && (
                    <p className="text-sm text-gray-700 leading-relaxed">{synthesis.content}</p>
                  )}
                  {synthesis.advice && (
                    <p className="text-xs text-gray-500 leading-relaxed mt-2 italic">{synthesis.advice}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {stepType && (
            <Link
              href={`/candidats/${candidate.id}/transcription?step=${stepType}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:underline mt-4 w-fit"
            >
              <FileText size={13} />Voir le détail de l'entretien complet <ChevronRight size={11} />
            </Link>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
