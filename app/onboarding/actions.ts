"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export type OnboardingAnswers = {
  activityDescription: string;
  sector: string;
  techStack: string[];
  cultureValues: string;
  hrChallenges: string;
};

export async function completeOnboarding(answers: OnboardingAnswers) {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    redirect("/connexion");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("companies")
    .update({
      activity_description: answers.activityDescription || null,
      sector: answers.sector || null,
      tech_stack: answers.techStack,
      culture_values: answers.cultureValues || null,
      hr_challenges: answers.hrChallenges || null,
      onboarding_completed: true,
    })
    .eq("id", recruiter.company_id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard");
}
