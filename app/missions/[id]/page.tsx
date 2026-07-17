import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Plus, FileText, Check, Target, Award } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, LinkBtn, BackLink, Avatar } from "@/components/noa/ui-primitives";
import {
  requireRecruiter, getMission, getMissionObjectives, getMissionSkills, getCandidates, getInterviewsForCandidates,
} from "@/lib/noa/queries";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_COLOR, REASON_LABEL, formatDate, initials,
  CANDIDATE_AVATAR_COLOR, SUB_STEP_LABEL, subStepFor,
} from "@/lib/noa/labels";
import type { CandidateStatus, MissionSkillCategory } from "@/lib/noa/types";
import { MissionActions } from "./mission-actions";

const PROCESS_STEPS = ["Cadrage", "Screening", "Topgrading", "Décision"];

const ProcessFrise = ({ active }: { active: number }) => (
  <div className="flex items-center gap-0">
    {PROCESS_STEPS.map((step, i) => {
      const done = i < active;
      const current = i === active;
      return (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              done ? "bg-[#75DA9F] text-white" : current ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-400"
            }`}>
              {done ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${
              current ? "text-[#010101]" : done ? "text-[#1e8f52]" : "text-gray-400"
            }`}>
              {step}
            </span>
          </div>
          {i < PROCESS_STEPS.length - 1 && (
            <div className={`h-px w-12 mx-1 mb-5 flex-shrink-0 transition-all ${done ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
          )}
        </div>
      );
    })}
  </div>
);

const KANBAN_COLS: { key: CandidateStatus; label: string; color: string; dot: string }[] = [
  { key: "Screening", label: "Screening", color: "border-[#99BAF8]/40 bg-[#99BAF8]/4", dot: "bg-[#99BAF8]" },
  { key: "Topgrading", label: "Topgrading", color: "border-[#CCB8FF]/40 bg-[#CCB8FF]/4", dot: "bg-[#CCB8FF]" },
  { key: "Decision finale", label: "Décision finale", color: "border-[#75DA9F]/40 bg-[#75DA9F]/4", dot: "bg-[#75DA9F]" },
  { key: "Non retenu", label: "Non retenu", color: "border-gray-200 bg-gray-50", dot: "bg-gray-300" },
];

const SKILL_CATEGORY_LABEL: Record<MissionSkillCategory, string> = {
  technique: "Techniques",
  relationnelle: "Relationnelles",
  comportementale: "Comportementales",
};

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recruiter = await requireRecruiter();
  const companyId = recruiter.company_id;

  const mission = await getMission(id);
  if (!mission || mission.company_id !== companyId) {
    notFound();
  }

  const [objectives, skills, allCandidates] = await Promise.all([
    getMissionObjectives(mission.id),
    getMissionSkills(mission.id),
    getCandidates(companyId, { missionId: mission.id }),
  ]);
  const interviews = await getInterviewsForCandidates(allCandidates.map((c) => c.id));
  const interviewByCandidate = new Map(interviews.map((i) => [`${i.candidate_id}-${i.type}`, i]));

  const skillsByCategory = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[])
    .map((category) => ({ category, items: skills.filter((s) => s.category === category) }));

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-5xl mx-auto">
        <BackLink href="/missions" />

        {/* Titre + statut */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {mission.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={MISSION_STATUS_COLOR[mission.status]}>{MISSION_STATUS_LABEL[mission.status]}</Badge>
              <span className="text-xs text-gray-400">
                {mission.reason ? REASON_LABEL[mission.reason] ?? mission.reason : "-"} · Créée le {formatDate(mission.created_at)}
              </span>
            </div>
          </div>
          <MissionActions missionId={mission.id} missionTitle={mission.title} status={mission.status} candidateCount={allCandidates.length} />
        </div>

        {/* Avancement */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Avancement du recrutement</p>
          <ProcessFrise active={mission.process_step} />
        </Card>

        {/* Fiche de poste — même structure que /fiche-finale : une carte par
            section plutôt qu'une grille dense, plus lisible. */}
        <div className="flex flex-col gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#99BAF8]/12">
                  <FileText size={12} className="text-[#3a6fd4]" />
                </div>
                <h3 className="font-semibold text-[#010101] text-sm">Mission</h3>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/resume`} className="text-xs font-semibold text-[#3a6fd4] hover:text-[#2a5cb8] transition-colors">
                Modifier
              </Link>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{mission.mission_text || "Aucune mission rédigée pour le moment."}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#75DA9F]/12">
                  <Target size={12} className="text-[#1e8f52]" />
                </div>
                <h3 className="font-semibold text-[#010101] text-sm">Résultats attendus</h3>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/resultats`} className="text-xs font-semibold text-[#3a6fd4] hover:text-[#2a5cb8] transition-colors">
                Modifier
              </Link>
            </div>
            {objectives.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun objectif défini.</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="text-left pb-2 pl-1 pr-2 w-6">#</th>
                      <th className="text-left pb-2 pr-3">KPI</th>
                      <th className="text-left pb-2 pr-3">Métrique</th>
                      <th className="text-left pb-2 pr-3">Seuil de réussite</th>
                      <th className="text-left pb-2 pr-1">Délai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {objectives.map((o, i) => (
                      <tr key={o.id} className="align-top">
                        <td className="py-2.5 pl-1 pr-2 text-gray-300 text-xs font-bold">{i + 1}</td>
                        <td className="py-2.5 pr-3 text-sm text-[#010101] font-medium leading-snug">{o.label}</td>
                        <td className="py-2.5 pr-3 text-xs text-gray-500 leading-snug">{o.metric || "-"}</td>
                        <td className="py-2.5 pr-3 text-xs text-gray-600 font-medium leading-snug">{o.threshold || "-"}</td>
                        <td className="py-2.5 pr-1 whitespace-nowrap">
                          {o.deadline ? <Badge color="green">{o.deadline}</Badge> : <span className="text-xs text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#CCB8FF]/12">
                  <Award size={12} className="text-[#6b4ec4]" />
                </div>
                <h3 className="font-semibold text-[#010101] text-sm">Compétences</h3>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/competences`} className="text-xs font-semibold text-[#3a6fd4] hover:text-[#2a5cb8] transition-colors">
                Modifier
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {skillsByCategory.map((block) => (
                <div key={block.category}>
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block bg-gray-100 text-gray-500">{SKILL_CATEGORY_LABEL[block.category]}</div>
                  {block.items.length === 0 ? (
                    <p className="text-xs text-gray-300">-</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {block.items.map((s) => (
                        <li key={s.id} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-1 leading-none">·</span>
                          {s.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Kanban candidats */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              Candidats
              <span className="ml-2 text-sm font-normal text-gray-400">{allCandidates.length}</span>
            </h2>
            <LinkBtn href={`/candidats/nouveau?mission=${mission.id}`} variant="primary" size="sm"><Plus size={13} />Ajouter un candidat</LinkBtn>
          </div>

          {allCandidates.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
                <Users size={18} />
              </div>
              <p className="text-sm font-semibold text-[#010101]">Aucun candidat pour le moment</p>
              <p className="text-xs text-gray-400">Importez un premier CV pour démarrer l'évaluation.</p>
              <LinkBtn href={`/candidats/nouveau?mission=${mission.id}`} variant="primary" size="sm"><Plus size={13} />Ajouter un candidat</LinkBtn>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-3 items-start">
              {KANBAN_COLS.map((col) => {
                const cards = allCandidates.filter((c) => c.status === col.key);
                return (
                  <div key={col.key} className={`rounded-2xl border p-3 ${col.color}`}>
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                      <span className="text-xs font-bold text-[#010101]">{col.label}</span>
                      <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-white/70 rounded-lg px-1.5 py-0.5">{cards.length}</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {cards.length === 0 && (
                        <div className="py-6 flex flex-col items-center gap-1.5 text-center">
                          <p className="text-[10px] text-gray-300 font-medium">Aucun candidat</p>
                        </div>
                      )}
                      {cards.map((c) => {
                        const stepType = c.status === "Screening" ? "screening" : c.status === "Topgrading" ? "topgrading" : null;
                        const subStep = stepType ? subStepFor(interviewByCandidate.get(`${c.id}-${stepType}`)) : null;
                        return (
                        <Link
                          key={c.id}
                          href={`/candidats/${c.id}`}
                          className="bg-white rounded-xl border border-black/[0.06] p-3 cursor-pointer hover:border-[#99BAF8]/40 hover:shadow-sm transition-all group block"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"} size="sm" />
                            <span className="text-xs font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight">{c.first_name} {c.last_name}</span>
                          </div>
                          {subStep && (
                            <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${
                              subStep === "decision" ? "bg-[#75DA9F]/15 text-[#1e8f52]" : subStep === "interview" ? "bg-[#99BAF8]/15 text-[#3a6fd4]" : "bg-gray-100 text-gray-400"
                            }`}>
                              {SUB_STEP_LABEL[subStep]}
                            </span>
                          )}
                          {c.score !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-1">
                                <div className="h-1 rounded-full bg-[#99BAF8]" style={{ width: `${c.score}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 tabular-nums">{c.score}/100</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-300 mt-1">Pas encore noté</p>
                          )}
                        </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
