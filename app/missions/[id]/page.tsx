import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Plus, FileText, Check, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, LinkBtn, BackLink, Avatar } from "@/components/noa/ui-primitives";
import {
  requireRecruiter, getMission, getMissionObjectives, getMissionSkills, getCandidates,
} from "@/lib/noa/queries";
import {
  MISSION_STATUS_LABEL, MISSION_STATUS_COLOR, REASON_LABEL, formatDate, initials,
  CANDIDATE_AVATAR_COLOR,
} from "@/lib/noa/labels";
import type { CandidateStatus, MissionSkillCategory } from "@/lib/noa/types";

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

  const skillsByCategory = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[])
    .map((category) => ({ category, items: skills.filter((s) => s.category === category) }))
    .filter((block) => block.items.length > 0);

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
        </div>

        {/* Avancement */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Avancement du recrutement</p>
          <ProcessFrise active={mission.process_step} />
        </Card>

        {/* Fiche de poste */}
        <Card className="overflow-hidden mb-8">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#99BAF8]/15 flex items-center justify-center text-[#3a6fd4] flex-shrink-0 mt-0.5">
                  <FileText size={15} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#010101] mb-2">Fiche de poste</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{mission.mission_text || "Aucune mission rédigée pour le moment."}</p>
                </div>
              </div>
              <Link
                href={`/missions/nouvelle/${mission.id}/resume`}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:text-[#2a5cb8] flex-shrink-0 mt-0.5 transition-colors"
              >
                Voir plus de détails
              </Link>
            </div>
          </div>

          {(objectives.length > 0 || skillsByCategory.length > 0) && (
            <div className="px-5 pb-5 pt-1 border-t border-black/[0.04]">
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Résultats attendus</p>
                  <div className="flex flex-col gap-2.5">
                    {objectives.length === 0 && <p className="text-xs text-gray-400">Aucun objectif défini.</p>}
                    {objectives.map((o) => {
                      const ok = Boolean(o.metric && o.deadline && o.threshold);
                      return (
                        <div key={o.id} className="flex items-start gap-2">
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${ok ? "bg-[#75DA9F]/20 text-[#1e8f52]" : "bg-orange-50 text-orange-400"}`}>
                            {ok ? <Check size={10} /> : <AlertTriangle size={9} />}
                          </div>
                          <div>
                            <p className="text-sm text-[#010101] font-medium leading-snug">{o.label}</p>
                            <p className="text-xs text-gray-400">{[o.metric, o.deadline, o.threshold].filter(Boolean).join(" · ")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Compétences</p>
                  <div className="flex flex-col gap-3">
                    {skillsByCategory.length === 0 && <p className="text-xs text-gray-400">Aucune compétence définie.</p>}
                    {skillsByCategory.map((block) => (
                      <div key={block.category}>
                        <p className="text-[10px] font-semibold text-gray-400 mb-1.5">{SKILL_CATEGORY_LABEL[block.category]}</p>
                        <div className="flex flex-wrap gap-1">
                          {block.items.map((s) => (
                            <span key={s.id} className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-lg px-2 py-0.5">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

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
                      {cards.map((c) => (
                        <Link
                          key={c.id}
                          href={`/candidats/${c.id}`}
                          className="bg-white rounded-xl border border-black/[0.06] p-3 cursor-pointer hover:border-[#99BAF8]/40 hover:shadow-sm transition-all group block"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"} size="sm" />
                            <span className="text-xs font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight">{c.first_name} {c.last_name}</span>
                          </div>
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
                      ))}
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
