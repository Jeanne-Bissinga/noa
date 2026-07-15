"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = {
  error?: string;
  message?: string;
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

  // Stash the signup answers in the auth user's metadata: if email
  // confirmation is required, signUp() won't give us a session (so we can't
  // call the RPC yet, since it relies on auth.uid()). The /auth/callback
  // route reads this metadata to create the company + recruiter rows once
  // the user actually confirms their email and gets a session.
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        siret: siret || null,
        team_size: teamSize || null,
        main_objective: mainObjective || null,
        job_title: jobTitle || null,
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered") || signUpError.message.toLowerCase().includes("already been registered")) {
      return { error: "Un compte existe déjà avec cet email." };
    }
    return { error: signUpError.message };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Email confirmation is required: no session yet, so we can't create the
    // company/recruiter rows here. /auth/callback handles it once the user
    // clicks the confirmation link.
    return {
      message: "Compte créé. Merci de vérifier votre boîte mail et de cliquer sur le lien de confirmation pour continuer.",
    };
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
