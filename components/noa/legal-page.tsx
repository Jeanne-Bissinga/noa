import Link from "next/link";
import { NoaLogo, BackLink } from "@/components/noa/ui-primitives";

// Coquille partagée par les pages légales (CGU, politique de confidentialité,
// mentions légales…). Le contenu est décrit en données côté page : un article
// se lit d'un bloc et la mise en forme reste identique de l'une à l'autre.
//
// Rappel : toute nouvelle page légale doit être ajoutée à PUBLIC_PATHS dans
// lib/supabase/proxy.ts, sinon elle exige une connexion pour être lue.

export const LEGAL_CONTACT_EMAIL = "noa.recrutement@gmail.com";

export type LegalBlock =
  | { p: string }
  | { address: { name: string; lines: string[] } }
  | { contact: { label: string; value: string; href?: string }[] }
  | { h3: string }
  | { ul: string[] }
  | { dl: { term: string; def: string }[] }
  | { quote: string }
  | { mail: true };

export type LegalArticle = { n: number; title: string; blocks: LegalBlock[] };

const poppins = { fontFamily: "Poppins, sans-serif" };

const MailLink = () => (
  <a
    href={`mailto:${LEGAL_CONTACT_EMAIL}`}
    className="text-sm font-semibold text-[#3a6fd4] underline underline-offset-2 transition-colors hover:text-[#010101]"
  >
    {LEGAL_CONTACT_EMAIL}
  </a>
);

const Block = ({ block }: { block: LegalBlock }) => {
  if ("address" in block) {
    return (
      <div>
        <p className="text-sm font-semibold leading-relaxed text-[#010101]">{block.address.name}</p>
        {block.address.lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-gray-600">{line}</p>
        ))}
      </div>
    );
  }
  if ("contact" in block) {
    return (
      <div className="space-y-1">
        {block.contact.map((c) => (
          <p key={c.label} className="text-sm leading-relaxed text-gray-600">
            {c.label} :{" "}
            {c.href ? (
              <a href={c.href} className="font-semibold text-[#3a6fd4] underline underline-offset-2 transition-colors hover:text-[#010101]">{c.value}</a>
            ) : (
              <span className="font-semibold text-[#010101]">{c.value}</span>
            )}
          </p>
        ))}
      </div>
    );
  }
  if ("h3" in block) {
    return <h3 className="pt-2 text-sm font-bold text-[#010101]" style={poppins}>{block.h3}</h3>;
  }
  if ("ul" in block) {
    return (
      <ul className="space-y-2 pl-5">
        {block.ul.map((item) => (
          <li key={item} className="list-disc text-sm leading-relaxed text-gray-600 marker:text-gray-300">{item}</li>
        ))}
      </ul>
    );
  }
  if ("dl" in block) {
    return (
      <ul className="space-y-2 pl-5">
        {block.dl.map((item) => (
          <li key={item.term} className="list-disc text-sm leading-relaxed text-gray-600 marker:text-gray-300">
            <span className="font-semibold text-[#010101]">{item.term}</span> : {item.def}
          </li>
        ))}
      </ul>
    );
  }
  if ("quote" in block) {
    return (
      <blockquote className="border-l-2 border-[#99BAF8] bg-white px-4 py-3 text-sm italic leading-relaxed text-gray-600">
        « {block.quote} »
      </blockquote>
    );
  }
  if ("mail" in block) return <p><MailLink /></p>;
  return <p className="text-sm leading-relaxed text-gray-600">{block.p}</p>;
};

export function LegalPage({
  title, lastUpdate, articles,
}: {
  title: string;
  lastUpdate: string;
  articles: LegalArticle[];
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="bg-[#010101]">
        <div className="mx-auto flex w-[min(100%-32px,768px)] items-center py-5">
          <Link href="/" aria-label="Retour à l'accueil" className="inline-flex">
            <NoaLogo scale={0.8} />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-[min(100%-32px,768px)] py-12 sm:py-16">
        <BackLink href="/" />
        <h1 className="text-3xl font-bold text-[#010101] sm:text-4xl" style={poppins}>{title}</h1>
        <p className="mt-3 text-sm text-gray-400">Dernière mise à jour : {lastUpdate}</p>

        <div className="mt-12 space-y-12">
          {articles.map((article) => (
            <section key={article.n} id={`article-${article.n}`} className="scroll-mt-8">
              <h2 className="mb-4 text-lg font-bold text-[#010101]" style={poppins}>
                {article.n}. {article.title}
              </h2>
              <div className="space-y-4">
                {article.blocks.map((block, i) => <Block key={i} block={block} />)}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto w-[min(100%-32px,768px)] py-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Noa Recrutement
        </div>
      </footer>
    </div>
  );
}
