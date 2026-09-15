import type { OnboardingWorkPreferences } from "@/lib/noa/types";

// Les trois états de l'étape, côté manager.
//
// Module pur, séparé de queries.ts pour une raison précise : la carte d'étape
// est un composant client, et importer le libellé depuis le module qui ouvre
// une connexion Supabase serveur ferait entrer `lib/supabase/server` dans le
// bundle du navigateur. Le build le refuse, à juste titre.

export type WorkPreferencesStepStatus = "non_invite" | "invite" | "complete";

export function stepStatusOf(
  preferences: Pick<OnboardingWorkPreferences, "status"> | null,
): WorkPreferencesStepStatus {
  if (!preferences) return "non_invite";
  return preferences.status === "completed" ? "complete" : "invite";
}

export const STEP_STATUS_LABEL: Record<WorkPreferencesStepStatus, string> = {
  non_invite: "Non invité",
  invite: "Invitation envoyée",
  complete: "Complétées",
};
