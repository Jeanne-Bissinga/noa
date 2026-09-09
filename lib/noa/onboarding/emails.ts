import "server-only";
import { sendMail, isEmailConfigured } from "@/lib/noa/email";
import { publicUrl } from "@/lib/noa/onboarding/tokens";

// Message adressé au collaborateur.
//
// Un seul, avant son arrivée : l'invitation à renseigner ses préférences de
// travail. Le ton compte autant que le contenu — c'est un accompagnement, pas
// un contrôle.
//
// Réutilise le transport existant (lib/noa/email.ts, Gmail SMTP). Aucun
// fournisseur ajouté, et jamais de destinataire par défaut : chaque envoi
// nomme le sien.

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function layout(paragraphs: string[], cta: { href: string; label: string }, footer: string): string {
  return `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
      ${paragraphs.map((p) => `<p>${p}</p>`).join("")}
      <p style="margin:24px 0">
        <a href="${escapeHtml(cta.href)}" style="background:#99BAF8;color:#010101;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;display:inline-block">
          ${escapeHtml(cta.label)}
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px">${escapeHtml(footer)}</p>
    </div>`;
}

// ─── Préférences de travail ─────────────────────────────────────────────────

export interface WorkPreferencesInviteInput {
  to: string;
  firstName: string;
  token: string;
  origin: string;
}

export async function sendWorkPreferencesInvite(input: WorkPreferencesInviteInput): Promise<void> {
  const url = publicUrl("work_preferences", input.token, input.origin);
  const name = input.firstName.trim();

  const lines = [
    "Dans le cadre de votre intégration, nous vous invitons à compléter vos préférences de travail.",
    "Si vous avez déjà réalisé un test DISC, MBTI ou Big Five, vous pourrez simplement renseigner votre résultat.",
    "Sinon, Noa vous proposera un court questionnaire de 24 questions.",
    "Ces informations servent uniquement à personnaliser certains éléments de votre accompagnement pendant votre prise de poste.",
  ];
  const footer = "Environ 5 minutes.";

  const text = [`Bonjour ${name},`, "", ...lines.flatMap((l) => [l, ""]), url, "", footer].join("\n");
  const html = layout(
    [`Bonjour ${escapeHtml(name)},`, ...lines.map(escapeHtml)],
    { href: url, label: "Compléter mes préférences" },
    footer,
  );

  await sendMail({ to: input.to, subject: "Complétez vos préférences de travail", text, html });
}

export { isEmailConfigured };
