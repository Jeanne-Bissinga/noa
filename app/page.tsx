import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { NoaLogo } from "@/components/noa/ui-primitives";
import { ScrollLink } from "@/components/noa/scroll-link";
import { HeroKanban } from "@/components/noa/hero-kanban";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Recruter avec méthode",
  description:
    "Noa vous guide à chaque étape de votre recrutement grâce à une méthode simple et reconnue. Vous évaluez, vous comparez, vous décidez.",
};

// The landing page mirrors the marketing design, whose breakpoints (900px / 640px)
// and container width don't line up with the Tailwind defaults, hence the arbitrary values.
const CONTAINER = "mx-auto w-[min(100%-32px,1024px)] min-[641px]:w-[min(100%-48px,1024px)]";
const HERO_CONTAINER = "mx-auto w-[min(100%-32px,1280px)] min-[641px]:w-[min(100%-64px,1280px)]";

const BTN = "inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all hover:-translate-y-px";
const BTN_BLUE = `${BTN} border-transparent bg-[#99BAF8] text-[#010101] hover:bg-[#7aa6f5]`;
const BTN_OUTLINE = `${BTN} border-white/20 font-medium text-white hover:bg-white/5`;
const BTN_OUTLINE_DARK = `${BTN} border-gray-300 font-medium text-[#010101] hover:bg-gray-50`;
const BTN_WHITE = `${BTN} border-transparent bg-white text-[#010101] hover:bg-white/90`;
const BTN_OUTLINE_ON_BLUE = `${BTN} border-[#010101]/20 font-medium text-[#010101] hover:bg-white/20`;

const STATS = [
  {
    value: "74 %",
    label: "des entreprises admettent avoir mal recruté",
    source: "Étude LinkedIn, 2024",
  },
  {
    value: "15x",
    label: "le salaire annuel : coût d'un mauvais recrutement",
    source: "Geoff Smart, Who",
  },
  {
    value: "50 %",
    label: "des décisions d'embauche sont des erreurs",
    source: "Peter Drucker",
  },
];

const STEPS = [
  { n: "1", color: "bg-[#FEE831]", title: "Grille de scoring", text: "Définir les critères qui comptent vraiment pour le poste." },
  { n: "2", color: "bg-[#CCB8FF]", title: "Entretien structuré", text: "Mener un entretien guidé, candidat par candidat." },
  { n: "3", color: "bg-[#75DA9F]", title: "Synthèse", text: "Obtenir une synthèse claire et comparable pour chaque profil." },
  { n: "4", color: "bg-[#99BAF8]", title: "Décision", text: "Comparer les profils sur les mêmes critères et trancher en confiance." },
];

const WHY = [
  { title: "Pensé pour les PME", text: "Juste ce qu'il faut pour recruter juste, à votre échelle." },
  { title: "Aucune expertise RH requise", text: "La méthode est intégrée à l'outil. Vous suivez le guide, pas besoin de formation RH." },
  { title: "Une décision documentée, pas un feeling", text: "Chaque étape laisse une trace : critères, notes, synthèses ..." },
];

const PROOF = {
  value: "90",
  suffix: "%",
  label: "de taux de réussite constaté sur les recrutements menés avec la méthode Topgrading",
  source: "Bradford D. Smart, créateur de la méthode Topgrading — pas un résultat propre à Noa",
};

const PRODUCT_LINKS = ["Méthode A-Player", "Grille de scoring", "Entretien structuré", "Synthèse", "Décision"];
// `href: null` = page pas encore rédigée, le libellé reste affiché mais n'est
// pas présenté comme cliquable (cf. ticket « Pages légales absentes »).
const LEGAL_LINKS: { label: string; href: string | null }[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/confidentialite" },
  { label: "CGU", href: "/cgu" },
];

const PLANS = [
  {
    slug: "free",
    name: "Noa Free",
    free: true,
    highlight: false,
    features: [
      "Accès complet à la méthode en démo",
    ],
    cta: { label: "Demander une démo", href: "/demo" },
  },
  {
    slug: "starter",
    name: "Noa Starter",
    monthly12: "49",
    monthly3: "69",
    highlight: false,
    features: [
      "500 crédits mensuels",
      "Environ 8 candidats évalués complètement par mois",
    ],
    cta: { label: "Souscrire", href: "/inscription?plan=starter" },
  },
  {
    slug: "growth",
    name: "Noa Growth",
    monthly12: "99",
    monthly3: "139",
    highlight: true,
    features: [
      "1 500 crédits mensuels",
      "Environ 27 candidats évalués complètement par mois",
    ],
    cta: { label: "Souscrire", href: "/inscription?plan=growth" },
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
    <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins, Arial, sans-serif" }}>
      <header className="sticky top-5 z-20 mx-2 flex items-center justify-between rounded-[26px] bg-[#010101] px-4 py-4 min-[641px]:px-8">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="inline-flex flex-none"
        >
          <NoaLogo scale={0.75} />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-8 text-sm font-medium text-white/70 min-[901px]:flex">
          <ScrollLink href="#constat" className="transition-colors hover:text-white">Constat</ScrollLink>
          <ScrollLink href="#methode" className="transition-colors hover:text-white">Méthode</ScrollLink>
          <ScrollLink href="#pourquoi" className="transition-colors hover:text-white">Pourquoi noa</ScrollLink>
          <ScrollLink href="#plans" className="transition-colors hover:text-white">Tarifs</ScrollLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white min-[641px]:block"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className={`${BTN_BLUE} px-3 py-2 text-xs min-[641px]:px-4 min-[641px]:text-sm`}
          >
            Créer un compte
          </Link>
        </div>
      </header>

      <main>
        <section id="accueil" className="relative overflow-hidden bg-white px-6 py-20 min-[641px]:px-8 min-[641px]:py-20">
          <div className="pointer-events-none absolute left-[10%] top-16 h-56 w-56 rounded-full bg-[#FEE831]/20 blur-[70px]" />
          <div className="pointer-events-none absolute left-[28%] top-6 h-56 w-56 rounded-full bg-[#CCB8FF]/25 blur-[70px]" />
          <div className="pointer-events-none absolute left-[14%] top-64 h-56 w-56 rounded-full bg-[#75DA9F]/20 blur-[70px]" />

          <div className={`${HERO_CONTAINER} relative z-10 grid items-center gap-12 min-[901px]:grid-cols-2`}>
            <div className="text-center min-[901px]:text-left">
              <h1 className="mb-6 text-[clamp(36px,5vw,48px)] font-extrabold leading-[1.15] tracking-[-1.5px] text-[#010101]">
                Recruter avec méthode.
                <br />
                <span className="text-[#99BAF8]">Décider avec confiance.</span>
              </h1>

              <p className="mx-auto mb-8 max-w-[520px] text-[16px] leading-[1.75] text-gray-500 min-[641px]:text-[17px] min-[901px]:mx-0">
                Noa évalue vos candidats avec la rigueur d&apos;un expert du recrutement, sans équipe RH.
                Vous comparez les profils, la décision finale reste la vôtre.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 min-[641px]:flex-row min-[901px]:justify-start">
                <ScrollLink href="#methode" className={`${BTN_BLUE} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                  Découvrir la méthode
                </ScrollLink>
                <Link href="/demo" className={`${BTN_OUTLINE_DARK} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                  Demander une démo
                </Link>
              </div>
            </div>

            <HeroKanban />
          </div>
        </section>

        <section id="constat" className="border-t-2 border-gray-100 bg-white py-12 mx-16">
          <div className={CONTAINER}>
            <h2 className="mb-10 text-center text-[27px] font-bold leading-[1.25] text-[#010101] min-[641px]:text-[30px]">
              Le constat :
            </h2>
            <div className="grid gap-6 min-[901px]:grid-cols-3">
              {STATS.map(s => (
                <article key={s.value} className="rounded-2xl border border-[#99BAF8]/40 bg-white p-8 text-center">
                  <p className="mb-3 text-[40px] font-extrabold leading-none text-[#99BAF8]">{s.value}</p>
                  <p className="mb-2 text-sm font-medium leading-[1.65] text-gray-700">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.source}</p>
                </article>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-gray-500">
              <span className="font-bold text-[#010101]">Noa</span> vous aide à éviter ça. Grâce à une méthode structurée, pas à l&apos;instinct.
            </p>
          </div>
        </section>

        <section id="methode" className="bg-[#010101] py-16">
          <div className={CONTAINER}>
            <p className="mb-2 text-xs font-medium uppercase tracking-[2px] text-white/50">La méthode A-Player</p>
            <h2 className="text-[27px] font-bold leading-[1.25] text-white min-[641px]:text-[30px]">
              Évaluer, étape par étape.
            </h2>
            <p className="mb-10 mt-2 text-sm text-white/50">Un parcours guidé en 4 étapes, pour comparer vos candidats sur des bases objectives.</p>

            <div className="grid gap-4 min-[641px]:grid-cols-2 min-[901px]:grid-cols-4">
              {STEPS.map((step) => (
                <article
                  key={step.n}
                  className="rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)]"
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold text-[#010101] ${step.color}`}
                  >
                    {step.n}
                  </div>
                  <h3 className="mb-2 text-base font-bold text-[#010101]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-[1.65] text-gray-500">
                    {step.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pourquoi" className="bg-gray-50 py-16">
          <div className={CONTAINER}>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-[27px] font-bold leading-[1.25] text-[#010101] min-[641px]:text-[30px]">Pourquoi noa ?</h2>
              <p className="mt-3 text-sm font-bold text-[#8B7FD9] min-[641px]:text-base">
                Décider sans expertise RH, avec la même rigueur qu&apos;un professionnel du recrutement.
              </p>
              <p className="mt-4 text-sm leading-[1.75] text-gray-500">
                Recruter ne s&apos;improvise pas, mais vous n&apos;avez pas besoin d&apos;une équipe RH pour le faire sérieusement.
                Noa intègre une méthode éprouvée directement dans votre parcours de décision, pour que chaque recrutement
                repose sur des critères clairs plutôt que sur l&apos;instinct.
              </p>
            </div>

            <div className="mt-10 grid gap-4 min-[901px]:grid-cols-3">
              {WHY.map(w => (
                <article key={w.title} className="rounded-2xl border border-[#CCB8FF]/50 bg-white p-6 text-center">
                  <h3 className="mb-2 text-sm font-bold text-[#010101]">{w.title}</h3>
                  <p className="text-sm leading-[1.65] text-gray-500">{w.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className={CONTAINER}>
            <div className="rounded-3xl bg-[#99BAF8] px-8 py-12 text-center min-[641px]:px-14 min-[641px]:text-left">
              <h2 className="text-[27px] font-bold leading-[1.25] text-[#010101] min-[641px]:text-[30px]">
                Prêt à recruter la bonne personne ?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-[1.7] text-[#010101]/70 min-[641px]:text-[15px]">
                Créez votre compte ou demandez une démo pour voir comment Noa évalue vos candidats.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 min-[641px]:flex-row min-[641px]:justify-start">
                <ScrollLink href="#methode" className={`${BTN_WHITE} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                  Découvrir la méthode
                </ScrollLink>
                <Link href="/demo" className={`${BTN_OUTLINE_ON_BLUE} w-full px-7 py-3.5 min-[641px]:w-auto`}>
                  Demander une démo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-100 bg-white py-14">
          <div className={`${CONTAINER} mx-auto max-w-xl text-center`}>
            <p className="mb-2 text-[48px] font-extrabold leading-none text-[#010101]">
              {PROOF.value}
              <span className="text-[#99BAF8]">{PROOF.suffix}</span>
            </p>
            <p className="text-sm leading-[1.65] text-gray-500">{PROOF.label}</p>
            <p className="mt-3 text-xs text-gray-400">{PROOF.source}</p>
            <p className="mt-6 text-xs leading-[1.6] text-gray-400">
              Noa est en phase de lancement : nous n&apos;avons pas encore de résultats chiffrés qui lui sont propres.
              Cette méthode a inspiré la nôtre — les résultats obtenus avec Noa seront publiés dès qu&apos;ils seront disponibles.
            </p>
          </div>
        </section>

        <section
          id="plans"
          className="bg-[#010101] px-6 py-20 text-white min-[641px]:px-8"
        >
          <div className={CONTAINER}>
            <div className="text-center">
              <h2 className="text-[27px] font-bold leading-[1.25] min-[641px]:text-[30px]">
                Recruter avec méthode, dès maintenant.
              </h2>
              <p className="mt-4 text-sm text-white/50">
                Accès immédiat. Aucune expertise RH requise.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 min-[641px]:grid-cols-3">
              {PLANS.map(plan => (
                <article
                  key={plan.slug}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlight
                      ? "border-[#99BAF8] bg-white/[0.06]"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-8 rounded-full bg-[#99BAF8] px-3 py-1 text-xs font-bold text-[#010101]">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{plan.name}</h3>

                  {plan.free ? (
                    <div className="mt-6 flex items-end gap-1.5">
                      <span className="text-[40px] font-extrabold leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Gratuit
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 flex items-end gap-1.5">
                        <span className="text-[40px] font-extrabold leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
                          {plan.monthly12} € HT
                        </span>
                        <span className="mb-1 text-sm text-white/50">/mois</span>
                      </div>
                      <p className="mt-2 text-xs text-white/40">avec engagement 12 mois</p>
                      <p className="mt-1 text-xs text-white/40">soit {plan.monthly3} € HT/mois avec engagement 3 mois</p>
                    </>
                  )}

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                        <Check size={16} className="mt-0.5 flex-none text-[#75DA9F]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.cta.href}
                    className={`mt-8 w-full px-6 py-3.5 ${plan.highlight ? BTN_BLUE : BTN_OUTLINE}`}
                  >
                    {plan.cta.label}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#010101] pb-8 pt-12 text-white">
        <div
          className={`${CONTAINER} grid gap-8 min-[641px]:grid-cols-3 min-[641px]:gap-10`}
        >
          <div>
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              className="inline-flex"
            >
              <NoaLogo scale={0.75} />
            </Link>
            <p className="mt-4 max-w-[320px] text-sm leading-[1.7] text-white/50">
              Structurer le recrutement. Trouver le bon candidat.
            </p>
            <div className="mt-6 flex items-center gap-4">
              {["Instagram", "LinkedIn", "TikTok"].map((s) => (
                <ScrollLink
                  key={s}
                  href="#"
                  className="text-xs text-white/40 transition-colors hover:text-white"
                >
                  {s}
                </ScrollLink>
              ))}
            </div>
            <a
              href="mailto:noa.recrutement@gmail.com"
              className="mt-4 inline-block text-xs text-white/40 transition-colors hover:text-white"
            >
              noa.recrutement@gmail.com
            </a>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[1.6px] text-white/30">
              Produit
            </p>
            {PRODUCT_LINKS.map((l) => (
              <ScrollLink
                key={l}
                href="#methode"
                className="mb-2 block text-sm text-white/60 transition-colors hover:text-white"
              >
                {l}
              </ScrollLink>
            ))}
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[1.6px] text-white/30">
              Informations légales
            </p>
            {LEGAL_LINKS.map((l) =>
              l.href ? (
                <Link
                  key={l.label}
                  href={l.href}
                  className="mb-2 block text-sm text-white/60 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              ) : (
                <p key={l.label} className="mb-2 block text-sm text-white/40">
                  {l.label}
                </p>
              ),
            )}
          </div>
        </div>

        <div
          className={`${CONTAINER} mt-10 border-t border-white/10 pt-6 text-xs text-white/30`}
        >
          © 2026 Noa. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
