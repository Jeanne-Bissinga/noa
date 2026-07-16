"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";
import { NoaLogo, Btn, InputField } from "@/components/noa/ui-primitives";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <NoaLogo scale={0.85} />
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Recruter avec méthode,<br />Décider avec confiance.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            noa guide chaque étape de vos recrutements grâce à une méthodologie éprouvée, pensée pour les managers de PME tech.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { n: "94%", label: "de recrutements réussis avec la méthode Topgrading", color: "text-[#75DA9F]" },
            { n: "3×", label: "plus vite qu'un process traditionnel", color: "text-[#99BAF8]" },
          ].map(s => (
            <div key={s.n} className="flex-1 bg-white/5 rounded-2xl p-5">
              <div className={`text-3xl font-bold mb-1.5 ${s.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.n}</div>
              <div className="text-white/50 text-xs leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {state?.message ? (
          <div className="w-full max-w-lg py-8">
            <div className="lg:hidden mb-8"><NoaLogo /></div>
            <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Vérifiez votre boîte mail</h2>
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#75DA9F]/10 border border-[#75DA9F]/30 text-[#1e8f52] text-sm">
              {state.message}
            </div>
            <p className="text-center text-xs text-gray-400 mt-5">
              Déjà confirmé ?{" "}
              <Link href="/connexion" className="text-[#3a6fd4] hover:underline">Se connecter</Link>
            </p>
          </div>
        ) : (
        <form action={formAction} className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>
          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Créer mon compte</h2>
          <p className="text-gray-400 text-sm mb-8">Commencez à recruter avec méthode en moins de 5 minutes.</p>

          {state?.error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <InputField label="Prénom" placeholder="Marie" required name="firstName" />
            <InputField label="Nom" placeholder="Leroy" required name="lastName" />
          </div>
          <div className="flex flex-col gap-4 mb-4">
            <InputField label="Email professionnel" type="email" placeholder="marie.leroy@techco.fr" required name="email" />
            <InputField label="Mot de passe" type="password" placeholder="••••••••" required name="password" />
            <InputField label="Nom de l'entreprise" placeholder="TechCo SAS" required name="companyName" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <InputField label="SIRET" placeholder="123 456 789 00012" required name="siret" />
            <InputField label="Fonction" placeholder="CTO, DG, Manager..." required name="jobTitle" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Taille de l'équipe</label>
              <select
                name="teamSize"
                defaultValue="1–10 personnes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600"
              >
                <option>1–10 personnes</option>
                <option>11–19 personnes</option>
                <option>20–49 personnes</option>
                <option>50-199 personnes</option>
                <option>199+ personnes</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Objectif principal</label>
              <select
                name="mainObjective"
                defaultValue="Structurer mes recrutements"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600"
              >
                <option>Structurer mes recrutements</option>
                <option>Gagner du temps</option>
                <option>Réduire les erreurs de cast</option>
                <option>Préparer une montée en charge</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 mb-7 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreed ? "bg-[#99BAF8] border-[#99BAF8]" : "border-gray-300 group-hover:border-[#99BAF8]"
              }`}
            >
              {agreed && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-gray-500 leading-relaxed">
              J'accepte les{" "}
              <span className="text-[#3a6fd4] underline">Conditions Générales d'Utilisation</span>{" "}
              et la{" "}
              <span className="text-[#3a6fd4] underline">Politique de confidentialité</span>
            </span>
          </label>

          <Btn variant="primary" size="lg" className="w-full justify-center" type="submit" disabled={!agreed || pending}>
            {pending ? "Création en cours..." : "Créer mon compte"}
            <ChevronRight size={17} />
          </Btn>

          <p className="text-center text-xs text-gray-400 mt-5">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-[#3a6fd4] hover:underline">Se connecter</Link>
          </p>
        </form>
        )}
      </div>
    </div>
  );
}
