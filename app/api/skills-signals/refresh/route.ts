import "server-only";
import { NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";
import { fetchAndStoreSkillsSignals } from "@/lib/noa/skills-signals";

// Déclenché manuellement depuis la Scorecard intelligente ("Actualiser les
// données marché"). N'importe quel recruteur authentifié peut l'appeler : les
// signaux sont une donnée de marché partagée, pas un secret par entreprise.
export async function POST() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const results = await fetchAndStoreSkillsSignals();
  const itemsStored = results.reduce((sum, r) => sum + r.itemsStored, 0);
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({ itemsStored, feeds: results.length, failed });
}
