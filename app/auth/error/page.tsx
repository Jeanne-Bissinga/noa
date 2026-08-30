"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NoaLogo, Btn, BackLink } from "@/components/noa/ui-primitives";

const poppins = { fontFamily: "Poppins, sans-serif" };

// Supabase renvoie la cause de l'échec dans le fragment de l'URL
// (#error=...&error_code=...), qui n'est jamais transmis au serveur : seul le
// navigateur peut le lire, d'où cette page côté client.
const MESSAGES: Record<string, string> = {
  otp_expired:
    "Ce lien a expiré ou a déjà été utilisé. Pour votre sécurité, un lien de réinitialisation ne fonctionne qu'une seule fois et pour une durée limitée.",
  access_denied:
    "Ce lien n'est plus valide. Il a peut-être déjà servi, ou il a été ouvert depuis un autre appareil que celui qui l'a demandé.",
};

const FALLBACK =
  "Nous n'avons pas pu vous authentifier avec ce lien. Il est probablement expiré ou déjà utilisé.";

export default function AuthErrorPage() {
  const [message, setMessage] = useState(FALLBACK);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("error_code") ?? params.get("error");
    // Le fragment n'existe pas au rendu serveur : ce second rendu est
    // inévitable, c'est le seul moment où la cause de l'échec est lisible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code && MESSAGES[code]) setMessage(MESSAGES[code]);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 inline-flex rounded-2xl bg-[#010101] px-4 py-3"><NoaLogo scale={0.75} /></div>

        <BackLink href="/connexion" label="Retour à la connexion" />

        <h1 className="text-2xl font-bold text-[#010101] mb-2" style={poppins}>
          Lien expiré
        </h1>
        <p className="text-sm leading-relaxed text-gray-500 mb-8">{message}</p>

        <Link href="/mot-de-passe-oublie" className="block">
          <Btn variant="primary" size="lg" className="w-full justify-center">
            Demander un nouveau lien
          </Btn>
        </Link>
      </div>
    </div>
  );
}
