"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  error?: string;
  message?: string;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Merci de renseigner votre adresse email." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Merci d'indiquer une adresse email valide." };
  }

  // L'URL de retour doit être absolue : elle part dans l'email envoyé par
  // Supabase. On la reconstruit depuis la requête pour qu'elle vaille aussi
  // bien en local qu'en préproduction ou en production.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${protocol}://${host}` : "";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/nouveau-mot-de-passe`,
  });

  if (error) {
    // Journalisé côté serveur uniquement : le message rendu ne change pas.
    console.error("Demande de réinitialisation de mot de passe échouée :", error.message);
  }

  // Réponse volontairement identique que l'adresse existe ou non : révéler
  // qu'un compte existe permettrait d'énumérer les utilisateurs du service.
  return {
    message:
      "Si un compte existe avec cette adresse, un email vient d'être envoyé avec un lien pour définir un nouveau mot de passe. Pensez à vérifier vos courriers indésirables.",
  };
}
