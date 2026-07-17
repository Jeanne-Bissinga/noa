"use server";

import { sendMail } from "@/lib/noa/email";

export type DemoState = {
  error?: string;
  message?: string;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function requestDemo(_prevState: DemoState, formData: FormData): Promise<DemoState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const teamSize = String(formData.get("teamSize") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredSlot = String(formData.get("preferredSlot") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!firstName || !lastName || !email || !companyName) {
    return { error: "Merci de remplir tous les champs obligatoires." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Merci d'indiquer une adresse e-mail valide." };
  }

  const rows: [string, string][] = [
    ["Nom", `${firstName} ${lastName}`],
    ["Email", email],
    ["Téléphone", phone || "—"],
    ["Entreprise", companyName],
    ["Taille de l'équipe", teamSize || "—"],
    ["Date souhaitée", preferredDate || "—"],
    ["Créneau", preferredSlot || "—"],
    ["Message", message || "—"],
  ];

  const text = rows.map(([k, v]) => `${k} : ${v}`).join("\n");
  const html = `
    <h2 style="font-family:Arial,sans-serif">Nouvelle demande de démo</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px;color:#6b7280;vertical-align:top"><strong>${escapeHtml(k)}</strong></td><td style="padding:6px 12px;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>`;

  try {
    await sendMail({
      subject: `Demande de démo — ${firstName} ${lastName} (${companyName})`,
      text,
      html,
      replyTo: email,
    });
  } catch (e) {
    console.error("Envoi de la demande de démo échoué :", e);
    return { error: "L'envoi a échoué. Merci de réessayer ou de nous écrire directement." };
  }

  return { message: "Votre demande a bien été envoyée. Nous vous recontactons très vite pour fixer un créneau." };
}
