"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = {
  error?: string;
};

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();
  const siret = String(formData.get("siret") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const teamSize = String(formData.get("teamSize") ?? "");
  const mainObjective = String(formData.get("mainObjective") ?? "");

  if (!firstName || !lastName || !email || !password || !companyName) {
    return { error: "Merci de remplir tous les champs obligatoires." };
  }

  const supabase = await createClient();

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("already been registered")) {
      return { error: "Un compte existe déjà avec cet email." };
    }
    return { error: signUpError.message };
  }

  // signUp() doesn't guarantee an active session (e.g. email confirmation
  // required). Make sure we have one before calling the RPC, which relies on
  // auth.uid().
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { error: "Compte créé. Merci de vérifier votre email avant de continuer." };
    }
  }

  const { error: rpcError } = await supabase.rpc("create_company_and_recruiter", {
    p_company_name: companyName,
    p_siret: siret || null,
    p_sector: null,
    p_team_size: teamSize || null,
    p_main_objective: mainObjective || null,
    p_first_name: firstName,
    p_last_name: lastName,
    p_email: email,
    p_job_title: jobTitle || null,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  redirect("/onboarding");
}
