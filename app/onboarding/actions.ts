"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export type OnboardingAnswers = {
  activityDescription: string;
  sector: string;
  techStack: string[];
  cultureValues: string;
  hrChallenges: string;
};

// L'action ne redirige pas elle-même : Next implémente `redirect()` en levant
// une exception, que le formulaire attrapait et affichait telle quelle, en
// rouge et en anglais, alors que l'enregistrement avait réussi. Elle renvoie
// donc une destination, et c'est le formulaire qui navigue.
export type CompleteOnboardingResult = {
  error?: string;
  redirectTo?: string;
};

export async function completeOnboarding(answers: OnboardingAnswers): Promise<CompleteOnboardingResult> {
  const recruiter = await getCurrentRecruiter();

  if (!recruiter) {
    return { redirectTo: "/connexion" };
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
    console.error("Enregistrement de l'onboarding échoué :", error.message);
    return { error: "Nous n'avons pas pu enregistrer vos réponses. Merci de réessayer." };
  }

  return { redirectTo: "/dashboard" };
}
