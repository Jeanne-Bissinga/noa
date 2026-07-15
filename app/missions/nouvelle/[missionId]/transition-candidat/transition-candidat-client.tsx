"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
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
              {i + 1}
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

const TRANSITION_DELAY_MS = 2200;

export function TransitionCandidatClient({ missionId }: { missionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(`/candidats/nouveau?mission=${missionId}`);
    }, TRANSITION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [router, missionId]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-full">
        <div className="max-w-lg w-full text-center flex flex-col items-center gap-8 py-16">
          <ProcessFrise active={0} />

          <div className="w-16 h-16 rounded-2xl bg-[#99BAF8]/15 flex items-center justify-center text-[#3a6fd4] animate-pulse">
            <Users size={28} />
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4]">
              Étape suivante
            </span>
            <h1 className="text-3xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ajouter un candidat
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              La fiche de poste est prête. Importez le CV d&apos;un candidat pour que noa génère automatiquement sa fiche et prépare la grille d&apos;évaluation adaptée au poste.
            </p>
          </div>

          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#99BAF8] rounded-full animate-spin" />
        </div>
      </div>
    </AppLayout>
  );
}
