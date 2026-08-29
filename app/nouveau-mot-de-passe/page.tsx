"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NoaLogo, Btn, InputField } from "@/components/noa/ui-primitives";
import { updatePassword, type NewPasswordState } from "./actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/noa/auth";

const initialState: NewPasswordState = {};
const poppins = { fontFamily: "Poppins, sans-serif" };

export default function NewPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <Link href="/" aria-label="Retour à l'accueil" className="inline-flex flex-none">
          <NoaLogo scale={0.85} />
        </Link>
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={poppins}>
            Un nouveau<br />mot de passe.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Choisissez-en un que vous n'utilisez nulle part ailleurs. Vous serez connectée juste après.
          </p>
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <form action={formAction} className="w-full max-w-sm py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>

          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={poppins}>Nouveau mot de passe</h2>
          <p className="text-gray-400 text-sm mb-8">
            {MIN_PASSWORD_LENGTH} caractères minimum.
          </p>

          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-6">
              <p className="text-sm text-red-500">{state.error}</p>
            </div>
          )}

          <div className="mb-4">
            <InputField
              label="Nouveau mot de passe"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="mb-6">
            <InputField
              label="Confirmer le mot de passe"
              type="password"
              name="confirmation"
              placeholder="••••••••"
              required
            />
          </div>

          <Btn variant="primary" size="lg" className="w-full justify-center" type="submit" disabled={pending}>
            {pending ? "Mise à jour..." : "Enregistrer et continuer"}
            <ChevronRight size={17} />
          </Btn>
        </form>
      </div>
    </div>
  );
}
