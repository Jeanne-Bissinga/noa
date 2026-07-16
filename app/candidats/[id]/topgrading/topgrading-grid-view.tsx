"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { ChevronRight, Eye } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { saveGridAnswers, finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { TopgradingEpisode } from "@/lib/noa/synthesis";

export function TopgradingGridView({
  candidate, episodes, initialNotes, initialTranscript,
}: {
  candidate: Candidate;
  episodes: TopgradingEpisode[];
  initialNotes: Record<string, string>;
  initialTranscript: string | null;
}) {
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes ?? {});
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [interviewDone, setInterviewDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-[#CCB8FF]/20 text-[#6b4ec4]";

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await saveGridAnswers(candidate.id, "topgrading", notes);
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const handleGoToSynthesis = () => {
    setPending(true);
    startTransition(async () => {
      await finishInterview(candidate.id, "topgrading", notes, transcript);
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
            Le Topgrading explore le parcours chronologique. Posez les questions dans l'ordre et notez les réponses. Déroulez chaque question pour afficher les relances.
          </p>
        </div>

        {/* Grille épisodes */}
        <div className="flex flex-col gap-4 mb-6">
          {episodes.map((ep, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[#010101] text-sm">{ep.co}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{ep.role}</div>
                </div>
                {ep.period && <Badge color="violet">{ep.period}</Badge>}
              </div>
              <div className="flex flex-col gap-2.5">
                {ep.qs.map((item) => {
                  const key = item.id;
                  const open = !!expanded[key];
                  return (
                    <div key={key} className="bg-gray-50 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
                        <button
                          onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="w-5 h-5 rounded-md bg-white border border-gray-200 hover:border-[#CCB8FF] flex items-center justify-center flex-shrink-0 transition-colors"
                        >
                          <ChevronRight size={10} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
                        </button>
                        <p className="text-xs font-semibold text-gray-700 flex-1">{item.q}</p>
                      </div>
                      {open && item.probes && item.probes.length > 0 && (
                        <div className="mx-3.5 mb-3 bg-[#CCB8FF]/10 border border-[#CCB8FF]/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-[#6b4ec4] uppercase tracking-widest mb-2">Questions de relance</p>
                          <ul className="flex flex-col gap-1.5">
                            {item.probes.map((probe, pi) => (
                              <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="text-[#CCB8FF] flex-shrink-0 mt-0.5">•</span>
                                {probe}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="px-3.5 pb-3">
                        <textarea
                          value={notes[key] || ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                          rows={2}
                          placeholder="Notes…"
                          className="w-full bg-transparent text-xs focus:outline-none text-gray-600 placeholder-gray-300 resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Notez les réponses au fur et à mesure de l'entretien.</p>
          {interviewDone ? (
            <Btn variant="primary" onClick={handleGoToSynthesis} disabled={pending}>
              {pending ? "Génération de la synthèse…" : "Aller à la synthèse"}
              <ChevronRight size={15} />
            </Btn>
          ) : (
            <Btn variant="secondary" onClick={() => setInterviewDone(true)}>
              Finir l'entretien
              <ChevronRight size={15} />
            </Btn>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
