"use client";

import { useState, useTransition } from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { Btn } from "@/components/noa/ui-primitives";
import { cancelMission, reactivateMission, deleteMissionPermanently } from "../actions";
import type { MissionStatus } from "@/lib/noa/types";

type DeleteStep = "closed" | "choice" | "confirm";

export function MissionActions({
  missionId, missionTitle, status, candidateCount,
}: {
  missionId: string;
  missionTitle: string;
  status: MissionStatus;
  candidateCount: number;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Avec des candidats rattachés, la suppression demande d'abord un choix
  // explicite (les supprimer aussi, ou garder via une annulation) avant la
  // confirmation finale. Sans candidat, on saute directement à la confirmation.
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("closed");
  const [confirmText, setConfirmText] = useState("");
  const [, startTransition] = useTransition();

  const closeDelete = () => {
    setDeleteStep("closed");
    setConfirmText("");
    setError(null);
  };

  const handleCancel = () => {
    if (!window.confirm(`Annuler la campagne "${missionTitle}" ? Elle sortira des vues actives, mais rien n'est supprimé — réactivable à tout moment.`)) return;
    setPending(true);
    startTransition(async () => {
      await cancelMission(missionId);
      setPending(false);
    });
  };

  const handleReactivate = () => {
    setPending(true);
    startTransition(async () => {
      await reactivateMission(missionId);
      setPending(false);
    });
  };

  // Choix "garder les candidats" depuis l'étape de suppression : équivaut à
  // annuler la campagne, pas besoin de re-confirmer une seconde fois.
  const handleKeepCandidates = () => {
    setPending(true);
    startTransition(async () => {
      await cancelMission(missionId);
      setPending(false);
      closeDelete();
    });
  };

  const handleDelete = () => {
    setError(null);
    setPending(true);
    startTransition(async () => {
      try {
        await deleteMissionPermanently(missionId, candidateCount > 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "La suppression a échoué.");
        setPending(false);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {status === "annule" ? (
          <button
            onClick={handleReactivate}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] bg-[#99BAF8]/10 hover:bg-[#99BAF8]/20 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            <RotateCcw size={13} />Réactiver la campagne
          </button>
        ) : (
          <button
            onClick={handleCancel}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            <Archive size={13} />Annuler la campagne
          </button>
        )}

        {deleteStep === "closed" && (
          <button
            onClick={() => setDeleteStep(candidateCount > 0 ? "choice" : "confirm")}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            <Trash2 size={13} />Supprimer la mission
          </button>
        )}
      </div>

      {deleteStep === "choice" && (
        <div className="mt-3 p-4 rounded-xl border border-orange-200 bg-orange-50 max-w-md">
          <p className="text-xs text-orange-700 leading-relaxed mb-3">
            Cette mission a <strong>{candidateCount} candidat{candidateCount > 1 ? "s" : ""}</strong> rattaché{candidateCount > 1 ? "s" : ""}.
            Voulez-vous les supprimer aussi ?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setDeleteStep("confirm")}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              <Trash2 size={13} />Oui, tout supprimer ({candidateCount} candidat{candidateCount > 1 ? "s" : ""} inclus)
            </button>
            <button
              onClick={handleKeepCandidates}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#010101] bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
            >
              {pending ? "Annulation…" : "Non, garder les candidats (annuler la campagne)"}
            </button>
            <button onClick={closeDelete} disabled={pending} className="text-xs text-gray-400 hover:text-gray-500 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {deleteStep === "confirm" && (
        <div className="mt-3 p-4 rounded-xl border border-red-200 bg-red-50 max-w-md">
          <p className="text-xs text-red-600 leading-relaxed mb-2">
            Action irréversible{candidateCount > 0 ? ` : la mission ET ses ${candidateCount} candidat${candidateCount > 1 ? "s" : ""} (entretiens, grilles, synthèses, décisions inclus) seront définitivement supprimés` : " : la mission sera définitivement supprimée"}.
            Tapez son nom (<strong>{missionTitle}</strong>) pour confirmer.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={missionTitle}
            className="w-full text-xs border border-red-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-red-400 bg-white text-[#010101]"
          />
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={closeDelete}>
              Annuler
            </Btn>
            <button
              onClick={handleDelete}
              disabled={confirmText !== missionTitle || pending}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 px-3 py-2 rounded-xl transition-all"
            >
              <Trash2 size={13} />{pending ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
