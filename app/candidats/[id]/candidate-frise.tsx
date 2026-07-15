"use client";

import Link from "next/link";
import { Check, ChevronRight, FileText } from "lucide-react";
import { LinkBtn } from "@/components/noa/ui-primitives";
import type { StageStatus } from "@/lib/noa/types";

// ─── Route destinations for each step, mirrors STEP_META / SUB_STEP_DEST from
// the prototype (components/noa/prototype-source.tsx ~line 3162-3194). ───────
const STEP_META = {
  Screening: {
    desc: "Cet entretien permet d'évaluer rapidement l'adéquation du profil avec le poste et de valider les prérequis essentiels.",
  },
  Topgrading: {
    desc: "Cet entretien permet d'analyser en profondeur le parcours du candidat, ses réalisations passées et ses comportements en situation réelle.",
  },
  Décision: {
    desc: "Toutes les étapes d'évaluation sont complètes. Vous pouvez maintenant prendre votre décision finale.",
  },
} as const;

function stepDest(candidateId: string, step: "Screening" | "Topgrading", sub: "prep" | "interview" | "decision") {
  const stepParam = step === "Screening" ? "screening" : "topgrading";
  if (sub === "prep") return `/candidats/${candidateId}/preparation?step=${stepParam}`;
  if (sub === "interview") return `/candidats/${candidateId}/${stepParam}`;
  return `/candidats/${candidateId}/${stepParam}/decision`;
}

// Given a stage's actual prep/interview progress, infer which sub-step
// (prep / interview / decision) is currently active. A stage being "current"
// only means it's the active stage overall — it says nothing about whether
// the recruiter already prepared or ran the interview, so we look at the
// real `interviews` record instead: it's only created once the recruiter
// either finishes preparation or jumps straight to the interview.
function subStepFor(started: boolean, interviewDone: boolean): "prep" | "interview" | "decision" {
  if (!started) return "prep";
  if (!interviewDone) return "interview";
  return "decision";
}

const SUB_STEPS: { key: "prep" | "interview" | "decision"; label: string }[] = [
  { key: "prep", label: "Préparation" },
  { key: "interview", label: "Entretien" },
  { key: "decision", label: "Décision" },
];

export function CandidateFrise({
  candidateId, screening, topgrading, decision,
  screeningStarted, screeningInterviewDone, topgradingStarted, topgradingInterviewDone,
}: {
  candidateId: string;
  screening: StageStatus;
  topgrading: StageStatus;
  decision: StageStatus;
  screeningStarted: boolean;
  screeningInterviewDone: boolean;
  topgradingStarted: boolean;
  topgradingInterviewDone: boolean;
}) {
  const steps = [
    { label: "Screening" as const, status: screening },
    { label: "Topgrading" as const, status: topgrading },
    { label: "Décision" as const, status: decision },
  ];
  const activeStep = steps.find((s) => s.status === "current");

  return (
    <div className="flex flex-col gap-5">
      {/* ── Main frise ── */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const done = step.status === "done";
          const cur = step.status === "current";
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? "bg-[#75DA9F] text-white" : cur ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-300"
                }`}>
                  {done ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  cur ? "text-[#010101]" : done ? "text-[#1e8f52]" : "text-gray-300"
                }`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-16 mx-1 mb-5 flex-shrink-0 ${done ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Sous-frise étape en cours (Screening / Topgrading) ── */}
      {activeStep && (activeStep.label === "Screening" || activeStep.label === "Topgrading") && (() => {
        const stepKey = activeStep.label;
        const curSub = stepKey === "Screening"
          ? subStepFor(screeningStarted, screeningInterviewDone)
          : subStepFor(topgradingStarted, topgradingInterviewDone);
        const curSubIdx = SUB_STEPS.findIndex((s) => s.key === curSub);
        const accentBg = stepKey === "Screening" ? "bg-[#99BAF8]/8 border-[#99BAF8]/20" : "bg-[#CCB8FF]/8 border-[#CCB8FF]/20";
        const accentText = stepKey === "Screening" ? "text-[#3a6fd4]" : "text-[#6b4ec4]";
        const accentCircle = stepKey === "Screening" ? "bg-[#99BAF8] text-white" : "bg-[#CCB8FF] text-[#6b4ec4]";

        return (
          <div className={`rounded-xl border ${accentBg} p-4`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${accentText} mb-4`}>Sous-étapes — {stepKey}</p>

            <div className="flex items-start gap-0 mb-4">
              {SUB_STEPS.map((sub, si) => {
                const isDone = si < curSubIdx;
                const isCur = si === curSubIdx;
                const isUpcoming = si > curSubIdx;
                const href = stepDest(candidateId, stepKey, sub.key);
                return (
                  <div key={sub.key} className="flex items-start">
                    <div className="flex flex-col items-center gap-1.5">
                      {isUpcoming ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-100 text-gray-300">
                          {si + 1}
                        </div>
                      ) : (
                        <Link
                          href={href}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            isDone ? "bg-[#75DA9F] text-white hover:opacity-80" : accentCircle
                          }`}
                        >
                          {isDone ? <Check size={11} /> : si + 1}
                        </Link>
                      )}
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${
                        isCur ? "text-[#010101]" : isDone ? "text-[#1e8f52]" : "text-gray-300"
                      }`}>{sub.label}</span>
                      {isDone && (
                        <Link href={href} className={`text-[10px] underline ${accentText} hover:opacity-70 transition-opacity`}>
                          Modifier
                        </Link>
                      )}
                    </div>
                    {si < SUB_STEPS.length - 1 && (
                      <div className={`h-px w-12 mx-1 mt-3.5 flex-shrink-0 ${isDone ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 flex-wrap">
              {curSub === "prep" && (
                <LinkBtn href={stepDest(candidateId, stepKey, "prep")} variant="primary" size="sm">
                  <FileText size={13} />Préparer l'entretien
                </LinkBtn>
              )}
              {curSub === "interview" && (
                <LinkBtn href={stepDest(candidateId, stepKey, "interview")} variant="primary" size="sm">
                  Commencer l'entretien <ChevronRight size={14} />
                </LinkBtn>
              )}
              {curSub === "decision" && (
                <LinkBtn href={stepDest(candidateId, stepKey, "decision")} variant="primary" size="sm">
                  Prendre une décision <ChevronRight size={14} />
                </LinkBtn>
              )}
              {curSub === "prep" && (
                <LinkBtn href={stepDest(candidateId, stepKey, "interview")} variant="secondary" size="sm">
                  Passer l'entretien directement <ChevronRight size={14} />
                </LinkBtn>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Étape Décision ── */}
      {activeStep?.label === "Décision" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-[#010101] mb-1">Prendre la décision finale</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{STEP_META["Décision"].desc}</p>
          <LinkBtn href={`/candidats/${candidateId}/decision-finale`} variant="primary" size="sm">
            Prendre une décision <ChevronRight size={14} />
          </LinkBtn>
        </div>
      )}
    </div>
  );
}
