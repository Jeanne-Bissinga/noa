import type { Metadata } from "next";
import { recordNoticeShown, resolveWorkPreferencesToken } from "@/lib/noa/preferences/tokens";
import { questionsForDimensions } from "@/lib/noa/preferences/questions";
import { NOTICE_VERSION } from "@/lib/noa/preferences/information-notice";
import { PublicShell } from "@/app/integration/public-shell";
import { PreferencesFlow } from "./preferences-flow";
import { ThankYou } from "./thank-you";

// Page publique des préférences de travail : la seule page de Noa accessible
// sans compte.
//
// Rien du reste du produit n'est joignable d'ici — pas de sidebar, pas de lien
// vers Noa. La page ne connaît que le prénom, l'état du questionnaire et les
// réponses déjà données : ni scorecard, ni notes, ni score, ni décision, ni
// les autres candidats.
//
// Le questionnaire posé est calculé ici, côté serveur. Aujourd'hui, toujours
// les 24 questions : `questionsForDimensions()` sans argument. Le jour où une
// sélection sera écrite en base, c'est le seul endroit à changer.

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

  // Horodatage de la présentation du texte d'information, au rendu : c'est le
  // moment réel où il s'affiche, et cela évite un aller-retour depuis le
  // navigateur. Écrit une seule fois ; un échec n'empêche jamais de répondre.
  if (!preferences.noticeAlreadyRecorded) {
    await recordNoticeShown(preferences.preferencesId, NOTICE_VERSION);
  }

  return (
    <PublicShell footer="Ces informations servent à préparer vos prochains échanges. Elles ne constituent pas une évaluation.">
      <PreferencesFlow
        token={token}
        firstName={preferences.firstName}
        questions={questionsForDimensions()}
        initialAnswers={preferences.answers}
      />
    </PublicShell>
  );
}
