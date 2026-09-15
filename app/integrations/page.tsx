import { requireRecruiter } from "@/lib/noa/queries";
import { getIntegrationsData } from "@/lib/noa/onboarding/queries";
import { getIntegrationOverview, type IntegrationOverview } from "@/lib/noa/onboarding/overview";
import { IntegrationsBoard, type IntegrationRow } from "./integrations-board";

// Vue de pilotage : toutes les personnes recrutées et où elles en sont.
//
// Six requêtes quel que soit le nombre de lignes (getIntegrationsData), puis
// une fonction pure par personne (getIntegrationOverview). Cette page ne
// décide de rien elle-même : elle assemble et transmet.
//
// Cliquer sur une ligne ouvre /integrations/[id] : une fois recrutée, la
// personne reste dans le contexte Intégrations, sidebar comprise.

export default async function IntegrationsPage() {
  const recruiter = await requireRecruiter();
  const data = await getIntegrationsData(recruiter.company_id);
  const now = new Date();

  const missionById = new Map(data.missions.map((m) => [m.id, m]));
  const onboardingByCandidate = new Map(data.onboardings.map((o) => [o.candidate_id, o]));
  const preferencesByOnboarding = new Map(data.preferences.map((p) => [p.onboarding_id, p]));

  const rows: IntegrationRow[] = data.candidates.map((candidate) => {
    const onboarding = onboardingByCandidate.get(candidate.id) ?? null;
    const overview: IntegrationOverview = getIntegrationOverview({
      candidate,
      onboarding,
      interviews: data.interviews.filter((i) => i.candidate_id === candidate.id),
      preparedInterviewIds: data.preparedInterviewIds,
      conclusions: data.conclusions,
      preferences: onboarding ? preferencesByOnboarding.get(onboarding.id) ?? null : null,
      now,
    });
    return {
      candidate,
      missionTitle: missionById.get(candidate.mission_id)?.title ?? null,
      overview,
    };
  });

  return <IntegrationsBoard rows={rows} />;
}
