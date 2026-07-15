"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export type CreateMissionState = {
  error?: string;
};

export async function createMission(
  _prevState: CreateMissionState,
  formData: FormData,
): Promise<CreateMissionState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  const reason = String(formData.get("reason") ?? "").trim();
  const reasonDetail = String(formData.get("reasonDetail") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const missionText = String(formData.get("missionText") ?? "").trim();

  if (!reason || !title) {
    return { error: "Merci de sélectionner un motif et de renseigner un titre de poste." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("missions")
    .insert({
      company_id: recruiter.company_id,
      created_by: recruiter.id,
      title,
      reason,
      reason_detail: reasonDetail || null,
      mission_text: missionText || null,
      status: "brouillon",
      process_step: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la mission." };
  }

  redirect(`/missions/nouvelle/${data.id}/resume`);
}
