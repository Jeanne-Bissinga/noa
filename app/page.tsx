import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { NoaLogo } from "@/components/noa/ui-primitives";
import { ScrollLink } from "@/components/noa/scroll-link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Noa — Recruter avec méthode",
  description:
    "Noa vous guide à chaque étape de votre recrutement grâce à une méthode simple et reconnue. Vous évaluez, vous comparez, vous décidez.",
};

// The landing page mirrors the marketing design, whose breakpoints (900px / 640px)
// and container width don't line up with the Tailwind defaults, hence the arbitrary values.
const CONTAINER = "mx-auto w-[min(100%-32px,1024px)] min-[641px]:w-[min(100%-48px,1024px)]";

const BTN = "inline-flex items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-bold transition-all hover:-translate-y-px";
const BTN_BLUE = `${BTN} bg-[#99BAF8] text-[#010101] hover:bg-[#7aa6f5]`;
const BTN_OUTLINE = `${BTN} border-white/20 font-medium text-white hover:bg-white/5`;

const STATS = [
  { value: "74 %", label: "des entreprises admettent avoir mal recruté", source: "Étude LinkedIn, 2024" },
  { value: "15x", label: "le salaire annuel : coût d'un mauvais recrutement", source: "Geoff Smart, Who" },
  { value: "50 %", label: "des décisions d'embauche sont des erreurs", source: "Peter Drucker" },
];

const STEPS = [
  { n: "1", color: "bg-[#FEE831]", title: "Cadrer", text: "Définir ce que le poste exige vraiment : critères, résultats attendus, compétences clés." },
  { n: "2", color: "bg-[#CCB8FF]", title: "Sourcer", text: "Centraliser les candidats, tracer leur origine, garder une vue claire du vivier." },
  { n: "3", color: "bg-[#75DA9F]", title: "Évaluer", text: "Mener des entretiens structurés et scorer chaque profil sur les mêmes critères." },
  { n: "4", color: "bg-[#99BAF8]", title: "Convaincre", text: "Préparer une proposition ciblée pour que le bon candidat accepte l'offre." },
];

const PROOF = [
  { value: "1 300", suffix: "+", label: "entreprises analysées pour construire la méthode" },
  { value: "20 000", suffix: "+", label: "candidats étudiés pour valider les critères de sélection" },
  { value: "90", suffix: "%", label: "de taux de réussite constaté sur ces recrutements structurés" },
];

const PRODUCT_LINKS = ["Méthode A-Player", "Cadrer le poste", "Sourcer les candidats", "Évaluer les profils", "Convaincre le candidat"];
const LEGAL_LINKS = ["Mentions légales", "Politique de confidentialité", "CGU", "Contact"];

const PLANS = [
  {
    slug: "starter",
    name: "Noa Starter",
    target: "PME tech, recrutement ponctuel",
    monthly: "41",
    yearly: "490 €/an",
    highlight: false,
    features: [
      "10 candidats évalués inclus",
      "49 € par candidat évalué",
      "2 scorecards (missions / postes)",
      "Jusqu'à 2 utilisateurs recruteurs",
      "Engagement 12 mois",
    ],
  },
  {
    slug: "pro",
    name: "Noa Pro",
    target: "PME tech, recrutement régulier",
    monthly: "99",
    yearly: "1 190 €/an",
    highlight: true,
    features: [
      "25 candidats évalués inclus",
      "47,60 € par candidat évalué",
      "4 scorecards (missions / postes)",
      "Jusqu'à 4 utilisateurs recruteurs",
      "Engagement 12 mois",
    ],
  },
  {
    slug: "scale",
    name: "Noa Scale",
    target: "PME tech en forte croissance",
    monthly: "183",
    yearly: "2 190 €/an",
    highlight: false,
    features: [
      "50 candidats évalués inclus",
      "43,80 € par candidat évalué",
      "10 scorecards (missions / postes)",
      "Jusqu'à 8 utilisateurs recruteurs",
      "Engagement 12 mois",
    ],
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Un utilisateur déjà connecté est renvoyé directement vers son espace.
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#010101]" style={{ fontFamily: "Poppins, Arial, sans-serif" }}>
      <header className="sticky top-5 z-20 mx-2 flex items-center justify-between rounded-[26px] bg-[#010101] px-4 py-4 min-[641px]:px-8">
        <Link href="/" aria-label="Retour à l'accueil" className="inline-flex flex-none">
          <NoaLogo scale={0.75} />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 text-sm font-medium text-white/70 min-[901px]:flex">
          <ScrollLink href="#methode" className="transition-colors hover:text-white">Méthode</ScrollLink>
          <ScrollLink href="#chiffres" className="transition-colors hover:text-white">Résultats</ScrollLink>
          <ScrollLink href="#plans" className="transition-colors hover:text-white">Tarifs</ScrollLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white min-[641px]:block"
          >
            Se connecter
          </Link>
          <Link href="/inscription" className={`${BTN_BLUE} px-3 py-2 text-xs min-[641px]:px-4 min-[641px]:text-sm`}>
            Créer un compte
          </Link>
        </div>
      </header>

      <main>
        <section id="accueil" className="relative overflow-hidden bg-[#010101] px-6 py-20 text-center text-white min-[641px]:px-8 min-[641px]:py-24">
          <div className="pointer-events-none absolute left-1/4 top-12 h-64 w-64 rounded-full bg-[#99BAF8]/[0.08] blur-[80px]" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-[#CCB8FF]/[0.08] blur-[100px]" />

          <div className="relative z-10 mx-auto w-full max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75DA9F]" />
              Pour les managers de PME tech
            </div>

            <h1 className="mb-6 text-[clamp(40px,5.2vw,52px)] font-extrabold leading-[1.15] tracking-[-1.5px]">
              Recruter avec méthode.
              <br />
              <span className="text-[#99BAF8]">Décider avec confiance.</span>
            </h1>

            <p className="mx-auto mb-4 max-w-[672px] text-[16px] leading-[1.75] text-white/60 min-[641px]:text-[17px]">
              Noa vous guide à chaque étape de votre recrutement grâce à une méthode simple et reconnue.
              Vous évaluez, vous comparez, vous décidez.
            </p>
            <p className="mx-auto mb-10 text-sm text-white/35">La décision finale reste toujours la vôtre.</p>

            <div className="flex flex-col items-center justify-center gap-4 min-[641px]:flex-row">
              <ScrollLink href="#methode" className={`${BTN_BLUE} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                Découvrir la méthode
              </ScrollLink>
              <Link href="/demo" className={`${BTN_OUTLINE} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                Demander une démo
              </Link>
            </div>
          </div>
        </section>

        <section id="chiffres" className="bg-white py-16">
          <div className={`${CONTAINER} grid gap-6 min-[901px]:grid-cols-3`}>
            {STATS.map(s => (
              <article key={s.value} className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                <p className="mb-3 text-[40px] font-extrabold leading-none text-[#99BAF8]">{s.value}</p>
                <p className="mb-2 text-sm font-medium leading-[1.65] text-gray-700">{s.label}</p>
                <p className="text-xs text-gray-400">{s.source}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="methode" className="bg-gray-50 py-16">
          <div className={CONTAINER}>
            <p className="mb-2 text-xs font-medium uppercase tracking-[2px] text-gray-400">La méthode A-Player</p>
            <h2 className="text-[27px] font-bold leading-[1.25] text-[#010101] min-[641px]:text-[30px]">
              Structurer votre recrutement, étape par étape.
            </h2>
            <p className="mb-10 mt-2 text-sm text-gray-500">Un parcours guidé en 4 étapes. Chaque décision reste la vôtre.</p>

            <div className="grid gap-4 min-[641px]:grid-cols-2 min-[901px]:grid-cols-4">
              {STEPS.map(step => (
                <article
                  key={step.n}
                  className="rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-[#010101] ${step.color}`}>
                    {step.n}
                  </div>
                  <h3 className="mb-2 text-base font-bold text-[#010101]">{step.title}</h3>
                  <p className="text-sm leading-[1.65] text-gray-500">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white py-14">
          <div className={`${CONTAINER} grid items-center gap-8 min-[901px]:grid-cols-3`}>
            {PROOF.map((p, i) => (
              <article
                key={p.value}
                className={`text-center ${i === 1 ? "border-y border-gray-100 py-8 min-[901px]:border-x min-[901px]:border-y-0 min-[901px]:px-8 min-[901px]:py-0" : ""}`}
              >
                <p className="mb-2 text-[48px] font-extrabold leading-none text-[#010101]">
                  {p.value}
                  <span className="text-[#99BAF8]">{p.suffix}</span>
                </p>
                <p className="text-sm leading-[1.65] text-gray-500">{p.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="plans" className="bg-[#010101] px-6 py-20 text-white min-[641px]:px-8">
          <div className={CONTAINER}>
            <div className="text-center">
              <h2 className="text-[27px] font-bold leading-[1.25] min-[641px]:text-[30px]">
                Recruter avec méthode, dès maintenant.
              </h2>
              <p className="mt-4 text-sm text-white/50">Accès immédiat. Aucune expertise RH requise.</p>
            </div>

            <div className="mt-12 grid gap-6 min-[901px]:grid-cols-3">
              {PLANS.map(plan => (
                <article
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlight ? "border-[#99BAF8] bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-8 rounded-full bg-[#99BAF8] px-3 py-1 text-xs font-bold text-[#010101]">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{plan.name}</h3>
                  <p className="mt-1 text-xs text-white/50">{plan.target}</p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-[40px] font-extrabold leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
                      {plan.monthly} €
                    </span>
                    <span className="mb-1 text-sm text-white/50">/mois</span>
                  </div>
                  <p className="mt-2 text-xs text-white/40">soit {plan.yearly}, facturé annuellement</p>

                  <ul className="mt-6 flex flex-col gap-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                        <Check size={16} className="mt-0.5 flex-none text-[#75DA9F]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/inscription?plan=${plan.slug}`}
                    className={`mt-8 w-full px-6 py-3.5 ${plan.highlight ? BTN_BLUE : BTN_OUTLINE}`}
                  >
                    S'abonner
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#010101] pb-8 pt-12 text-white">
        <div className={`${CONTAINER} grid gap-8 min-[641px]:grid-cols-3 min-[641px]:gap-10`}>
          <div>
            <Link href="/" aria-label="Retour à l'accueil" className="inline-flex">
              <NoaLogo scale={0.75} />
            </Link>
            <p className="mt-4 max-w-[320px] text-sm leading-[1.7] text-white/50">
              Structurer le recrutement. Trouver le bon candidat.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {["Instagram", "LinkedIn", "TikTok"].map(s => (
                <ScrollLink key={s} href="#" className="text-xs text-white/40 transition-colors hover:text-white">{s}</ScrollLink>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[1.6px] text-white/30">Produit</p>
            {PRODUCT_LINKS.map(l => (
              <ScrollLink key={l} href="#methode" className="mb-2 block text-sm text-white/60 transition-colors hover:text-white">{l}</ScrollLink>
            ))}
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[1.6px] text-white/30">Informations légales</p>
            {LEGAL_LINKS.map(l => (
              <ScrollLink key={l} href="#" className="mb-2 block text-sm text-white/60 transition-colors hover:text-white">{l}</ScrollLink>
            ))}
          </div>
        </div>

        <div className={`${CONTAINER} mt-10 border-t border-white/10 pt-6 text-xs text-white/30`}>
          © 2025 Noa. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
