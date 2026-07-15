"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Check, Zap, FileText, Plus, X } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink, Badge } from "@/components/noa/ui-primitives";
import { savePreparation } from "../actions";
import { GUIDE_FORMATS, GUIDE_DURATIONS, type PrepGridSection, type PrepGuideSection } from "@/lib/noa/interview-content";
import type { Candidate, InterviewGuide, InterviewType } from "@/lib/noa/types";

const STEP_LABEL: Record<InterviewType, string> = {
  screening: "Screening",
  topgrading: "Topgrading",
};

export function PreparationView({
  candidate, step, meta, existingGuide,
}: {
  candidate: Candidate;
  step: InterviewType;
  meta: {
    goal: string;
    gridIntro: string;
    gridSections: PrepGridSection[];
    guideIntro: string;
    guideSections: PrepGuideSection[];
  };
  existingGuide: InterviewGuide | null;
}) {
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);

  const existingSections = existingGuide?.questions as PrepGridSection[] | undefined;
  const hasExisting = Array.isArray(existingSections) && existingSections.length > 0;

  const [gridGenerated, setGridGenerated] = useState(hasExisting);
  const [editedSections, setEditedSections] = useState<PrepGridSection[]>(
    hasExisting ? existingSections! : meta.gridSections.map((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q })) })),
  );
  const [format, setFormat] = useState(existingGuide?.format ?? "");
  const [duration, setDuration] = useState(existingGuide?.duration_minutes ? `${existingGuide.duration_minutes} min` : "");
  const [guideGenerated, setGuideGenerated] = useState(Boolean(existingGuide));

  const canGenerateGuide = gridGenerated && format && duration;
  const stepLabel = STEP_LABEL[step];
  const name = `${candidate.first_name} ${candidate.last_name}`;

  const handleGenerateGrid = () => {
    setEditedSections(meta.gridSections.map((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q })) })));
    setGridGenerated(true);
  };

  const handleGenerateGuide = () => {
    setGuideGenerated(true);
  };

  const updateQuestion = (si: number, qi: number, val: string) => {
    setEditedSections((prev) =>
      prev.map((s, i) => (i === si ? { ...s, questions: s.questions.map((q, j) => (j === qi ? { ...q, text: val } : q)) } : s)),
    );
  };
  const addQuestion = (si: number) => {
    setEditedSections((prev) => prev.map((s, i) => (i === si ? { ...s, questions: [...s.questions, { text: "" }] } : s)));
  };
  const removeQuestion = (si: number, qi: number) => {
    setEditedSections((prev) => prev.map((s, i) => (i === si ? { ...s, questions: s.questions.filter((_, j) => j !== qi) } : s)));
  };

  const handleFinish = () => {
    setPending(true);
    startTransition(async () => {
      await savePreparation(candidate.id, step, editedSections, format, duration);
    });
  };

  return (
    <AppLayout headerTitle={`Préparer le ${stepLabel}`}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/candidats/${candidate.id}`} />

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step === "screening" ? "bg-[#99BAF8]/15" : "bg-[#CCB8FF]/15"}`}>
            <FileText size={17} className={step === "screening" ? "text-[#3a6fd4]" : "text-[#6b4ec4]"} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Préparer le {stepLabel}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{name}{candidate.title ? ` · ${candidate.title}` : ""}</p>
          </div>
        </div>

        {/* Objectif */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Objectif de l'entretien</p>
          <p className="text-sm text-gray-600 leading-relaxed">{meta.goal}</p>
        </Card>

        {/* Grille d'entretien */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grille d'entretien</p>
            {gridGenerated && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full">
                <Zap size={9} />Générée par noa
              </span>
            )}
          </div>

          {!gridGenerated && (
            <button
              onClick={handleGenerateGrid}
              className="w-full group flex items-center gap-4 bg-[#010101] text-white rounded-xl px-5 py-4 hover:bg-gray-900 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-[#FEE831]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Générer la grille d'entretien</p>
                <p className="text-xs text-gray-400 mt-0.5">noa adapte la grille au poste et au profil de {name}.</p>
              </div>
              <ChevronRight size={15} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          )}

          {gridGenerated && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-400 leading-relaxed">{meta.gridIntro}</p>

              {step === "screening" && editedSections[0] && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex flex-col divide-y divide-gray-50">
                    {editedSections[0].questions.map((q, qi) => (
                      <div key={qi} className="flex items-start gap-4 px-4 py-3.5 group">
                        <div className="flex-1 min-w-0">
                          <input
                            value={q.text}
                            onChange={(e) => updateQuestion(0, qi, e.target.value)}
                            className="w-full text-sm text-[#010101] bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#99BAF8] focus:outline-none py-0.5 leading-snug transition-colors"
                          />
                          {q.crit && <span className="text-[10px] text-gray-400 mt-1 block">{q.crit}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-25 select-none pointer-events-none">
                          {["Oui", "Partiel", "Non"].map((opt) => (
                            <span key={opt} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-500">{opt}</span>
                          ))}
                        </div>
                        <button onClick={() => removeQuestion(0, qi)} className="mt-1.5 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-50 bg-gray-50">
                    <button onClick={() => addQuestion(0)} className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#3a6fd4] transition-colors">
                      <Plus size={11} />Ajouter un critère
                    </button>
                  </div>
                </div>
              )}

              {step === "topgrading" && (
                <div className="flex flex-col gap-3">
                  {editedSections.map((section, si) => (
                    <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-[#010101] text-sm">{section.title}</p>
                          {section.subtitle && <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>}
                        </div>
                        {section.period && <Badge color="violet">{section.period}</Badge>}
                      </div>
                      <div className="flex flex-col gap-2 p-3 bg-gray-50">
                        {section.questions.map((q, qi) => (
                          <div key={qi} className="flex items-start gap-2 bg-white rounded-xl px-3.5 py-2.5 group">
                            <input
                              value={q.text}
                              onChange={(e) => updateQuestion(si, qi, e.target.value)}
                              className="flex-1 text-xs font-semibold text-gray-600 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#99BAF8] focus:outline-none py-0.5 leading-relaxed transition-colors"
                            />
                            <button onClick={() => removeQuestion(si, qi)} className="mt-1 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addQuestion(si)} className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#3a6fd4] transition-colors mt-1 pl-1">
                          <Plus size={11} />Ajouter une question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Format & durée */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Format de l'entretien</p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-[#010101] mb-2">Format</p>
              <div className="flex flex-col gap-1.5">
                {GUIDE_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ${format === f ? "border-[#99BAF8] bg-[#99BAF8]/8 text-[#3a6fd4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${format === f ? "border-[#3a6fd4]" : "border-gray-300"}`}>
                      {format === f && <div className="w-1.5 h-1.5 rounded-full bg-[#3a6fd4]" />}
                    </div>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#010101] mb-2">Durée</p>
              <div className="flex flex-wrap gap-2">
                {GUIDE_DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${duration === d ? "border-[#99BAF8] bg-[#99BAF8]/10 text-[#3a6fd4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Guide d'entretien */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Guide d'entretien</p>
            {guideGenerated && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full">
                <Zap size={9} />Générée par noa
              </span>
            )}
          </div>

          {!canGenerateGuide && !guideGenerated && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              {!gridGenerated ? "Générez d'abord la grille d'entretien." : "Renseignez le format et la durée pour générer le guide."}
            </p>
          )}

          {canGenerateGuide && !guideGenerated && (
            <button
              onClick={handleGenerateGuide}
              className="w-full group flex items-center gap-4 bg-[#010101] text-white rounded-xl px-5 py-4 hover:bg-gray-900 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-[#FEE831]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Générer le guide d'entretien</p>
                <p className="text-xs text-gray-400 mt-0.5">{format} · {duration} · Adapté au profil de {name}</p>
              </div>
              <ChevronRight size={15} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          )}

          {guideGenerated && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-gray-500">{meta.guideIntro}</p>
              {meta.guideSections.map((section, si) => (
                <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex items-baseline gap-2">
                    <p className="text-xs font-semibold text-[#010101]">{section.title}</p>
                    {section.subtitle && <p className="text-[10px] text-gray-400">{section.subtitle}</p>}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {section.questions.map((item, qi) => (
                      <div key={qi} className="px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#010101] mb-2">{item.q}</p>
                        <ul className="flex flex-col gap-1.5">
                          {item.probes.map((probe, pi) => (
                            <li key={pi} className="flex gap-2 text-[11px] text-gray-600">
                              <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full bg-gray-300 mt-[6px]" />
                              {probe}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={handleFinish} disabled={pending}>
            <Check size={15} />{pending ? "Enregistrement…" : "Préparation terminée"}
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
