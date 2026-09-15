"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Btn } from "@/components/noa/ui-primitives";
import { STEP_STATUS_LABEL, type WorkPreferencesStepStatus } from "@/lib/noa/preferences/status";
import {
  GUIDANCE_FOOTNOTE,
  guidanceSourceLine,
  type ConductAdviceItem,
} from "@/lib/noa/preferences/communication";
import { InvitePreferencesModal } from "./invite-modal";

// L'étape « Préférences de travail », entre le premier entretien et
// l'entretien technique.
//
// Posée sous la frise et non dedans : c'est une proposition faite au candidat,
// pas une étape du processus. Tant que la réponse n'est pas arrivée, la carte
// le dit à voix haute — sans quoi un statut « Non invité » se lirait comme une
// case à cocher avant de pouvoir continuer.
//
// ─── Une fois complétée, la carte ne navigue plus ───────────────────────────
// Elle a porté un bouton « Voir les conseils pour l'échange » qui menait à la
// page de préparation — la même destination que « Préparer l'entretien » dans
// la frise. Deux libellés pour un seul endroit se lisent comme deux actions
// différentes. La carte montre donc les conseils sur place, et la navigation
// appartient au seul CTA de la frise.
//
// Ce qui est affiché ici est un aperçu ; la page de préparation les remet dans
// le contexte de l'entretien, avec les sujets à approfondir. Ce n'est pas une
// duplication à corriger : les deux endroits ne servent pas au même moment.
//
// Rien ici ne participe à l'évaluation : ni note, ni score, ni classement. Et
// jamais l'étiquette brute d'un test déclaré — cf. guidanceSourceLine.

const CHIP: Record<WorkPreferencesStepStatus, string> = {
  non_invite: "bg-gray-100 text-gray-500",
  invite: "bg-gray-100 text-gray-500",
  complete: "bg-[#75DA9F]/15 text-[#1e8f52]",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function PreferencesStepCard({
  candidateId,
  firstName,
  candidateEmail,
  status,
  guidance,
  invitedAt,
  expiresAt,
}: {
  candidateId: string;
  firstName: string;
  candidateEmail: string | null;
  status: WorkPreferencesStepStatus;
  /** Conseils de conduite, calculés côté serveur. Vide tant que rien n'est complété. */
  guidance: ConductAdviceItem[];
  invitedAt: string | null;
  expiresAt: string | null;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const expired = Boolean(expiresAt) && new Date(expiresAt as string) <= new Date();
  const complete = status === "complete";
  // Tous les conseils d'une liste viennent de la même source : la lire sur le
  // premier suffit.
  const sourceLine = guidance.length > 0 ? guidanceSourceLine(guidance[0].source) : null;

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="text-xs font-bold text-[#010101]">Préférences de travail</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CHIP[status]}`}>
          {STEP_STATUS_LABEL[status]}
        </span>
      </div>

      {complete ? (
        // Pas de phrase d'introduction : le titre et le statut « Complétées »
        // disent déjà que la personne a répondu. La seule ligne qui reste est
        // celle qui apprend quelque chose — d'où vient le conseil, et avec
        // quelle prudence le lire. Pour le questionnaire Noa, il n'y a rien à
        // relativiser : `guidanceSourceLine` renvoie null et rien ne s'affiche.
        sourceLine && <p className="text-[11px] text-gray-400 leading-relaxed">{sourceLine}</p>
      ) : (
        <>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {firstName} peut décrire ses préférences de travail. Noa en tirera des conseils pour
            conduire l&apos;échange, et des sujets à approfondir rattachés aux compétences attendues
            pour le poste.
          </p>

          <p className="text-[11px] text-gray-400 leading-relaxed mt-1.5">
            Facultatif. Vous pouvez préparer et mener l&apos;entretien technique sans attendre cette
            réponse, et une préférence n&apos;entre dans aucune note.
          </p>
        </>
      )}

      {status === "invite" && invitedAt && (
        <p className="text-[10px] text-gray-400 mt-2.5">
          Invitation envoyée le {formatDate(invitedAt)}
          {expired ? " · lien expiré, renvoyez-en un" : ` · lien valable jusqu'au ${formatDate(expiresAt)}`}
        </p>
      )}

      {!complete && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Btn variant="secondary" size="sm" onClick={() => setInviteOpen(true)}>
            <Send size={12} />
            {status === "non_invite" ? "Inviter à compléter ses préférences" : "Renvoyer le lien"}
          </Btn>
        </div>
      )}

      {complete && guidance.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Pour votre échange avec {firstName}
          </p>
          <ul className="flex flex-col gap-1.5">
            {guidance.map((item) => (
              <li key={item.id} className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{item.action}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">{GUIDANCE_FOOTNOTE}</p>
        </div>
      )}

      {inviteOpen && (
        <InvitePreferencesModal
          candidateId={candidateId}
          firstName={firstName}
          candidateEmail={candidateEmail}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
}
