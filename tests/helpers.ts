import type { SupabaseClient } from "@supabase/supabase-js";

/** Crée une company + mission + candidat de test, prêts à recevoir des entretiens/décisions. */
export async function seedCandidate(supabase: SupabaseClient) {
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: `Test Co ${Date.now()}` })
    .select("id")
    .single();
  if (companyError) throw companyError;

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .insert({ company_id: company.id, title: "Mission test" })
    .select("id")
    .single();
  if (missionError) throw missionError;

  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .insert({
      company_id: company.id,
      mission_id: mission.id,
      first_name: "Test",
      last_name: "Candidat",
    })
    .select("id")
    .single();
  if (candidateError) throw candidateError;

  return { companyId: company.id as string, missionId: mission.id as string, candidateId: candidate.id as string };
}

/** Supprime la company : cascade sur mission, candidat, et tout ce qui en dépend. */
export async function cleanupCompany(supabase: SupabaseClient, companyId: string) {
  await supabase.from("companies").delete().eq("id", companyId);
}
