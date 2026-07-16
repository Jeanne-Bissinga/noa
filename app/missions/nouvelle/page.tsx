"use client";

import { useActionState, useState } from "react";
import { ChevronRight, Zap } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink, InputField, Textarea, StepBar } from "@/components/noa/ui-primitives";
import { createMission, type CreateMissionState } from "./actions";

// ─── Mini SVG illustrations for recruitment context cards ──────────────────
const IlluScale = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#75DA9F" fillOpacity="0.12" />
    <rect x="12" y="32" width="7" height="9" rx="2" fill="#75DA9F" fillOpacity="0.5" />
    <rect x="22.5" y="25" width="7" height="16" rx="2" fill="#75DA9F" fillOpacity="0.75" />
    <rect x="33" y="17" width="7" height="24" rx="2" fill="#75DA9F" />
    <polyline points="33,17 37,12 41,17" stroke="#1e8f52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IlluReplacement = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#99BAF8" fillOpacity="0.12" />
    <circle cx="18" cy="19" r="5" fill="#99BAF8" fillOpacity="0.35" />
    <path d="M10 38c0-5 3.6-8 8-8" stroke="#99BAF8" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" fill="none" />
    <line x1="22" y1="26" x2="32" y2="26" stroke="#3a6fd4" strokeWidth="1.8" strokeLinecap="round" />
    <polyline points="29,22 33,26 29,30" stroke="#3a6fd4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="38" cy="19" r="5" fill="#99BAF8" />
    <path d="M30 38c0-5 3.6-8 8-8" stroke="#99BAF8" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const IlluReorg = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#CCB8FF" fillOpacity="0.12" />
    <circle cx="26" cy="15" r="5" fill="#CCB8FF" />
    <line x1="26" y1="20" x2="26" y2="26" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="16" y1="26" x2="36" y2="26" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="16" y1="26" x2="16" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="26" y1="26" x2="26" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="36" y1="26" x2="36" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <circle cx="16" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.55" />
    <circle cx="26" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.8" />
    <circle cx="36" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.55" />
    <path d="M20 40 Q26 43 32 40" stroke="#6b4ec4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <polyline points="30,38 32,40 30,42" stroke="#6b4ec4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IlluNewRole = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#FEE831" fillOpacity="0.15" />
    <path d="M26 13c-5 0-9 4-9 9 0 3.5 1.8 6.5 4.5 8.2V33h9v-2.8C33.2 28.5 35 25.5 35 22c0-5-4-9-9-9z" fill="#FEE831" fillOpacity="0.7" />
    <rect x="21.5" y="33" width="9" height="2.5" rx="1.2" fill="#FEE831" fillOpacity="0.9" />
    <rect x="23" y="35.5" width="6" height="2" rx="1" fill="#c8a800" fillOpacity="0.7" />
    <line x1="26" y1="9" x2="26" y2="11" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="34" y1="12" x2="33" y2="13.4" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="20" x2="36.5" y2="20" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18" y1="12" x2="19" y2="13.4" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14" y1="20" x2="15.5" y2="20" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IlluOther = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#e5e7eb" fillOpacity="0.6" />
    <path d="M22 20c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2-1.5 3-3 4v2" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <circle cx="26" cy="33" r="1.5" fill="#9ca3af" />
  </svg>
);

const LOADING_STEPS = [
  "Analyse du contexte de recrutement…",
  "Identification des enjeux du poste…",
  "Rédaction du résumé de la fiche…",
  "Finalisation en cours…",
];

const REASONS = [
  { id: "scale", label: "Scale / Croissance", desc: "Soutenir la montée en charge de l'équipe", ring: "ring-[#75DA9F]/50 bg-[#75DA9F]/8", dot: "bg-[#75DA9F]", Illu: IlluScale },
  { id: "replacement", label: "Remplacement", desc: "Remplacer un collaborateur qui quitte le poste", ring: "ring-[#99BAF8]/50 bg-[#99BAF8]/8", dot: "bg-[#99BAF8]", Illu: IlluReplacement },
  { id: "reorg", label: "Réorganisation", desc: "Adapter l'équipe à un nouveau périmètre", ring: "ring-[#CCB8FF]/50 bg-[#CCB8FF]/8", dot: "bg-[#CCB8FF]", Illu: IlluReorg },
  { id: "newrole", label: "Création de poste", desc: "Un besoin nouveau, un rôle qui n'existait pas encore", ring: "ring-[#FEE831]/60 bg-[#FEE831]/12", dot: "bg-[#FEE831]", Illu: IlluNewRole },
  { id: "other", label: "Autre", desc: "Un contexte particulier à préciser", ring: "ring-gray-300 bg-gray-50", dot: "bg-gray-400", Illu: IlluOther },
];

const initialState: CreateMissionState = {};

export default function CampaignWhyPage() {
  const [state, formAction, pending] = useActionState(createMission, initialState);
  const [reason, setReason] = useState("");
  const [autreDetail, setAutreDetail] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  // Purely cosmetic staged-loading animation while the server action runs,
  // the actual mission insert happens in the server action itself.
  const handleSubmitClick = () => {
    setLoadingStep(0);
    const steps = [600, 1200, 1900, 2600];
    steps.forEach((delay, i) => setTimeout(() => setLoadingStep(i), delay));
  };

  return (
    <AppLayout headerTitle="Nouvelle mission">
      <div className="max-w-2xl mx-auto">
        <BackLink href="/missions" />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={0} /></div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Pourquoi ce recrutement ?</h1>
        <p className="text-gray-400 text-sm mb-7">Identifier le motif permet à noa de calibrer les objectifs et compétences attendus.</p>

        {state?.error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmitClick}>
          <input type="hidden" name="reason" value={reason} />
          <input type="hidden" name="reasonDetail" value={reason === "other" ? autreDetail : ""} />

          <div className="flex flex-col gap-2.5 mb-7">
            {REASONS.map((r) => {
              const isSelected = reason === r.id;
              const isOtherOpen = r.id === "other" && isSelected;
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl transition-all overflow-hidden ${
                    isSelected ? `ring-2 ${r.ring}` : "bg-white hover:border hover:border-gray-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => { setReason(r.id); if (r.id !== "other") setAutreDetail(""); }}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-current" : "border-gray-300"}`}>
                      {isSelected && <div className={`w-2 h-2 rounded-full ${r.dot}`} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[#010101]">{r.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                    </div>
                    <div className="flex-shrink-0 opacity-80">
                      <r.Illu />
                    </div>
                  </button>
                  {isOtherOpen && (
                    <div className="px-5 pb-4 pt-0 border-t border-gray-200/60">
                      <input
                        autoFocus
                        value={autreDetail}
                        onChange={(e) => setAutreDetail(e.target.value)}
                        placeholder="Décrivez brièvement le contexte de ce recrutement…"
                        className="w-full bg-transparent text-sm text-[#010101] placeholder-gray-400 focus:outline-none pt-3"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Card className="p-6 mb-7">
            <div className="flex flex-col gap-4">
              <InputField label="Titre du poste" placeholder="Ex : Développeur Full-Stack Senior" required name="title" />
              <Textarea
                label="Point de départ"
                placeholder="Ex : L'équipe commerciale peine à convertir les leads entrants, le CA stagne depuis 2 trimestres."
                rows={3}
                hint="La situation actuelle : pourquoi ce poste est nécessaire maintenant."
                name="startingPoint"
              />
              <Textarea
                label="Objectif(s) à X mois / an"
                placeholder="Ex : Doubler le chiffre d'affaires en 2 ans en structurant une vraie stratégie commerciale."
                rows={3}
                hint="Des résultats datés, pas d'intentions vagues."
                name="targetObjective"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Btn variant="primary" size="lg" type="submit" disabled={!reason || pending}>
              {pending ? "Création en cours…" : "Créer ma fiche de poste"}
              {!pending && <ChevronRight size={17} />}
            </Btn>
          </div>
        </form>
      </div>

      {/* Loading overlay */}
      {pending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 max-w-xs text-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl bg-[#99BAF8]/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="relative w-16 h-16 rounded-2xl bg-[#99BAF8]/10 flex items-center justify-center">
                <Zap size={28} className="text-[#3a6fd4]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4] mb-2">noa travaille pour vous</p>
              <p className="text-sm font-semibold text-[#010101] min-h-[1.5rem] transition-all">{LOADING_STEPS[loadingStep]}</p>
            </div>
            <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#99BAF8] rounded-full transition-all duration-700"
                style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
