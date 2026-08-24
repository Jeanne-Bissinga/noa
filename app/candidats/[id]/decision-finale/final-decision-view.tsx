"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, TrendingUp, PartyPopper, Sparkles, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, Btn, BackLink } from "@/components/noa/ui-primitives";
import { useRegisterTestFiller } from "@/components/noa/test-fill-context";
import { initials as initialsOf } from "@/lib/noa/labels";
import { decideFinal, ensureFinalRecommendationTest } from "../actions";
import { markMissionFilled } from "@/app/missions/actions";
import type { Candidate, CandidateExperience, CandidateSkill, Synthesis } from "@/lib/noa/types";

const VERDICT_STYLE: Record<string, { label: string; tone: string }> = {
  "Recommandation : recruter": { label: "Recruter", tone: "bg-[#75DA9F]/15 text-[#1e8f52]" },
  "Recommandation : à discuter": { label: "À discuter", tone: "bg-[#99BAF8]/15 text-[#3a6fd4]" },
  "Recommandation : écarter": { label: "Écarter", tone: "bg-red-50 text-red-500" },
};

function StageRecap({ candidateId, step, label, synthesis }: {
  candidateId: string;
  step: "screening" | "topgrading";
  label: string;
  synthesis: Synthesis | null;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        {synthesis ? (
          <Badge color="green">Réalisé</Badge>
        ) : (
          <Badge color="gray">À venir</Badge>
        )}
      </div>
      {synthesis?.advice ? (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{synthesis.advice}</p>
      ) : (
        <p className="text-xs text-gray-300">Pas encore de synthèse.</p>
      )}
      {synthesis && (
        <Link
          href={`/candidats/${candidateId}/synthese?step=${step}`}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3a6fd4] hover:underline mt-2"
        >
          Voir le détail<ChevronRight size={10} />
        </Link>
      )}
    </Card>
  );
}

export function FinalDecisionView({
  candidate, score, experiences, skills, screeningSynthesis, topgradingSynthesis, globalRecommendation,
}: {
  candidate: Candidate;
  score: number | null;
  experiences: CandidateExperience[];
  skills: CandidateSkill[];
  screeningSynthesis: Synthesis | null;
  topgradingSynthesis: Synthesis | null;
  globalRecommendation: Synthesis | null;
}) {
  const [pendingAction, setPendingAction] = useState<"non_retenu" | "retenu" | null>(null);
  // Une fois le candidat marqué "recruté", on demande d'abord au recruteur si
  // la mission est désormais pourvue (elle peut viser plusieurs postes, donc
  // rester active) avant de le renvoyer vers la liste des candidats.
  const [missionPrompt, setMissionPrompt] = useState<{ missionId: string } | null>(null);
  const [missionPending, setMissionPending] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // La page ne génère jamais la recommandation IA pour le compte de test (cf.
  // page.tsx) : ce bouton la remplace par une recommandation fixe.
  useRegisterTestFiller(() => {
    if (globalRecommendation) return;
    startTransition(async () => {
      const created = await ensureFinalRecommendationTest(candidate.id);
      if (created) router.refresh();
    });
  });

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = score !== null && score >= 75
    ? "bg-[#75DA9F]/20 text-[#1e8f52]"
    : score !== null && score >= 50
    ? "bg-[#99BAF8]/20 text-[#3a6fd4]"
    : "bg-red-50 text-red-400";

  const recommendation = score === null
    ? { label: "Score en attente", tone: "bg-gray-100 text-gray-500" }
    : score >= 75
    ? { label: "Profil recommandé", tone: "bg-[#75DA9F]/15 text-[#1e8f52]" }
    : score >= 50
    ? { label: "Profil à discuter", tone: "bg-[#99BAF8]/15 text-[#3a6fd4]" }
    : { label: "Profil insuffisant", tone: "bg-red-50 text-red-500" };

  const verdict = globalRecommendation?.advice ? VERDICT_STYLE[globalRecommendation.advice] : null;

  const handleDecide = (action: "non_retenu" | "retenu") => {
    setPendingAction(action);
    startTransition(async () => {
      const result = await decideFinal(candidate.id, action, score);
      // action "non_retenu" : decideFinal redirige lui-même côté serveur.
      if (action === "retenu" && result?.missionId) {
        setMissionPrompt({ missionId: result.missionId });
        setPendingAction(null);
      }
    });
  };

  const handleMissionChoice = (fillMission: boolean) => {
    if (!missionPrompt) return;
    setMissionPending(true);
    startTransition(async () => {
      if (fillMission) {
        await markMissionFilled(missionPrompt.missionId);
      }
      router.push("/candidats");
    });
  };

  if (missionPrompt) {
    return (
      <AppLayout headerTitle={name}>
        <div className="max-w-md mx-auto">
          <Card className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#75DA9F]/15 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={22} className="text-[#1e8f52]" />
            </div>
            <h1 className="text-lg font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>{name} a été marqué comme recruté</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Cette mission cherche-t-elle encore d'autres profils, ou le recrutement est-il terminé ?
            </p>
            <div className="flex flex-col gap-2">
              <Btn variant="primary" size="lg" onClick={() => handleMissionChoice(true)} disabled={missionPending}>
                <Check size={15} />{missionPending ? "…" : "Marquer la mission comme pourvue"}
              </Btn>
              <Btn variant="secondary" size="lg" onClick={() => handleMissionChoice(false)} disabled={missionPending}>
                Non, je continue à recruter sur cette mission
              </Btn>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

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
                <span className="text-sm text-gray-400">Décision finale</span>
                <Badge color="green">Finaliste</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion de noa */}
        {globalRecommendation && (
          <Card className="p-5 mb-4 border-[#99BAF8]/25">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#99BAF8]/12 flex items-center justify-center">
                  <Sparkles size={12} className="text-[#3a6fd4]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Suggestion de noa</p>
              </div>
              {verdict && <span className={`text-xs font-bold px-3 py-1 rounded-full ${verdict.tone}`}>{verdict.label}</span>}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{globalRecommendation.content}</p>
          </Card>
        )}

        {/* Score */}
        <Card className="p-6 mb-4 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Note globale</p>
          <div className="inline-flex items-end gap-1.5 mb-2">
            <span className="text-6xl font-bold text-[#010101] leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
              {score ?? "-"}
            </span>
            <span className="text-2xl text-gray-200 font-light mb-1">/100</span>
          </div>
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${recommendation.tone}`}>
              <TrendingUp size={12} />
              {recommendation.label}
            </span>
          </div>
        </Card>

        {/* Récap Screening / Topgrading */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StageRecap candidateId={candidate.id} step="screening" label="Screening" synthesis={screeningSynthesis} />
          <StageRecap candidateId={candidate.id} step="topgrading" label="Topgrading" synthesis={topgradingSynthesis} />
        </div>

        {/* Profil candidat */}
        {(skills.length > 0 || experiences.length > 0) && (
          <Card className="p-5 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Profil</p>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {skills.map((s) => (
                  <span key={s.id} className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-lg px-2 py-0.5">{s.name}</span>
                ))}
              </div>
            )}
            {experiences.length > 0 && (
              <ul className="flex flex-col gap-1">
                {experiences.map((exp) => (
                  <li key={exp.id} className="text-xs text-gray-600 flex items-baseline gap-1.5">
                    <span className="font-semibold text-[#010101]">{exp.role || "-"}</span>
                    {exp.company && <span className="text-gray-400">· {exp.company}</span>}
                    {exp.period && <span className="text-gray-300 text-[10px] ml-auto flex-shrink-0">{exp.period}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="flex items-center justify-between gap-4">
          <Btn variant="danger" onClick={() => handleDecide("non_retenu")} disabled={pendingAction !== null}>
            <X size={15} />{pendingAction === "non_retenu" ? "…" : "Ne pas retenir"}
          </Btn>
          <Btn variant="primary" size="lg" onClick={() => handleDecide("retenu")} disabled={pendingAction !== null}>
            <Check size={15} />{pendingAction === "retenu" ? "…" : "Marquer comme recruté"}
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
