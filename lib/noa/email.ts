import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Adresse qui reçoit les demandes de démo. Surchargeable via l'environnement,
// avec la boîte Noa par défaut.
export const DEMO_RECIPIENT = process.env.DEMO_RECIPIENT_EMAIL || "noa.recrutement@gmail.com";

let transporter: Transporter | null = null;

// Transport Gmail SMTP. Nécessite un « mot de passe d'application » Google
// (Compte Google -> Sécurité -> Validation en deux étapes -> Mots de passe
// des applications), stocké dans GMAIL_APP_PASSWORD. Renvoie null si la
// configuration est absente, pour que l'appelant puisse le signaler proprement.
function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

export function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail(opts: {
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  const t = getTransporter();
  if (!t) throw new Error("Envoi d'e-mail non configuré (GMAIL_USER / GMAIL_APP_PASSWORD manquants).");

  await t.sendMail({
    from: `Noa <${process.env.GMAIL_USER}>`,
    to: DEMO_RECIPIENT,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  });
}
