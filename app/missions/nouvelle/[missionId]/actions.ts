"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getMission } from "@/lib/noa/queries";
import type { MissionSkillCategory } from "@/lib/noa/types";

async function assertOwnedMission(missionId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }
  const mission = await getMission(missionId);
  if (!mission || mission.company_id !== recruiter.company_id) {
    throw new Error("Mission introuvable.");
  }
  return { recruiter, mission };
}

// ─── Résumé de mission (mission_text) ──────────────────────────────────────
export type SaveMissionTextState = { error?: string };

export async function saveMissionText(
  missionId: string,
  _prevState: SaveMissionTextState,
  formData: FormData,
): Promise<SaveMissionTextState> {
  const { mission } = await assertOwnedMission(missionId);

  const missionText = String(formData.get("missionText") ?? "").trim();
  if (!missionText) {
    return { error: "La mission ne peut pas être vide." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("missions")
    .update({ mission_text: missionText, updated_at: new Date().toISOString() })
    .eq("id", mission.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/missions/nouvelle/${mission.id}/resume`);
  redirect(`/missions/nouvelle/${mission.id}/resultats`);
}

// ─── Objectifs (mission_objectives) ────────────────────────────────────────
export async function addObjective(missionId: string, position: number) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_objectives")
    .insert({
      mission_id: mission.id,
      label: "",
      metric: "",
      deadline: "",
      threshold: "",
      position,
    })
    .select("*")
    .single();
  revalidatePath(`/missions/nouvelle/${mission.id}/resultats`);
  return data;
}

export async function updateObjective(
  objectiveId: string,
  missionId: string,
  fields: { label?: string; metric?: string; deadline?: string; threshold?: string },
) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();
  await supabase.from("mission_objectives").update(fields).eq("id", objectiveId).eq("mission_id", mission.id);
  revalidatePath(`/missions/nouvelle/${mission.id}/resultats`);
}

export async function removeObjective(objectiveId: string, missionId: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();
  await supabase.from("mission_objectives").delete().eq("id", objectiveId).eq("mission_id", mission.id);
  revalidatePath(`/missions/nouvelle/${mission.id}/resultats`);
}

const NOA_OBJ_SUGGESTIONS = [
  { label: "Livrer le module d'intégrations API", metric: "3 intégrations tierces", deadline: "3 mois", threshold: "Livrées en production et documentées" },
  { label: "Réduire le temps de déploiement client", metric: "Délai moyen de mise en production", deadline: "6 mois", threshold: "< 3 jours (vs 3 semaines actuellement)" },
  { label: "Améliorer la couverture de tests", metric: "Taux de couverture sur les modules critiques", deadline: "2 mois", threshold: "> 80 %" },
];

export async function fillObjectiveSuggestions(missionId: string, startPosition: number) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_objectives")
    .insert(
      NOA_OBJ_SUGGESTIONS.map((s, i) => ({
        mission_id: mission.id,
        label: s.label,
        metric: s.metric,
        deadline: s.deadline,
        threshold: s.threshold,
        position: startPosition + i,
      })),
    )
    .select("*");
  revalidatePath(`/missions/nouvelle/${mission.id}/resultats`);
  return data ?? [];
}

// ─── Compétences (mission_skills) ──────────────────────────────────────────
export async function toggleSkill(
  missionId: string,
  category: MissionSkillCategory,
  name: string,
  currentlyPresent: boolean,
  position: number,
) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  let created = null;
  if (currentlyPresent) {
    await supabase
      .from("mission_skills")
      .delete()
      .eq("mission_id", mission.id)
      .eq("category", category)
      .eq("name", name);
  } else {
    const { data } = await supabase
      .from("mission_skills")
      .insert({ mission_id: mission.id, category, name, position })
      .select("*")
      .single();
    created = data;
  }
  revalidatePath(`/missions/nouvelle/${mission.id}/competences`);
  return created;
}

export async function addCustomSkill(missionId: string, category: MissionSkillCategory, name: string, position: number) {
  const { mission } = await assertOwnedMission(missionId);
  const trimmed = name.trim();
  if (!trimmed) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_skills")
    .insert({ mission_id: mission.id, category, name: trimmed, position })
    .select("*")
    .single();
  revalidatePath(`/missions/nouvelle/${mission.id}/competences`);
  return data;
}

const NOA_SKILL_SUGGESTIONS: Record<MissionSkillCategory, string[]> = {
  technique: ["TypeScript / JavaScript avancé", "React & Next.js", "Node.js / API REST", "PostgreSQL ou équivalent"],
  relationnelle: ["Communication claire avec des non-techniques", "Autonomie sur des sujets complexes", "Feedback constructif en code review"],
  comportementale: ["Orienté livraison et résultats", "Curiosité et veille technologique", "Fiabilité dans les engagements"],
};

export async function fillSkillSuggestions(missionId: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  const rows: { mission_id: string; category: MissionSkillCategory; name: string; position: number }[] = [];
  (Object.keys(NOA_SKILL_SUGGESTIONS) as MissionSkillCategory[]).forEach((category) => {
    NOA_SKILL_SUGGESTIONS[category].forEach((name, i) => {
      rows.push({ mission_id: mission.id, category, name, position: i });
    });
  });

  const { data } = await supabase.from("mission_skills").insert(rows).select("*");
  revalidatePath(`/missions/nouvelle/${mission.id}/competences`);
  return data ?? [];
}

// ─── Validation de la fiche de poste ───────────────────────────────────────
export async function validateJobSpec(missionId: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("missions")
    .update({ status: "en_cours", process_step: 1, updated_at: new Date().toISOString() })
    .eq("id", mission.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/missions/nouvelle/${mission.id}/coherence`);
  revalidatePath("/missions");
  redirect(`/missions/nouvelle/${mission.id}/fiche-finale`);
}

// ─── Fiche finale ───────────────────────────────────────────────────────────
export async function saveFinalSpec(missionId: string, finalSpecText: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();
  await supabase
    .from("missions")
    .update({ final_spec_text: finalSpecText, updated_at: new Date().toISOString() })
    .eq("id", mission.id);
  revalidatePath(`/missions/nouvelle/${mission.id}/fiche-finale`);
}
