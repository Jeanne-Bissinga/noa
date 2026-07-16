"use client";

import { useEffect, useRef, useTransition } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/noa/ui-primitives";
import { saveTranscript } from "@/app/candidats/[id]/actions";
import type { InterviewType } from "@/lib/noa/types";

// Affiché après le guide d'entretien (cf. RecordingGuidance, affiché avant,
// pour la consigne d'enregistrement) : le recruteur colle ici la
// transcription obtenue une fois l'entretien terminé, pour que noa l'utilise
// dans la synthèse post-entretien.
const ACCENT = {
  blue: { ring: "focus:border-[#99BAF8] focus:ring-[#99BAF8]/20", icon: "text-[#3a6fd4] bg-[#99BAF8]/12" },
  violet: { ring: "focus:border-[#CCB8FF] focus:ring-[#CCB8FF]/20", icon: "text-[#6b4ec4] bg-[#CCB8FF]/12" },
};

export function TranscriptCapture({
  candidateId, type, value, onChange, accent = "blue",
}: {
  candidateId: string;
  type: InterviewType;
  value: string;
  onChange: (value: string) => void;
  accent?: "blue" | "violet";
}) {
  const [, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const colors = ACCENT[accent];

  // Debounced persistence to the interview row, mirroring the grid answers pattern.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await saveTranscript(candidateId, type, value);
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Card className="p-4 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <FileText size={12} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Transcription de l&apos;entretien</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        Collez ici le texte obtenu depuis votre outil d&apos;enregistrement une fois l&apos;entretien terminé : noa s&apos;en servira pour analyser la grille et rédiger la synthèse.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={value ? 6 : 3}
        placeholder="Collez ici la transcription générée par votre outil…"
        className={`w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 placeholder-gray-300 resize-none transition-colors ${colors.ring}`}
      />
    </Card>
  );
}
