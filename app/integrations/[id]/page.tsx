import { notFound } from "next/navigation";
import { requireRecruiter, getCandidate, getMission, getInterviewGuide } from "@/lib/noa/queries";
import { getOnboardingBundle } from "@/lib/noa/onboarding/queries";
import { getIntegrationOverview, requiresManagerAction } from "@/lib/noa/onboarding/overview";
import { buildPreferenceContext } from "@/lib/noa/onboarding/personalization";
import { buildTimeline } from "@/lib/noa/onboarding/timeline";
import { IntegrationDetail } from "./integration-view";

// Fiche d'un plan d'onboarding, dans la section Plans d'onboarding.
//
// Elle existe dès que la personne est recrutée — il n'y a pas d'écran
// intermédiaire à traverser. Tout le vocabulaire d'état vient de
// getIntegrationOverview, la même fonction que la liste : les deux écrans ne
// peuvent pas diverger.

export default async function IntegrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  const bundle = await getOnboardingBundle(candidate.id);
  const now = new Date();
  const interviews = bundle?.interviews ?? [];

  // Un entretien est « préparé » dès qu'il a un guide : c'est ce qui distingue
  // « Préparer l'entretien » de « Réaliser l'entretien ».
  const guides = await Promise.all(interviews.map((i) => getInterviewGuide(i.id)));
  const preparedInterviewIds = interviews.filter((_, i) => guides[i] !== null).map((i) => i.id);

  const overview = getIntegrationOverview({
    candidate,
    onboarding: bundle?.onboarding ?? null,
    interviews,
    preparedInterviewIds,
    conclusions: bundle?.conclusions ?? [],
    preferences: bundle?.preferences ?? null,
    now,
  });

  const timeline = buildTimeline({
    arrivalDate: overview.startDate,
    interviews,
    // Un préparatif reste à mener tant que l'action principale en réclame un
    // qui ne soit pas un entretien.
    beforeArrivalPending:
      requiresManagerAction(overview.primaryNextAction) && overview.primaryNextAction.interviewId === null,
    now,
  });

  const context = buildPreferenceContext(bundle?.onboarding ?? null, bundle?.preferences ?? null);
  const mission = candidate.mission_id ? await getMission(candidate.mission_id) : null;

  return (
    <IntegrationDetail
      candidate={candidate}
      missionTitle={mission?.title ?? null}
      overview={overview}
      timeline={timeline}
      goals={bundle?.goals ?? []}
      conclusions={bundle?.conclusions ?? []}
      preparedInterviewIds={preparedInterviewIds}
      preferences={bundle?.preferences ?? null}
      context={context}
    />
  );
}
