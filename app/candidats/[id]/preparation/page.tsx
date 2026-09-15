import { notFound } from "next/navigation";
import { parseRecruitmentInterviewType } from "@/lib/noa/labels";
import { requireRecruiter, getCandidate, getInterview, getInterviewGuide } from "@/lib/noa/queries";
import { PREP_META } from "@/lib/noa/interview-content";
import { buildScreeningContext } from "../actions";
import { ensureInterviewBriefing } from "../preferences/briefing-actions";
import { getWorkPreferencesByCandidate } from "@/lib/noa/preferences/queries";
import { buildPreferenceContext } from "@/lib/noa/preferences/context";
import { buildCommunicationGuidance } from "@/lib/noa/preferences/communication";
import type { ConductAdviceItem } from "@/lib/noa/preferences/communication";
import type { PreferenceTopic } from "@/lib/noa/preferences/briefing";
import { PreparationView } from "./preparation-view";
import { PreferencesView } from "./preferences-view";

export default async function PreparationPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  const recruiter = await requireRecruiter();

  const candidate = await getCandidate(id);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    notFound();
  }

  // 404 plutôt qu'un repli silencieux sur « screening » : depuis que d'autres
  // types d'entretien existent, une valeur inconnue doit se voir.
  const stepType = parseRecruitmentInterviewType(step);
  if (!stepType) notFound();

  const interview = await getInterview(candidate.id, stepType);
  const guide = interview ? await getInterviewGuide(interview.id) : null;
  const meta = PREP_META[stepType];

  // Les préférences n'alimentent que l'entretien technique : le premier
  // entretien a lieu avant qu'elles soient demandées.
  //
  // Tout ce bloc est facultatif de bout en bout. Sans préférences complétées,
  // `guidance` et `topics` sont vides, aucune section n'est rendue, et la page
  // est exactement celle d'avant.
  let guidance: ConductAdviceItem[] = [];
  let topics: PreferenceTopic[] = [];
  if (stepType === "topgrading") {
    const preferences = await getWorkPreferencesByCandidate(candidate.id);
    guidance = buildCommunicationGuidance(buildPreferenceContext(preferences));
    if (preferences?.status === "completed") {
      const context = await buildScreeningContext(candidate, recruiter);
      topics = await ensureInterviewBriefing(candidate, recruiter, context);
    }
  }

  return (
    <PreparationView
      candidate={candidate}
      step={stepType}
      meta={meta}
      existingGuide={guide}
      preferences={
        guidance.length > 0 || topics.length > 0 ? (
          <PreferencesView firstName={candidate.first_name} guidance={guidance} topics={topics} />
        ) : null
      }
    />
  );
}
