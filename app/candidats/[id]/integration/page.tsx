import { permanentRedirect } from "next/navigation";

// L'intégration a sa propre section (/integrations/[id]) : elle a dépassé le
// stade de sous-page d'une fiche de recrutement. Cette redirection reste pour
// les liens déjà envoyés et les signets — le segment est le même identifiant
// de candidat des deux côtés, la correspondance est exacte.
export default async function LegacyIntegrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  permanentRedirect(`/integrations/${id}`);
}
