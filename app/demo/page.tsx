"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { NoaLogo, Btn, InputField } from "@/components/noa/ui-primitives";
import { requestDemo, type DemoState } from "./actions";

const initialState: DemoState = {};
const poppins = { fontFamily: "Poppins, sans-serif" };

export default function DemoPage() {
  const [state, formAction, pending] = useActionState(requestDemo, initialState);

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <Link href="/" aria-label="Retour à l'accueil" className="inline-flex flex-none">
          <NoaLogo scale={0.85} />
        </Link>
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={poppins}>
            Voyons Noa<br />en action.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Choisissez un créneau : on vous montre comment structurer vos recrutements, répondre à vos questions, et voir si la méthode colle à votre équipe.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { n: "30 min", label: "une démo courte et concrète, sans engagement", color: "text-[#75DA9F]" },
            { n: "48 h", label: "délai moyen pour être recontacté", color: "text-[#99BAF8]" },
          ].map(s => (
            <div key={s.n} className="flex-1 bg-white/5 rounded-2xl p-5">
              <div className={`text-3xl font-bold mb-1.5 ${s.color}`} style={poppins}>{s.n}</div>
              <div className="text-white/50 text-xs leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {state?.message ? (
          <div className="w-full max-w-lg py-8">
            <div className="lg:hidden mb-8"><NoaLogo /></div>
            <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={poppins}>Demande envoyée</h2>
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#75DA9F]/10 border border-[#75DA9F]/30 text-[#1e8f52] text-sm">
              {state.message}
            </div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#3a6fd4] hover:underline mt-6">
              <ArrowLeft size={15} /> Retour à l'accueil
            </Link>
          </div>
        ) : (
          <form action={formAction} className="w-full max-w-lg py-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#010101] mb-6">
              <ArrowLeft size={14} /> Retour à l'accueil
            </Link>
            <div className="lg:hidden mb-8"><NoaLogo /></div>
            <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={poppins}>Demander une démo</h2>
            <p className="text-gray-400 text-sm mb-8">Dites-nous en un peu plus, on vous recontacte pour fixer un rendez-vous.</p>

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
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Téléphone" type="tel" placeholder="06 12 34 56 78" name="phone" />
                <InputField label="Nom de l'entreprise" placeholder="TechCo SAS" required name="companyName" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
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

            <div className="grid grid-cols-2 gap-4 mb-6">
              <InputField label="Date souhaitée" type="date" name="preferredDate" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#010101]">Créneau préféré</label>
                <select
                  name="preferredSlot"
                  defaultValue="Matin (9h–12h)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600"
                >
                  <option>Matin (9h–12h)</option>
                  <option>Après-midi (14h–18h)</option>
                  <option>Peu importe</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-7">
              <label className="text-sm font-semibold text-[#010101]">Message (optionnel)</label>
              <textarea
                name="message"
                rows={3}
                placeholder="Un contexte, une question, un besoin précis..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] placeholder-gray-300 text-black resize-none"
              />
            </div>

            <Btn variant="primary" size="lg" className="w-full justify-center" type="submit" disabled={pending}>
              {pending ? "Envoi en cours..." : "Envoyer ma demande"}
              <ChevronRight size={17} />
            </Btn>

            <p className="text-center text-xs text-gray-400 mt-5">
              Vous préférez commencer tout de suite ?{" "}
              <Link href="/inscription" className="text-[#3a6fd4] hover:underline">Créer un compte</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
