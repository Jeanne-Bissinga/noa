"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, X } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink, Textarea } from "@/components/noa/ui-primitives";
import { formatDate } from "@/lib/noa/labels";
import { addGoal, removeGoal, updateGoal, updateOnboardingDetails, validateOnboarding } from "../actions";
import type { Onboarding, OnboardingGoal, OnboardingPhase } from "@/lib/noa/types";

// Plan 30-60-90, généré depuis le recrutement.
//
// Lecture par défaut, modification à la demande. L'écran précédent était un
// formulaire permanent, avec un bandeau de compteurs (« 7 objectifs »,
// « 6 priorités », « 3 bilans ») et un champ « Cible » sur chaque ligne : trois
// informations qui n'aidaient ni à comprendre le plan ni à agir dessus. Le
// manager vient ici pour relire, corriger une phrase, et valider.
//
// La cible chiffrée existe toujours, mais seulement en mode Modifier et vide
// par défaut : Noa n'en devine plus aucune depuis le texte de la Scorecard.

const PHASES: { phase: OnboardingPhase; title: string; help: string }[] = [
  {
    phase: "j30",
    title: "30 premiers jours",
    help: "Ce sur quoi la personne se concentre en arrivant.",
  },
  {
    phase: "j60",
    title: "J30 → J60",
    help: "Les premiers résultats attendus.",
  },
  {
    phase: "j90",
    title: "J60 → J90",
    help: "Les résultats attendus à 90 jours, repris du recrutement.",
  },
];

function GoalRow({ goal, onRemoved }: { goal: OnboardingGoal; onRemoved: (id: string) => void }) {
  const [label, setLabel] = useState(goal.label);
  const [target, setTarget] = useState(goal.target_value !== null ? String(goal.target_value) : "");
  const [, startTransition] = useTransition();

  const commitLabel = (value: string) => {
    if (value.trim() === goal.label) return;
    startTransition(() => {
      updateGoal(goal.id, { label: value });
    });
  };

  const commitTarget = (value: string) => {
    const trimmed = value.trim();
    // Champ vidé : l'objectif redevient qualitatif, suivi par statut.
    const parsed = trimmed === "" ? null : Number(trimmed.replace(",", "."));
    if (parsed !== null && !Number.isFinite(parsed)) return;
    startTransition(() => {
      updateGoal(goal.id, { targetValue: parsed });
    });
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={(e) => commitLabel(e.target.value)}
        placeholder="Intitulé"
        className="flex-1 text-sm bg-transparent focus:outline-none text-[#010101] placeholder-gray-300"
      />
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        onBlur={(e) => commitTarget(e.target.value)}
        placeholder="—"
        title="Cible chiffrée, seulement si ce résultat se compte. Laissez vide sinon : le suivi se fera par statut."
        aria-label="Cible chiffrée (facultatif)"
        className="w-16 text-xs text-right bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 text-[#010101] placeholder-gray-300"
      />
      <button
        type="button"
        onClick={() => {
          onRemoved(goal.id);
          startTransition(() => {
            removeGoal(goal.id);
          });
        }}
        className="p-1 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-all"
        aria-label="Supprimer"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export function PlanEditor({
  candidateId,
  candidateName,
  firstName,
  onboarding,
  goals,
  preferencesCompleted,
  missionTitle,
}: {
  candidateId: string;
  candidateName: string;
  firstName: string;
  onboarding: Onboarding;
  goals: OnboardingGoal[];
  preferencesCompleted: boolean;
  missionTitle: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [missionText, setMissionText] = useState(onboarding.mission_text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const visible = goals.filter((g) => !removed.includes(g.id));
  const byPhase = (phase: OnboardingPhase) => visible.filter((g) => g.phase === phase);

  const handleAdd = (phase: OnboardingPhase) => {
    startTransition(async () => {
      await addGoal(onboarding.id, phase);
      router.refresh();
    });
  };

  const handleValidate = () => {
    setError(null);
    startTransition(async () => {
      const result = await validateOnboarding(onboarding.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/integrations/${candidateId}`);
    });
  };

  return (
    <AppLayout headerTitle={candidateName}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/integrations/${candidateId}`} label="Retour au plan d'onboarding" />

        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Plan 30-60-90 de {firstName}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Généré à partir des éléments définis pendant le recrutement
            {missionTitle ? ` · ${missionTitle}` : ""}.
          </p>
        </div>

        {/* ── Mission ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Mission</p>
          {editing ? (
            <div className="flex flex-col gap-3">
              <Textarea
                rows={5}
                value={missionText}
                onChange={setMissionText}
                placeholder="Reprise de la campagne de recrutement."
                hint="Modifiable ici sans toucher à la campagne."
              />
              <div>
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    startTransition(() => {
                      updateOnboardingDetails(onboarding.id, { missionText });
                    })
                  }
                >
                  Enregistrer la mission
                </Btn>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {onboarding.mission_text?.trim() || (
                <span className="text-gray-300">Aucune mission reprise de la campagne.</span>
              )}
            </p>
          )}
        </Card>

        {/* ── Avant l'arrivée ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
            Avant l&apos;arrivée
          </p>
          <p className="text-[11px] text-gray-400 mb-3">
            Rappel. Ces points se pilotent depuis le plan d&apos;onboarding.
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Préférences de travail</span>
              <span className="text-xs font-semibold text-[#010101]">
                {preferencesCompleted ? "Complétées" : "En attente"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Date d&apos;arrivée</span>
              <span className="text-xs font-semibold text-[#010101]">
                {onboarding.start_date ? formatDate(onboarding.start_date) : "À définir"}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Les trois phases ── */}
        {PHASES.map(({ phase, title, help }) => (
          <Card key={phase} className="p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
              {editing && (
                <button
                  type="button"
                  onClick={() => handleAdd(phase)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#3a6fd4] hover:underline"
                >
                  <Plus size={12} />
                  Ajouter
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mb-2">{help}</p>

            {byPhase(phase).length === 0 ? (
              <p className="text-xs text-gray-300 py-2">Aucun élément pour l&apos;instant.</p>
            ) : editing ? (
              byPhase(phase).map((goal) => (
                <GoalRow key={goal.id} goal={goal} onRemoved={(id) => setRemoved((r) => [...r, id])} />
              ))
            ) : (
              <ul className="flex flex-col gap-1.5">
                {byPhase(phase).map((goal) => (
                  <li key={goal.id} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>
                      {goal.label || <span className="text-gray-300">Sans intitulé</span>}
                      {goal.kind === "numeric" && goal.target_value !== null && (
                        <span className="text-gray-400"> — cible : {goal.target_value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex items-center gap-2 flex-wrap">
          <Btn variant={editing ? "primary" : "secondary"} onClick={() => setEditing((e) => !e)}>
            <Pencil size={14} />
            {editing ? "Terminer les modifications" : "Modifier"}
          </Btn>

          {!onboarding.start_date && onboarding.status !== "brouillon" && (
            <p className="text-[11px] text-gray-400">
              Les entretiens seront programmés dès que la date d&apos;arrivée sera fixée.
            </p>
          )}

          {onboarding.status === "brouillon" && (
            <Btn variant="primary" onClick={handleValidate} disabled={pending}>
              {pending ? "Validation…" : "Valider le plan"}
              {!pending && <Check size={15} />}
            </Btn>
          )}
        </div>

        {onboarding.status === "brouillon" && (
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            En validant, Noa programme les quatre entretiens : J1 le jour de l'arrivée, puis J30, J60
            et J90. Vous pourrez tout modifier ensuite.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
