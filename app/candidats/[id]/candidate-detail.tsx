"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Check, X, FileText, Edit3 } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, BackLink, Btn, InputField } from "@/components/noa/ui-primitives";
import { CANDIDATE_BADGE, CANDIDATE_AVATAR_COLOR, initials as initialsOf } from "@/lib/noa/labels";
import { CvModal } from "./cv-modal";
import { CandidateFrise } from "./candidate-frise";
import { CandidateDelete } from "./candidate-delete";
import { updateCandidateProfile } from "./actions";
import type { Candidate, CandidateExperience, CandidateSkill, Decision } from "@/lib/noa/types";

// Dernière décision actée (hors "reporté", qui ne clôt rien) pour une étape
// donnée. STATUS_FIELDS marque les 3 étapes "done" dès que le candidat est
// "Non retenu", quelle que soit l'étape réelle du refus (cf. lib/noa/labels.ts)
// — on recroise donc avec `decisions` pour savoir CE QUI s'est vraiment passé.
function lastDecision(decisions: Decision[], stage: Decision["stage"]): Decision | null {
  return decisions.filter((d) => d.stage === stage && d.status !== "reporte").pop() ?? null;
}

export function CandidateDetail({
  candidate, experiences, skills, cvSignedUrl, decisions,
  screeningStarted, screeningInterviewDone, topgradingStarted, topgradingInterviewDone,
}: {
  candidate: Candidate;
  experiences: CandidateExperience[];
  skills: CandidateSkill[];
  cvSignedUrl: string | null;
  decisions: Decision[];
  screeningStarted: boolean;
  screeningInterviewDone: boolean;
  topgradingStarted: boolean;
  topgradingInterviewDone: boolean;
}) {
  const [cvOpen, setCvOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    title: candidate.title ?? "",
    location: candidate.location ?? "",
    email: candidate.email ?? "",
  });
  const [, startTransition] = useTransition();

  const handleSaveProfile = () => {
    setEditError(null);
    setPending(true);
    startTransition(async () => {
      const result = await updateCandidateProfile(candidate.id, draft);
      if (result.error) {
        setEditError(result.error);
        setPending(false);
        return;
      }
      setPending(false);
      setEditing(false);
    });
  };

  const cancelEdit = () => {
    setDraft({
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      title: candidate.title ?? "",
      location: candidate.location ?? "",
      email: candidate.email ?? "",
    });
    setEditError(null);
    setEditing(false);
  };

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-gray-100 text-gray-500";

  const screeningDecision = lastDecision(decisions, "screening");
  const topgradingDecision = lastDecision(decisions, "topgrading");
  const finalDecision = lastDecision(decisions, "final");

  const allDone = candidate.screening_status === "done" && candidate.topgrading_status === "done";
  const scoreColor = candidate.score !== null
    ? candidate.score >= 75 ? "text-[#1e8f52]" : candidate.score >= 50 ? "text-[#3a6fd4]" : "text-red-400"
    : "";
  const scoreBg = candidate.score !== null
    ? candidate.score >= 75 ? "bg-[#75DA9F]/12 border-[#75DA9F]/25" : candidate.score >= 50 ? "bg-[#99BAF8]/12 border-[#99BAF8]/25" : "bg-red-50 border-red-100"
    : "";

  // Basé sur l'entretien réellement mené (pas sur *_status, forcé "done" par
  // STATUS_FIELDS pour "Non retenu") : un candidat refusé au screening n'a
  // jamais eu de Topgrading, cette étape ne doit donc pas apparaître ici.
  const completedSteps = [
    screeningInterviewDone && { key: "screening" as const, label: "Screening", decision: screeningDecision },
    topgradingInterviewDone && { key: "topgrading" as const, label: "Topgrading", decision: topgradingDecision },
  ].filter(Boolean) as { key: "screening" | "topgrading"; label: string; decision: Decision | null }[];

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
        <BackLink href={`/candidats`} />
        

        {/* ── En-tête ── */}
        <Card className="p-5 mb-4">
          {editing ? (
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <InputField label="Prénom" required value={draft.firstName} onChange={(v) => setDraft((d) => ({ ...d, firstName: v }))} />
                <InputField label="Nom" required value={draft.lastName} onChange={(v) => setDraft((d) => ({ ...d, lastName: v }))} />
                <InputField label="Poste" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} />
                <InputField label="Localisation" value={draft.location} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} />
                <InputField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />
              </div>
              {editError && <p className="text-xs text-red-500 mb-2">{editError}</p>}
              <div className="flex gap-2">
                <Btn variant="primary" size="sm" onClick={handleSaveProfile} disabled={pending}>
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </Btn>
                <Btn variant="secondary" size="sm" onClick={cancelEdit} disabled={pending}>Annuler</Btn>
              </div>
            </div>
          ) : (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#010101] hover:border-gray-300 px-3 py-2 rounded-xl transition-all"
                >
                  <Edit3 size={13} />Modifier
                </button>
                <button
                  onClick={() => setCvOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#010101] hover:border-gray-300 px-3 py-2 rounded-xl transition-all"
                >
                  <FileText size={13} />Voir le CV
                </button>
              </div>
            </div>
          )}

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
            screeningStarted={screeningStarted}
            screeningInterviewDone={screeningInterviewDone}
            topgradingStarted={topgradingStarted}
            topgradingInterviewDone={topgradingInterviewDone}
            screeningRejected={screeningDecision?.status === "non_retenu"}
            topgradingRejected={topgradingDecision?.status === "non_retenu"}
            finalRejected={finalDecision?.status === "non_retenu"}
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
                      {step.decision?.status === "non_retenu" ? (
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <X size={11} className="text-red-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#75DA9F]/15 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-[#1e8f52]" />
                        </div>
                      )}
                      <p className="text-sm font-semibold text-[#010101]">{step.label}</p>
                      {step.decision?.status === "non_retenu" && (
                        <Badge color="red">Non retenu</Badge>
                      )}
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
                    Voir plus <ChevronRight size={12} />
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

        <div className="mt-6">
          <CandidateDelete candidateId={candidate.id} candidateName={name} />
        </div>
      </div>
    </AppLayout>
  );
}
