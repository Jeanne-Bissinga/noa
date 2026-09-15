// Scoring du questionnaire Noa et lecture des préférences.
//
// Module pur, déterministe, sans IA. Chaque étape est une règle qu'un manager
// peut comprendre et qu'on peut expliquer au collaborateur.
//
// ─── Ce que ce module ne fait pas ───────────────────────────────────────────
// Il ne produit jamais un profil DISC, MBTI ou Big Five : les six préférences
// ne sont pas convertibles, et une préférence n'est pas un trait. Il ne
// qualifie jamais la personne — « mixed » veut dire « pas de préférence assez
// nette pour une recommandation forte », rien d'autre.
import type { PreferenceOrientation, WorkPreferenceDimension } from "@/lib/noa/types";
import {
  WORK_PREFERENCE_DIMENSIONS,
  questionsForDimensions,
  isAnswerValue,
  type AnswerValue,
} from "@/lib/noa/preferences/questions";

export const DIMENSION_LABEL: Record<WorkPreferenceDimension, string> = {
  structure: "Structure",
  autonomy: "Autonomie",
  interaction: "Interaction",
  initiative: "Initiative",
  change: "Changement",
  feedback: "Retours",
};

export interface DimensionScore {
  /** Moyenne des quatre réponses normalisées, entre 1 et 4. */
  mean: number;
  /** Écart-type des quatre réponses normalisées. */
  standardDeviation: number;
  orientation: PreferenceOrientation;
}

/**
 * Scores par dimension. PARTIEL par construction : un questionnaire peut ne
 * porter que sur un sous-ensemble de dimensions (cf. questionsForDimensions).
 * Aujourd'hui aucune ligne n'est écrite avec une sélection, la valeur est donc
 * toujours complète — mais le type dit la vérité future et oblige les lecteurs
 * à traiter l'absence plutôt qu'à la découvrir en production.
 */
export type WorkPreferenceScores = Partial<Record<WorkPreferenceDimension, DimensionScore>>;

/** Dimensions réellement mesurées, dans l'ordre canonique. */
export function scoredDimensions(scores: WorkPreferenceScores): WorkPreferenceDimension[] {
  return WORK_PREFERENCE_DIMENSIONS.filter((d) => scores[d] !== undefined);
}

// ─── Seuils ─────────────────────────────────────────────────────────────────
// Centralisés pour pouvoir les régler sans toucher à la logique. Une
// orientation n'est retenue que si la moyenne est nette ET que les quatre
// réponses vont dans le même sens : une moyenne de 3.25 obtenue avec 4-4-4-1
// n'est pas une préférence, c'est une dispersion.
export const ORIENTATION_THRESHOLDS = {
  highMean: 3.25,
  lowMean: 1.75,
  maxStandardDeviation: 0.75,
} as const;

/** Réponse normalisée : un accord à une question inversée vaut une préférence basse. */
export function normalizeAnswer(answer: AnswerValue, scoring: "direct" | "reverse"): number {
  return scoring === "direct" ? answer : 5 - answer;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function orientationOf(m: number, sd: number): PreferenceOrientation {
  if (sd > ORIENTATION_THRESHOLDS.maxStandardDeviation) return "mixed";
  if (m >= ORIENTATION_THRESHOLDS.highMean) return "high_preference";
  if (m <= ORIENTATION_THRESHOLDS.lowMean) return "low_preference";
  return "mixed";
}

/**
 * Calcule les scores des dimensions demandées. Exige TOUTES les réponses des
 * questions de ces dimensions : un questionnaire incomplet ne se score pas, il
 * se reprend.
 *
 * Sans second argument : les six dimensions et les 24 réponses, c'est-à-dire
 * le comportement d'avant, à l'identique. C'est le seul appel en production.
 */
export function scoreWorkPreferences(
  answers: Record<string, unknown>,
  dimensions: readonly WorkPreferenceDimension[] = WORK_PREFERENCE_DIMENSIONS,
): WorkPreferenceScores | null {
  const asked = questionsForDimensions(dimensions);
  if (asked.length === 0) return null;

  const normalized = new Map<WorkPreferenceDimension, number[]>();

  for (const question of asked) {
    const answer = answers[question.id];
    if (!isAnswerValue(answer)) return null;
    const bucket = normalized.get(question.dimension) ?? [];
    bucket.push(normalizeAnswer(answer, question.scoring));
    normalized.set(question.dimension, bucket);
  }

  // Parcours dans l'ordre canonique, et non dans celui du Map : l'ordre des
  // clés du jsonb stocké doit rester celui des dimensions, pas celui des
  // questions posées.
  const scores: WorkPreferenceScores = {};
  for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
    const values = normalized.get(dimension);
    if (!values) continue;
    const m = Math.round(mean(values) * 100) / 100;
    const sd = Math.round(standardDeviation(values) * 100) / 100;
    scores[dimension] = { mean: m, standardDeviation: sd, orientation: orientationOf(m, sd) };
  }
  return scores;
}

/**
 * Relit des scores stockés en jsonb, en refusant tout ce qui n'a pas la forme
 * attendue.
 *
 * Accepte un sous-ensemble de dimensions, mais chaque dimension présente doit
 * être complète : une entrée à moitié écrite est un bug, pas une préférence
 * partielle. Un objet sans aucune dimension connue reste null — « rien de
 * mesuré » n'est pas un résultat.
 *
 * Rétrocompatible : un jsonb à six dimensions écrit avant cette version se
 * relit à l'identique.
 */
export function parseWorkPreferenceScores(raw: unknown): WorkPreferenceScores | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const scores: WorkPreferenceScores = {};

  for (const dimension of WORK_PREFERENCE_DIMENSIONS) {
    const entry = record[dimension] as Partial<DimensionScore> | undefined;
    if (entry === undefined || entry === null) continue;
    if (
      typeof entry.mean !== "number" ||
      typeof entry.standardDeviation !== "number" ||
      !["low_preference", "mixed", "high_preference"].includes(String(entry.orientation))
    ) {
      return null;
    }
    scores[dimension] = {
      mean: entry.mean,
      standardDeviation: entry.standardDeviation,
      orientation: entry.orientation as PreferenceOrientation,
    };
  }
  return scoredDimensions(scores).length > 0 ? scores : null;
}

// ─── Libellés manager ───────────────────────────────────────────────────────
// Toujours formulés comme une préférence de travail, jamais comme un trait de
// la personne. Les scores numériques ne sont pas affichés par défaut.
type OrientationLabels = Record<PreferenceOrientation, string>;

export const PREFERENCE_LABEL: Record<WorkPreferenceDimension, OrientationLabels> = {
  structure: {
    low_preference: "Apprécie un cadre souple",
    mixed: "S'adapte à différents niveaux de structure",
    high_preference: "Apprécie un cadre clairement défini",
  },
  autonomy: {
    low_preference: "Apprécie des repères et validations régulières",
    mixed: "À l'aise avec une autonomie progressive",
    high_preference: "Apprécie une large marge de manœuvre",
  },
  interaction: {
    low_preference: "Apprécie davantage les temps de réflexion individuelle",
    mixed: "Alterne facilement échanges et travail individuel",
    high_preference: "Apprécie des échanges réguliers",
  },
  initiative: {
    low_preference: "Préfère disposer de premiers repères avant d'agir",
    mixed: "Adapte son niveau d'initiative au contexte",
    high_preference: "Aime pouvoir prendre spontanément l'initiative",
  },
  change: {
    low_preference: "Apprécie des changements préparés et progressifs",
    mixed: "S'adapte à différents rythmes de changement",
    high_preference: "Apprécie pouvoir s'ajuster rapidement",
  },
  feedback: {
    low_preference: "Préfère des retours regroupés et espacés",
    mixed: "S'adapte à différents rythmes de retour",
    high_preference: "Apprécie des retours réguliers au fil de l'avancement",
  },
};

// ─── Recommandations manager ────────────────────────────────────────────────
// Déterministes. Une par dimension nettement orientée, les plus marquées
// d'abord. Formulées comme des actions du manager — jamais « cette personne
// est… ».
type Recommendation = Record<"low_preference" | "high_preference", string>;

export const PREFERENCE_RECOMMENDATION: Record<WorkPreferenceDimension, Recommendation> = {
  structure: {
    high_preference: "Clarifiez au départ les objectifs, les principales échéances et les critères de réussite.",
    low_preference: "Donnez surtout la finalité et les priorités, en laissant de la souplesse sur la manière d'organiser le travail.",
  },
  autonomy: {
    high_preference: "Une fois le cadre posé, laissez une marge de manœuvre importante sur la manière d'atteindre les objectifs.",
    low_preference: "Prévoyez des points de repère et de validation réguliers au démarrage des nouvelles missions.",
  },
  interaction: {
    high_preference: "Facilitez rapidement les échanges avec les personnes clés de l'équipe.",
    low_preference: "Préservez également des plages de travail individuel et évitez de multiplier les interactions inutiles.",
  },
  initiative: {
    high_preference: "Donnez rapidement des espaces dans lesquels la personne peut proposer et expérimenter.",
    low_preference: "Commencez par préciser les marges de décision avant d'attendre une forte prise d'initiative.",
  },
  change: {
    high_preference: "La personne peut apprécier de pouvoir ajuster rapidement son organisation lorsque les priorités évoluent.",
    low_preference: "Anticipez autant que possible les changements importants et donnez du contexte avant leur mise en place.",
  },
  feedback: {
    high_preference: "Prévoyez des retours courts et réguliers pendant les premières semaines.",
    low_preference: "Regroupez davantage les retours et privilégiez des points identifiés plutôt que des sollicitations permanentes.",
  },
};

/** Nombre maximal de suggestions affichées : au-delà, plus rien n'est lu. */
export const MAX_RECOMMENDATIONS = 3;

/** Centre de l'échelle 1-4 : la distance à ce point mesure la netteté d'une préférence. */
const SCALE_MIDPOINT = 2.5;

export interface PreferenceHighlight {
  dimension: WorkPreferenceDimension;
  orientation: Exclude<PreferenceOrientation, "mixed">;
  label: string;
  recommendation: string;
}

/**
 * Préférences nettes, de la plus marquée à la moins marquée. Les dimensions
 * « mixed » n'apparaissent jamais ici : elles ne portent pas de conseil fort.
 */
export function highlightPreferences(scores: WorkPreferenceScores, max = MAX_RECOMMENDATIONS): PreferenceHighlight[] {
  return scoredDimensions(scores)
    .filter((d) => scores[d]!.orientation !== "mixed")
    .sort((a, b) => Math.abs(scores[b]!.mean - SCALE_MIDPOINT) - Math.abs(scores[a]!.mean - SCALE_MIDPOINT))
    .slice(0, max)
    .map((dimension) => {
      const orientation = scores[dimension]!.orientation as Exclude<PreferenceOrientation, "mixed">;
      return {
        dimension,
        orientation,
        label: PREFERENCE_LABEL[dimension][orientation],
        recommendation: PREFERENCE_RECOMMENDATION[dimension][orientation],
      };
    });
}
