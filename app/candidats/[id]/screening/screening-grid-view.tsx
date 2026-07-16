"use client";

import { useState, useTransition } from "react";
import { FileText, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { CANDIDATE_AVATAR_COLOR, ELIMINATOIRE_CRIT, initials as initialsOf } from "@/lib/noa/labels";
import { finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { ScreeningCriterion } from "@/lib/noa/synthesis";

export function ScreeningGridView({
  candidate, criteria, initialTranscript,
}: {
  candidate: Candidate;
  criteria: ScreeningCriterion[];
  initialTranscript: string | null;
}) {
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-[#99BAF8]/20 text-[#3a6fd4]";

  const handleAnalyze = () => {
    setPending(true);
    setError(null);
    startTransition(async () => {
      const result = await finishInterview(candidate.id, "screening", transcript);
      if (result?.error) {
        setError(result.error);
        setPending(false);
      }
    });
  };

  return (
    <AppLayout headerTitle={name}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/candidats/${candidate.id}`} />

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">{candidate.title ?? "-"}</span>
                <Badge color="blue">Screening</Badge>
              </div>
            </div>
          </div>
        </div>

        <TranscriptCapture candidateId={candidate.id} type="screening" value={transcript} onChange={setTranscript} accent="blue" />

        {/* Guide de screening (lecture seule) */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#99BAF8]/12 flex items-center justify-center">
              <FileText size={11} className="text-[#3a6fd4]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Grille d'évaluation</h3>
          </div>
          <p className="text-xs text-gray-400 mb-1">
            À consulter pendant l'entretien. noa évaluera chaque critère automatiquement à partir de la transcription — rien à cocher ici.
          </p>
          <div className="flex flex-col">
            {criteria.map((q, i) => (
              <div key={q.id} className={`py-3.5 ${i < criteria.length - 1 ? "border-b border-gray-50" : ""}`}>
                <p className="text-sm text-[#010101] leading-snug">{q.q}</p>
                {q.crit === ELIMINATOIRE_CRIT ? (
                  <div className="mt-1"><Badge color="red">Éliminatoire</Badge></div>
                ) : (
                  q.crit && <span className="text-[10px] text-gray-400 mt-0.5 block">{q.crit}</span>
                )}
                {q.probes && q.probes.length > 0 && (
                  <ul className="flex flex-col gap-1 mt-2">
                    {q.probes.map((probe, pi) => (
                      <li key={pi} className="flex items-start gap-2 text-xs text-gray-500">
                        <span className="text-[#99BAF8] flex-shrink-0 mt-0.5">•</span>
                        {probe}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">noa remplit la grille et rédige la synthèse à partir de la transcription.</p>
          <Btn variant="primary" onClick={handleAnalyze} disabled={pending || !transcript.trim()}>
            {pending ? "noa analyse l'entretien…" : "Analyser l'entretien"}
            <ChevronRight size={15} />
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
