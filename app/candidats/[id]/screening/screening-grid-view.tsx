"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { FileText, ChevronRight, Edit3 } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { saveGridAnswers, finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { ScreeningCriterion, ScreeningAnswer } from "@/lib/noa/synthesis";

export function ScreeningGridView({
  candidate, criteria, initialAnswers, initialTranscript,
}: {
  candidate: Candidate;
  criteria: ScreeningCriterion[];
  initialAnswers: Record<string, ScreeningAnswer>;
  initialTranscript: string | null;
}) {
  const [answers, setAnswers] = useState<Record<string, ScreeningAnswer>>(initialAnswers ?? {});
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [interviewDone, setInterviewDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-[#99BAF8]/20 text-[#3a6fd4]";

  const allAnswered = criteria.every((c) => answers[c.id]);

  const btnStyle = (opt: string, id: string) => {
    const sel = answers[id] === opt;
    if (!sel) return "bg-gray-50 text-gray-400 hover:bg-gray-100";
    if (opt === "Oui") return "bg-[#75DA9F]/20 text-[#1e8f52] ring-1 ring-[#75DA9F]/40";
    if (opt === "Partiel") return "bg-[#FEE831]/25 text-[#8a6a00] ring-1 ring-[#FEE831]/50";
    return "bg-red-50 text-red-500 ring-1 ring-red-200";
  };

  // Debounced persistence of answers as the recruiter fills the grid.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await saveGridAnswers(candidate.id, "screening", answers);
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const handleAnswer = (id: string, opt: ScreeningAnswer) => {
    setAnswers((prev) => ({ ...prev, [id]: opt }));
  };

  const handleFinishInterview = () => {
    setInterviewDone(true);
  };

  const handleGoToSynthesis = () => {
    setPending(true);
    startTransition(async () => {
      await finishInterview(candidate.id, "screening", answers, transcript);
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

        {/* Grille */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#99BAF8]/12 flex items-center justify-center">
              <FileText size={11} className="text-[#3a6fd4]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Grille de screening</h3>
          </div>
          <p className="text-xs text-gray-400 mb-1">
            Cochez la réponse pour chaque critère. Déroulez un critère pour retrouver<span className="font-bold"> les questions de relance.</span>
          </p>
          <div className="flex flex-col">
            {criteria.map((q, i) => {
              const open = !!expanded[q.id];
              return (
                <div key={q.id} className={`${i < criteria.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-start gap-3 py-3.5">
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="mt-0.5 w-5 h-5 rounded-md bg-gray-100 hover:bg-[#99BAF8]/15 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <ChevronRight size={11} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#010101] leading-snug">{q.q}</p>
                      {q.crit && <span className="text-[10px] text-gray-400 mt-0.5 block">{q.crit}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(["Oui", "Partiel", "Non"] as ScreeningAnswer[]).map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${btnStyle(opt, q.id)}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {open && q.probes && q.probes.length > 0 && (
                    <div className="ml-8 mb-3 bg-[#99BAF8]/6 border border-[#99BAF8]/15 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#3a6fd4] uppercase tracking-widest mb-2">Questions de relance</p>
                      <ul className="flex flex-col gap-1.5">
                        {q.probes.map((probe, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-[#99BAF8] flex-shrink-0 mt-0.5">•</span>
                            {probe}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notes libres */}
        <Card className="p-4 mb-6 bg-gray-50 border-gray-50">
          <div className="flex items-start gap-3">
            <Edit3 size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <textarea rows={2} placeholder="Notes libres pendant l'entretien…" className="w-full bg-transparent text-xs focus:outline-none text-gray-600 placeholder-gray-300 resize-none" />
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {allAnswered ? (
              <span className="text-[#1e8f52] font-medium">✓ Grille complète</span>
            ) : (
              <span>{criteria.filter((q) => answers[q.id]).length}/{criteria.length} critères renseignés</span>
            )}
          </div>
          {interviewDone ? (
            <Btn variant="primary" onClick={handleGoToSynthesis} disabled={pending}>
              {pending ? "Génération de la synthèse…" : "Aller à la synthèse"}
              <ChevronRight size={15} />
            </Btn>
          ) : (
            <Btn variant="secondary" onClick={handleFinishInterview} disabled={!allAnswered}>
              Finir l'entretien
              <ChevronRight size={15} />
            </Btn>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
