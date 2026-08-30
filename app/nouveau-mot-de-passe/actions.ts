"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD_LENGTH } from "@/lib/noa/auth";

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
    // Les messages de Supabase sont en anglais : on les traduit plutôt que de
    // les afficher tels quels.
    if (error.message.toLowerCase().includes("should be different")) {
      return { error: "Votre nouveau mot de passe doit être différent de l'ancien." };
    }
    if (error.message.toLowerCase().includes("at least")) {
      return { error: `Votre mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
    }
    return { error: "La mise à jour a échoué. Merci de réessayer." };
  }

  redirect("/dashboard");
}
