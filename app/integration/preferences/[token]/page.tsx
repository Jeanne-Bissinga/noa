import type { Metadata } from "next";
import { resolveWorkPreferencesToken } from "@/lib/noa/onboarding/tokens";
import { PublicShell } from "@/app/integration/public-shell";
import { PreferencesFlow } from "./preferences-flow";
import { ThankYou } from "./thank-you";

// Page publique des préférences de travail : la seconde page de Noa accessible
// sans compte. C'est la seule page de Noa accessible sans authentification.
//
// Rien du reste du produit n'est joignable d'ici — pas de sidebar, pas de lien
// vers Noa. La page ne connaît que le prénom, l'état du questionnaire et les
// réponses déjà données : ni scorecard, ni notes, ni décision, ni les autres
// candidats.

export const metadata: Metadata = {
  title: "Vos préférences de travail",
  robots: { index: false, follow: false },
};

const FAILURES = {
  introuvable: {
    title: "Ce lien n'est pas valide",
    body: "Vérifiez que vous avez bien copié l'adresse complète depuis votre message.",
  },
  expire: {
    title: "Ce lien a expiré",
    body: "Rapprochez-vous de votre manager, il pourra vous en envoyer un nouveau.",
  },
  indisponible: {
    title: "Service momentanément indisponible",
    body: "Merci de réessayer dans quelques minutes.",
  },
} as const;

export default async function WorkPreferencesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveWorkPreferencesToken(token);

  if (!resolved.ok) {
    const message = FAILURES[resolved.reason];
    return (
      <PublicShell>
        <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
          {message.title}
        </h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message.body}</p>
      </PublicShell>
    );
  }

  const { preferences } = resolved;

  // Déjà complété : le remerciement, et rien d'autre. Rouvrir le lien ne
  // ramène jamais au questionnaire.
  if (preferences.completed) {
    return (
      <PublicShell>
        <ThankYou />
      </PublicShell>
    );
  }

  return (
    <PublicShell footer="Ces informations servent uniquement à personnaliser certains éléments de votre intégration.">
      <PreferencesFlow token={token} firstName={preferences.firstName} initialAnswers={preferences.answers} />
    </PublicShell>
  );
}
