"use client";

import { useState, useTransition } from "react";
import { goalProgress, progressWording, GOAL_STATUS_LABEL } from "@/lib/noa/onboarding/progress";
import { updateGoal } from "./actions";
import type { OnboardingGoal, OnboardingGoalStatus } from "@/lib/noa/types";

// Mise à jour d'un résultat par le manager.
//
// Une ligne de tableau, plus une carte : à quatre objectifs, l'ancienne version
// occupait 530 pixels — un écran presque plein pour quatre phrases et seize
// boutons. Le libellé, sa mesure et son contrôle tiennent désormais sur une
// seule ligne, et les quatre boutons de statut sont devenus une liste
// déroulante.
//
// C'est l'une des rares saisies qui restent au manager, et elle doit tenir en
// un geste : soit un chiffre à corriger, soit un statut à choisir. Deux natures
// de résultat, pas plus.

const STATUSES: OnboardingGoalStatus[] = ["non_commence", "en_cours", "atteint", "bloque"];

const STATUS_STYLE: Record<OnboardingGoalStatus, string> = {
  non_commence: "bg-gray-50 text-gray-500 border-gray-200",
  en_cours: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/40",
  atteint: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/40",
  bloque: "bg-orange-50 text-orange-500 border-orange-200",
};

export function GoalTracker({ goal }: { goal: OnboardingGoal }) {
  const [current, setCurrent] = useState(goal.current_value !== null ? String(goal.current_value) : "");
  const [status, setStatus] = useState<OnboardingGoalStatus>(goal.status);
  const [, startTransition] = useTransition();

  // Recalculé localement pour que le pourcentage bouge dès la saisie, sans
  // attendre l'aller-retour serveur.
  const percent = goalProgress({
    kind: goal.kind,
    target_value: goal.target_value,
    current_value: current === "" ? null : Number(current.replace(",", ".")),
  });
  const wording = progressWording(percent);

  const commitCurrent = (value: string) => {
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed.replace(",", "."));
    if (parsed !== null && !Number.isFinite(parsed)) return;
    startTransition(() => {
      updateGoal(goal.id, { currentValue: parsed });
    });
  };

  const commitStatus = (next: OnboardingGoalStatus) => {
    setStatus(next);
    startTransition(() => {
      updateGoal(goal.id, { status: next });
    });
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#010101] leading-snug">{goal.label}</p>
        {goal.metric && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{goal.metric}</p>}
      </div>

      {goal.kind === "numeric" && goal.target_value !== null ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            onBlur={(e) => commitCurrent(e.target.value)}
            placeholder="0"
            aria-label={`Valeur actuelle — ${goal.label}`}
            className="w-14 text-xs text-right bg-gray-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 text-[#010101] placeholder-gray-300"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">/ {goal.target_value}</span>
          {wording && <span className="text-[10px] text-gray-400 w-24 text-right">{wording}</span>}
        </div>
      ) : (
        <select
          value={status}
          onChange={(e) => commitStatus(e.target.value as OnboardingGoalStatus)}
          aria-label={`Statut — ${goal.label}`}
          className={`flex-shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 ${STATUS_STYLE[status]}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {GOAL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
