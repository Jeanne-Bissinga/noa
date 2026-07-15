import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Candidate,
  CandidateExperience,
  CandidateSkill,
  Company,
  Decision,
  EvaluationGrid,
  Interview,
  InterviewGuide,
  InterviewType,
  Mission,
  MissionObjective,
  MissionSkill,
  RecruiterWithCompany,
  Synthesis,
} from "@/lib/noa/types";

/**
 * Returns the recruiter row (+ joined company) for the currently logged-in
 * user, or null if there is no session or no recruiter/company yet.
 */
export async function getCurrentRecruiter(): Promise<RecruiterWithCompany | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("recruiters")
    .select("*, company:companies(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return data as unknown as RecruiterWithCompany;
}

/**
 * Standard guard for protected Server Component pages:
 * - redirects to /connexion if there is no authenticated user
 * - redirects to /onboarding if the recruiter/company exists but onboarding
 *   hasn't been completed yet
 */
export async function requireRecruiter(): Promise<RecruiterWithCompany> {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/connexion");
  }

  if (!recruiter.company || recruiter.company.onboarding_completed === false) {
    redirect("/onboarding");
  }

  return recruiter;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  return data as Company | null;
}

export async function getMissions(companyId: string): Promise<Mission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("missions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Mission[];
}

export async function getMission(missionId: string): Promise<Mission | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("missions").select("*").eq("id", missionId).maybeSingle();
  return data as Mission | null;
}

export async function getMissionObjectives(missionId: string): Promise<MissionObjective[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_objectives")
    .select("*")
    .eq("mission_id", missionId)
    .order("position", { ascending: true });
  return (data ?? []) as MissionObjective[];
}

export async function getMissionSkills(missionId: string): Promise<MissionSkill[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mission_skills")
    .select("*")
    .eq("mission_id", missionId)
    .order("position", { ascending: true });
  return (data ?? []) as MissionSkill[];
}

export async function getCandidates(
  companyId: string,
  opts?: { missionId?: string },
): Promise<Candidate[]> {
  const supabase = await createClient();
  let query = supabase.from("candidates").select("*").eq("company_id", companyId);

  if (opts?.missionId) {
    query = query.eq("mission_id", opts.missionId);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data ?? []) as Candidate[];
}

export async function getCandidate(candidateId: string): Promise<Candidate | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("candidates").select("*").eq("id", candidateId).maybeSingle();
  return data as Candidate | null;
}

export async function getCandidateExperiences(candidateId: string): Promise<CandidateExperience[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_experiences")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("position", { ascending: true });
  return (data ?? []) as CandidateExperience[];
}

export async function getCandidateSkills(candidateId: string): Promise<CandidateSkill[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("candidate_skills").select("*").eq("candidate_id", candidateId);
  return (data ?? []) as CandidateSkill[];
}

export async function getInterview(
  candidateId: string,
  type: InterviewType,
): Promise<Interview | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interviews")
    .select("*")
    .eq("candidate_id", candidateId)
    .eq("type", type)
    .maybeSingle();
  return data as Interview | null;
}

export async function getEvaluationGrid(interviewId: string): Promise<EvaluationGrid | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluation_grids")
    .select("*")
    .eq("interview_id", interviewId)
    .maybeSingle();
  return data as EvaluationGrid | null;
}

export async function getInterviewGuide(interviewId: string): Promise<InterviewGuide | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_guides")
    .select("*")
    .eq("interview_id", interviewId)
    .maybeSingle();
  return data as InterviewGuide | null;
}

export async function getSyntheses(candidateId: string): Promise<Synthesis[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("syntheses")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });
  return (data ?? []) as Synthesis[];
}

export async function getDecisions(candidateId: string): Promise<Decision[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("decided_at", { ascending: true });
  return (data ?? []) as Decision[];
}
