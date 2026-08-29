"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { NoaLogo, Btn, InputField } from "@/components/noa/ui-primitives";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};
const poppins = { fontFamily: "Poppins, sans-serif" };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <Link href="/" aria-label="Retour à l'accueil" className="inline-flex flex-none">
          <NoaLogo scale={0.85} />
        </Link>
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={poppins}>
            Ça arrive<br />à tout le monde.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Indiquez votre adresse professionnelle : vous recevrez un lien pour choisir un nouveau mot de passe.
          </p>
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <form action={formAction} className="w-full max-w-sm py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>

          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={poppins}>Mot de passe oublié</h2>
          <p className="text-gray-400 text-sm mb-8">
            Nous vous enverrons un lien pour en définir un nouveau.
          </p>

          {state?.message ? (
            <div className="rounded-xl border border-[#75DA9F]/40 bg-[#75DA9F]/10 px-4 py-3 mb-6">
              <p className="text-sm leading-relaxed text-[#1e8f52]">{state.message}</p>
            </div>
          ) : (
            <>
              {state?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-6">
                  <p className="text-sm text-red-500">{state.error}</p>
                </div>
              )}

              <div className="mb-6">
                <InputField
                  label="Email professionnel"
                  type="email"
                  name="email"
                  placeholder="marie.leroy@techco.fr"
                  required
                />
              </div>

              <Btn variant="primary" size="lg" className="w-full justify-center" type="submit" disabled={pending}>
                {pending ? "Envoi en cours..." : "Recevoir le lien"}
                <ChevronRight size={17} />
              </Btn>
            </>
          )}

          <Link
            href="/connexion"
            className="group mt-6 flex w-fit items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-[#010101]"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            Retour à la connexion
          </Link>
        </form>
      </div>
    </div>
  );
}
