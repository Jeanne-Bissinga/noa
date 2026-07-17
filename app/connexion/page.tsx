"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NoaLogo, Btn } from "@/components/noa/ui-primitives";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const incompleteProfile = use(searchParams).error === "profil_incomplet";

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <NoaLogo scale={0.85} />
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bon retour<br />parmi nous.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Continuez là où vous en étiez. Vos campagnes et candidats vous attendent.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { n: "74 %", label: "des entreprises admettent avoir mal recruté", color: "text-[#75DA9F]" },
            { n: "15×", label: "le salaire annuel : coût d'un mauvais recrutement", color: "text-[#99BAF8]" },
          ].map(s => (
            <div key={s.n} className="flex-1 bg-white/5 rounded-2xl p-5">
              <div className={`text-3xl font-bold mb-1.5 ${s.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.n}</div>
              <div className="text-white/50 text-xs leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <form action={formAction} className="w-full max-w-sm py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>
          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Se connecter</h2>
          <p className="text-gray-400 text-sm mb-8">Accédez à votre espace noa.</p>

          {incompleteProfile && !state?.error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
              Votre profil n'a pas pu être retrouvé. Merci de recréer un compte via "Créer un compte" ci-dessous.
            </div>
          )}

          {state?.error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
              {state.error}
            </div>
          )}

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Email professionnel</label>
              <input
                type="email"
                name="email"
                placeholder="marie.leroy@techco.fr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] placeholder-gray-300 transition-all text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#010101]">Mot de passe</label>
                <span className="text-xs text-[#3a6fd4] cursor-pointer hover:underline">Mot de passe oublié ?</span>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] placeholder-gray-300 transition-all text-black"
              />
            </div>
          </div>

          <Btn
            variant="primary"
            size="lg"
            className="w-full justify-center"
            type="submit"
            disabled={pending}
          >
            {pending ? "Connexion..." : "Se connecter"}
            <ChevronRight size={17} />
          </Btn>

          <p className="text-center text-xs text-gray-400 mt-5">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-[#3a6fd4] hover:underline">Créer un compte</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
