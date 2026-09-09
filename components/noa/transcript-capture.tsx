"use client";

import { useEffect, useRef, useTransition } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/noa/ui-primitives";
import { ACCENT, type AccentName } from "@/lib/noa/interview-accent";

// Affiché après le guide d'entretien (cf. RecordingGuidance, affiché avant,
// qui porte le contrôle d'enregistrement) : le texte transcrit y apparaît
// automatiquement à la fin de l'enregistrement, et le recruteur peut aussi y
// coller une transcription obtenue autrement, ou corriger le texte.

export function TranscriptCapture({
  value, onChange, onPersist, accent = "blue",
}: {
  value: string;
  onChange: (value: string) => void;
  /**
   * Sauvegarde debouncée. Passée en prop plutôt qu'importée : un composant
   * partagé n'a pas à connaître la Server Action d'une route particulière, et
   * les entretiens d'intégration n'écrivent pas au même endroit que ceux du
   * recrutement.
   */
  onPersist?: (value: string) => void | Promise<unknown>;
  accent?: AccentName;
}) {
  const [, startTransition] = useTransition();
  // Une ref plutôt qu'une dépendance de l'effet : une fonction fléchée recréée
  // à chaque rendu relancerait le debounce en boucle. Mise à jour dans un
  // effet, pas pendant le rendu, que React interdit.
  const persistRef = useRef(onPersist);
  useEffect(() => {
    persistRef.current = onPersist;
  });
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
        await persistRef.current?.(value);
      });
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
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
        Le texte transcrit apparaît ici automatiquement une fois l&apos;enregistrement terminé. Vous pouvez aussi coller une transcription obtenue autrement, ou corriger le texte.
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
