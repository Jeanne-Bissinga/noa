import { notFound } from "next/navigation";
import { requireRecruiter, getMission, getMissionObjectives, getMissionSkills } from "@/lib/noa/queries";
import { REASON_LABEL, formatDate } from "@/lib/noa/labels";
import { FinalSpecView } from "./final-spec-view";
import type { MissionSkillCategory } from "@/lib/noa/types";

function composeFinalSpecText({
  companyName, missionTitle, reasonLabel, dateLabel, missionText, objectives, skillsByCategory,
}: {
  companyName: string; missionTitle: string; reasonLabel: string; dateLabel: string; missionText: string;
  objectives: { label: string; metric: string | null; deadline: string | null; threshold: string | null }[];
  skillsByCategory: { label: string; items: string[] }[];
}) {
  const objectivesText = objectives
    .map((o) => `• ${o.label}${[o.threshold, o.deadline].filter(Boolean).length ? ", " + [o.threshold, o.deadline].filter(Boolean).join(" · ") : ""}`)
    .join("\n");

  const skillsText = skillsByCategory
    .filter((c) => c.items.length > 0)
    .map((c) => `${c.label} : ${c.items.join(", ")}`)
    .join("\n");

  return `${missionTitle}, ${companyName}
${reasonLabel} · ${dateLabel}

MISSION
${missionText || "-"}

RÉSULTATS ATTENDUS
${objectivesText || "-"}

COMPÉTENCES REQUISES
${skillsText || "-"}`;
}

export default async function JobFinalPage({ params }: { params: Promise<{ missionId: string }> }) {
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

  const SKILL_CATEGORY_LABEL: Record<MissionSkillCategory, string> = {
    technique: "Techniques",
    relationnelle: "Relationnelles",
    comportementale: "Comportementales",
  };

  const skillsByCategory = (["technique", "relationnelle", "comportementale"] as MissionSkillCategory[]).map((category) => ({
    category,
    label: SKILL_CATEGORY_LABEL[category],
    items: skills.filter((s) => s.category === category).map((s) => s.name),
  }));

  const reasonLabel = mission.reason ? REASON_LABEL[mission.reason] ?? mission.reason : "-";
  const dateLabel = formatDate(mission.created_at);

  const finalSpecText = mission.final_spec_text
    ?? composeFinalSpecText({
      companyName: recruiter.company.name,
      missionTitle: mission.title,
      reasonLabel,
      dateLabel,
      missionText: mission.mission_text ?? "",
      objectives,
      skillsByCategory,
    });

  return (
    <FinalSpecView
      mission={mission}
      companyName={recruiter.company.name}
      reasonLabel={reasonLabel}
      dateLabel={dateLabel}
      objectives={objectives}
      skillsByCategory={skillsByCategory}
      finalSpecText={finalSpecText}
    />
  );
}
