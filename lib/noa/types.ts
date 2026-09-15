// TypeScript types mirroring scripts/001_noa_schema.sql exactly.
// Keep field names/nullability/unions in sync with the SQL migration.

export type RecruiterRole = "admin" | "recruteur";

export type MissionStatus = "brouillon" | "en_cours" | "pourvu" | "annule";

export type MissionSkillCategory = "technique" | "relationnelle" | "comportementale";

export type CandidateStatus = "Screening" | "Topgrading" | "Decision finale" | "Non retenu" | "Recrute";

export type StageStatus = "done" | "current" | "pending" | "none";

/** Étapes d'entretien du recrutement. */
export type RecruitmentInterviewType = "screening" | "topgrading";

/**
 * Les quatre entretiens des 90 premiers jours. Ils vivent dans la même table
 * que ceux du recrutement : même guide, même enregistrement, même
 * transcription, même synthèse — il n'y a pas deux moteurs d'entretien.
 */
export type IntegrationInterviewType =
  | "integration_j1"
  | "integration_j30"
  | "integration_j60"
  | "integration_j90";

export type InterviewType = RecruitmentInterviewType | IntegrationInterviewType;

export type InterviewStatus = "planifie" | "termine";

export type SynthesisAuthor = "noa" | "recruiter";

export type DecisionStage = "screening" | "topgrading" | "final";

export type DecisionStatus = "retenu" | "non_retenu" | "reporte";

export interface Company {
  id: string;
  name: string;
  siret: string | null;
  sector: string | null;
  team_size: string | null;
  main_objective: string | null;
  activity_description: string | null;
  culture_values: string | null;
  tech_stack: string[];
  hr_challenges: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Recruiter {
  id: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  role: RecruiterRole;
  created_at: string;
}

export interface RecruiterWithCompany extends Recruiter {
  company: Company;
}

export interface Mission {
  id: string;
  company_id: string;
  created_by: string | null;
  title: string;
  reason: string | null;
  reason_detail: string | null;
  status: MissionStatus;
  process_step: number;
  starting_point: string | null;
  target_objective: string | null;
  mission_text: string | null;
  final_spec_text: string | null;
  // false tant que les 5 étapes ne sont pas franchies et la fiche de poste
  // validée : la campagne existe en base mais n'est listée nulle part.
  finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissionObjective {
  id: string;
  mission_id: string;
  label: string;
  metric: string | null;
  deadline: string | null;
  threshold: string | null;
  position: number;
}

export interface MissionSkill {
  id: string;
  mission_id: string;
  category: MissionSkillCategory;
  name: string;
  position: number;
  justification: string | null;
}

export interface Candidate {
  id: string;
  company_id: string;
  mission_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  title: string | null;
  location: string | null;
  summary: string | null;
  cv_url: string | null;
  attachments: unknown[];
  source: string | null;
  status: CandidateStatus;
  screening_status: StageStatus;
  topgrading_status: StageStatus;
  decision_status: StageStatus;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateExperience {
  id: string;
  candidate_id: string;
  role: string | null;
  company: string | null;
  period: string | null;
  bullets: string[];
  position: number;
}

export interface CandidateSkill {
  id: string;
  candidate_id: string;
  name: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  type: InterviewType;
  format: string | null;
  duration_minutes: number | null;
  status: InterviewStatus;
  recording_status: string;
  transcript: string | null;
  interviewer_id: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EvaluationGrid {
  id: string;
  interview_id: string;
  mission_id: string | null;
  criteria: unknown[];
  answers: Record<string, unknown>;
  notes: Record<string, unknown>;
  /** Horodatage de l'évaluation par noa, distinct de `updated_at` (aussi modifié par l'édition des critères par le recruteur). Trace exigée par l'article 12 du règlement IA. */
  answers_evaluated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewGuide {
  id: string;
  interview_id: string;
  questions: unknown[];
  topics: unknown[];
  format: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface Synthesis {
  id: string;
  candidate_id: string;
  interview_id: string | null;
  authored_by: SynthesisAuthor;
  content: string | null;
  advice: string | null;
  created_at: string;
}

export interface Decision {
  id: string;
  candidate_id: string;
  stage: DecisionStage;
  status: DecisionStatus;
  reason: string | null;
  decided_by: string | null;
  decided_at: string;
}

// ─── Profil DISC ────────────────────────────────────────────────────────────
// Seul rescapé des types de l'intégration 30-60-90 : DiscProfile sert encore à
// lire un test DISC déclaré par un candidat (lib/noa/preferences/).
//
// Les tables onboarding_* et les lignes interviews.type = 'integration_*'
// existent toujours en base — rien n'a été supprimé par scripts/018 — mais plus
// aucun code ne les lit. Leurs types sont partis avec leurs lecteurs : les
// laisser aurait fait croire à une fonctionnalité vivante.

export type DiscProfile = "D" | "I" | "S" | "C";

// ─── Préférences de travail (scripts/012 et 018) ────────────────────────────

export type WorkPreferencesStatus = "invited" | "completed";

export type WorkPreferencesSource = "declared_test" | "noa_questionnaire";

export type AssessmentType = "disc" | "mbti" | "big_five" | "noa_work_preferences";

/** Les six préférences mesurées par le questionnaire Noa. */
export type WorkPreferenceDimension =
  | "structure"
  | "autonomy"
  | "interaction"
  | "initiative"
  | "change"
  | "feedback";

/** Lecture d'une préférence : orientation nette, ou pas de préférence marquée. */
export type PreferenceOrientation = "low_preference" | "mixed" | "high_preference";

export type BigFiveLevel = "low" | "medium" | "high";

export type BigFiveTrait =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "emotional_stability";

export interface OnboardingWorkPreferences {
  id: string;
  /** Rattachement au recrutement (scripts/018). Nul pour les lignes historiques. */
  candidate_id: string | null;
  /**
   * Rattachement historique à une intégration. Le préfixe du nom de table vient
   * de là ; plus rien ne le renseigne depuis que les préférences se collectent
   * pendant le recrutement.
   */
  onboarding_id: string | null;
  status: WorkPreferencesStatus;
  source: WorkPreferencesSource | null;
  assessment_type: AssessmentType | null;
  /** Forme validée côté serveur selon assessment_type (cf. declared-tests.ts, work-preferences.ts). */
  structured_result: Record<string, unknown> | null;
  questionnaire_answers: Record<string, number> | null;
  questionnaire_scores: Record<string, unknown> | null;
  token_hash: string | null;
  token_expires_at: string | null;
  /**
   * Version du texte « Pourquoi ces informations ? » affiché au candidat, et
   * date de son affichage. Traçabilité seulement : ce n'est pas un
   * consentement, et rien dans le produit ne dépend de ces deux valeurs.
   */
  notice_version: string | null;
  notice_shown_at: string | null;
  /** Sujets à approfondir figés à la préparation de l'entretien technique (cf. preferences/briefing.ts). */
  interview_briefing: unknown | null;
  briefing_generated_at: string | null;
  invited_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
