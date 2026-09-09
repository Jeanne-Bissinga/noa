import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getMission } from "@/lib/noa/queries";
import { getOnboardingBundle } from "@/lib/noa/onboarding/queries";
import { PlanEditor } from "./plan-editor";

// Plan 30-60-90 : lecture d'abord, modification à la demande, puis validation.
//
// Sous-route de la fiche d'intégration plutôt qu'un état de celle-ci : le plan
// se relit et se partage par son URL, et la fiche reste centrée sur ce qu'il y
// a à faire aujourd'hui.

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const bundle = await getOnboardingBundle(candidate.id);
  // Pas encore d'intégration : le plan n'existe pas, la fiche propose de le
  // créer. On y renvoie plutôt que d'afficher une page vide.
  if (!bundle) notFound();

  const mission = candidate.mission_id ? await getMission(candidate.mission_id) : null;

  return (
    <PlanEditor
      candidateId={candidate.id}
      candidateName={`${candidate.first_name} ${candidate.last_name}`}
      firstName={candidate.first_name}
      onboarding={bundle.onboarding}
      goals={bundle.goals}
      preferencesCompleted={bundle.preferences?.status === "completed"}
      missionTitle={mission?.title ?? null}
    />
  );
}
