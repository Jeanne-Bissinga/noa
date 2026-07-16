import { Mic, ExternalLink, Smartphone } from "lucide-react";
import { Card } from "@/components/noa/ui-primitives";

// noa n'enregistre pas encore l'entretien : le recruteur doit enregistrer
// lui-même (outil externe ou dictaphone natif du téléphone) avant de
// démarrer, puis coller la transcription obtenue une fois l'entretien terminé
// (cf. TranscriptCapture, affiché après le guide sur la page d'entretien).
const TOOL_EXAMPLES = [
  { name: "Otter.ai", hint: "dictaphone + transcription auto" },
  { name: "Fireflies.ai", hint: "rejoint Zoom / Meet / Teams" },
  { name: "tl;dv", hint: "transcription + résumé de visio" },
  { name: "Fathom", hint: "gratuit, transcription de visio" },
  { name: "Notta", hint: "appli mobile de transcription" },
];

const ACCENT = {
  blue: { chip: "border-[#99BAF8]/30 text-[#3a6fd4] bg-[#99BAF8]/8", icon: "text-[#3a6fd4] bg-[#99BAF8]/12" },
  violet: { chip: "border-[#CCB8FF]/30 text-[#6b4ec4] bg-[#CCB8FF]/8", icon: "text-[#6b4ec4] bg-[#CCB8FF]/12" },
};

export function RecordingGuidance({ accent = "blue" }: { accent?: "blue" | "violet" }) {
  const colors = ACCENT[accent];

  return (
    <Card className="p-4 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
          <Mic size={12} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Avant de démarrer : enregistrez l'entretien</p>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3">
        noa n&apos;enregistre pas encore l&apos;entretien lui-même. Enregistrez-le avec un outil externe qui propose une transcription automatique
        (informez le candidat au préalable) — vous collerez le texte obtenu à la fin de l&apos;entretien, une fois la grille consultée.
      </p>

      <div className="flex items-start gap-2 mb-3 bg-gray-50 rounded-xl px-3 py-2.5">
        <Smartphone size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Le plus simple : le dictaphone natif de votre téléphone (Dictaphone sur iPhone, Enregistreur vocal sur Android), si disponible sur votre appareil.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TOOL_EXAMPLES.map((tool) => (
          <span key={tool.name} className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2.5 py-1 ${colors.chip}`}>
            <ExternalLink size={9} />
            {tool.name}
            <span className="text-gray-400 font-normal">· {tool.hint}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}
