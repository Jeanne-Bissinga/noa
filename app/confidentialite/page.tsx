import type { Metadata } from "next";
import { LegalPage, type LegalArticle } from "@/components/noa/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Noa Recrutement : données collectées, finalités, bases légales, durées de conservation, cookies, destinataires et droits des personnes.",
};

const ARTICLES: LegalArticle[] = [
  {
    n: 1,
    title: "Qui est responsable de vos données ?",
    blocks: [
      { p: "Noa Recrutement est responsable des traitements de données personnelles réalisés pour la gestion du site, des comptes utilisateurs et de la relation avec ses clients." },
      { p: "Les informations relatives à l'identité juridique de l'éditeur sont disponibles dans les Mentions légales." },
      { p: "Pour toute question relative à vos données personnelles, vous pouvez contacter Noa à l'adresse suivante :" },
      { mail: true },
      { p: "Concernant les données des candidats évalués par nos clients recruteurs, Noa agit en tant que sous-traitant au sens du RGPD." },
      { p: "Le client recruteur, c'est-à-dire l'entreprise qui utilise Noa, reste responsable du traitement de ces données." },
      { p: "Il appartient notamment au client recruteur de déterminer les finalités du traitement, les données nécessaires au recrutement, les critères d'évaluation et les personnes autorisées à accéder aux informations des candidats." },
      { p: "Cette répartition des rôles est précisée dans nos Conditions Générales d'Utilisation et, le cas échéant, dans le contrat conclu avec le client." },
    ],
  },
  {
    n: 2,
    title: "Quelles données collectons-nous ?",
    blocks: [
      { h3: "Données des utilisateurs et clients recruteurs" },
      { p: "Lors de la création et de l'utilisation d'un compte Noa, nous pouvons collecter les données suivantes :" },
      { ul: [
        "prénom ;",
        "nom ;",
        "adresse email professionnelle ;",
        "informations nécessaires à l'authentification du compte ;",
        "nom de l'entreprise ;",
        "numéro SIRET ;",
        "fonction au sein de l'entreprise ;",
        "taille de l'équipe ;",
        "objectif principal d'utilisation de Noa ;",
        "données relatives à l'utilisation du Service ;",
        "données de facturation lorsqu'une offre payante est utilisée ;",
        "données de navigation via Google Analytics, sous réserve du consentement de l'utilisateur.",
      ] },
      { p: "Les mots de passe sont traités au moyen de mécanismes de sécurité destinés à empêcher leur consultation en clair." },
      { h3: "Données des candidats évalués via la plateforme" },
      { p: "Dans le cadre d'un recrutement, nos clients peuvent transmettre ou saisir dans Noa notamment :" },
      { ul: [
        "nom et prénom du candidat ;",
        "coordonnées nécessaires au recrutement ;",
        "CV ;",
        "expériences professionnelles ;",
        "formations ;",
        "compétences ;",
        "informations relatives à la candidature ;",
        "critères d'évaluation définis par le recruteur ;",
        "scorecards de recrutement ;",
        "réponses apportées lors des entretiens ;",
        "notes prises par les recruteurs ;",
        "évaluations réalisées pendant le processus de recrutement ;",
        "résultats d'évaluation ;",
        "synthèses et éléments de comparaison entre candidats ;",
        "transcriptions ou contenus issus d'entretiens, lorsqu'ils sont utilisés dans le Service.",
      ] },
      { p: "La nature exacte des données traitées dépend des informations saisies ou transmises à Noa par le client recruteur." },
    ],
  },
  {
    n: 3,
    title: "Pourquoi collectons-nous ces données ?",
    blocks: [
      { p: "Nous traitons ces données afin de :" },
      { ul: [
        "fournir le service Noa ;",
        "créer et gérer les comptes utilisateurs ;",
        "permettre aux entreprises de structurer leurs recrutements ;",
        "permettre la création et l'utilisation de scorecards ;",
        "accompagner la réalisation d'entretiens structurés ;",
        "organiser et analyser les informations relatives aux candidats ;",
        "générer des synthèses et des éléments d'aide à la décision ;",
        "gérer la relation avec nos clients ;",
        "gérer la facturation ;",
        "répondre aux demandes de contact et d'assistance ;",
        "assurer la sécurité et le bon fonctionnement du Service ;",
        "améliorer Noa ;",
        "mesurer l'audience du site ;",
        "respecter nos obligations légales.",
      ] },
      { p: "Noa constitue un outil d'aide à la décision." },
      { p: "Noa ne prend pas automatiquement la décision de recruter ou de refuser un candidat." },
      { p: "La décision finale reste prise par le client recruteur." },
    ],
  },
  {
    n: 4,
    title: "Base légale du traitement",
    blocks: [
      { p: "Selon les traitements concernés, nous nous appuyons sur les bases légales suivantes :" },
      { dl: [
        { term: "Exécution du contrat", def: "pour la création et la gestion du compte, la fourniture du Service et la gestion de la relation avec le client ;" },
        { term: "Intérêt légitime", def: "pour assurer la sécurité, améliorer le Service et analyser son utilisation lorsque cela est applicable ;" },
        { term: "Respect d'une obligation légale", def: "notamment pour certaines obligations comptables, fiscales ou administratives ;" },
        { term: "Consentement", def: "pour les cookies et traceurs non essentiels, notamment Google Analytics lorsqu'un consentement est requis." },
      ] },
      { p: "Concernant les données des candidats traitées pour le compte d'un client, il appartient au client recruteur, en qualité de responsable du traitement, de déterminer la base légale appropriée au traitement des données dans le cadre de son recrutement." },
    ],
  },
  {
    n: 5,
    title: "Combien de temps conservons-nous vos données ?",
    blocks: [
      { dl: [
        { term: "Données de compte client", def: "pendant toute la durée de la relation contractuelle, puis pendant la durée nécessaire au respect de nos obligations légales, comptables ou à la gestion d'éventuels litiges ;" },
        { term: "Données de candidats", def: "leur durée de conservation est principalement déterminée par le client recruteur en sa qualité de responsable du traitement ;" },
        { term: "Données de connexion et logs", def: "pendant une durée maximale de 1 an, sauf nécessité particulière liée à la sécurité ou obligation légale ;" },
        { term: "Données de facturation", def: "pendant la durée imposée par les obligations légales et comptables applicables." },
      ] },
      { p: "À l'issue de ces durées, les données sont supprimées ou anonymisées, sauf lorsqu'une obligation légale impose leur conservation." },
    ],
  },
  {
    n: 6,
    title: "Cookies et Google Analytics",
    blocks: [
      { p: "Nous utilisons Google Analytics pour mesurer la fréquentation et l'utilisation du site." },
      { p: "Cet outil :" },
      { ul: [
        "ne se déclenche qu'après votre consentement lorsqu'un consentement est requis ;",
        "peut entraîner le traitement de certaines données par Google ;",
        "peut impliquer un transfert de certaines données vers les États-Unis, selon les conditions applicables au service ;",
        "peut être refusé lors de votre première visite ;",
        "peut être désactivé ultérieurement grâce à l'outil de gestion des préférences de cookies.",
      ] },
      { p: "Vous pouvez également configurer votre navigateur pour limiter ou refuser certains cookies." },
      { p: "Le refus des cookies non essentiels n'empêche pas l'accès aux fonctionnalités essentielles de Noa." },
    ],
  },
  {
    n: 7,
    title: "Qui a accès à vos données ?",
    blocks: [
      { p: "Les données peuvent être accessibles uniquement aux personnes et prestataires qui en ont besoin pour assurer le fonctionnement du Service." },
      { p: "Cela peut notamment inclure :" },
      { ul: [
        "les personnes autorisées au sein de Noa ;",
        "les utilisateurs autorisés de l'entreprise cliente ;",
        "Vercel Inc., utilisé pour l'hébergement du Service ;",
        "les prestataires techniques nécessaires au fonctionnement de Noa ;",
        "Google Analytics pour la mesure d'audience, sous réserve du consentement applicable ;",
        "le prestataire de paiement utilisé par Noa, lorsqu'un paiement est réalisé ;",
        "les fournisseurs de technologies d'intelligence artificielle listés ci-dessous.",
      ] },
      { p: "Lorsque Noa fait appel à des sous-traitants, ceux-ci ne sont autorisés à traiter les données que dans la mesure nécessaire à la fourniture de leurs services." },
      { h3: "Fournisseurs d'intelligence artificielle" },
      { p: "Certaines fonctionnalités de Noa reposent sur des services d'intelligence artificielle opérés par des prestataires tiers. Les données qui leur sont transmises se limitent à ce qui est nécessaire à la fonctionnalité demandée." },
      { dl: [
        { term: "Anthropic PBC, États-Unis", def: "traitement des contenus nécessaires aux analyses et aux suggestions de Noa. Sont notamment transmis le contenu des CV importés, afin d'en extraire la fiche candidat, les informations de la mission, pour proposer objectifs, compétences et guides d'entretien, ainsi que les réponses et transcriptions d'entretien, pour évaluer les grilles, produire les synthèses et formuler une recommandation." },
        { term: "AssemblyAI Inc., États-Unis", def: "transcription des entretiens. Lorsque le recruteur utilise l'enregistrement audio, celui-ci est transmis à ce prestataire, qui le restitue sous forme de texte. La transcription obtenue est ensuite utilisée dans Noa comme toute autre note d'entretien." },
      ] },
      { p: "Ces prestataires interviennent en qualité de sous-traitants. Ils ne sont pas autorisés à utiliser ces données à d'autres fins que la fourniture du service demandé." },
      { p: "Le recours à ces prestataires implique un transfert de données en dehors de l'Union européenne. Ce transfert est encadré par les garanties prévues au chapitre V du RGPD." },
      { p: "Les analyses, évaluations et synthèses produites par ces outils constituent une aide à la décision. Aucune décision de recrutement n'est prise automatiquement par eux, et la décision finale reste celle du client recruteur." },
      { p: "Vos données personnelles ne sont jamais vendues à des tiers." },
    ],
  },
  {
    n: 8,
    title: "Vos droits",
    blocks: [
      { p: "Conformément au RGPD et à la réglementation applicable, vous pouvez disposer, selon votre situation, des droits suivants :" },
      { ul: [
        "droit d'accès ;",
        "droit de rectification ;",
        "droit à l'effacement ;",
        "droit à la limitation du traitement ;",
        "droit d'opposition ;",
        "droit à la portabilité lorsque celui-ci est applicable ;",
        "droit de retirer votre consentement à tout moment pour les traitements reposant sur celui-ci.",
      ] },
      { p: "Pour exercer vos droits concernant les données traitées directement par Noa, contactez-nous à :" },
      { mail: true },
      { p: "Si vous êtes un candidat évalué via la plateforme d'un de nos clients, vous pouvez également vous adresser directement au recruteur ou à l'entreprise concernée, responsable du traitement de vos données." },
      { p: "Noa pourra, lorsque cela est nécessaire, assister le client dans le traitement de votre demande." },
      { p: "Vous disposez également du droit d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés, CNIL." },
    ],
  },
  {
    n: 9,
    title: "Sécurité",
    blocks: [
      { p: "Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables afin de protéger les données personnelles contre notamment :" },
      { ul: [
        "l'accès non autorisé ;",
        "la perte ;",
        "la destruction ;",
        "l'altération ;",
        "la divulgation non autorisée ;",
        "l'utilisation abusive.",
      ] },
      { p: "Les accès aux données sont limités aux personnes et services qui en ont besoin pour assurer leurs fonctions." },
    ],
  },
  {
    n: 10,
    title: "Contact",
    blocks: [
      { p: "Pour toute question relative à la présente Politique de confidentialité ou au traitement de vos données personnelles :" },
      { p: "Noa Recrutement" },
      { mail: true },
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialité de Noa Recrutement"
      lastUpdate="29 août 2026"
      articles={ARTICLES}
    />
  );
}
