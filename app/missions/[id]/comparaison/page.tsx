import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, BackLink } from "@/components/noa/ui-primitives";
import {
  requireRecruiter, getMission, getMissionSkills, getCandidates,
  getInterviewsForCandidates, getSynthesesForCandidates, getCandidateSkillsForCandidates,
  getDecisionsForCandidates, getRecruitersByIds, getEvaluationGridsForInterviews,
} from "@/lib/noa/queries";
import { candidateCoversSkill, validatedSkillIds } from "@/lib/noa/skill-match";
import { formatDate, initials } from "@/lib/noa/labels";
import type { MissionSkillCategory, Synthesis } from "@/lib/noa/types";
import { ComparisonBoard } from "./comparison-board";
import type { ComparisonCandidate, ComparisonSkillBlock } from "./comparison-board";

const SKILL_CATEGORY_LABEL: Record<MissionSkillCategory, string> = {
  technique: "Techniques",
  relationnelle: "Relationnelles (soft skills)",
  comportementale: "Savoir-être & valeurs",
};

export default async function MissionComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();
  const companyId = recruiter.company_id;

  const mission = await getMission(id);
  if (!mission || mission.company_id !== companyId) {
    notFound();
  }

  const [missionSkills, candidates] = await Promise.all([
    getMissionSkills(mission.id),
    getCandidates(companyId, { missionId: mission.id }),
  ]);

  const candidateIds = candidates.map((c) => c.id);
  const [interviews, syntheses, candidateSkills, decisions] = await Promise.all([
    getInterviewsForCandidates(candidateIds),
    getSynthesesForCandidates(candidateIds),
    getCandidateSkillsForCandidates(candidateIds),
    getDecisionsForCandidates(candidateIds),
  ]);
  // Les deux grilles notées, jamais celle d'un entretien d'intégration : elle
  // n'entre pas dans l'évaluation d'un recrutement.
  const gradedInterviews = interviews.filter((i) => i.type === "screening" || i.type === "topgrading");
  const evaluationGrids = await getEvaluationGridsForInterviews(gradedInterviews.map((i) => i.id));

  const recruiters = await getRecruitersByIds(decisions.map((d) => d.decided_by).filter((v): v is string => !!v));
  // null quand la décision n'a pas d'auteur connu : la phrase affichée s'arrête
  // alors à la date, plutôt que de nommer un auteur vide.
  const recruiterName = (recruiterId: string | null): string | null => {
    if (!recruiterId) return null;
    const r = recruiters.find((r) => r.id === recruiterId);
    return r ? `${r.first_name} ${r.last_name}` : "un membre de l'équipe";
  };

  const skillBlocks: ComparisonSkillBlock[] = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[])
    .map((category) => ({
      category,
      label: SKILL_CATEGORY_LABEL[category],
      items: missionSkills
        .filter((s) => s.category === category)
        .map((s) => ({ id: s.id, name: s.name, justification: s.justification })),
    }))
    .filter((block) => block.items.length > 0);

  const noaSynthesis = (candidateId: string, interviewId: string | undefined | null): Synthesis | null =>
    syntheses.find((s) => s.candidate_id === candidateId && s.interview_id === (interviewId ?? null) && s.authored_by === "noa") ?? null;

  const boardCandidates: ComparisonCandidate[] = candidates.map((c) => {
    const screeningInterview = interviews.find((i) => i.candidate_id === c.id && i.type === "screening");
    const topgradingInterview = interviews.find((i) => i.candidate_id === c.id && i.type === "topgrading");
    const skills = candidateSkills.filter((s) => s.candidate_id === c.id);
    const screeningGrid = evaluationGrids.find((g) => g.interview_id === screeningInterview?.id);
    const topgradingGrid = evaluationGrids.find((g) => g.interview_id === topgradingInterview?.id);
    return {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      initials: initials(c.first_name, c.last_name),
      status: c.status,
      score: c.score,
      coveredSkillIds: missionSkills.filter((s) => candidateCoversSkill(skills, s.name)).map((s) => s.id),
      screeningValidatedSkillIds: [...validatedSkillIds(screeningGrid, missionSkills)],
      topgradingValidatedSkillIds: [...validatedSkillIds(topgradingGrid, missionSkills)],
      screeningAdvice: noaSynthesis(c.id, screeningInterview?.id)?.advice ?? null,
      topgradingAdvice: noaSynthesis(c.id, topgradingInterview?.id)?.advice ?? null,
      noaOverview: noaSynthesis(c.id, null)?.content ?? null,
      decisions: decisions
        .filter((d) => d.candidate_id === c.id)
        .map((d) => ({
          id: d.id,
          status: d.status,
          stage: d.stage,
          date: formatDate(d.decided_at),
          author: recruiterName(d.decided_by),
          reason: d.reason,
        })),
    };
  });

  return (
    <AppLayout headerTitle={`Comparaison des candidats, ${mission.title}`}>
      <div className="max-w-6xl mx-auto">
        <BackLink href={`/missions/${mission.id}`} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Comparer les candidats
          </h1>
          {/* Phrase construite en chaîne, pas en texte JSX : sur deux lignes de
              source, le reflux mangeait l'espace juste après {mission.title}
              et affichait « Développeur IAa sa fiche ». */}
          <p className="text-sm text-gray-400 mt-1 max-w-3xl leading-relaxed">
            {`Une fiche par candidat au poste de ${mission.title}, avec les mêmes compétences attendues, les mêmes étapes d'entretien et les mêmes décisions déjà prises.`}
          </p>
        </div>

        {candidates.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
              <Users size={18} />
            </div>
            <p className="text-sm font-semibold text-[#010101]">Aucun candidat pour le moment</p>
            <p className="text-xs text-gray-400">Ajoutez au moins deux candidats pour pouvoir les comparer.</p>
          </Card>
        ) : (
          <>
            {candidates.length === 1 && (
              <Card className="p-4 mb-4 text-xs text-gray-500">
                Un seul candidat sur cette campagne pour l&apos;instant. Ajoutez-en un second pour pouvoir
                les comparer.
              </Card>
            )}
            <ComparisonBoard
              candidates={boardCandidates}
              skillBlocks={skillBlocks}
              totalSkills={missionSkills.length}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
