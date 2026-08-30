import type { Metadata } from "next";
import { LegalPage, type LegalArticle } from "@/components/noa/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de Noa Recrutement : éditeur, directrice de la publication, hébergeur, propriété intellectuelle et droit applicable.",
};

const ARTICLES: LegalArticle[] = [
  {
    n: 1,
    title: "Éditeur du site",
    blocks: [
      { p: "Le site et le service Noa Recrutement sont édités par :" },
      { address: { name: "Jeanne Bissinga", lines: ["71 Rue Villeneuve", "92110 Clichy", "France"] } },
      { contact: [
        { label: "Téléphone", value: "07 69 91 99 95", href: "tel:+33769919995" },
        { label: "Email", value: "noa.recrutement@gmail.com", href: "mailto:noa.recrutement@gmail.com" },
      ] },
      { p: "Noa Recrutement est le nom sous lequel le service est présenté et exploité." },
      { p: "Tant que l'activité n'est pas exploitée par une société ou une autre structure juridique immatriculée, Jeanne Bissinga agit en qualité d'éditrice du site." },
      { p: "Les présentes mentions légales seront mises à jour en cas de création d'une structure juridique afin d'y faire figurer, selon la situation applicable :" },
      { ul: [
        "la dénomination sociale ;",
        "la forme juridique ;",
        "l'adresse du siège social ;",
        "le numéro SIREN ou SIRET ;",
        "les informations d'immatriculation au RNE ou au RCS, lorsqu'elles sont applicables ;",
        "le numéro de TVA intracommunautaire, lorsqu'il est applicable.",
      ] },
    ],
  },
  {
    n: 2,
    title: "Directeur de la publication",
    blocks: [
      { p: "La directrice de la publication est :" },
      { address: { name: "Jeanne Bissinga", lines: [] } },
      { p: "Contact :" },
      { mail: true },
    ],
  },
  {
    n: 3,
    title: "Hébergement",
    blocks: [
      { p: "Le site est hébergé par :" },
      { address: { name: "Vercel Inc.", lines: ["440 N Barranca Avenue #4133", "Covina, CA 91723", "États-Unis"] } },
      { contact: [
        { label: "Téléphone", value: "+1 559 288 7060", href: "tel:+15592887060" },
        { label: "Email", value: "privacy@vercel.com", href: "mailto:privacy@vercel.com" },
        { label: "Site internet", value: "vercel.com", href: "https://vercel.com" },
      ] },
    ],
  },
  {
    n: 4,
    title: "Propriété intellectuelle",
    blocks: [
      { p: "L'ensemble des éléments présents sur le site et le service Noa Recrutement, notamment les textes, graphismes, interfaces, éléments visuels, fonctionnalités, logiciels, bases de données, noms et logos, est protégé par les règles applicables en matière de propriété intellectuelle." },
      { p: "Sauf mention contraire, ces éléments sont exploités dans le cadre du service Noa Recrutement." },
      { p: "Toute reproduction, représentation, adaptation, modification, diffusion ou exploitation, totale ou partielle, sans autorisation préalable est interdite, sauf dans les cas expressément prévus par la loi." },
    ],
  },
  {
    n: 5,
    title: "Données personnelles",
    blocks: [
      { p: "Les modalités de collecte et de traitement des données personnelles dans le cadre du site et du service Noa Recrutement sont détaillées dans la Politique de confidentialité." },
      { p: "Pour toute demande relative aux données personnelles :" },
      { mail: true },
    ],
  },
  {
    n: 6,
    title: "Cookies",
    blocks: [
      { p: "Le site peut utiliser des cookies et autres traceurs nécessaires à son fonctionnement ainsi que, sous réserve du consentement de l'utilisateur lorsque celui-ci est requis, des outils de mesure d'audience." },
      { p: "Les informations relatives aux cookies utilisés, à leurs finalités et aux modalités permettant de gérer les préférences sont précisées dans la Politique de confidentialité et dans l'outil de gestion des cookies disponible sur le site." },
    ],
  },
  {
    n: 7,
    title: "Responsabilité",
    blocks: [
      { p: "Noa Recrutement s'efforce de fournir des informations exactes et à jour sur son site." },
      { p: "Toutefois, aucune garantie ne peut être donnée concernant l'exactitude, l'exhaustivité ou l'actualité de l'ensemble des informations publiées." },
      { p: "Noa Recrutement ne saurait être tenu responsable des dommages résultant d'une utilisation du site non conforme à sa destination, sous réserve des dispositions légales impératives applicables." },
    ],
  },
  {
    n: 8,
    title: "Contact",
    blocks: [
      { p: "Pour toute question relative au site ou au service Noa Recrutement :" },
      { p: "Noa Recrutement" },
      { mail: true },
    ],
  },
  {
    n: 9,
    title: "Droit applicable",
    blocks: [
      { p: "Les présentes mentions légales sont soumises au droit français." },
      { p: "Elles sont notamment établies conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique." },
    ],
  },
];

export default function MentionsLegalesPage() {
  return (
    <LegalPage
      title="Mentions légales de Noa Recrutement"
      lastUpdate="29 août 2026"
      articles={ARTICLES}
    />
  );
}
