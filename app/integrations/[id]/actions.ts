"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentRecruiter,
  getCandidate,
} from "@/lib/noa/queries";
import { getOnboardingByCandidate, getIntegrationInterviews, getWorkPreferences } from "@/lib/noa/onboarding/queries";
import { createDraftOnboarding } from "@/lib/noa/onboarding/create";
import { ERROR_MESSAGE, userError } from "@/lib/noa/errors";
import { planInterviews, tokenExpiryFor } from "@/lib/noa/onboarding/schedule";
import { generateToken, hashToken, publicUrl } from "@/lib/noa/onboarding/tokens";
import { sendWorkPreferencesInvite, isEmailConfigured } from "@/lib/noa/onboarding/emails";
import type {
  ManagerConclusion,
  Onboarding,
  OnboardingGoalStatus,
  OnboardingPhase,
} from "@/lib/noa/types";

// Écritures de l'intégration. Même garde que app/candidats/[id]/actions.ts :
// rien ne s'écrit sans avoir revérifié côté serveur que le candidat appartient
// à l'entreprise du recruteur connecté — la RLS est la seconde barrière, pas
// la première.

async function assertOwnedCandidate(candidateId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }
  const candidate = await getCandidate(candidateId);
  if (!candidate || candidate.company_id !== recruiter.company_id) {
    throw new Error("Candidat introuvable.");
  }
  return { recruiter, candidate };
}

async function assertOwnedOnboarding(onboardingId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }
  const supabase = await createClient();
  const { data } = await supabase.from("onboardings").select("*").eq("id", onboardingId).maybeSingle();
  const onboarding = data as Onboarding | null;
  if (!onboarding || onboarding.company_id !== recruiter.company_id) {
    throw new Error("Plan d'onboarding introuvable.");
  }
  return { recruiter, onboarding, supabase };
}

function revalidateOnboarding(candidateId: string | undefined) {
  // Un identifiant absent produirait `/integrations/` : on ne
  // revalide rien plutôt qu'un chemin qui n'existe pas.
  if (!candidateId) return;
  // "layout" couvre la fiche ET ses sous-routes (/plan, /j30, /j60, /j90) : elles
  // lisent le même bundle, et une future sous-route serait sinon oubliée ici.
  revalidatePath(`/integrations/${candidateId}`, "layout");
  revalidatePath("/integrations");
  revalidatePath(`/candidats/${candidateId}`);
}

// ─── Création ───────────────────────────────────────────────────────────────

/**
 * Rattrapage pour une personne recrutée avant que l'intégration ne soit créée
 * automatiquement à la décision. Idempotent : la fiche appelle cette action
 * sans risque, y compris deux fois de suite.
 */
export async function prepareOnboarding(candidateId: string): Promise<{ error?: string }> {
  const { recruiter, candidate } = await assertOwnedCandidate(candidateId);

  if (candidate.status !== "Recrute") {
    return { error: "Le plan d'onboarding ne se prépare qu'une fois le candidat recruté." };
  }

  const result = await createDraftOnboarding(candidate, recruiter.id);
  if (!result.ok) return { error: result.error };

  revalidateOnboarding(candidateId);
  return {};
}

export async function updateOnboardingDetails(
  onboardingId: string,
  fields: { startDate?: string | null; missionText?: string },
): Promise<{ error?: string }> {
  const { onboarding, supabase } = await assertOwnedOnboarding(onboardingId);

  const patch: Record<string, string | null> = { updated_at: new Date().toISOString() };
  let dateChanged = false;

  if (fields.startDate !== undefined) {
    // Chaîne vide comme null : le champ date du navigateur renvoie "" quand on
    // l'efface, et « À définir » doit rester atteignable après coup.
    const value = fields.startDate?.trim() || null;
    if (value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { error: "Date de prise de poste invalide." };
    }
    patch.start_date = value;
    dateChanged = value !== onboarding.start_date;
  }
  if (fields.missionText !== undefined) {
    patch.mission_text = fields.missionText.trim() || null;
  }

  const { error } = await supabase.from("onboardings").update(patch).eq("id", onboarding.id);
  if (error) return { error: userError("updateOnboardingDetails", error, ERROR_MESSAGE.dateArrivee) };

  if (dateChanged) {
    const synced = await syncInterviewSchedule({ ...onboarding, start_date: patch.start_date ?? null });
    if (synced.error) return { error: synced.error };
  }

  revalidateOnboarding(onboarding.candidate_id);
  return {};
}

/** Fixe la date d'arrivée. Nom explicite pour la carte « Avant son arrivée ». */
export async function setArrivalDate(
  onboardingId: string,
  date: string | null,
): Promise<{ error?: string }> {
  return updateOnboardingDetails(onboardingId, { startDate: date });
}

export async function updateGoal(
  goalId: string,
  fields: {
    label?: string;
    metric?: string;
    targetValue?: number | null;
    currentValue?: number | null;
    status?: OnboardingGoalStatus;
  },
): Promise<{ error?: string }> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  const supabase = await createClient();
  // RLS `onboarding scoped all` : une ligne d'une autre entreprise n'est ni
  // lisible ni modifiable, la requête ne renverrait rien.
  const { data } = await supabase
    .from("onboarding_goals")
    .select("id, onboarding_id, kind, onboarding:onboardings(candidate_id)")
    .eq("id", goalId)
    .maybeSingle();
  if (!data) return { error: "Objectif introuvable." };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.label !== undefined) {
    const label = fields.label.trim();
    if (!label) return { error: "L'intitulé est obligatoire." };
    patch.label = label;
  }
  if (fields.metric !== undefined) patch.metric = fields.metric.trim() || null;
  if (fields.targetValue !== undefined) {
    patch.target_value = fields.targetValue;
    // La nature du résultat suit la cible : renseigner un chiffre rend
    // l'objectif mesurable, l'effacer le ramène à un suivi par statut.
    patch.kind = fields.targetValue === null ? "qualitative" : "numeric";
  }
  if (fields.currentValue !== undefined) patch.current_value = fields.currentValue;
  if (fields.status !== undefined) patch.status = fields.status;

  const { error } = await supabase.from("onboarding_goals").update(patch).eq("id", goalId);
  if (error) return { error: userError("updateGoal", error, ERROR_MESSAGE.objectif) };

  const candidateId = (data.onboarding as unknown as { candidate_id: string } | null)?.candidate_id;
  if (candidateId) revalidateOnboarding(candidateId);
  return {};
}

export async function addGoal(onboardingId: string, phase: OnboardingPhase): Promise<{ error?: string }> {
  const { onboarding, supabase } = await assertOwnedOnboarding(onboardingId);

  const { count } = await supabase
    .from("onboarding_goals")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_id", onboarding.id)
    .eq("phase", phase);

  const { error } = await supabase.from("onboarding_goals").insert({
    onboarding_id: onboarding.id,
    phase,
    label: "",
    kind: "qualitative",
    position: count ?? 0,
  });
  if (error) return { error: userError("addGoal", error, ERROR_MESSAGE.objectif) };

  revalidateOnboarding(onboarding.candidate_id);
  return {};
}

export async function removeGoal(goalId: string): Promise<{ error?: string }> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_goals")
    .select("id, onboarding:onboardings(candidate_id)")
    .eq("id", goalId)
    .maybeSingle();
  if (!data) return { error: "Objectif introuvable." };

  const { error } = await supabase.from("onboarding_goals").delete().eq("id", goalId);
  if (error) return { error: userError("removeGoal", error, ERROR_MESSAGE.objectif) };

  const candidateId = (data.onboarding as unknown as { candidate_id: string } | null)?.candidate_id;
  if (candidateId) revalidateOnboarding(candidateId);
  return {};
}

// ─── Validation du plan ─────────────────────────────────────────────────────

/**
 * Valide le plan : l'intégration devient active et le calendrier des points de
 * entretiens est créé : J1 le jour de l'arrivée, puis J30, J60 et J90.
 *
 * Les objectifs restés vides sont supprimés au passage : une carte ajoutée
 * puis laissée vierge ne doit pas se retrouver dans le bilan J90.
 * Rejouer l'action ne recrée rien (index unique par créneau) — elle sert aussi
 * à rattraper un calendrier partiellement créé.
 */
export async function validateOnboarding(onboardingId: string): Promise<{ error?: string }> {
  const { onboarding, supabase } = await assertOwnedOnboarding(onboardingId);

  await supabase.from("onboarding_goals").delete().eq("onboarding_id", onboarding.id).eq("label", "");

  const { error: statusError } = await supabase
    .from("onboardings")
    .update({ status: "actif", updated_at: new Date().toISOString() })
    .eq("id", onboarding.id);
  if (statusError) return { error: userError("validateOnboarding", statusError, ERROR_MESSAGE.plan) };

  // Le calendrier ne dépend pas de l'ordre : valider le plan sans date le
  // laisse en attente, fixer la date le créera.
  const synced = await syncInterviewSchedule({ ...onboarding, status: "actif" });
  if (synced.error) return { error: synced.error };

  revalidateOnboarding(onboarding.candidate_id);
  return {};
}

/**
 * Crée ou replanifie les quatre entretiens de l'intégration.
 *
 * Appelée après la validation du plan ET après un changement de date : les deux
 * conditions peuvent tomber dans n'importe quel ordre, c'est cette fonction qui
 * vérifie qu'elles sont réunies plutôt que ses appelants — sinon la moitié des
 * chemins d'appel oublieraient un cas.
 *
 * Un entretien déjà mené garde sa date : elle raconte ce qui s'est passé. Seuls
 * les entretiens encore à venir suivent le report.
 */
async function syncInterviewSchedule(onboarding: Onboarding): Promise<{ error?: string }> {
  if (onboarding.status === "brouillon" || !onboarding.start_date) return {};

  const supabase = await createClient();
  const existing = await getIntegrationInterviews(onboarding.candidate_id);
  const start = new Date(`${onboarding.start_date}T09:00:00`);

  for (const slot of planInterviews(start)) {
    const match = existing.find((i) => i.type === slot.type);

    if (!match) {
      const { error } = await supabase.from("interviews").insert({
        candidate_id: onboarding.candidate_id,
        type: slot.type,
        scheduled_at: slot.scheduledAt.toISOString(),
      });
      if (error) return { error: userError("syncInterviewSchedule.insert", error, ERROR_MESSAGE.plan) };
      continue;
    }

    if (match.status !== "termine" && match.scheduled_at !== slot.scheduledAt.toISOString()) {
      const { error } = await supabase
        .from("interviews")
        .update({ scheduled_at: slot.scheduledAt.toISOString() })
        .eq("id", match.id);
      if (error) return { error: userError("syncInterviewSchedule.reschedule", error, ERROR_MESSAGE.plan) };
    }
  }

  return {};
}

// ─── Origine des liens publics ──────────────────────────────────────────────
// NEXT_PUBLIC_SITE_URL fait foi quand elle est définie ; sinon on reconstruit
// l'origine depuis la requête, pour que le lien soit cliquable en local comme
// en préproduction sans configuration supplémentaire.
async function requestOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const headerList = await headers();
  return `${headerList.get("x-forwarded-proto") ?? "http"}://${headerList.get("host") ?? "localhost:3000"}`;
}

// ─── Invitation aux préférences de travail ──────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteResult = { error?: string; url?: string; sent?: boolean };

/**
 * Invite le collaborateur à renseigner ses préférences de travail.
 *
 * Le lien est émis ici, seule son
 * empreinte (purpose `work_preferences`) est stockée, et le rappeler régénère
 * le lien en invalidant le précédent. L'URL est toujours renvoyée pour être
 * copiée et partagée par le canal que le manager préfère.
 *
 * `email` est facultatif : Noa ne connaît pas l'adresse du collaborateur et ne
 * la stocke pas ici — elle ne sert qu'à cet envoi. Sans adresse, seul le lien
 * est produit.
 */
export async function issueWorkPreferencesLink(
  onboardingId: string,
  email: string | null,
): Promise<InviteResult> {
  const { onboarding, supabase } = await assertOwnedOnboarding(onboardingId);

  // Aucun garde sur l'état du plan : les préférences se demandent dès que la
  // personne est recrutée. Elles mettent du temps à revenir, et elles servent
  // justement à préparer le plan — les faire attendre sa validation inversait
  // l'ordre utile.
  const to = email?.trim() || null;
  if (to !== null && !EMAIL_PATTERN.test(to)) {
    return { error: "Adresse e-mail invalide." };
  }

  const existing = await getWorkPreferences(onboarding.id);
  if (existing?.status === "completed") {
    return { error: "Les préférences de travail ont déjà été complétées." };
  }

  const token = generateToken();
  const now = new Date();
  const row = {
    onboarding_id: onboarding.id,
    status: "invited" as const,
    token_hash: hashToken("work_preferences", token),
    token_expires_at: tokenExpiryFor(now).toISOString(),
    invited_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("onboarding_work_preferences")
    .upsert(row, { onConflict: "onboarding_id" });
  if (error) return { error: userError("issueWorkPreferencesLink", error, ERROR_MESSAGE.invitation) };

  const origin = await requestOrigin();
  const url = publicUrl("work_preferences", token, origin);
  revalidateOnboarding(onboarding.candidate_id);

  if (!to) return { url, sent: false };
  if (!isEmailConfigured()) {
    return { url, sent: false, error: "L'envoi d'e-mail n'est pas configuré. Le lien reste copiable ci-dessous." };
  }

  const { data: candidate } = await supabase
    .from("candidates")
    .select("first_name")
    .eq("id", onboarding.candidate_id)
    .maybeSingle();

  try {
    await sendWorkPreferencesInvite({
      to,
      firstName: (candidate?.first_name as string | undefined) ?? "",
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

// ─── Conclusion d'un entretien ──────────────────────────────────────────────

const CONCLUSIONS: ManagerConclusion[] = ["conforme", "ajustements", "attention"];

/**
 * Ce que le manager retient d'un entretien. Volontairement léger : une issue
 * parmi trois et une note facultative. Aucune de ces issues ne porte sur la
 * poursuite du contrat — Noa réunit les faits, la décision reste hors de
 * l'outil.
 */
export async function saveInterviewConclusion(
  interviewId: string,
  conclusion: string,
  note: string,
): Promise<{ error?: string }> {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) redirect("/connexion");

  if (!CONCLUSIONS.includes(conclusion as ManagerConclusion)) {
    return { error: "Conclusion invalide." };
  }

  const supabase = await createClient();
  // RLS `candidate scoped all` sur interviews : un entretien d'une autre
  // entreprise n'est pas lisible, la requête ne renvoie rien.
  const { data } = await supabase
    .from("interviews")
    .select("id, candidate_id")
    .eq("id", interviewId)
    .maybeSingle();
  if (!data) return { error: "Entretien introuvable." };

  const { error } = await supabase.from("onboarding_interview_conclusions").upsert(
    {
      interview_id: interviewId,
      conclusion,
      note: note.trim() || null,
      decided_by: recruiter.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "interview_id" },
  );
  if (error) return { error: userError("saveInterviewConclusion", error, ERROR_MESSAGE.bilan) };

  revalidateOnboarding(data.candidate_id as string);
  return {};
}
