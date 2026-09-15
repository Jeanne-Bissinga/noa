import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getMission, getMissionObjectives, getMissionSkills } from "@/lib/noa/queries";
import { buildPlan, flattenPlan } from "@/lib/noa/onboarding/plan";
import { getOnboardingByCandidate } from "@/lib/noa/onboarding/queries";
import { ERROR_MESSAGE, userError } from "@/lib/noa/errors";
import type { Candidate, Onboarding } from "@/lib/noa/types";

// Création de l'intégration en brouillon à partir de la campagne.
//
// Vit ici plutôt que dans une Server Action parce que deux appelants en ont
// besoin : la décision de recrutement (app/candidats/[id]/actions.ts, qui crée
// l'intégration dans la foulée du passage à « Recruté ») et l'action manuelle
// de rattrapage pour les personnes recrutées avant que ce soit automatique.
// Un fichier « use server » n'a pas à en importer un autre.
//
// Idempotente : une intégration déjà créée est simplement renvoyée. La
// contrainte unique sur candidate_id est le filet de sécurité si deux appels
// se croisent.

export type CreateDraftResult =
  | { ok: true; onboarding: Onboarding }
  | { ok: false; error: string };

export async function createDraftOnboarding(
  candidate: Candidate,
  managerId: string | null,
): Promise<CreateDraftResult> {
  const existing = await getOnboardingByCandidate(candidate.id);
  if (existing) return { ok: true, onboarding: existing };

  const supabase = await createClient();
  const mission = candidate.mission_id ? await getMission(candidate.mission_id) : null;
  const [objectives, skills] = await Promise.all([
    mission ? getMissionObjectives(mission.id) : Promise.resolve([]),
    mission ? getMissionSkills(mission.id) : Promise.resolve([]),
  ]);

  const { data: created, error } = await supabase
    .from("onboardings")
    .insert({
      company_id: candidate.company_id,
      candidate_id: candidate.id,
      mission_id: candidate.mission_id,
      manager_id: managerId,
      status: "brouillon",
      // Aucune date d'arrivée : c'est au manager de la fixer, et la fiche
      // affiche « À définir » d'ici là. La poser à aujourd'hui ferait démarrer
      // le compte des 90 jours au moment du recrutement, pas de l'arrivée.
      start_date: null,
      mission_text: mission?.mission_text ?? null,
    })
    .select("*")
    .single();

  if (error || !created) {
    // Course entre deux appels : l'autre a gagné, son résultat fait foi.
    const raced = await getOnboardingByCandidate(candidate.id);
    if (raced) return { ok: true, onboarding: raced };
    return { ok: false, error: userError("createDraftOnboarding", error, ERROR_MESSAGE.preparation) };
  }

  const onboarding = created as Onboarding;
  const goals = flattenPlan(buildPlan(objectives, skills));

  if (goals.length > 0) {
    const { error: goalsError } = await supabase.from("onboarding_goals").insert(
      goals.map((g) => ({
        onboarding_id: onboarding.id,
        mission_objective_id: g.missionObjectiveId,
        phase: g.phase,
        label: g.label,
        kind: g.kind,
        metric: g.metric,
        target_value: g.targetValue,
        position: g.position,
      })),
    );
    if (goalsError) return { ok: false, error: userError("createDraftOnboarding.goals", goalsError, ERROR_MESSAGE.preparation) };
  }

  return { ok: true, onboarding };
}
