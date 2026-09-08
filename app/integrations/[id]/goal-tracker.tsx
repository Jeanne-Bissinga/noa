"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/noa/ui-primitives";
import { goalProgress, progressWording, GOAL_STATUS_LABEL } from "@/lib/noa/onboarding/progress";
import { updateGoal } from "./actions";
import type { OnboardingGoal, OnboardingGoalStatus } from "@/lib/noa/types";

// Mise à jour d'un résultat par le manager.
//
// C'est l'une des rares saisies qui lui restent, et elle doit tenir en un
// geste : soit un chiffre à corriger, soit un statut à cliquer. Deux natures
// de résultat, pas plus — un objectif chiffré affiche sa progression, un
// objectif qualitatif se suit par statut.

const STATUSES: OnboardingGoalStatus[] = ["non_commence", "en_cours", "atteint", "bloque"];

const STATUS_STYLE: Record<OnboardingGoalStatus, string> = {
  non_commence: "bg-gray-100 text-gray-500 border-gray-200",
  en_cours: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/40",
  atteint: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/40",
  bloque: "bg-orange-50 text-orange-500 border-orange-200",
};

export function GoalTracker({ goal }: { goal: OnboardingGoal }) {
  const [current, setCurrent] = useState(goal.current_value !== null ? String(goal.current_value) : "");
  const [status, setStatus] = useState<OnboardingGoalStatus>(goal.status);
  const [, startTransition] = useTransition();

  // Recalculé localement pour que la barre bouge dès la saisie, sans attendre
  // l'aller-retour serveur.
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
    <Card className="p-3.5">
      <p className="text-xs font-semibold text-[#010101] leading-snug">{goal.label}</p>
      {goal.metric && <p className="text-[10px] text-gray-400 mt-0.5">{goal.metric}</p>}

      {goal.kind === "numeric" && goal.target_value !== null ? (
        <div className="mt-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <input
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              onBlur={(e) => commitCurrent(e.target.value)}
              placeholder="0"
              aria-label="Valeur actuelle"
              className="w-16 text-xs text-right bg-gray-50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 text-[#010101] placeholder-gray-300"
            />
            <span className="text-xs text-gray-400">/ {goal.target_value}</span>
            {percent !== null && (
              <span className="text-xs font-semibold text-[#010101] ml-auto">
                {percent}% · <span className="font-normal text-gray-500">{wording}</span>
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (percent ?? 0) >= 100 ? "bg-[#75DA9F]" : "bg-[#99BAF8]"
              }`}
              style={{ width: `${percent ?? 0}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commitStatus(s)}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                status === s ? STATUS_STYLE[s] : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {GOAL_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
