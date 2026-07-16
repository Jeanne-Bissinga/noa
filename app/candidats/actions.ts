"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getCandidate, getMission } from "@/lib/noa/queries";
import { STATUS_FIELDS, canMoveCandidate } from "@/lib/noa/labels";
import { extractCandidateProfile, CV_SUPPORTED_MIME, type CandidateProfileExtract } from "@/lib/noa/ai";
import type { CandidateStatus, DecisionStage } from "@/lib/noa/types";

// Un retour en arrière annule les étapes à partir de celle visée : leurs
// décisions ne tiennent plus. Sans ça, l'écran de décision afficherait
// "Décision déjà prise" et masquerait ses boutons, laissant le candidat
// bloqué — le kanban ne pouvant plus le faire avancer.
const STAGES_REOPENED_BY: Record<CandidateStatus, DecisionStage[]> = {
  Screening: ["screening", "topgrading", "final"],
  Topgrading: ["topgrading", "final"],
  "Decision finale": ["final"],
  // Issues terminales : jamais atteintes par un retour en arrière.
  "Non retenu": [],
  Recrute: [],
};

// ─── Kanban: move a candidate to a new column ──────────────────────────────
// Status-field mapping lives in lib/noa/labels.ts (STATUS_FIELDS) so it can be
// shared with the screening/topgrading/final decision Server Actions in
// app/candidats/[id]/actions.ts without violating the "use server" file's
// "only export async functions" rule.
//
// Le kanban ne sert qu'aux corrections : voir canMoveCandidate. Toute
// progression passe par decideStage / decideFinal, qui tracent la décision.
export async function moveCandidate(candidateId: string, newStatus: CandidateStatus) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }

  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }

  // Le board applique déjà la règle, mais il ne protège rien : la Server
  // Action est appelable directement.
  const check = canMoveCandidate(candidate.status, newStatus);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  if (candidate.status === newStatus) return;

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

  // Retour en arrière : les décisions des étapes réouvertes sont caduques.
  const reopened = STAGES_REOPENED_BY[newStatus];
  if (reopened.length) {
    await supabase.from("decisions").delete().eq("candidate_id", candidateId).in("stage", reopened);
  }

  revalidatePath("/candidats");
  revalidatePath(`/candidats/${candidateId}`);
  // Le dashboard compte les décisions en attente à partir de ces champs.
  revalidatePath("/dashboard");
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

  // Lecture unique du fichier : sert à l'upload ET à l'extraction noa.
  const buffer = Buffer.from(await cvFile.arrayBuffer());

  const safeName = cvFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${recruiter.company_id}/${randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("cv-attachments")
    .upload(path, buffer, { contentType: cvFile.type || undefined });

  if (uploadError) {
    return { error: `Échec de l'import du CV : ${uploadError.message}` };
  }

  // noa extrait le profil (titre, localisation, expériences, compétences…) du CV.
  // PDF/images uniquement. En cas d'échec, la fiche est créée sans enrichissement.
  let profile: CandidateProfileExtract | null = null;
  if (CV_SUPPORTED_MIME.test(cvFile.type)) {
    try {
      profile = await extractCandidateProfile({ base64: buffer.toString("base64"), mediaType: cvFile.type });
    } catch (e) {
      const err = e as { message?: string };
      console.error(`[noa] Extraction du CV échouée, fiche créée sans enrichissement : ${err?.message ?? String(e)}`);
    }
  }

  const { data, error } = await supabase
    .from("candidates")
    .insert({
      company_id: recruiter.company_id,
      mission_id: mission.id,
      first_name: firstName,
      last_name: lastName,
      cv_url: path,
      title: profile?.title || title || null,
      location: profile?.location || location || null,
      email: profile?.email || null,
      summary: profile?.summary || null,
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

  // Expériences et compétences extraites (tables dédiées).
  if (profile) {
    const experiences = profile.experiences.filter((exp) => exp.role || exp.company || exp.bullets.length);
    if (experiences.length) {
      await supabase.from("candidate_experiences").insert(
        experiences.map((exp, i) => ({
          candidate_id: data.id,
          role: exp.role || null,
          company: exp.company || null,
          period: exp.period || null,
          bullets: exp.bullets ?? [],
          position: i,
        })),
      );
    }

    const skills = [...new Set(profile.skills.map((s) => s.trim()).filter(Boolean))];
    if (skills.length) {
      await supabase.from("candidate_skills").insert(skills.map((name) => ({ candidate_id: data.id, name })));
    }
  }

  revalidatePath("/candidats");
  revalidatePath(`/missions/${mission.id}`);
  revalidatePath("/dashboard");
  redirect(`/candidats/${data.id}/transition?type=screening`);
}
