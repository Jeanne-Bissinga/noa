// Profil DISC : lecture et affichage.
//
// Noa n'administre aucun test DISC. Un profil arrive soit par déclaration du
// collaborateur (onboarding_work_preferences, assessment_type 'disc'), soit
// depuis les colonnes historiques disc_primary / disc_secondary de
// onboardings, conservées en lecture seule pour les intégrations créées avant
// les préférences de travail.
//
// Il ne sert qu'à contextualiser : le texte d'aide sous une question de suivi
// et la formulation d'une suggestion faite au manager
// (lib/noa/preferences/context.ts). Il ne modifie jamais une question
// principale, un objectif ni un critère.
import type { DiscProfile } from "@/lib/noa/types";

export const DISC_PROFILES: DiscProfile[] = ["D", "I", "S", "C"];

export const DISC_LABEL: Record<DiscProfile, string> = {
  D: "Dominant",
  I: "Influent",
  S: "Stable",
  C: "Conforme",
};

export function isDiscProfile(value: unknown): value is DiscProfile {
  return typeof value === "string" && (DISC_PROFILES as string[]).includes(value);
}

/** Libellé court affiché au manager, ex. « C/S ». */
export function formatDisc(primary: DiscProfile | null, secondary: DiscProfile | null): string | null {
  if (!primary) return null;
  return secondary ? `${primary}/${secondary}` : primary;
}
