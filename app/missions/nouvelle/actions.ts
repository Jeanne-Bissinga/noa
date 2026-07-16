"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";
import { generateMissionText } from "@/lib/noa/ai";

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

  // noa rédige la mission du poste à partir du contexte de l'étape 1. En cas
  // d'échec de l'API, on retombe sur le texte brut du recruteur pour ne jamais
  // casser le flux de création.
  let generatedMission = missionText;
  let noaSucceeded = false;
  try {
    const noaText = await generateMissionText({ reason, reasonDetail, title, missionText });
    if (noaText) {
      generatedMission = noaText;
      noaSucceeded = true;
    }
  } catch (e) {
    // Repli volontaire sur le texte brut. On log la raison précise pour pouvoir
    // diagnostiquer (clé absente, crédits insuffisants, timeout, ...) sans casser
    // la création de mission.
    const err = e as { status?: number; error?: { error?: { type?: string; message?: string } }; message?: string };
    const reason =
      err?.error?.error?.message ?? err?.message ?? String(e);
    console.error(
      `[noa] Génération de la mission échouée, repli sur le texte brut. ` +
        `status=${err?.status ?? "?"} type=${err?.error?.error?.type ?? "?"} : ${reason}`,
    );
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
      mission_text: generatedMission || null,
      status: "brouillon",
      process_step: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la mission." };
  }

  // Si noa n'a pas pu rédiger (repli sur le texte brut), on le signale à
  // l'étape 2 pour afficher un message honnête plutôt que « Proposé par noa ».
  const target = `/missions/nouvelle/${data.id}/resume`;
  redirect(noaSucceeded ? target : `${target}?noa=fallback`);
}
