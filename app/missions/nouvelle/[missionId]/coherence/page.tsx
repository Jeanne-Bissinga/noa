import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Target, Award, Edit3 } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, BackLink, StepBar } from "@/components/noa/ui-primitives";
import { requireRecruiter, getMission, getMissionObjectives, getMissionSkills } from "@/lib/noa/queries";
import { REASON_LABEL, formatDate } from "@/lib/noa/labels";
import type { MissionSkillCategory } from "@/lib/noa/types";
import { ValidateButton } from "./validate-button";

const SKILL_CATEGORY_LABEL: Record<MissionSkillCategory, string> = {
  technique: "Techniques",
  relationnelle: "Relationnelles",
  comportementale: "Comportementales",
};

export default async function JobCoherencePage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  const recruiter = await requireRecruiter();
  const mission = await getMission(missionId);

  if (!mission || mission.company_id !== recruiter.company_id) {
    notFound();
  }

  const [objectives, skills] = await Promise.all([
    getMissionObjectives(mission.id),
    getMissionSkills(mission.id),
  ]);

  const skillsByCategory = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[])
    .map((category) => ({ category, items: skills.filter((s) => s.category === category) }));

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/missions/nouvelle/${mission.id}/competences`} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={4} /></div>

        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Récapitulatif</h1>
        <p className="text-gray-400 text-sm mb-7">Vérifiez que votre fiche de poste est complète avant de la valider.</p>

        {/* Context banner */}
        <div className="flex items-center gap-3 bg-[#010101] text-white rounded-2xl px-5 py-3.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-[#75DA9F]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#75DA9F] mb-0.5">Contexte</p>
            <p className="text-sm font-semibold">{mission.title} · {mission.reason ? REASON_LABEL[mission.reason] ?? mission.reason : "—"}</p>
            <p className="text-xs text-white/50 mt-0.5">{recruiter.company.name} · créée le {formatDate(mission.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {/* Mission */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#99BAF8]/12 flex items-center justify-center">
                  <FileText size={12} className="text-[#3a6fd4]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Mission</span>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/resume`} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
                <Edit3 size={10} />Modifier
              </Link>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {mission.mission_text || "Aucune mission rédigée pour le moment."}
            </p>
          </Card>

          {/* Résultats */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#75DA9F]/12 flex items-center justify-center">
                  <Target size={12} className="text-[#1e8f52]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Résultats attendus</span>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/resultats`} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
                <Edit3 size={10} />Modifier
              </Link>
            </div>
            {objectives.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun objectif défini.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {objectives.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#75DA9F]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1e8f52] text-[9px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-sm text-[#010101] font-medium">{o.label}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{[o.threshold, o.deadline].filter(Boolean).join(" · ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Compétences */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#CCB8FF]/12 flex items-center justify-center">
                  <Award size={12} className="text-[#6b4ec4]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Compétences</span>
              </div>
              <Link href={`/missions/nouvelle/${mission.id}/competences`} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
                <Edit3 size={10} />Modifier
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {skillsByCategory.map((cat) => (
                <div key={cat.category}>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block bg-gray-100 text-gray-500">
                    {SKILL_CATEGORY_LABEL[cat.category]}
                  </span>
                  {cat.items.length === 0 ? (
                    <p className="text-xs text-gray-300">—</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {cat.items.map((item) => (
                        <li key={item.id} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-0.5">·</span>{item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <ValidateButton missionId={mission.id} />
        </div>
      </div>
    </AppLayout>
  );
}
