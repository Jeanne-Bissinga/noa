import type { InterviewType } from "@/lib/noa/types";

// Couleur d'accent d'un entretien.
//
// La table vivait en double, à deux entrées, recopiée dans l'enregistreur et
// dans la zone de transcription — elles auraient divergé au premier ajout.
//
// Les classes sont écrites en toutes lettres : Tailwind ne génère que ce qu'il
// lit dans les sources, une classe assemblée par concaténation ne sortirait
// jamais du build.

export type AccentName = "blue" | "violet" | "green";

export const ACCENT: Record<AccentName, { icon: string; ring: string; dot: string }> = {
  blue: {
    icon: "bg-[#99BAF8]/15 text-[#3a6fd4]",
    ring: "focus:ring-[#99BAF8]/40 focus:border-[#99BAF8]",
    dot: "bg-[#99BAF8]",
  },
  violet: {
    icon: "bg-[#CCB8FF]/20 text-[#6b4ec4]",
    ring: "focus:ring-[#CCB8FF]/40 focus:border-[#CCB8FF]",
    dot: "bg-[#CCB8FF]",
  },
  green: {
    icon: "bg-[#75DA9F]/15 text-[#1e8f52]",
    ring: "focus:ring-[#75DA9F]/40 focus:border-[#75DA9F]",
    dot: "bg-[#75DA9F]",
  },
};

/**
 * Table exhaustive, à l'image de STATUS_OF_STEP : ajouter un type d'entretien
 * sans lui choisir d'accent devient une erreur de compilation, plutôt qu'un
 * `undefined` qui casse le rendu à l'exécution.
 */
export const ACCENT_OF_TYPE: Record<InterviewType, AccentName> = {
  screening: "blue",
  topgrading: "violet",
  integration_j1: "green",
  integration_j30: "green",
  integration_j60: "green",
  integration_j90: "green",
};
