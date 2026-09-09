import { createClient } from "@/lib/supabase/server";
import { isIntegrationInterview } from "@/lib/noa/labels";
import type {
  Candidate,
  Interview,
  Mission,
  Onboarding,
  OnboardingAction,
  OnboardingGoal,
  OnboardingInterviewConclusion,
  OnboardingWorkPreferences,
} from "@/lib/noa/types";

// Lectures de l'intégration, sur le modèle de lib/noa/queries.ts : client
// Supabase de session, RLS active, aucune vérification d'entreprise en dur
// ici — c'est la policy `company scoped` qui l'assure.

export async function getOnboardingByCandidate(candidateId: string): Promise<Onboarding | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboardings")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return data as Onboarding | null;
}

export async function getOnboardingGoals(onboardingId: string): Promise<OnboardingGoal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_goals")
    .select("*")
    .eq("onboarding_id", onboardingId)
    .order("phase", { ascending: true })
    .order("position", { ascending: true });
  return (data ?? []) as OnboardingGoal[];
}

/**
 * Les entretiens d'intégration d'une personne, triés par date.
 *
 * Ils vivent dans la même table que les entretiens de recrutement : le filtre
 * sur le type est donc la seule chose qui les distingue, et la RLS par candidat
 * s'applique sans qu'on ait rien à ajouter.
 */
export async function getIntegrationInterviews(candidateId: string): Promise<Interview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interviews")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("scheduled_at", { ascending: true });
  return ((data ?? []) as Interview[]).filter((i) => isIntegrationInterview(i.type));
}

export async function getOnboardingActions(onboardingId: string): Promise<OnboardingAction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_actions")
    .select("*")
    .eq("onboarding_id", onboardingId)
    .order("position", { ascending: true });
  return (data ?? []) as OnboardingAction[];
}

export async function getInterviewConclusions(interviewIds: string[]): Promise<OnboardingInterviewConclusion[]> {
  if (interviewIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_interview_conclusions")
    .select("*")
    .in("interview_id", interviewIds);
  return (data ?? []) as OnboardingInterviewConclusion[];
}

export interface OnboardingBundle {
  onboarding: Onboarding;
  goals: OnboardingGoal[];
  /** Les quatre entretiens, triés par date. */
  interviews: Interview[];
  actions: OnboardingAction[];
  conclusions: OnboardingInterviewConclusion[];
  preferences: OnboardingWorkPreferences | null;
}

/**
 * Tout ce qu'un écran d'intégration a besoin de lire. Les entretiens sont
 * chargés d'abord (leurs identifiants conditionnent les deux requêtes
 * suivantes), puis réponses et conclusions en parallèle.
 */
export async function getOnboardingBundle(candidateId: string): Promise<OnboardingBundle | null> {
  const onboarding = await getOnboardingByCandidate(candidateId);
  if (!onboarding) return null;

  const [goals, interviews, actions, preferences] = await Promise.all([
    getOnboardingGoals(onboarding.id),
    getIntegrationInterviews(candidateId),
    getOnboardingActions(onboarding.id),
    getWorkPreferences(onboarding.id),
  ]);

  const conclusions = await getInterviewConclusions(interviews.map((i) => i.id));

  return { onboarding, goals, interviews, actions, conclusions, preferences };
}

// ─── Préférences de travail ─────────────────────────────────────────────────

export async function getWorkPreferences(onboardingId: string): Promise<OnboardingWorkPreferences | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_work_preferences")
    .select("*")
    .eq("onboarding_id", onboardingId)
    .maybeSingle();
  return data as OnboardingWorkPreferences | null;
}

// ─── Vue de pilotage /integrations ──────────────────────────────────────────

export interface IntegrationsData {
  candidates: Candidate[];
  missions: Mission[];
  onboardings: Onboarding[];
  /** Les entretiens d'intégration de toute l'entreprise. */
  interviews: Interview[];
  /** Entretiens dont le guide est préparé : distingue « à préparer » de « à réaliser ». */
  preparedInterviewIds: string[];
  conclusions: OnboardingInterviewConclusion[];
  preferences: OnboardingWorkPreferences[];
}

/**
 * Tout ce que la page /integrations a besoin de lire, en sept requêtes quel que
 * soit le nombre de personnes : les recrutés et les intégrations existantes
 * (une personne peut être dans les deux, ou dans une seule), puis les tables
 * dépendantes par lots `.in()`. Aucune requête par ligne.
 *
 * Le périmètre entreprise est doublement garanti : par le filtre explicite et
 * par la RLS `company scoped`.
 */
export async function getIntegrationsData(companyId: string): Promise<IntegrationsData> {
  const supabase = await createClient();

  const [{ data: recruited }, { data: onboardingRows }] = await Promise.all([
    supabase.from("candidates").select("*").eq("company_id", companyId).eq("status", "Recrute"),
    supabase.from("onboardings").select("*").eq("company_id", companyId),
  ]);

  const onboardings = (onboardingRows ?? []) as Onboarding[];
  let candidates = (recruited ?? []) as Candidate[];

  // Intégrations dont le candidat n'est plus « Recruté » (statut corrigé après
  // coup) : on le charge quand même, l'intégration existe.
  const known = new Set(candidates.map((c) => c.id));
  const missingIds = onboardings.map((o) => o.candidate_id).filter((id) => !known.has(id));
  if (missingIds.length > 0) {
    const { data: extra } = await supabase.from("candidates").select("*").in("id", missingIds);
    candidates = [...candidates, ...((extra ?? []) as Candidate[])];
  }

  const missionIds = [...new Set(candidates.map((c) => c.mission_id).filter(Boolean))];
  const onboardingIds = onboardings.map((o) => o.id);

  const candidateIds = candidates.map((c) => c.id);

  const [{ data: missions }, { data: allInterviews }, { data: preferences }] = await Promise.all([
    missionIds.length ? supabase.from("missions").select("*").in("id", missionIds) : Promise.resolve({ data: [] }),
    candidateIds.length
      ? supabase.from("interviews").select("*").in("candidate_id", candidateIds)
      : Promise.resolve({ data: [] }),
    onboardingIds.length
      ? supabase.from("onboarding_work_preferences").select("*").in("onboarding_id", onboardingIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Les entretiens de recrutement sont écartés ici : ils n'ont rien à faire
  // dans la vue de pilotage de l'intégration.
  const interviews = ((allInterviews ?? []) as Interview[]).filter((i) => isIntegrationInterview(i.type));
  const interviewIds = interviews.map((i) => i.id);

  const [conclusions, { data: guides }] = await Promise.all([
    getInterviewConclusions(interviewIds),
    interviewIds.length
      ? supabase.from("interview_guides").select("interview_id").in("interview_id", interviewIds)
      : Promise.resolve({ data: [] }),
  ]);
  const preparedInterviewIds = ((guides ?? []) as { interview_id: string }[]).map((g) => g.interview_id);

  return {
    candidates,
    missions: (missions ?? []) as Mission[],
    onboardings,
    interviews,
    preparedInterviewIds,
    conclusions,
    preferences: (preferences ?? []) as OnboardingWorkPreferences[],
  };
}
