"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Check, FileText } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge } from "@/components/noa/ui-primitives";
import { CANDIDATE_BADGE, CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { CvModal } from "./cv-modal";
import { CandidateFrise } from "./candidate-frise";
import type { Candidate, CandidateExperience, CandidateSkill } from "@/lib/noa/types";

export function CandidateDetail({
  candidate, experiences, skills, cvSignedUrl,
}: {
  candidate: Candidate;
  experiences: CandidateExperience[];
  skills: CandidateSkill[];
  cvSignedUrl: string | null;
}) {
  const [cvOpen, setCvOpen] = useState(false);

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-gray-100 text-gray-500";

  const allDone = candidate.screening_status === "done" && candidate.topgrading_status === "done";
  const scoreColor = candidate.score !== null
    ? candidate.score >= 75 ? "text-[#1e8f52]" : candidate.score >= 50 ? "text-[#3a6fd4]" : "text-red-400"
    : "";
  const scoreBg = candidate.score !== null
    ? candidate.score >= 75 ? "bg-[#75DA9F]/12 border-[#75DA9F]/25" : candidate.score >= 50 ? "bg-[#99BAF8]/12 border-[#99BAF8]/25" : "bg-red-50 border-red-100"
    : "";

  const completedSteps = [
    candidate.screening_status === "done" && { key: "screening" as const, label: "Screening" },
    candidate.topgrading_status === "done" && { key: "topgrading" as const, label: "Topgrading" },
  ].filter(Boolean) as { key: "screening" | "topgrading"; label: string }[];

  return (
    <AppLayout headerTitle={name}>
      {cvOpen && (
        <CvModal
          candidate={candidate}
          experiences={experiences}
          skills={skills}
          cvSignedUrl={cvSignedUrl}
          avatarColor={avatarColor}
          onClose={() => setCvOpen(false)}
        />
      )}
      <div className="max-w-2xl mx-auto">
        <Link href="/candidats" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-500 text-xs font-medium mb-5 transition-colors group w-fit">
          Retour
        </Link>

        {/* ── En-tête ── */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar initials={initialsOf(candidate.first_name, candidate.last_name)} color={avatarColor} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h1>
                  <Badge color={CANDIDATE_BADGE[candidate.status]}>{candidate.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{[candidate.title, candidate.location].filter(Boolean).join(" · ") || "-"}</p>
              </div>
            </div>
            <button
              onClick={() => setCvOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#010101] hover:border-gray-300 px-3 py-2 rounded-xl transition-all"
            >
              <FileText size={13} />Voir le CV
            </button>
          </div>

          {experiences.length > 0 && (
            <>
              <div className="h-px bg-gray-100 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Expériences</p>
              <div className="flex flex-col gap-0">
                {experiences.map((exp, i) => (
                  <div key={exp.id} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#99BAF8] mt-1.5 flex-shrink-0" />
                      {i < experiences.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-[#010101]">{exp.role}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{exp.period}</span>
                      </div>
                      <p className="text-[10px] font-medium text-[#3a6fd4] mb-2">{exp.company}</p>
                      <ul className="flex flex-col gap-1">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
                            <span className="text-gray-300 flex-shrink-0 mt-0.5">•</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── Frise ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Avancement</p>
          <CandidateFrise
            candidateId={candidate.id}
            screening={candidate.screening_status}
            topgrading={candidate.topgrading_status}
            decision={candidate.decision_status}
          />
        </Card>

        {/* ── Étapes réalisées ── */}
        {completedSteps.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Étapes réalisées</p>
            {completedSteps.map((step) => (
              <Card key={step.key} className="p-5 hover:border-gray-200 transition-all">
                <Link href={`/candidats/${candidate.id}/synthese?step=${step.key}`} className="block">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#75DA9F]/15 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-[#1e8f52]" />
                      </div>
                      <p className="text-sm font-semibold text-[#010101]">{step.label}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>

                {/* Décision réelle, pointe vers les routes de décision par étape
                    (au lieu du toggle local factice du prototype qui ne persistait rien). */}
                <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Décision pour cette étape</p>
                  <Link
                    href={`/candidats/${candidate.id}/${step.key}/decision`}
                    className="text-xs font-semibold text-[#3a6fd4] hover:underline flex items-center gap-1"
                  >
                    Voir / prendre la décision <ChevronRight size={12} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Note globale ── */}
        {allDone && candidate.score !== null && (
          <Card className={`p-5 border ${scoreBg}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Note globale</p>
            <div className="flex items-center gap-5">
              <div className={`text-5xl font-bold ${scoreColor}`} style={{ fontFamily: "Poppins, sans-serif" }}>
                {candidate.score}
                <span className="text-xl font-normal text-gray-400">/100</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-white rounded-full h-2.5 mb-1.5 overflow-hidden border border-black/[0.06]">
                  <div className={`h-full rounded-full ${candidate.score >= 75 ? "bg-[#75DA9F]" : candidate.score >= 50 ? "bg-[#99BAF8]" : "bg-red-400"}`} style={{ width: `${candidate.score}%` }} />
                </div>
                <p className="text-xs text-gray-400">
                  {candidate.score >= 75 ? "Profil très solide, recommandé à l'embauche" : candidate.score >= 50 ? "Profil correct, à discuter en équipe" : "Profil insuffisant, non retenu"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
