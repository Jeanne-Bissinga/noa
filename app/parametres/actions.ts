"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export type SettingsFormState = { error?: string; success?: boolean; message?: string };

export async function updateProfile(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!firstName || !lastName) return { error: "Prénom et nom sont obligatoires." };
  if (!email) return { error: "L'email est obligatoire." };

  const supabase = await createClient();
  const emailChanged = email !== recruiter.email;

  if (emailChanged) {
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) return { error: authError.message };
  }

  const { error } = await supabase
    .from("recruiters")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      job_title: String(formData.get("jobTitle") ?? "").trim() || null,
    })
    .eq("user_id", recruiter.user_id);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  return {
    success: true,
    message: emailChanged
      ? "Un email de confirmation a été envoyé à la nouvelle adresse. Le changement de connexion ne prendra effet qu'après confirmation."
      : undefined,
  };
}

export async function updateCompany(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom de l'entreprise est obligatoire." };

  const techStack = String(formData.get("techStack") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name,
      siret: String(formData.get("siret") ?? "").trim() || null,
      sector: String(formData.get("sector") ?? "").trim() || null,
      team_size: String(formData.get("teamSize") ?? "").trim() || null,
      main_objective: String(formData.get("mainObjective") ?? "").trim() || null,
      activity_description: String(formData.get("activityDescription") ?? "").trim() || null,
      culture_values: String(formData.get("cultureValues") ?? "").trim() || null,
      tech_stack: techStack,
      hr_challenges: String(formData.get("hrChallenges") ?? "").trim() || null,
    })
    .eq("id", recruiter.company_id);

  if (error) return { error: error.message };

  revalidatePath("/parametres");
  return { success: true };
}

export type DeleteAccountState = { error?: string };

/**
 * Suppression définitive : entreprise (cascade -> missions, candidats,
 * entretiens, etc.) puis le compte auth lui-même. Nécessite la clé
 * service_role (RLS ne l'autorise pas, et auth.admin n'est accessible qu'avec
 * elle) — voir lib/supabase/admin.ts.
 */
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== recruiter.company.name) {
    return { error: "Le nom saisi ne correspond pas au nom de l'entreprise." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Suppression indisponible pour le moment (configuration serveur manquante). Contactez le support." };
  }

  const { error: companyError } = await admin.from("companies").delete().eq("id", recruiter.company_id);
  if (companyError) return { error: companyError.message };

  const { error: userError } = await admin.auth.admin.deleteUser(recruiter.user_id);
  if (userError) return { error: userError.message };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
