"use client";

import { useState, useTransition } from "react";
import { FileText, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { PrepGuideSection } from "@/lib/noa/interview-content";

export function ScreeningGridView({
  candidate, guideSections, initialTranscript,
}: {
  candidate: Candidate;
  guideSections: PrepGuideSection[];
  initialTranscript: string | null;
}) {
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

        {/* Guide d'entretien (lecture seule) */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#99BAF8]/12 flex items-center justify-center">
              <FileText size={11} className="text-[#3a6fd4]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Guide d'entretien</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            À consulter pendant l'entretien. noa évaluera la grille automatiquement à partir de la transcription — rien à cocher ici.
          </p>
          <div className="flex flex-col gap-4">
            {guideSections.map((section, si) => (
              <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 flex items-baseline gap-2">
                  <p className="text-xs font-semibold text-[#010101]">{section.title}</p>
                  {section.subtitle && <p className="text-[10px] text-gray-400">{section.subtitle}</p>}
                </div>
                <div className="divide-y divide-gray-100">
                  {section.questions.map((item, qi) => {
                    const key = `${si}-${qi}`;
                    const open = !!expanded[key];
                    const hasProbes = item.probes && item.probes.length > 0;
                    return (
                      <div key={qi} className="px-4 py-3">
                        <button
                          onClick={() => hasProbes && setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                          disabled={!hasProbes}
                          className="w-full flex items-start gap-2 text-left disabled:cursor-default"
                        >
                          {hasProbes && (
                            <ChevronRight size={11} className={`text-gray-400 mt-0.5 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                          )}
                          <p className="text-[11px] font-semibold text-[#010101]">{item.q}</p>
                        </button>
                        {open && hasProbes && (
                          <ul className="flex flex-col gap-1.5 mt-2 pl-[19px]">
                            {item.probes.map((probe, pi) => (
                              <li key={pi} className="flex gap-2 text-[11px] text-gray-600">
                                <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full bg-gray-300 mt-[6px]" />
                                {probe}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
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
