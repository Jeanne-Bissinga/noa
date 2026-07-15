"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Search, Award, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";

// ─── Process steps frise (matches components/noa/prototype-source.tsx) ─────
const PROCESS_STEPS = ["Cadrage", "Screening", "Topgrading", "Décision"];

const ProcessFrise = ({ active }: { active: number }) => (
  <div className="flex items-center gap-0">
    {PROCESS_STEPS.map((step, i) => {
      const done = i < active;
      const current = i === active;
      return (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "bg-[#75DA9F] text-white" : current ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-400"
              }`}
            >
              {done ? <FileText size={13} className="opacity-0" /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                current ? "text-[#010101]" : done ? "text-[#1e8f52]" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
          {i < PROCESS_STEPS.length - 1 && (
            <div className={`h-px w-12 mx-1 mb-5 flex-shrink-0 transition-all ${done ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
          )}
        </div>
      );
    })}
  </div>
);

type TransitionType = "screening" | "topgrading" | "final";

type TransitionConfig = {
  step: number;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

const TRANSITION_CONFIG: Record<TransitionType, TransitionConfig> = {
  screening: {
    step: 1,
    icon: <Search size={28} />,
    eyebrow: "Screening",
    title: "Préparer l'entretien de screening",
    description:
      "Le screening permet de vérifier rapidement les prérequis objectifs du poste. noa a généré une grille de questions standardisées à partir de la fiche de poste, à compléter pendant l'entretien téléphonique.",
  },
  topgrading: {
    step: 2,
    icon: <Award size={28} />,
    eyebrow: "Topgrading",
    title: "Préparer l'entretien Topgrading",
    description:
      "Le Topgrading explore chronologiquement le parcours du candidat pour identifier ses patterns de performance réels, au-delà des formulations d'un CV.",
  },
  final: {
    step: 3,
    icon: <TrendingUp size={28} />,
    eyebrow: "Décision finale",
    title: "Consulter la note globale",
    description:
      "noa a calculé une note de synthèse à partir de l'ensemble des évaluations : résultats attendus, compétences et fit culturel. Cette note est une aide à votre décision, pas une réponse définitive.",
  },
};

const DESTINATION: Record<TransitionType, (candidateId: string) => string> = {
  screening: (candidateId) => `/candidats/${candidateId}`,
  topgrading: (candidateId) => `/candidats/${candidateId}/preparation?step=topgrading`,
  final: (candidateId) => `/candidats/${candidateId}/decision-finale`,
};

const TRANSITION_DELAY_MS = 2200;

export function CandidateTransitionClient({
  candidateId,
  type,
}: {
  candidateId: string;
  type: TransitionType;
}) {
  const router = useRouter();
  const config = TRANSITION_CONFIG[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(DESTINATION[type](candidateId));
    }, TRANSITION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router, candidateId, type]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-full">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-8 py-16">
          <ProcessFrise active={config.step} />

          <div className="w-16 h-16 rounded-2xl bg-[#99BAF8]/15 flex items-center justify-center text-[#3a6fd4] animate-pulse">
            {config.icon}
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4]">
              {config.eyebrow}
            </span>
            <h1 className="text-3xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              {config.title}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {config.description}
            </p>
          </div>

          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#99BAF8] rounded-full animate-spin" />
        </div>
      </div>
    </AppLayout>
  );
}

export type { TransitionType };
