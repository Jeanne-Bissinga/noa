"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/noa/auth";
import { authError } from "@/lib/noa/errors";

export type NewPasswordState = {
  error?: string;
};

export async function updatePassword(
  _prevState: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!password || !confirmation) {
    return { error: "Merci de saisir puis de confirmer votre nouveau mot de passe." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Votre mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }
  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  const supabase = await createClient();

  // Le lien reçu par email a ouvert une session : sans elle, le lien a expiré
  // ou a déjà été utilisé.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Votre lien de réinitialisation n'est plus valide. Merci d'en demander un nouveau." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    // Traduction centralisée (lib/noa/errors.ts) : les messages de Supabase
    // sont en anglais, et certains disent quelque chose d'utile.
    return { error: authError("updatePassword", error, "La mise à jour a échoué. Merci de réessayer.") };
  }

  redirect("/dashboard");
}
