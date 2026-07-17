"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Btn } from "@/components/noa/ui-primitives";
import { deleteCandidate } from "./actions";

export function CandidateDelete({ candidateId, candidateName }: { candidateId: string; candidateName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    setPending(true);
    startTransition(async () => {
      try {
        await deleteCandidate(candidateId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "La suppression a échoué.");
        setPending(false);
      }
    });
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
      >
        <Trash2 size={13} />Supprimer le candidat
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-red-200 bg-red-50 max-w-md">
      <p className="text-xs text-red-600 leading-relaxed mb-2">
        Action irréversible : la fiche candidat et tout son historique (entretiens, grilles, synthèses, décisions) seront définitivement supprimés.
        Tapez son nom (<strong>{candidateName}</strong>) pour confirmer.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={candidateName}
        className="w-full text-xs border border-red-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-red-400 bg-white text-[#010101]"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={() => { setConfirming(false); setConfirmText(""); setError(null); }}>
          Annuler
        </Btn>
        <button
          onClick={handleDelete}
          disabled={confirmText !== candidateName || pending}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-500 px-3 py-2 rounded-xl transition-all"
        >
          <Trash2 size={13} />{pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
      </div>
    </div>
  );
}
