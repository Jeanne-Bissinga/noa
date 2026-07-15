"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getCandidate, getMission } from "@/lib/noa/queries";
import { STATUS_FIELDS } from "@/lib/noa/labels";
import type { CandidateStatus } from "@/lib/noa/types";

// ─── Kanban: move a candidate to a new column ──────────────────────────────
// Status-field mapping lives in lib/noa/labels.ts (STATUS_FIELDS) so it can be
// shared with the screening/topgrading/final decision Server Actions in
// app/candidats/[id]/actions.ts without violating the "use server" file's
// "only export async functions" rule.
export async function moveCandidate(candidateId: string, newStatus: CandidateStatus) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }

  const supabase = await createClient();
  const fields = STATUS_FIELDS[newStatus];

  const { error } = await supabase
    .from("candidates")
    .update({
      status: newStatus,
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/candidats");
  revalidatePath(`/candidats/${candidateId}`);
  if (candidate.mission_id) {
    revalidatePath(`/missions/${candidate.mission_id}`);
  }
}

// ─── Create candidate ───────────────────────────────────────────────────────
export type CreateCandidateState = {
  error?: string;
};

export async function createCandidate(
  missionId: string | undefined,
  _prevState: CreateCandidateState,
  formData: FormData,
): Promise<CreateCandidateState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  if (!missionId) {
    return { error: "Aucune mission associée : impossible de créer la fiche candidat. Revenez à la mission concernée pour ajouter un candidat." };
  }

  const mission = await getMission(missionId);
  if (!mission || mission.company_id !== recruiter.company_id) {
    return { error: "Mission introuvable pour ce candidat." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const cvFile = formData.get("cvFile") as File | null;

  if (!firstName || !lastName) {
    return { error: "Merci de renseigner le prénom et le nom du candidat." };
  }

  if (!cvFile || cvFile.size === 0) {
    return { error: "Merci d'importer le CV du candidat." };
  }

  const supabase = await createClient();

  const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${recruiter.company_id}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("cv-attachments")
    .upload(path, cvFile, { contentType: cvFile.type || undefined });

  if (uploadError) {
    return { error: `Échec de l'import du CV : ${uploadError.message}` };
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      company_id: recruiter.company_id,
      mission_id: mission.id,
      first_name: firstName,
      last_name: lastName,
      title: title || null,
      location: location || null,
      cv_url: path,
      status: "Screening",
      screening_status: "current",
      topgrading_status: "pending",
      decision_status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Impossible de créer la fiche candidat." };
  }

  revalidatePath("/candidats");
  revalidatePath(`/missions/${mission.id}`);
  redirect(`/candidats/${data.id}/transition?type=screening`);
}
