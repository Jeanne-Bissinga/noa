"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Mic, AlertTriangle, FileText, ChevronRight, Edit3 } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn } from "@/components/noa/ui-primitives";
import { CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { saveGridAnswers, finishInterview } from "../actions";
import type { Candidate } from "@/lib/noa/types";
import type { ScreeningCriterion, ScreeningAnswer } from "@/lib/noa/synthesis";

export function ScreeningGridView({
  candidate, criteria, initialAnswers,
}: {
  candidate: Candidate;
  criteria: ScreeningCriterion[];
  initialAnswers: Record<string, ScreeningAnswer>;
}) {
  const [answers, setAnswers] = useState<Record<string, ScreeningAnswer>>(initialAnswers ?? {});
  const [recording, setRecording] = useState(false);
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
    setRecording(false);
  };

  const handleGoToSynthesis = () => {
    setPending(true);
    startTransition(async () => {
      await finishInterview(candidate.id, "screening", answers);
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
                <span className="text-sm text-gray-400">{candidate.title ?? "—"}</span>
                <Badge color="blue">Screening</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau enregistrement */}
        <div className={`rounded-2xl border p-4 mb-5 transition-all ${recording ? "bg-red-50 border-red-200" : "bg-[#010101] border-[#010101]"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecording((r) => !r)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${recording ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
            >
              {recording ? <span className="w-3 h-3 rounded-sm bg-white" /> : <Mic size={17} className="text-white" />}
            </button>
            <div className="flex-1">
              {recording ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-semibold text-red-700">Enregistrement en cours…</p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-white">Enregistrer l'entretien</p>
              )}
              <p className={`text-xs mt-0.5 ${recording ? "text-red-500" : "text-white/50"}`}>
                {recording ? "Cliquez pour arrêter l'enregistrement." : "La transcription ne peut pas être générée sans enregistrement."}
              </p>
            </div>
          </div>
          {!recording && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/10">
              <AlertTriangle size={12} className="text-[#FEE831] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/70">Informez le candidat qu'il est enregistré avant de démarrer l'entretien.</p>
            </div>
          )}
        </div>

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
                            <span className="text-[#99BAF8] flex-shrink-0 mt-0.5">—</span>
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
              {recording && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
              Finir l'entretien
              <ChevronRight size={15} />
            </Btn>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
