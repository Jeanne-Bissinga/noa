"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { PrepGuideSection } from "@/lib/noa/interview-content";

export function TopgradingGridView({
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
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-[#CCB8FF]/20 text-[#6b4ec4]";

  const handleAnalyze = () => {
    setPending(true);
    setError(null);
    startTransition(async () => {
      const result = await finishInterview(candidate.id, "topgrading", transcript);
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">Entretien Topgrading</span>
                <Badge color="violet">Topgrading</Badge>
              </div>
            </div>
          </div>
          <Btn variant="secondary" size="sm"><Eye size={13} />Voir le CV</Btn>
        </div>

        <TranscriptCapture candidateId={candidate.id} type="topgrading" value={transcript} onChange={setTranscript} accent="violet" />

        {/* Contexte */}
        <div className="bg-[#CCB8FF]/10 border border-[#CCB8FF]/25 rounded-2xl p-4 mb-5">
          <p className="text-xs text-[#6b4ec4] leading-relaxed">
            Le Topgrading explore le parcours chronologique. Consultez les questions et relances ci-dessous pendant l'entretien —
            noa évaluera la grille automatiquement à partir de la transcription, rien à noter ici.
          </p>
        </div>

        {/* Guide d'entretien (lecture seule) */}
        <div className="flex flex-col gap-4 mb-6">
          {guideSections.map((section, si) => (
            <Card key={si} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[#010101] text-sm">{section.title}</div>
                  {section.subtitle && <div className="text-xs text-gray-400 mt-0.5">{section.subtitle}</div>}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {section.questions.map((item, qi) => {
                  const key = `${si}-${qi}`;
                  const open = !!expanded[key];
                  const hasProbes = item.probes && item.probes.length > 0;
                  return (
                    <div key={qi} className="bg-gray-50 rounded-xl p-3.5">
                      <button
                        onClick={() => hasProbes && setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                        disabled={!hasProbes}
                        className="w-full flex items-start gap-2 text-left disabled:cursor-default"
                      >
                        {hasProbes && (
                          <ChevronRight size={10} className={`text-gray-400 mt-0.5 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                        )}
                        <p className="text-xs font-semibold text-gray-700">{item.q}</p>
                      </button>
                      {open && hasProbes && (
                        <ul className="flex flex-col gap-1 mt-2 pl-[18px]">
                          {item.probes.map((probe, pi) => (
                            <li key={pi} className="flex items-start gap-2 text-xs text-gray-500">
                              <span className="text-[#CCB8FF] flex-shrink-0 mt-0.5">•</span>
                              {probe}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

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
