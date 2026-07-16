"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText, Zap, Check, X, ArrowRight, ChevronRight, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, Btn } from "@/components/noa/ui-primitives";
import { CANDIDATE_AVATAR_COLOR, ELIMINATOIRE_CRIT, initials as initialsOf } from "@/lib/noa/labels";
import { decideStage, askAboutInterview } from "./actions";
import type { Candidate, Decision, Synthesis } from "@/lib/noa/types";

type Stat = { label: string; value: string; tone: "green" | "yellow" | "red" };

/**
 * Une ligne de la grille telle que noa l'a remplie. `answer` porte les deux
 * formes de grille : "Oui"/"Partiel"/"Non" en screening, une note libre en
 * topgrading (`group` porte alors l'épisode du parcours).
 */
export type GridRow = {
  id: string;
  question: string;
  crit?: string;
  group?: string;
  answer: string | null;
};

const TONE_CLASSES: Record<Stat["tone"], string> = {
  green: "bg-[#75DA9F]/10 text-[#1e8f52]",
  yellow: "bg-[#FEE831]/20 text-[#8a6a00]",
  red: "bg-red-50 text-red-500",
};

const ANSWER_CLASSES: Record<string, string> = {
  Oui: "bg-[#75DA9F]/10 text-[#1e8f52] border-[#75DA9F]/25",
  Partiel: "bg-[#FEE831]/20 text-[#8a6a00] border-[#FEE831]/40",
  Non: "bg-red-50 text-red-500 border-red-100",
};

const DECIDED_META: Record<"retenu" | "non_retenu", { text: string; className: string }> = {
  retenu: { text: "Retenu pour la suite", className: "bg-[#75DA9F]/10 text-[#1e8f52] border-[#75DA9F]/25" },
  non_retenu: { text: "Non retenu", className: "bg-red-50 text-red-500 border-red-100" },
};

const STAGE_META = {
  screening: {
    label: "Screening",
    badge: "blue" as const,
    accentBorder: "border-[#99BAF8]/30",
    accentBg: "from-[#99BAF8]/5",
    avatarColor: "bg-[#99BAF8]/20 text-[#3a6fd4]",
  },
  topgrading: {
    label: "Topgrading",
    badge: "violet" as const,
    accentBorder: "border-[#CCB8FF]/30",
    accentBg: "from-[#CCB8FF]/5",
    avatarColor: "bg-[#CCB8FF]/20 text-[#6b4ec4]",
  },
} as const;

export function DecisionView({
  candidate, stage, stats, gridRows = [], noaSynthesis, hasTranscript, decision,
}: {
  candidate: Candidate;
  stage: "screening" | "topgrading";
  stats: Stat[];
  gridRows?: GridRow[];
  noaSynthesis: Synthesis | null;
  hasTranscript: boolean;
  decision: Decision | null;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pendingAction, setPendingAction] = useState<"non_retenu" | "reporte" | "retenu" | null>(null);
  const [, startTransition] = useTransition();

  const meta = STAGE_META[stage];
  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? meta.avatarColor;
  const transcriptHref = `/candidats/${candidate.id}/transcription?step=${stage}`;

  const handleDecide = (action: "non_retenu" | "reporte" | "retenu") => {
    setPendingAction(action);
    startTransition(async () => {
      await decideStage(candidate.id, stage, action);
    });
  };

  // La réponse n'est pas persistée : elle vit le temps de la consultation.
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    setAsking(true);
    setAskError(null);
    setAnswer(null);
    const res = await askAboutInterview(candidate.id, stage, question);
    if (res.error) setAskError(res.error);
    else setAnswer(res.answer ?? null);
    setAsking(false);
  };

  return (
    <AppLayout headerTitle={name}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">{meta.label} · Synthèse</span>
                <Badge color={meta.badge}>{meta.label}</Badge>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 italic">Proposition d'analyse. La décision vous appartient.</span>
        </div>

        {/* Accès direct à la transcription intégrale, au-dessus du bloc d'évaluation */}
        {hasTranscript && (
          <Link
            href={transcriptHref}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:underline mb-4 w-fit"
          >
            <FileText size={13} />Voir la transcription complète<ChevronRight size={11} />
          </Link>
        )}

        {/* Grille d'évaluation remplie par noa */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-500" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Grille d'évaluation</h3>
            <span className="ml-auto text-[10px] text-[#3a6fd4] bg-[#99BAF8]/15 px-2 py-0.5 rounded-full font-medium">Remplie par noa</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Évaluée automatiquement à partir de la transcription, du profil du candidat et de la campagne de recrutement.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className={`rounded-2xl p-4 text-center ${TONE_CLASSES[s.tone]}`}>
                <div className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{s.value}</div>
                <div className="text-xs mt-1 opacity-75">{s.label}</div>
              </div>
            ))}
          </div>

          {gridRows.length > 0 && (
            <div className="mt-5 border-t border-gray-100 pt-1">
              {gridRows.map((row, i) => {
                const isVerdict = row.answer !== null && row.answer in ANSWER_CLASSES;
                const showGroup = row.group && row.group !== gridRows[i - 1]?.group;
                return (
                  <div key={row.id}>
                    {showGroup && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 pb-1">{row.group}</p>
                    )}
                    <div className={`py-3.5 ${i < gridRows.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-[#010101] leading-snug">{row.question}</p>
                        {isVerdict && (
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ANSWER_CLASSES[row.answer!]}`}>
                            {row.answer}
                          </span>
                        )}
                      </div>
                      {row.crit === ELIMINATOIRE_CRIT ? (
                        <div className="mt-1.5"><Badge color="red">Éliminatoire</Badge></div>
                      ) : (
                        row.crit && <span className="text-[10px] text-gray-400 mt-0.5 block">{row.crit}</span>
                      )}
                      {!isVerdict && (
                        <p className="text-xs text-gray-500 leading-relaxed mt-1.5">
                          {row.answer?.trim() || "(non abordé dans l'entretien)"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Analyse noa */}
        <div className={`rounded-2xl border ${meta.accentBorder} bg-gradient-to-b ${meta.accentBg} to-white p-6 mb-4`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#FEE831]/25 flex items-center justify-center">
              <Zap size={11} className="text-[#8a6a00]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Analyse noa</h3>
            <span className="ml-auto text-[10px] text-[#3a6fd4] bg-[#99BAF8]/15 px-2 py-0.5 rounded-full font-medium">Générée depuis la grille</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Proposition d'analyse. La décision vous appartient.</p>

          {noaSynthesis ? (
            <>
              {noaSynthesis.content && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
                  <p className="text-xs text-gray-600 leading-relaxed">{noaSynthesis.content}</p>
                </div>
              )}
              {noaSynthesis.advice && (
                <div className="bg-[#010101] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={12} className="text-[#FEE831]" />
                    <p className="text-[10px] font-bold text-[#FEE831] uppercase tracking-widest">Conseil noa</p>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{noaSynthesis.advice}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
              <p className="text-sm font-semibold text-[#010101] mb-1">Synthèse pas encore disponible</p>
              <p className="text-xs text-gray-400">Terminez l'entretien pour générer l'analyse noa.</p>
            </div>
          )}
        </div>

        {/* Question libre : noa répond depuis la transcription */}
        <Card className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-[#010101]">Poser une question sur l'entretien</p>
          </div>
          {hasTranscript ? (
            <>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">Interrogez un moment précis de l'entretien. La réponse est recherchée dans la transcription et croisée avec le profil du candidat.</p>
              <form onSubmit={handleAsk} className="flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex : qu'a-t-il dit exactement sur son expérience de mentoring ?"
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#99BAF8] focus:ring-2 focus:ring-[#99BAF8]/20 placeholder-gray-300 text-black transition-all"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || asking}
                  aria-label="Obtenir la réponse de noa"
                  className="w-10 h-10 flex items-center justify-center bg-[#010101] text-white rounded-xl hover:bg-gray-900 transition-all flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#010101]"
                >
                  <ArrowRight size={15} className={asking ? "animate-pulse" : ""} />
                </button>
              </form>

              {asking && (
                <p className="text-xs text-gray-400 mt-3 animate-pulse">noa relit la transcription…</p>
              )}

              {answer && !asking && (
                <div className="mt-3 bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={11} className="text-[#8a6a00]" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Réponse noa</p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{answer}</p>
                  <Link href={transcriptHref} className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:underline mt-3 w-fit">
                    <FileText size={12} />Vérifier dans la transcription<ChevronRight size={11} />
                  </Link>
                </div>
              )}

              {askError && !asking && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-500 leading-relaxed">{askError}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              Aucune transcription n'est disponible pour cet entretien, cette fonctionnalité nécessite un enregistrement transcrit.
            </p>
          )}
        </Card>

        {/* CTAs — masqués si la décision pour cette étape a déjà été actée */}
        {decision ? (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${DECIDED_META[decision.status as "retenu" | "non_retenu"].className}`}>
            {decision.status === "retenu" ? <Check size={15} /> : <X size={15} />}
            Décision déjà prise : {DECIDED_META[decision.status as "retenu" | "non_retenu"].text}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Btn variant="danger" onClick={() => handleDecide("non_retenu")} disabled={pendingAction !== null}>
              <X size={15} />{pendingAction === "non_retenu" ? "…" : "Ne pas retenir"}
            </Btn>
            <Btn variant="secondary" onClick={() => handleDecide("reporte")} disabled={pendingAction !== null}>
              {pendingAction === "reporte" ? "…" : "Décider plus tard"}
            </Btn>
            <Btn variant="primary" size="lg" className="ml-auto" onClick={() => handleDecide("retenu")} disabled={pendingAction !== null}>
              <Check size={15} />{pendingAction === "retenu" ? "…" : "Retenir pour la suite"}
            </Btn>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
