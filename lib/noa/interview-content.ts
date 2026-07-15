// Fixed question content for the Screening / Topgrading interviews, mirrored
// from components/noa/prototype-source.tsx (ScreeningGridScreen ~line 1854,
// TopgradingGridScreen ~line 2182, PREP_META ~line 4156).
//
// This is the seed data used the first time an evaluation_grids/interview_guides
// row is created for a candidate+type. Once seeded, the *_grids.criteria row is
// the source of truth (the recruiter can edit question text in /preparation).

import type { ScreeningCriterion, TopgradingEpisode } from "@/lib/noa/synthesis";

// ─── Screening ──────────────────────────────────────────────────────────────
export const SCREENING_CRITERIA: ScreeningCriterion[] = [
  {
    id: "1",
    q: "Expérience en développement React de niveau senior (> 3 ans)",
    crit: "Prérequis non négociable",
    probes: [
      "Sur combien d'années avez-vous utilisé React en contexte professionnel ?",
      "Quels sont vos projets React les plus complexes livrés en production ?",
      "Quelles librairies de l'écosystème maîtrisez-vous (state management, routing, testing) ?",
    ],
  },
  {
    id: "2",
    q: "Maîtrise TypeScript dans un contexte professionnel",
    crit: "Prérequis non négociable",
    probes: [
      "Dans quels projets avez-vous utilisé TypeScript ?",
      "Avez-vous migré une base JS vers TypeScript ? Comment avez-vous géré la transition ?",
      "Comment gérez-vous les types complexes (génériques, types conditionnels) ?",
    ],
  },
  {
    id: "3",
    q: "Expérience en environnement startup ou PME tech (< 50 pers.)",
    crit: "Critère important",
    probes: [
      "Pouvez-vous décrire la taille et le contexte de votre dernière structure ?",
      "Comment gériez-vous la dette technique avec peu de ressources ?",
      "Avez-vous participé à des décisions d'architecture en autonomie ?",
    ],
  },
  {
    id: "4",
    q: "Disponibilité sous 4 semaines maximum",
    crit: "Contrainte logistique",
    probes: [
      "Quelle est votre date de disponibilité réelle ?",
      "Avez-vous un préavis en cours ? Est-il négociable ?",
      "Y a-t-il des contraintes de localisation ou de déplacement ?",
    ],
  },
  {
    id: "5",
    q: "Prétentions salariales dans la fourchette 60–75 k€",
    crit: "Contrainte budgétaire",
    probes: [
      "Quelle est votre rémunération actuelle (fixe + variable) ?",
      "Quelles sont vos attentes pour ce poste ?",
      "Y a-t-il d'autres éléments importants pour vous (télétravail, RTT, BSPCE) ?",
    ],
  },
  {
    id: "6",
    q: "A déjà accompagné ou mentoré des développeurs juniors",
    crit: "Critère important",
    probes: [
      "Pouvez-vous me donner un exemple concret de junior que vous avez accompagné ?",
      "Sur combien de temps ? Quel a été l'impact mesurable ?",
      "Comment adaptez-vous votre pédagogie selon le profil du junior ?",
    ],
  },
];

// ─── Topgrading ─────────────────────────────────────────────────────────────
export const TOPGRADING_EPISODES: TopgradingEpisode[] = [
  {
    co: "Scaleway",
    period: "2021–2025",
    role: "Senior Frontend Engineer",
    qs: [
      {
        id: "0-0",
        q: "Quelles étaient vos missions principales ?",
        probes: [
          "Quelles étaient vos responsabilités techniques au quotidien ?",
          "Combien de personnes dans l'équipe front ?",
          "Étiez-vous autonome sur les choix d'architecture ?",
        ],
      },
      {
        id: "0-1",
        q: "Quelle est votre réalisation dont vous êtes le plus fier ?",
        probes: [
          "Décrivez le contexte et l'enjeu du projet.",
          "Quel était votre rôle précis ?",
          "Quel a été l'impact mesurable (perf, adoption, revenus) ?",
          "Qu'est-ce que votre manager de l'époque dirait de vous ?",
        ],
      },
      {
        id: "0-2",
        q: "Qu'est-ce qui vous a amené à quitter ce poste ?",
        probes: [
          "Qu'est-ce qui vous a poussé à chercher autre chose ?",
          "Si c'était à refaire, resteriez-vous plus longtemps ?",
          "Qu'aurait dû changer l'entreprise pour vous retenir ?",
        ],
      },
    ],
  },
  {
    co: "Skello",
    period: "2019–2021",
    role: "Développeur Full-Stack",
    qs: [
      {
        id: "1-0",
        q: "Quelles étaient vos missions principales ?",
        probes: [
          "Quelle était la répartition front / back dans votre quotidien ?",
          "Avec quelles équipes travailliez-vous (produit, design, data) ?",
          "Quels étaient vos principaux livrables ?",
        ],
      },
      {
        id: "1-1",
        q: "Comment gérez-vous un désaccord technique avec votre manager ?",
        probes: [
          "Pouvez-vous me donner un exemple concret ?",
          "Comment avez-vous exprimé votre point de vue ?",
          "Quel a été le résultat ? Avez-vous eu raison, tort, ou les deux en partie ?",
        ],
      },
      {
        id: "1-2",
        q: "Quelle était l'ambiance dans l'équipe ?",
        probes: [
          "Comment décririez-vous la culture technique ?",
          "Y avait-il des tensions ? Comment étaient-elles gérées ?",
          "Qu'est-ce qui vous manque le plus de cette équipe ?",
        ],
      },
    ],
  },
  {
    co: "Freelance",
    period: "2017–2019",
    role: "Développeur Web indépendant",
    qs: [
      {
        id: "2-0",
        q: "Quels types de clients et projets ?",
        probes: [
          "Quels secteurs et types de clients (startups, agences, grands comptes) ?",
          "Quel était le projet le plus complexe techniquement ?",
          "Comment gériez-vous la relation client (brief, livrables, retours) ?",
        ],
      },
      {
        id: "2-1",
        q: "Comment organisez-vous votre travail en autonomie ?",
        probes: [
          "Comment structuriez-vous votre semaine type ?",
          "Comment gériez-vous les imprévus et les changements de scope ?",
          "Pourquoi avez-vous choisi d'arrêter le freelance à ce moment-là ?",
        ],
      },
    ],
  },
];

// ─── Preparation screen meta (grid + guide), mirrors PREP_META in the prototype
export type PrepGridQuestion = { text: string; crit?: string };
export type PrepGridSection = { title: string; subtitle?: string; period?: string; questions: PrepGridQuestion[] };
export type PrepGuideQuestion = { q: string; probes: string[] };
export type PrepGuideSection = { title: string; subtitle?: string; questions: PrepGuideQuestion[] };

export const PREP_META: Record<
  "screening" | "topgrading",
  {
    goal: string;
    gridIntro: string;
    gridSections: PrepGridSection[];
    guideIntro: string;
    guideSections: PrepGuideSection[];
  }
> = {
  screening: {
    goal:
      "Le Screening est un entretien court (20–30 min) visant à valider rapidement l'adéquation du profil avec les prérequis du poste : compétences techniques, disponibilité, attentes salariales et motivation.",
    gridIntro:
      "Même grille que celle utilisée pendant l'entretien. Pour chaque critère, vous cocherez Oui / Partiel / Non. Modifiez les intitulés avant de commencer.",
    gridSections: [
      {
        title: "Grille de screening",
        questions: SCREENING_CRITERIA.map((c) => ({ text: c.q, crit: c.crit })),
      },
    ],
    guideIntro: "Pour chaque critère de la grille, voici les questions à poser et les relances pour creuser la réponse.",
    guideSections: [
      {
        title: "Prérequis techniques",
        questions: [
          {
            q: "Expérience React senior",
            probes: [
              "Sur combien d'années avez-vous utilisé React en contexte professionnel ?",
              "Quels sont les projets les plus complexes que vous avez menés avec React ?",
              "Avez-vous travaillé sur des architectures front-end à fort volume (> 10k utilisateurs) ?",
              "Quelles librairies de l'écosystème React maîtrisez-vous (state management, routing, testing) ?",
            ],
          },
          {
            q: "Maîtrise TypeScript",
            probes: [
              "Dans quels contextes avez-vous utilisé TypeScript ?",
              "Avez-vous migré des projets JS vers TypeScript ? Si oui, comment avez-vous géré la transition ?",
              "Comment gérez-vous les types complexes (génériques, types conditionnels) ?",
            ],
          },
        ],
      },
      {
        title: "Contexte professionnel",
        questions: [
          {
            q: "Expérience en startup / PME tech",
            probes: [
              "Pouvez-vous décrire la taille et le contexte de votre dernière structure (< 50 personnes) ?",
              "Comment gériez-vous la dette technique et les itérations rapides dans ce contexte ?",
              "Avez-vous participé à des décisions d'architecture avec peu de ressources ?",
            ],
          },
          {
            q: "Mentoring de développeurs juniors",
            probes: [
              "Pouvez-vous me donner un exemple concret de junior que vous avez accompagné ?",
              "Sur combien de temps ? Quel a été l'impact mesurable pour cette personne ?",
              "Comment adaptez-vous votre approche pédagogique selon le profil ?",
            ],
          },
        ],
      },
      {
        title: "Disponibilité & attentes",
        questions: [
          {
            q: "Disponibilité & logistique",
            probes: [
              "Quelle est votre date de disponibilité réelle ?",
              "Avez-vous un préavis en cours ? Est-il négociable ?",
              "Y a-t-il des contraintes de localisation ou de déplacement à prendre en compte ?",
            ],
          },
          {
            q: "Prétentions salariales",
            probes: [
              "Quelle est votre rémunération actuelle (fixe + variable) ?",
              "Quelles sont vos attentes pour ce poste ?",
              "Y a-t-il d'autres éléments importants pour vous (télétravail, RTT, BSPCE) ?",
            ],
          },
        ],
      },
    ],
  },
  topgrading: {
    goal:
      "Le Topgrading est un entretien approfondi (60–90 min) basé sur le parcours chronologique du candidat. L'objectif est d'identifier ses patterns de performance, comportements récurrents, réalisations mesurables et axes de développement.",
    gridIntro:
      "La grille reprend exactement les épisodes et questions de la grille d'évaluation Topgrading. Pour chaque poste, notez librement les réponses.",
    gridSections: TOPGRADING_EPISODES.map((ep) => ({
      title: ep.co,
      subtitle: ep.role,
      period: ep.period,
      questions: ep.qs.map((q) => ({ text: q.q })),
    })),
    guideIntro:
      "Pour chaque épisode du parcours, voici les questions à poser et les relances pour aller chercher des exemples concrets et mesurables.",
    guideSections: [
      {
        title: "Scaleway",
        subtitle: "2021–2025 · Senior Frontend Engineer",
        questions: [
          {
            q: "Missions principales",
            probes: [
              "Quelles étaient vos responsabilités techniques au quotidien ?",
              "Combien de personnes composaient l'équipe front ? Quel était votre rôle dans l'équipe ?",
              "Étiez-vous autonome sur les choix d'architecture ou dépendant d'un lead technique ?",
            ],
          },
          {
            q: "Réalisation dont vous êtes le plus fier",
            probes: [
              "Décrivez le contexte et l'enjeu du projet.",
              "Quel était votre rôle précis ?",
              "Quel a été l'impact mesurable (performance, adoption, revenus) ?",
              "Qu'est-ce que votre manager de l'époque dirait de votre contribution ?",
            ],
          },
          {
            q: "Raison de départ",
            probes: [
              "Qu'est-ce qui vous a poussé à chercher autre chose ?",
              "Si c'était à refaire, resteriez-vous plus longtemps ? Pourquoi ?",
              "Qu'aurait dû changer l'entreprise pour vous retenir ?",
            ],
          },
        ],
      },
      {
        title: "Skello",
        subtitle: "2019–2021 · Développeur Full-Stack",
        questions: [
          {
            q: "Missions principales",
            probes: [
              "Quelle était la répartition front / back dans votre quotidien ?",
              "Avec quelles équipes travailliez-vous (produit, design, data) ?",
              "Quels étaient vos principaux livrables ?",
            ],
          },
          {
            q: "Désaccord technique avec un manager",
            probes: [
              "Pouvez-vous me donner un exemple concret ?",
              "Comment avez-vous exprimé votre point de vue ?",
              "Quel a été le résultat ? Avez-vous eu raison, tort, ou les deux en partie ?",
            ],
          },
          {
            q: "Ambiance & dynamique d'équipe",
            probes: [
              "Comment décrieriez-vous la culture technique de l'équipe ?",
              "Y avait-il des tensions ? Comment étaient-elles gérées ?",
              "Qu'est-ce qui vous manque le plus de cette équipe ?",
            ],
          },
        ],
      },
      {
        title: "Freelance",
        subtitle: "2017–2019 · Développeur Web indépendant",
        questions: [
          {
            q: "Clients & projets",
            probes: [
              "Quels secteurs et types de clients (startups, agences, grands comptes) ?",
              "Quel était le projet le plus complexe techniquement ?",
              "Comment gériez-vous la relation client (brief, livrables, retours) ?",
            ],
          },
          {
            q: "Organisation en autonomie",
            probes: [
              "Comment structuriez-vous votre semaine type ?",
              "Comment gériez-vous les imprévus et les changements de scope ?",
              "Pourquoi avez-vous choisi d'arrêter le freelance à ce moment-là ?",
            ],
          },
        ],
      },
    ],
  },
};

export const GUIDE_FORMATS = ["Visioconférence", "Téléphone", "Présentiel"];
export const GUIDE_DURATIONS = ["20 min", "30 min", "45 min", "60 min", "90 min"];
