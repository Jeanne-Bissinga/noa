"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Send, X } from "lucide-react";
import { Btn, InputField } from "@/components/noa/ui-primitives";
import { useToast } from "@/components/noa/toast";
import { ERROR_MESSAGE } from "@/lib/noa/errors";
import { workPreferencesInviteIntro } from "@/lib/noa/labels";
import { issueWorkPreferencesLink } from "./actions";

// Modale d'invitation aux préférences de travail.
//
// L'adresse e-mail du candidat peut déjà être connue : elle préremplit le
// champ, mais rien n'est stocké depuis cet écran — elle ne sert qu'à l'envoi.
// « Copier le lien » n'en a pas besoin, le recruteur le partage par le canal
// qu'il veut.
//
// La phrase d'introduction vit dans labels.ts : composée en JSX autour de
// {firstName}, elle perdait l'espace après le prénom (cf. le commentaire de
// workPreferencesInviteIntro).
//
// Une seule logique derrière les deux boutons (issueWorkPreferencesLink).

export function InvitePreferencesModal({
  candidateId,
  firstName,
  candidateEmail,
  onClose,
}: {
  candidateId: string;
  firstName: string;
  candidateEmail: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(candidateEmail ?? "");
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const issue = (withEmail: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const result = await issueWorkPreferencesLink(candidateId, withEmail ? email : null);
      if (result.url) setUrl(result.url);
      if (result.error) {
        setMessage(result.error);
      } else if (result.sent) {
        setMessage(`Invitation envoyée à ${email.trim()}.`);
        toast("Invitation envoyée");
      } else if (result.url && !withEmail) {
        // Le lien reste affiché sous la modale dans tous les cas : si la copie
        // échoue, le manager peut le sélectionner à la main plutôt que de
        // devoir en régénérer un.
        setMessage("Lien généré. Partagez-le par le canal de votre choix.");
        try {
          await navigator.clipboard.writeText(result.url);
          toast("Lien copié");
        } catch {
          toast(ERROR_MESSAGE.copieLien, "error");
        }
      }
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-black/[0.06] w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-base font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Inviter {firstName} à compléter ses préférences de travail
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-gray-300 hover:text-gray-500" aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          {workPreferencesInviteIntro(firstName)}
        </p>

        <InputField
          label="Adresse e-mail"
          type="email"
          placeholder="prenom@entreprise.com"
          value={email}
          onChange={setEmail}
          hint="Reprise de la fiche candidat. Modifiable pour cet envoi ; rien n'est enregistré ici."
        />

        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <Btn variant="primary" onClick={() => issue(true)} disabled={pending || !email.trim()}>
            <Send size={13} />
            {pending ? "Envoi…" : "Envoyer l'invitation"}
          </Btn>
          <Btn variant="secondary" onClick={() => issue(false)} disabled={pending}>
            <Copy size={13} />
            Copier le lien
          </Btn>
        </div>

        {message && <p className="text-[11px] text-gray-500 mt-3">{message}</p>}
        {url && (
          <p className="text-[10px] text-gray-400 mt-2 break-all bg-gray-50 rounded-lg px-2.5 py-2 font-mono">{url}</p>
        )}

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          Chaque envoi ou copie génère un nouveau lien : le précédent cesse de fonctionner.
        </p>
      </div>
    </div>
  );
}
