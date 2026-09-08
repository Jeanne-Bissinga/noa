// Socle de questions des quatre entretiens d'intégration.
//
// Déterministe et versionné avec le code, comme lib/noa/interview-content.ts :
// aucune génération par un modèle. Le socle est identique pour tout le monde —
// c'est ce qui rend deux entretiens J30 comparables entre eux.
//
// ─── Ce que les préférences de travail peuvent faire, et pas faire ──────────
// Elles ajoutent un texte d'aide sous une question, et au plus UNE question
// complémentaire par entretien. Elles ne remplacent jamais une question du
// socle, n'en réordonnent aucune, et ne touchent à aucun objectif : la
// personnalité adapte la manière de demander, jamais ce qui est attendu.
import type { IntegrationInterviewType, WorkPreferenceDimension } from "@/lib/noa/types";
import { preferenceOrientation, type PreferenceContext } from "@/lib/noa/onboarding/personalization";

export interface IntegrationQuestion {
  /** Stable, issu du socle. C'est la clé des notes — jamais un index. */
  id: string;
  q: string;
  /** Relances proposées au manager. */
  probes: string[];
  /** Texte d'aide dérivé des préférences. Oriente l'attention, ne reformule pas. */
  helper?: string;
  /** Vrai pour une question ajoutée par les préférences, pas par le socle. */
  fromPreferences?: boolean;
}

export interface IntegrationSection {
  id: string;
  title: string;
  questions: IntegrationQuestion[];
}

// ─── Les socles ─────────────────────────────────────────────────────────────

const J1: IntegrationSection[] = [
  {
    id: "attentes",
    title: "Attentes et mission",
    questions: [
      {
        id: "attentes.clarte",
        q: "Les attentes liées à votre poste vous semblent-elles suffisamment claires ?",
        probes: ["Qu'est-ce qui reste flou ?", "Qu'attendez-vous de vos trois premiers mois ?"],
      },
      {
        id: "attentes.mission",
        q: "Y a-t-il un élément de votre mission qui mérite d'être précisé ?",
        probes: ["Un périmètre ? Un interlocuteur ? Une priorité ?"],
      },
    ],
  },
  {
    id: "conditions",
    title: "Conditions de démarrage",
    questions: [
      {
        id: "conditions.ressources",
        q: "De quelles ressources avez-vous besoin pour commencer dans de bonnes conditions ?",
        probes: ["Accès, outils, documentation", "Personnes à rencontrer en priorité"],
      },
      {
        id: "conditions.autonomie",
        q: "Quel niveau d'autonomie vous semble approprié au démarrage ?",
        probes: ["Sur quoi souhaitez-vous être accompagné ?"],
      },
      {
        id: "conditions.feedback",
        q: "Comment préférez-vous recevoir du feedback pendant vos premières semaines ?",
        probes: ["À quelle fréquence ?", "Plutôt à chaud ou lors de points prévus ?"],
      },
    ],
  },
];

const J30: IntegrationSection[] = [
  {
    id: "prise_de_poste",
    title: "Prise de poste",
    questions: [
      {
        id: "prise_de_poste.clarte",
        q: "Les attentes et priorités sont-elles aujourd'hui suffisamment claires ?",
        probes: ["Qu'est-ce qui a changé depuis le J1 ?"],
      },
      {
        id: "prise_de_poste.ressources",
        q: "Disposez-vous des outils, informations et ressources nécessaires ?",
        probes: ["Qu'est-ce qui manque encore ?"],
      },
      {
        id: "prise_de_poste.accompagnement",
        q: "Le niveau d'accompagnement actuel vous convient-il ?",
        probes: ["Plutôt trop, plutôt pas assez ?"],
      },
      {
        id: "prise_de_poste.equipe",
        q: "Comment se passe votre intégration dans votre rôle et dans l'équipe ?",
        probes: ["Avec qui travaillez-vous le plus ?"],
      },
    ],
  },
  {
    id: "ajustements",
    title: "Freins et ajustements",
    questions: [
      {
        id: "ajustements.frein",
        q: "Quel est actuellement votre principal frein ?",
        probes: ["Depuis quand ?", "Qu'avez-vous déjà tenté ?"],
      },
      {
        id: "ajustements.suite",
        q: "Quel ajustement serait le plus utile pour les prochaines semaines ?",
        probes: ["De votre côté ? Du mien ?"],
      },
    ],
  },
];

const J60: IntegrationSection[] = [
  {
    id: "conditions",
    title: "Conditions de travail",
    questions: [
      {
        id: "conditions.priorites",
        q: "Vos priorités pour les prochaines semaines sont-elles suffisamment claires ?",
        probes: ["Qu'est-ce qui a bougé depuis le J30 ?"],
      },
      {
        id: "conditions.autonomie",
        q: "Le niveau d'autonomie dont vous disposez vous convient-il ?",
        probes: ["Sur quoi aimeriez-vous davantage de marge ?"],
      },
    ],
  },
  {
    id: "resultats",
    title: "Premiers résultats",
    questions: [
      {
        id: "resultats.progression",
        q: "Avez-vous le sentiment de progresser vers les résultats attendus ?",
        probes: ["Sur quels objectifs en particulier ?"],
      },
      {
        id: "resultats.observables",
        q: "Quels premiers résultats sont aujourd'hui observables ?",
        probes: ["Des exemples concrets ?"],
      },
      {
        id: "resultats.frein",
        q: "Quel est actuellement votre principal frein ?",
        probes: ["Qu'est-ce qui le lèverait ?"],
      },
      {
        id: "resultats.ajustement",
        q: "Qu'est-ce qui devrait être ajusté pour les 30 prochains jours ?",
        probes: ["Une priorité à déplacer ? Un appui à trouver ?"],
      },
    ],
  },
];

const J90: IntegrationSection[] = [
  {
    id: "bilan",
    title: "Bilan des 90 jours",
    questions: [
      {
        id: "bilan.clarte",
        q: "Les attentes liées à votre poste sont-elles aujourd'hui suffisamment claires ?",
        probes: [],
      },
      {
        id: "bilan.autonomie",
        q: "Disposez-vous d'un niveau d'autonomie adapté à vos missions ?",
        probes: [],
      },
      {
        id: "bilan.resultats",
        q: "Quels résultats considérez-vous comme les plus importants sur ces 90 premiers jours ?",
        probes: ["Pourquoi ceux-là ?"],
      },
      {
        id: "bilan.facilitateurs",
        q: "Qu'est-ce qui a le plus facilité votre intégration ?",
        probes: ["Une personne ? Un rituel ? Un outil ?"],
      },
    ],
  },
  {
    id: "suite",
    title: "La suite",
    questions: [
      {
        id: "suite.ameliorer",
        q: "Quel point reste encore à améliorer ou à clarifier ?",
        probes: [],
      },
      {
        id: "suite.progresser",
        q: "Sur quoi souhaitez-vous particulièrement progresser pendant les prochains mois ?",
        probes: ["De quel appui auriez-vous besoin ?"],
      },
    ],
  },
];

const BASE: Record<IntegrationInterviewType, IntegrationSection[]> = {
  integration_j1: J1,
  integration_j30: J30,
  integration_j60: J60,
  integration_j90: J90,
};

// ─── Personnalisation ───────────────────────────────────────────────────────
// Un texte d'aide par question, quand les préférences disent quelque chose sur
// la dimension concernée. Rien d'affirmatif sur la personne : ce sont des
// points d'attention pour le manager qui pose la question.

const HELPER: Record<string, { dimension: WorkPreferenceDimension; high: string; low: string }> = {
  "attentes.clarte": {
    dimension: "structure",
    high: "Précisez les critères de réussite et les échéances, pas seulement l'intention.",
    low: "Donnez la finalité et laissez ouverte la manière d'y parvenir.",
  },
  "conditions.autonomie": {
    dimension: "autonomy",
    high: "Nommez explicitement ce qui peut être décidé sans validation.",
    low: "Proposez des points de repère réguliers pour les premières semaines.",
  },
  "conditions.feedback": {
    dimension: "feedback",
    high: "Des retours courts et fréquents seront sans doute mieux reçus que des bilans espacés.",
    low: "Convenez de points identifiés plutôt que de retours au fil de l'eau.",
  },
  "prise_de_poste.accompagnement": {
    dimension: "interaction",
    high: "Vérifiez que les échanges avec l'équipe sont assez nombreux.",
    low: "Vérifiez qu'il reste des plages de travail individuel.",
  },
  "conditions.priorites": {
    dimension: "structure",
    high: "Reprécisez les critères et les échéances plutôt que les seules intentions.",
    low: "Recentrez sur le résultat attendu, pas sur la méthode.",
  },
};

/** Une question complémentaire, au plus, selon la préférence la plus marquée. */
const EXTRA: { dimension: WorkPreferenceDimension; orientation: "high" | "low"; question: IntegrationQuestion }[] = [
  {
    dimension: "change",
    orientation: "low",
    question: {
      id: "extra.changement",
      q: "Y a-t-il un changement récent que vous auriez aimé voir arriver plus progressivement ?",
      probes: [],
      fromPreferences: true,
    },
  },
  {
    dimension: "initiative",
    orientation: "high",
    question: {
      id: "extra.initiative",
      q: "Y a-t-il un sujet sur lequel vous aimeriez pouvoir prendre davantage l'initiative ?",
      probes: [],
      fromPreferences: true,
    },
  },
  {
    dimension: "interaction",
    orientation: "low",
    question: {
      id: "extra.concentration",
      q: "Avez-vous assez de temps de travail au calme pour avancer sur vos sujets de fond ?",
      probes: [],
      fromPreferences: true,
    },
  },
];

/**
 * Construit le guide d'un entretien : le socle, plus les textes d'aide et au
 * plus une question complémentaire tirés des préférences de travail.
 *
 * Sans contexte, le socle est servi tel quel — personne ne se retrouve sans
 * guide faute de préférences renseignées.
 */
export function buildIntegrationGuide(
  milestone: IntegrationInterviewType,
  context: PreferenceContext,
): IntegrationSection[] {
  const sections = BASE[milestone].map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const rule = HELPER[question.id];
      if (!rule) return { ...question };
      const orientation = preferenceOrientation(context, rule.dimension);
      if (orientation === "high_preference") return { ...question, helper: rule.high };
      if (orientation === "low_preference") return { ...question, helper: rule.low };
      return { ...question };
    }),
  }));

  // Une seule question complémentaire : au-delà, l'entretien s'allonge sans
  // que le manager sache laquelle compte vraiment.
  const extra = EXTRA.find((candidate) => {
    const orientation = preferenceOrientation(context, candidate.dimension);
    return candidate.orientation === "high"
      ? orientation === "high_preference"
      : orientation === "low_preference";
  });

  if (extra && sections.length > 0) {
    const last = sections[sections.length - 1];
    sections[sections.length - 1] = { ...last, questions: [...last.questions, extra.question] };
  }

  return sections;
}

/** Tous les identifiants de question d'un jalon, pour valider ce qui revient du client. */
export function questionIdsOf(sections: IntegrationSection[]): string[] {
  return sections.flatMap((s) => s.questions.map((q) => q.id));
}
