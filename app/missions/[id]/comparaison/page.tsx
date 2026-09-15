import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Check, Minus, Sparkles, Clock } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, BackLink, Avatar, LinkBtn } from "@/components/noa/ui-primitives";
import {
  requireRecruiter, getMission, getMissionSkills, getCandidates,
  getInterviewsForCandidates, getSynthesesForCandidates, getCandidateSkillsForCandidates,
  getDecisionsForCandidates, getRecruitersByIds,
} from "@/lib/noa/queries";
import {
  CANDIDATE_STATUS_LABEL, CANDIDATE_BADGE, CANDIDATE_AVATAR_COLOR, formatDate, initials,
  DECISION_STAGE_LABEL, DECISION_STATUS_LABEL, DECISION_STATUS_COLOR,
} from "@/lib/noa/labels";
import type { Candidate, CandidateSkill, MissionSkillCategory, Synthesis } from "@/lib/noa/types";

const SKILL_CATEGORY_LABEL: Record<MissionSkillCategory, string> = {
  technique: "Techniques",
  relationnelle: "Relationnelles (soft skills)",
  comportementale: "Savoir-être & valeurs",
};

/**
 * Rapprochement texte libre entre le nom d'une compétence attendue (fiche de
 * mission) et les compétences déclarées d'un candidat (CV). Pas de
 * référentiel commun entre les deux tables : une correspondance approchée
 * (sous-chaîne, insensible à la casse/accents) reste plus utile qu'une
 * absence de rapprochement, tant qu'elle est présentée comme indicative.
 */
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function candidateCoversSkill(candidateSkills: CandidateSkill[], skillName: string): boolean {
  const target = normalize(skillName);
  return candidateSkills.some((s) => {
    const cand = normalize(s.name);
    return cand.length > 0 && (target.includes(cand) || cand.includes(target));
  });
}

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

  const recruiters = await getRecruitersByIds(decisions.map((d) => d.decided_by).filter((v): v is string => !!v));
  const recruiterName = (recruiterId: string | null) => {
    if (!recruiterId) return "—";
    const r = recruiters.find((r) => r.id === recruiterId);
    return r ? `${r.first_name} ${r.last_name}` : "Recruteur";
  };

  const skillsByCategory = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[])
    .map((category) => ({ category, items: missionSkills.filter((s) => s.category === category) }));

  const noaSynthesis = (candidateId: string, interviewId: string | undefined | null): Synthesis | null =>
    syntheses.find((s) => s.candidate_id === candidateId && s.interview_id === (interviewId ?? null) && s.authored_by === "noa") ?? null;

  const perCandidate = candidates.map((c) => {
    const screeningInterview = interviews.find((i) => i.candidate_id === c.id && i.type === "screening");
    const topgradingInterview = interviews.find((i) => i.candidate_id === c.id && i.type === "topgrading");
    return {
      candidate: c,
      skills: candidateSkills.filter((s) => s.candidate_id === c.id),
      screeningSynthesis: noaSynthesis(c.id, screeningInterview?.id),
      topgradingSynthesis: noaSynthesis(c.id, topgradingInterview?.id),
      globalRecommendation: noaSynthesis(c.id, null),
      decisions: decisions.filter((d) => d.candidate_id === c.id),
    };
  });

  const gridCols = { gridTemplateColumns: `220px repeat(${Math.max(candidates.length, 1)}, minmax(200px, 1fr))` };

  return (
    <AppLayout headerTitle={`Comparaison — ${mission.title}`}>
      <div className="max-w-6xl mx-auto">
        <BackLink href={`/missions/${mission.id}`} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Comparer les candidats
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Synthèse comparable sur l&apos;ensemble des critères — techniques, soft skills, valeurs — et historique
            centralisé des décisions pour {mission.title}.
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
          <div className="flex flex-col gap-6">
            {candidates.length === 1 && (
              <Card className="p-4 text-xs text-gray-500">
                Un seul candidat sur cette mission pour l&apos;instant. Ajoutez-en un second pour une vraie comparaison.
              </Card>
            )}

            {/* En-tête candidats */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="grid gap-3 min-w-[720px]" style={gridCols}>
                <div />
                {perCandidate.map(({ candidate: c }) => (
                  <Link key={c.id} href={`/candidats/${c.id}`} className="group">
                    <Card className="p-4 hover:border-[#99BAF8]/40 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2.5 mb-2">
                        <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"} size="sm" />
                        <span className="text-sm font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight">
                          {c.first_name} {c.last_name}
                        </span>
                      </div>
                      <Badge color={CANDIDATE_BADGE[c.status]}>{CANDIDATE_STATUS_LABEL[c.status]}</Badge>
                      {c.score !== null ? (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-[#99BAF8]" style={{ width: `${c.score}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 tabular-nums">{c.score}/100</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-300 mt-3">Pas encore noté</p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Compétences attendues, techniques / soft skills / valeurs */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Compétences attendues — techniques, soft skills, valeurs
              </p>
              <Card className="p-4 overflow-x-auto">
                <div className="min-w-[720px]">
                  {skillsByCategory.map((block) => (
                    <div key={block.category} className="mb-4 last:mb-0">
                      <div className="text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block bg-gray-100 text-gray-500">
                        {SKILL_CATEGORY_LABEL[block.category]}
                      </div>
                      {block.items.length === 0 ? (
                        <p className="text-xs text-gray-300 pl-1">Aucun critère défini pour cette catégorie.</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {block.items.map((skill) => (
                            <div key={skill.id} className="grid gap-3" style={gridCols}>
                              <span className="text-xs text-gray-600 py-1.5 pr-2 truncate" title={skill.justification ?? undefined}>
                                {skill.name}
                              </span>
                              {perCandidate.map(({ candidate: c, skills }) => (
                                <div key={c.id} className="flex items-center py-1.5">
                                  {candidateCoversSkill(skills, skill.name) ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1e8f52]">
                                      <Check size={12} /> Couvert
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
                                      <Minus size={12} /> —
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Synthèses par étape */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Synthèses par étape</p>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="grid gap-3 min-w-[720px]" style={gridCols}>
                  <div className="flex items-center text-xs font-semibold text-gray-500">Premier entretien</div>
                  {perCandidate.map(({ candidate: c, screeningSynthesis }) => (
                    <Card key={c.id} className="p-3">
                      {screeningSynthesis?.advice ? (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{screeningSynthesis.advice}</p>
                      ) : (
                        <p className="text-xs text-gray-300">Pas encore de synthèse.</p>
                      )}
                    </Card>
                  ))}

                  <div className="flex items-center text-xs font-semibold text-gray-500">Entretien technique</div>
                  {perCandidate.map(({ candidate: c, topgradingSynthesis }) => (
                    <Card key={c.id} className="p-3">
                      {topgradingSynthesis?.advice ? (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{topgradingSynthesis.advice}</p>
                      ) : (
                        <p className="text-xs text-gray-300">Pas encore de synthèse.</p>
                      )}
                    </Card>
                  ))}

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Sparkles size={12} className="text-[#3a6fd4]" /> Suggestion de noa
                  </div>
                  {perCandidate.map(({ candidate: c, globalRecommendation }) => (
                    <Card key={c.id} className="p-3 border-[#99BAF8]/25">
                      {globalRecommendation?.content ? (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{globalRecommendation.content}</p>
                      ) : (
                        <p className="text-xs text-gray-300">Pas encore de suggestion.</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Historique centralisé des décisions */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Historique centralisé des décisions
              </p>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="grid gap-3 min-w-[720px] items-start" style={gridCols}>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Clock size={12} /> Décisions tracées
                  </div>
                  {perCandidate.map(({ candidate: c, decisions: candidateDecisions }) => (
                    <Card key={c.id} className="p-3">
                      {candidateDecisions.length === 0 ? (
                        <p className="text-xs text-gray-300">Aucune décision prise pour le moment.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {candidateDecisions.map((d) => (
                            <div key={d.id} className="text-xs">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Badge color={DECISION_STATUS_COLOR[d.status]}>{DECISION_STATUS_LABEL[d.status]}</Badge>
                                <span className="text-[10px] text-gray-400">{DECISION_STAGE_LABEL[d.stage]}</span>
                              </div>
                              <p className="text-[10px] text-gray-400">
                                {formatDate(d.decided_at)} · {recruiterName(d.decided_by)}
                              </p>
                              {d.reason && <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{d.reason}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Décision finale */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Décision</p>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="grid gap-3 min-w-[720px]" style={gridCols}>
                  <div />
                  {perCandidate.map(({ candidate: c }) => (
                    <div key={c.id}>
                      {c.status === "Recrute" || c.status === "Non retenu" ? (
                        <Badge color={CANDIDATE_BADGE[c.status]}>{CANDIDATE_STATUS_LABEL[c.status]}</Badge>
                      ) : (
                        <LinkBtn href={`/candidats/${c.id}/decision-finale`} variant="secondary" size="sm">
                          Décider
                        </LinkBtn>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
