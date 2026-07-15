import { notFound } from "next/navigation";
import { requireRecruiter, getMission, getMissionSkills } from "@/lib/noa/queries";
import { SkillsBoard } from "./skills-board";

export default async function JobSkillsPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  const recruiter = await requireRecruiter();
  const mission = await getMission(missionId);

  if (!mission || mission.company_id !== recruiter.company_id) {
    notFound();
  }

  const skills = await getMissionSkills(mission.id);

  return <SkillsBoard mission={mission} skills={skills} />;
}
