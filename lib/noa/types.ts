// TypeScript types mirroring scripts/001_noa_schema.sql exactly.
// Keep field names/nullability/unions in sync with the SQL migration.

export type RecruiterRole = "admin" | "recruteur";

export type MissionStatus = "brouillon" | "en_cours" | "pourvu" | "annule";

export type MissionSkillCategory = "technique" | "relationnelle" | "comportementale";

export type CandidateStatus = "Screening" | "Topgrading" | "Decision finale" | "Non retenu" | "Recrute";

export type StageStatus = "done" | "current" | "pending" | "none";

export type InterviewType = "screening" | "topgrading";

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
