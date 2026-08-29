import type { Metadata } from "next";
import { LegalPage, type LegalArticle } from "@/components/noa/legal-page";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation du service Noa Recrutement : accès au service, compte, données personnelles, responsabilités et droit applicable.",
};

const ARTICLES: LegalArticle[] = [
  {
    n: 1,
    title: "Objet",
    blocks: [
      { p: "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation du service Noa Recrutement, ci-après désigné « le Service », édité par Jeanne (voir Mentions légales)." },
      { p: "Le Service permet aux entreprises de structurer et d'améliorer leurs processus de recrutement grâce à des scorecards, des entretiens structurés et des outils d'analyse et de synthèse des candidatures, afin d'aider les recruteurs dans leur prise de décision." },
      { p: "Toute création de compte implique l'acceptation pleine et entière des présentes CGU." },
    ],
  },
  {
    n: 2,
    title: "Qui peut utiliser le Service ?",
    blocks: [
      { p: "Le Service est réservé aux professionnels agissant pour le compte d'une entreprise dans le cadre d'un usage B2B. Il n'est pas destiné aux particuliers agissant à titre personnel." },
      { p: "En créant un compte, l'utilisateur garantit :" },
      { ul: [
        "avoir la capacité juridique nécessaire pour utiliser le Service au nom de l'entreprise qu'il représente ;",
        "disposer, lorsque cela est nécessaire, de l'autorisation de son entreprise ;",
        "fournir des informations exactes, complètes et à jour lors de son inscription.",
      ] },
    ],
  },
  {
    n: 3,
    title: "Création et gestion du compte",
    blocks: [
      { p: "L'accès au Service nécessite la création d'un compte." },
      { p: "Lors de son inscription, l'utilisateur doit notamment renseigner :" },
      { ul: [
        "son prénom ;",
        "son nom ;",
        "son adresse email professionnelle ;",
        "un mot de passe ;",
        "le nom de son entreprise ;",
        "le numéro SIRET de son entreprise ;",
        "sa fonction au sein de l'entreprise.",
      ] },
      { p: "L'utilisateur peut également être amené à renseigner :" },
      { ul: [
        "la taille de son équipe ;",
        "son objectif principal d'utilisation de Noa.",
      ] },
      { p: "L'utilisateur garantit que les informations fournies sont exactes et s'engage à les mettre à jour si nécessaire." },
      { p: "L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et doit prendre toutes les précautions nécessaires pour empêcher leur utilisation par une personne non autorisée." },
      { p: "Une démonstration du Service peut être proposée avant tout engagement payant. Cette démonstration ne constitue pas un accès gratuit permanent au Service." },
      { p: "L'utilisateur peut demander la suppression de son compte en contactant Noa à l'adresse suivante :" },
      { mail: true },
      { p: "Noa se réserve le droit de suspendre ou de supprimer un compte en cas de non-respect des présentes CGU, d'utilisation frauduleuse ou illicite du Service, ou lorsque cela est nécessaire pour assurer la sécurité du Service." },
    ],
  },
  {
    n: 4,
    title: "Acceptation des CGU et information relative aux données personnelles",
    blocks: [
      { p: "Lors de la création de son compte, l'utilisateur doit accepter les présentes CGU." },
      { p: "L'utilisateur reconnaît également avoir pris connaissance de la Politique de confidentialité de Noa, qui décrit les modalités de collecte et de traitement de ses données personnelles." },
      { p: "La formulation proposée lors de l'inscription est la suivante :" },
      { quote: "J'accepte les Conditions Générales d'Utilisation et reconnais avoir pris connaissance de la Politique de confidentialité." },
      { p: "La création du compte est impossible tant que cette case n'a pas été cochée." },
    ],
  },
  {
    n: 5,
    title: "Utilisation du Service",
    blocks: [
      { p: "L'utilisateur s'engage à utiliser le Service uniquement dans le cadre de processus de recrutement professionnels." },
      { p: "Il s'engage notamment à :" },
      { ul: [
        "utiliser le Service conformément à sa destination ;",
        "respecter les lois et réglementations applicables au recrutement ;",
        "ne pas utiliser le Service à des fins discriminatoires ou contraires à la loi ;",
        "ne pas utiliser les résultats fournis par Noa comme unique fondement d'une décision de recrutement sans analyse humaine ;",
        "ne pas tenter de contourner les dispositifs de sécurité du Service ;",
        "ne pas copier, reproduire, revendre, décompiler ou exploiter de manière non autorisée tout ou partie du Service ;",
        "ne pas transmettre de données qu'il n'est pas autorisé à traiter ;",
        "ne pas importer de données personnelles sans disposer d'une base légale appropriée.",
      ] },
      { p: "L'utilisateur reste responsable de l'utilisation qu'il fait des informations et résultats fournis par Noa." },
    ],
  },
  {
    n: 6,
    title: "Rôle et responsabilité de Noa concernant les évaluations",
    blocks: [
      { p: "Noa fournit des outils d'aide à la décision destinés à accompagner les recruteurs dans l'analyse et la structuration de leurs processus de recrutement." },
      { p: "Noa peut notamment proposer :" },
      { ul: [
        "des scorecards de recrutement ;",
        "des outils d'entretien structuré ;",
        "des analyses des informations relatives aux candidats ;",
        "des synthèses ;",
        "des éléments permettant de comparer plusieurs candidatures.",
      ] },
      { p: "Noa ne prend pas automatiquement la décision de recruter ou de refuser un candidat." },
      { p: "La décision finale de recrutement relève exclusivement du client." },
      { p: "Le client reste responsable :" },
      { ul: [
        "de la définition de ses critères de recrutement ;",
        "de la pertinence de ces critères ;",
        "de leur conformité avec la législation applicable ;",
        "de l'interprétation des résultats fournis ;",
        "de la décision finale prise concernant un candidat.",
      ] },
      { p: "Noa ne garantit pas l'exactitude absolue des analyses, synthèses ou résultats générés." },
      { p: "Les résultats fournis doivent être vérifiés et interprétés par un utilisateur humain avant toute décision." },
    ],
  },
  {
    n: 7,
    title: "Données personnelles",
    blocks: [
      { p: "Le traitement des données personnelles des utilisateurs et des candidats est détaillé dans la Politique de confidentialité de Noa." },
      { p: "Dans le cadre de la création du compte, Noa peut notamment traiter les données suivantes :" },
      { ul: [
        "prénom ;",
        "nom ;",
        "adresse email professionnelle ;",
        "informations nécessaires à l'authentification ;",
        "nom de l'entreprise ;",
        "numéro SIRET ;",
        "fonction ;",
        "taille de l'équipe ;",
        "objectif principal d'utilisation du Service.",
      ] },
      { p: "Le mot de passe de l'utilisateur est traité selon des mesures de sécurité destinées à empêcher son accès en clair." },
      { p: "Pour les données relatives aux candidats transmises par le client, la répartition des responsabilités entre le client et Noa est précisée dans la Politique de confidentialité." },
      { p: "En principe, l'entreprise cliente agit en qualité de responsable du traitement pour les données utilisées dans son processus de recrutement et Noa intervient en qualité de sous-traitant lorsqu'il traite ces données pour son compte." },
    ],
  },
  {
    n: 8,
    title: "Données relatives aux candidats",
    blocks: [
      { p: "L'utilisateur peut être amené à importer dans Noa des données relatives à des candidats." },
      { p: "Ces données peuvent notamment comprendre :" },
      { ul: [
        "des CV ;",
        "des coordonnées ;",
        "des expériences professionnelles ;",
        "des formations ;",
        "des compétences ;",
        "des notes d'entretien ;",
        "des réponses à des questions d'entretien ;",
        "des évaluations réalisées par les recruteurs ;",
        "des informations nécessaires à la comparaison des candidatures.",
      ] },
      { p: "Le client garantit qu'il dispose du droit de collecter, utiliser et transmettre ces données dans le cadre de son processus de recrutement." },
      { p: "Il lui appartient notamment :" },
      { ul: [
        "d'informer les candidats lorsque cela est requis ;",
        "de disposer d'une base légale appropriée ;",
        "de respecter les durées de conservation applicables ;",
        "de respecter les droits des candidats ;",
        "de limiter les données collectées à ce qui est nécessaire au recrutement.",
      ] },
    ],
  },
  {
    n: 9,
    title: "Propriété intellectuelle",
    blocks: [
      { p: "Le Service, sa technologie, son code, son design, son interface, ses fonctionnalités, son identité visuelle et sa marque sont la propriété exclusive de Noa, sous réserve des droits appartenant à des tiers." },
      { p: "Aucune licence ni aucun droit de propriété n'est concédé à l'utilisateur, à l'exception du droit d'utiliser le Service conformément aux présentes CGU." },
      { p: "Les données et documents transmis par le client restent sous la responsabilité et le contrôle du client." },
      { p: "L'utilisation du Service ne transfère à Noa aucun droit de propriété sur les données appartenant au client." },
    ],
  },
  {
    n: 10,
    title: "Disponibilité et évolution du Service",
    blocks: [
      { p: "Noa s'efforce d'assurer la disponibilité et le bon fonctionnement du Service." },
      { p: "Toutefois, Noa ne garantit pas une disponibilité permanente ou sans interruption." },
      { p: "Le Service peut être temporairement indisponible notamment en cas :" },
      { ul: [
        "de maintenance ;",
        "de mise à jour ;",
        "de problème technique ;",
        "d'incident de sécurité ;",
        "de défaillance d'un prestataire technique ;",
        "d'événement indépendant de la volonté de Noa.",
      ] },
      { p: "Noa peut également faire évoluer les fonctionnalités du Service afin de l'améliorer, de corriger des problèmes ou de répondre à de nouvelles exigences techniques ou réglementaires." },
    ],
  },
  {
    n: 11,
    title: "Limitation de responsabilité",
    blocks: [
      { p: "Dans les limites autorisées par la loi, Noa ne pourra être tenu responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le Service." },
      { p: "Cela peut notamment concerner :" },
      { ul: [
        "une perte d'exploitation ;",
        "une perte de chiffre d'affaires ;",
        "une perte d'opportunité ;",
        "une perte de données imputable au client ;",
        "une décision de recrutement contestée ;",
        "une mauvaise interprétation des résultats fournis.",
      ] },
      { p: "Noa ne saurait notamment être tenu responsable d'une décision prise exclusivement sur la base d'un résultat fourni par le Service sans vérification ou analyse humaine appropriée." },
    ],
  },
  {
    n: 12,
    title: "Résiliation",
    blocks: [
      { p: "L'utilisateur peut demander la résiliation de son compte conformément aux conditions prévues dans les CGV, le devis ou le contrat applicable." },
      { p: "Noa peut suspendre ou résilier l'accès au Service en cas de manquement grave aux présentes CGU." },
      { p: "Lorsque la situation le permet, l'utilisateur est informé de cette suspension ou résiliation." },
    ],
  },
  {
    n: 13,
    title: "Modification des CGU",
    blocks: [
      { p: "Noa peut modifier les présentes CGU afin notamment de tenir compte :" },
      { ul: [
        "de l'évolution du Service ;",
        "de nouvelles fonctionnalités ;",
        "d'évolutions réglementaires ;",
        "de changements techniques ou organisationnels.",
      ] },
      { p: "Les utilisateurs seront informés des modifications substantielles par email ou par notification dans le Service." },
      { p: "La version applicable est la version en vigueur au moment de l'utilisation du Service." },
    ],
  },
  {
    n: 14,
    title: "Droit applicable et litiges",
    blocks: [
      { p: "Les présentes CGU sont soumises au droit français." },
      { p: "En cas de litige, les parties s'efforceront de rechercher une solution amiable avant toute procédure judiciaire." },
      { p: "À défaut de résolution amiable, les tribunaux compétents seront ceux du ressort de Paris, sous réserve des règles légales impératives applicables." },
    ],
  },
  {
    n: 15,
    title: "Contact",
    blocks: [
      { p: "Pour toute question relative aux présentes CGU ou à l'utilisation du Service :" },
      { p: "Noa Recrutement" },
      { mail: true },
    ],
  },
];

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions Générales d'Utilisation de Noa Recrutement"
      lastUpdate="29 août 2026"
      articles={ARTICLES}
    />
  );
}
