"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRecruiter, getMission, getCandidates } from "@/lib/noa/queries";

async function assertOwnedMission(missionId: string) {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    redirect("/connexion");
  }
  const mission = await getMission(missionId);
  if (!mission || mission.company_id !== recruiter.company_id) {
    throw new Error("Mission introuvable.");
  }
  return { recruiter, mission };
}

// ─── Annuler / réactiver une campagne ──────────────────────────────────────
// "annule" est un statut réversible : la mission sort des vues actives mais
// rien n'est supprimé, candidats et historique restent consultables.
export async function cancelMission(missionId: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  await supabase
    .from("missions")
    .update({ status: "annule", updated_at: new Date().toISOString() })
    .eq("id", mission.id);

  revalidatePath("/missions");
  revalidatePath(`/missions/${mission.id}`);
}

export async function reactivateMission(missionId: string) {
  const { mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  // Repart au dernier état cohérent avant l'annulation : "en_cours" si la
  // fiche de poste avait déjà été validée (process_step >= 1), "brouillon" sinon.
  const status = mission.process_step >= 1 ? "en_cours" : "brouillon";

  await supabase
    .from("missions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", mission.id);

  revalidatePath("/missions");
  revalidatePath(`/missions/${mission.id}`);
}

// ─── Suppression définitive ─────────────────────────────────────────────────
// missions.id est référencé par candidates.mission_id en "on delete cascade"
// (cf. scripts/001_noa_schema.sql) : supprimer une mission avec des candidats
// efface donc aussi ces candidats et tout leur historique (entretiens,
// grilles, synthèses, décisions). C'est un choix explicite du recruteur, pas
// un effet de bord silencieux : s'il y a des candidats, `confirmCandidateDeletion`
// doit être passé à true (l'UI le fait uniquement après un choix clair), sinon
// on bloque côté serveur pour ne jamais dépendre uniquement d'un garde-fou UI.
export async function deleteMissionPermanently(missionId: string, confirmCandidateDeletion = false) {
  const { recruiter, mission } = await assertOwnedMission(missionId);
  const supabase = await createClient();

  const candidates = await getCandidates(recruiter.company_id, { missionId: mission.id });
  if (candidates.length > 0 && !confirmCandidateDeletion) {
    throw new Error(
      `Cette mission a ${candidates.length} candidat${candidates.length > 1 ? "s rattachés" : " rattaché"}. Confirmez explicitement leur suppression, ou annulez la campagne à la place pour tout conserver.`,
    );
  }

  const { error } = await supabase.from("missions").delete().eq("id", mission.id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/missions");
  redirect("/missions");
}
