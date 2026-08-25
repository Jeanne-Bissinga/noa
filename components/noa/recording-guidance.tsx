"use client";

import { Mic, Square, X } from "lucide-react";
import { Card } from "@/components/noa/ui-primitives";
import { useInterviewRecorder } from "@/components/noa/use-interview-recorder";

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const ACCENT = {
  blue: { icon: "text-[#3a6fd4] bg-[#99BAF8]/12" },
  violet: { icon: "text-[#6b4ec4] bg-[#CCB8FF]/12" },
};

// Affiché avant le guide d'entretien : le recruteur démarre l'enregistrement
// ici, avant de dérouler l'entretien (cf. TranscriptCapture, affiché après le
// guide, qui reçoit le texte transcrit et permet de le relire/corriger).
export function RecordingGuidance({
  value, onChange, accent = "blue",
}: {
  value: string;
  onChange: (value: string) => void;
  accent?: "blue" | "violet";
}) {
  const colors = ACCENT[accent];

  const recorder = useInterviewRecorder((text) => {
    onChange(value.trim() ? `${value.trim()}\n\n${text}` : text);
  });

  return (
    <Card className="p-4 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <Mic size={12} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Enregistrer l&apos;entretien</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        Enregistrez directement l&apos;entretien (haut-parleur activé pour capter les deux voix), ou collez le texte obtenu depuis un autre outil : noa s&apos;en servira pour analyser la grille et rédiger la synthèse.
      </p>

      <div className="flex items-center gap-2">
        {recorder.status === "idle" || recorder.status === "error" ? (
          <button
            type="button"
            onClick={recorder.start}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#010101] hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
          >
            <Mic size={12} />
            Démarrer l&apos;enregistrement
          </button>
        ) : recorder.status === "recording" ? (
          <>
            <button
              type="button"
              onClick={recorder.stop}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-2 transition-colors"
            >
              <Square size={11} />
              Arrêter · {formatElapsed(recorder.elapsedSeconds)}
            </button>
            <button
              type="button"
              onClick={recorder.cancel}
              aria-label="Annuler l'enregistrement"
              className="flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg p-2 transition-colors"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#99BAF8] animate-pulse" />
            {recorder.status === "uploading" ? "Envoi de l'enregistrement…" : "Transcription en cours…"}
          </span>
        )}
      </div>

      {recorder.error && (
        <p className="text-xs text-red-500 mt-2">{recorder.error}</p>
      )}
    </Card>
  );
}
