"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentRecruiter, getCandidate } from "@/lib/noa/queries";
import { createClient } from "@/lib/supabase/server";
import { generateToken, hashToken, publicUrl, tokenExpiryFor } from "@/lib/noa/preferences/tokens";
import { sendWorkPreferencesInvite, isEmailConfigured } from "@/lib/noa/preferences/emails";
import { getWorkPreferencesByCandidate } from "@/lib/noa/preferences/queries";
import { ERROR_MESSAGE, userError } from "@/lib/noa/errors";

// Invitation du candidat à décrire ses préférences de travail.
//
// L'étape se situe après le premier entretien et avant l'entretien technique,
// et elle est facultative : rien ici ne conditionne la suite du recrutement.
// Aucune de ces données ne touche un score, une note de compétence ou une
// décision — elles servent à préparer une conversation.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteResult = {
  url?: string;
  sent?: boolean;
  error?: string;
};

async function assertOwnedCandidate(candidateId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");
  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }
  return { recruiter, candidate };
}

/**
 * Origine publique du lien. `NEXT_PUBLIC_SITE_URL` fait foi quand elle existe ;
 * sinon on la reconstruit depuis la requête, ce qui marche en préproduction
 * comme en local sans configuration.
 */
async function requestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Émet un lien de préférences, avec ou sans envoi d'e-mail.
 *
 * Une seule logique derrière les deux boutons de la modale : « Envoyer » et
 * « Copier le lien » passent ici, la seule différence est la présence d'une
 * adresse. Chaque émission remplace l'empreinte stockée, donc invalide le lien
 * précédent — c'est ce qui rend une relance sûre.
 *
 * L'adresse e-mail n'est pas conservée : Noa ne la connaît que le temps de
 * l'envoi.
 */
export async function issueWorkPreferencesLink(
  candidateId: string,
  email: string | null,
): Promise<InviteResult> {
  const { candidate } = await assertOwnedCandidate(candidateId);
  const supabase = await createClient();

  const to = email?.trim() || null;
  if (to !== null && !EMAIL_PATTERN.test(to)) {
    return { error: "Adresse e-mail invalide." };
  }

  const existing = await getWorkPreferencesByCandidate(candidate.id);
  if (existing?.status === "completed") {
    return { error: "Les préférences de travail ont déjà été complétées." };
  }

  const token = generateToken();
  const now = new Date();
  const row = {
    candidate_id: candidate.id,
    status: "invited" as const,
    token_hash: hashToken("work_preferences", token),
    token_expires_at: tokenExpiryFor(now).toISOString(),
    invited_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("onboarding_work_preferences")
    .upsert(row, { onConflict: "candidate_id" });
  if (error) return { error: userError("issueWorkPreferencesLink", error, ERROR_MESSAGE.invitation) };

  const origin = await requestOrigin();
  const url = publicUrl("work_preferences", token, origin);
  revalidatePath(`/candidats/${candidate.id}`);

  if (!to) return { url, sent: false };
  if (!isEmailConfigured()) {
    return { url, sent: false, error: "L'envoi d'e-mail n'est pas configuré. Le lien reste copiable ci-dessous." };
  }

  try {
    await sendWorkPreferencesInvite({
      to,
      firstName: candidate.first_name,
      token,
      origin,
    });
  } catch (e) {
    return {
      url,
      sent: false,
      error: userError("issueWorkPreferencesLink.email", e, "L'e-mail n'a pas pu être envoyé. Le lien reste copiable ci-dessous."),
    };
  }

  return { url, sent: true };
}
