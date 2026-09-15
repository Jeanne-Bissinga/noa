import "server-only";
import type { OnboardingWorkPreferences } from "@/lib/noa/types";
import { createClient } from "@/lib/supabase/server";

// Lecture des préférences côté recruteur.
//
// Client de session, donc RLS : un recruteur ne voit que les candidats de son
// entreprise. Le client service_role n'intervient nulle part ici — il est
// réservé à la résolution du lien public, où il n'y a aucune session à laquelle
// appliquer une policy (cf. preferences/tokens.ts).
//
// `server-only` : ce module ouvre une connexion base. Les libellés d'étape
// vivent à côté, dans status.ts, pour rester importables par un composant
// client.

export async function getWorkPreferencesByCandidate(
  candidateId: string,
): Promise<OnboardingWorkPreferences | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_work_preferences")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return data as OnboardingWorkPreferences | null;
}
