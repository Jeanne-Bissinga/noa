import { notFound } from "next/navigation";
import {
  requireRecruiter, getCandidate, getInterview, getInterviewGuide, getEvaluationGrid,
  getMission, getMissionObjectives, getSyntheses,
} from "@/lib/noa/queries";
import {
  getOnboardingByCandidate, getOnboardingGoals, getWorkPreferences,
  getIntegrationInterviews, getOnboardingActions, getInterviewConclusions,
} from "@/lib/noa/onboarding/queries";
import { buildPreferenceContext } from "@/lib/noa/onboarding/personalization";
import { buildIntegrationGuide } from "@/lib/noa/onboarding/interview-questions";
import { parseIntegrationCriteria } from "@/lib/noa/onboarding/interview-content";
import { interviewPhaseOf } from "@/lib/noa/onboarding/interview-phase";
import { previousDigest, openActions } from "@/lib/noa/onboarding/interview-history";
import { InterviewScreen } from "./interview-screen";
import type { IntegrationInterviewType } from "@/lib/noa/types";

// Corps partagé des quatre routes d'entretien.
//
// Une route par jalon plutôt qu'un segment dynamique : le jalon est porté par
// le dossier, donc une faute de frappe est une erreur de compilation et non un
// 404 à l'exécution, et les URL restent celles que le manager lit.
//
// Trois états, pilotés par les données et non par la navigation : préparation
// tant qu'aucun guide n'existe, conduite ensuite, restitution une fois
// l'entretien mené. Rien à mémoriser côté client.

export async function MilestonePage({
  params,
  milestone,
}: {
  params: Promise<{ id: string }>;
  milestone: IntegrationInterviewType;
}) {
  const { id } = await params;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) notFound();

  const onboarding = await getOnboardingByCandidate(candidate.id);
  // Sans plan validé, il n'y a pas encore de calendrier : la fiche l'explique.
  if (!onboarding || onboarding.status === "brouillon") notFound();

  const interview = await getInterview(candidate.id, milestone);
  const guide = interview ? await getInterviewGuide(interview.id) : null;
  const hasGuide = Boolean(guide && Array.isArray(guide.topics) && guide.topics.length > 0);
  const phase = interviewPhaseOf(interview, hasGuide);

  const [preferences, goals, mission, allInterviews, actions] = await Promise.all([
    getWorkPreferences(onboarding.id),
    getOnboardingGoals(onboarding.id),
    candidate.mission_id ? getMission(candidate.mission_id) : Promise.resolve(null),
    getIntegrationInterviews(candidate.id),
    getOnboardingActions(onboarding.id),
  ]);

  const [conclusions, syntheses, objectives] = await Promise.all([
    getInterviewConclusions(allInterviews.map((i) => i.id)),
    getSyntheses(candidate.id),
    mission ? getMissionObjectives(mission.id) : Promise.resolve([]),
  ]);

  const context = buildPreferenceContext(onboarding, preferences);
  const history = { interviews: allInterviews, syntheses, conclusions, actions };

  // Le guide affiché : celui figé à la préparation, ou la proposition tant que
  // rien n'est figé — le manager voit ce qu'il s'apprête à valider.
  const grid = interview ? await getEvaluationGrid(interview.id) : null;
  const criteria = parseIntegrationCriteria(grid?.criteria);
  const sections = criteria?.sections ?? buildIntegrationGuide(milestone, context);

  return (
    <InterviewScreen
      candidate={candidate}
      milestone={milestone}
      phase={phase}
      missionTitle={mission?.title ?? null}
      missionText={onboarding.mission_text ?? mission?.mission_text ?? null}
      sections={sections}
      answers={(grid?.answers ?? {}) as Record<string, string>}
      transcript={interview?.transcript ?? null}
      scheduledAt={interview?.scheduled_at ?? null}
      goals={goals}
      objectives={objectives}
      context={context}
      previous={previousDigest(history, milestone)}
      openActions={openActions(history)}
      ownActions={actions.filter((a) => a.source_interview_id === interview?.id)}
      synthesis={syntheses.find((s) => s.interview_id === interview?.id) ?? null}
      conclusion={conclusions.find((c) => c.interview_id === interview?.id) ?? null}
    />
  );
}
