"use server";

// Réservé à un seul compte de test : contrôle l'affichage du bouton "Remplir
// avec des données test", qui ne fait qu'appeler des setState côté client
// (aucune écriture en base ici).
import { getCurrentRecruiter } from "@/lib/noa/queries";
import { TEST_USER_ID } from "@/lib/noa/test-account";

export async function isTestFillAccount(): Promise<boolean> {
  const recruiter = await getCurrentRecruiter();
  return recruiter?.user_id === TEST_USER_ID;
}
