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

// ─── Intégration 30-60-90 (scripts/010_onboarding.sql) ──────────────────────

export type DiscProfile = "D" | "I" | "S" | "C";

export type DiscSource = "manuel" | "externe";

export type OnboardingStatus = "brouillon" | "actif" | "termine";

export type OnboardingPhase = "j30" | "j60" | "j90";

export type OnboardingGoalKind = "numeric" | "qualitative";

export type OnboardingGoalStatus = "non_commence" | "en_cours" | "atteint" | "bloque";





export type ManagerConclusion = "conforme" | "ajustements" | "attention";

export interface Onboarding {
  id: string;
  company_id: string;
  candidate_id: string;
  mission_id: string | null;
  manager_id: string | null;
  status: OnboardingStatus;
  /**
   * Date d'arrivée. null tant que le manager ne l'a pas fixée : l'interface
   * affiche « À définir » et les quatre entretiens ne sont pas encore datés
   * (cf. scripts/013_integration_parcours.sql).
   */
  start_date: string | null;
  mission_text: string | null;
  disc_primary: DiscProfile | null;
  disc_secondary: DiscProfile | null;
  disc_source: DiscSource | null;
  disc_assessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingGoal {
  id: string;
  onboarding_id: string;
  mission_objective_id: string | null;
  phase: OnboardingPhase;
  label: string;
  kind: OnboardingGoalKind;
  metric: string | null;
  target_value: number | null;
  current_value: number | null;
  status: OnboardingGoalStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ActionStatus = "todo" | "done" | "cancelled";

/**
 * Engagement concret pris pendant un entretien. Troisième niveau d'objectif,
 * distinct de l'outcome J90 (Scorecard) et du jalon J30/J60 : ceux-là disent
 * où l'on va, une action dit ce que quelqu'un fait d'ici au prochain échange.
 */
export interface OnboardingAction {
  id: string;
  onboarding_id: string;
  /** Entretien qui l'a décidée. null si celui-ci a été supprimé depuis. */
  source_interview_id: string | null;
  label: string;
  due_date: string | null;
  /** Texte libre : le porteur n'a pas forcément de compte Noa. */
  owner: string | null;
  status: ActionStatus;
  position: number;
  created_at: string;
  completed_at: string | null;
}

/** Ce que le manager retient d'un entretien. Jamais une décision RH. */
export interface OnboardingInterviewConclusion {
  id: string;
  interview_id: string;
  conclusion: ManagerConclusion;
  note: string | null;
  decided_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Préférences de travail (scripts/012_work_preferences.sql) ──────────────

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
  onboarding_id: string;
  status: WorkPreferencesStatus;
  source: WorkPreferencesSource | null;
  assessment_type: AssessmentType | null;
  /** Forme validée côté serveur selon assessment_type (cf. declared-tests.ts, work-preferences.ts). */
  structured_result: Record<string, unknown> | null;
  questionnaire_answers: Record<string, number> | null;
  questionnaire_scores: Record<string, unknown> | null;
  token_hash: string | null;
  token_expires_at: string | null;
  invited_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
