"use client";

import { useEffect, useRef, useTransition } from "react";
import { Mic, ExternalLink } from "lucide-react";
import { Card } from "@/components/noa/ui-primitives";
import { saveTranscript } from "@/app/candidats/[id]/actions";
import type { InterviewType } from "@/lib/noa/types";

// noa n'enregistre pas encore l'entretien : le recruteur enregistre en amont
// avec un outil externe, puis colle la transcription ici pour que noa
// l'utilise dans la synthèse post-entretien.
const TOOL_EXAMPLES = [
  { name: "Otter.ai", hint: "dictaphone + transcription auto" },
  { name: "Fireflies.ai", hint: "rejoint Zoom / Meet / Teams" },
  { name: "tl;dv", hint: "transcription + résumé de visio" },
  { name: "Fathom", hint: "gratuit, transcription de visio" },
  { name: "Notta", hint: "appli mobile de transcription" },
];

const ACCENT = {
  blue: { ring: "focus:border-[#99BAF8] focus:ring-[#99BAF8]/20", chip: "border-[#99BAF8]/30 text-[#3a6fd4] bg-[#99BAF8]/8", icon: "text-[#3a6fd4] bg-[#99BAF8]/12" },
  violet: { ring: "focus:border-[#CCB8FF] focus:ring-[#CCB8FF]/20", chip: "border-[#CCB8FF]/30 text-[#6b4ec4] bg-[#CCB8FF]/8", icon: "text-[#6b4ec4] bg-[#CCB8FF]/12" },
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
          <Mic size={12} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Enregistrement & transcription</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        noa n&apos;enregistre pas encore l&apos;entretien. Avant de démarrer, enregistrez-le avec un outil externe qui propose une transcription automatique
        (informez le candidat au préalable), puis collez le texte obtenu ci-dessous : noa s&apos;en servira pour affiner la synthèse.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {TOOL_EXAMPLES.map((tool) => (
          <span key={tool.name} className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2.5 py-1 ${colors.chip}`}>
            <ExternalLink size={9} />
            {tool.name}
            <span className="text-gray-400 font-normal">· {tool.hint}</span>
          </span>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={value ? 6 : 3}
        placeholder="Collez ici la transcription générée par votre outil, une fois l'entretien terminé…"
        className={`w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 placeholder-gray-300 resize-none transition-colors ${colors.ring}`}
      />
    </Card>
  );
}
