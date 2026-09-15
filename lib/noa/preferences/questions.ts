// Les 24 questions du questionnaire de préférences de travail.
//
// Une seule source : ce module. Le scoring (work-preferences.ts), la page
// publique et les tests lisent tous cette liste — personne ne la recopie.
//
// Ce questionnaire n'est pas un test de personnalité : il mesure des
// préférences de travail, sur six dimensions, à partir de situations
// concrètes. Il n'y a pas de bonne réponse, et rien ici ne produit un profil
// DISC, MBTI ou Big Five.
import type { WorkPreferenceDimension } from "@/lib/noa/types";

export interface WorkPreferenceQuestion {
  id: string;
  dimension: WorkPreferenceDimension;
  /** `reverse` : un accord signale une préférence BASSE sur la dimension. */
  scoring: "direct" | "reverse";
  text: string;
}

export const WORK_PREFERENCE_DIMENSIONS: WorkPreferenceDimension[] = [
  "structure",
  "autonomy",
  "interaction",
  "initiative",
  "change",
  "feedback",
];

export const WORK_PREFERENCE_QUESTIONS: WorkPreferenceQuestion[] = [
  { id: "q1", dimension: "structure", scoring: "direct", text: "Avant de commencer une mission, j'aime connaître clairement le résultat attendu." },
  { id: "q2", dimension: "interaction", scoring: "direct", text: "J'apprécie de réfléchir avec d'autres personnes lorsque je travaille sur un sujet." },
  { id: "q3", dimension: "autonomy", scoring: "direct", text: "Une fois mon périmètre défini, j'aime pouvoir gérer les décisions courantes sans demander systématiquement de validation." },
  { id: "q4", dimension: "change", scoring: "reverse", text: "Lorsque les priorités changent, je préfère disposer d'un peu de temps pour réorganiser ma façon de travailler." },
  { id: "q5", dimension: "feedback", scoring: "direct", text: "Des retours réguliers m'aident à savoir si je vais dans la bonne direction." },
  { id: "q6", dimension: "initiative", scoring: "direct", text: "Quand j'identifie une amélioration possible dans mon périmètre, j'aime pouvoir la proposer spontanément." },
  { id: "q7", dimension: "structure", scoring: "direct", text: "J'apprécie que les principales étapes et échéances d'une mission soient définies dès le départ." },
  { id: "q8", dimension: "interaction", scoring: "reverse", text: "Pour avancer efficacement, j'apprécie de disposer de périodes de travail avec peu d'interactions." },
  { id: "q9", dimension: "autonomy", scoring: "reverse", text: "Sur une nouvelle mission, des points de validation réguliers avec mon responsable m'aident à progresser." },
  { id: "q10", dimension: "change", scoring: "direct", text: "Lorsque les priorités évoluent, je préfère pouvoir ajuster rapidement mon organisation plutôt que conserver le fonctionnement prévu initialement." },
  { id: "q11", dimension: "feedback", scoring: "direct", text: "J'apprécie que les ajustements utiles me soient signalés au fil de l'avancement plutôt que seulement lors d'un bilan." },
  { id: "q12", dimension: "initiative", scoring: "direct", text: "Lorsque le résultat attendu est clair, j'aime pouvoir commencer à avancer sans attendre qu'on me précise chaque étape." },
  { id: "q13", dimension: "structure", scoring: "reverse", text: "Il me convient que l'on définisse principalement le résultat attendu et que la manière d'y parvenir reste ouverte." },
  { id: "q14", dimension: "interaction", scoring: "direct", text: "Des échanges réguliers avec mes collègues font partie de ma manière préférée de travailler." },
  { id: "q15", dimension: "autonomy", scoring: "direct", text: "J'apprécie de pouvoir organiser moi-même la manière dont j'atteins un objectif." },
  { id: "q16", dimension: "change", scoring: "direct", text: "Lorsque l'environnement évolue, je préfère expérimenter rapidement une nouvelle manière de fonctionner." },
  { id: "q17", dimension: "feedback", scoring: "reverse", text: "Lorsque je commence une mission, j'apprécie de disposer d'un peu de temps pour avancer avant de recevoir un premier retour." },
  { id: "q18", dimension: "initiative", scoring: "reverse", text: "Sur un sujet nouveau, je préfère disposer d'une première orientation avant de proposer ma propre manière d'avancer." },
  { id: "q19", dimension: "structure", scoring: "reverse", text: "J'apprécie de pouvoir ajuster l'organisation d'une mission au fur et à mesure plutôt que suivre un déroulé défini précisément dès le départ." },
  { id: "q20", dimension: "interaction", scoring: "reverse", text: "Lorsque j'aborde un sujet nouveau, je préfère d'abord construire ma réflexion seul(e) avant de la partager." },
  { id: "q21", dimension: "autonomy", scoring: "reverse", text: "Sur une nouvelle mission, je préfère valider les principales étapes avec mon responsable avant d'avancer davantage seul(e)." },
  { id: "q22", dimension: "change", scoring: "reverse", text: "Pour un changement important, je préfère comprendre ce qui va évoluer avant que la nouvelle organisation soit mise en place." },
  { id: "q23", dimension: "feedback", scoring: "reverse", text: "Lorsque tout avance normalement, je préfère regrouper les retours lors de points prévus plutôt que les recevoir au fil de l'eau." },
  { id: "q24", dimension: "initiative", scoring: "reverse", text: "Lorsque plusieurs approches sont possibles, je préfère disposer d'une première direction avant de choisir celle que je vais essayer." },
];

/**
 * Échelle de réponse. Quatre positions, aucun neutre : forcer un côté est ce
 * qui rend une préférence lisible. Ces libellés sont les seuls affichés au
 * collaborateur — jamais les chiffres.
 */
export const ANSWER_SCALE: { value: 1 | 2 | 3 | 4; label: string }[] = [
  { value: 1, label: "Pas d'accord" },
  { value: 2, label: "Plutôt pas d'accord" },
  { value: 3, label: "Plutôt d'accord" },
  { value: 4, label: "D'accord" },
];

export type AnswerValue = 1 | 2 | 3 | 4;

export function isAnswerValue(value: unknown): value is AnswerValue {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function findWorkPreferenceQuestion(id: string): WorkPreferenceQuestion | null {
  return WORK_PREFERENCE_QUESTIONS.find((q) => q.id === id) ?? null;
}

// ─── Sous-ensemble de dimensions ────────────────────────────────────────────
// Le questionnaire pourra un jour ne poser que les questions des dimensions
// pertinentes pour la Scorecard : 12 questions au lieu de 24 si trois
// dimensions suffisent. C'est le principe de minimisation — ne pas demander ce
// dont on ne fera rien.
//
// Le code sait le faire à partir d'ici. RIEN NE L'ACTIVE : tous les appels
// passent la valeur par défaut, donc les six dimensions et les 24 questions.
// La sélection ne sera branchée que lorsque la correspondance Scorecard ->
// dimensions sera assez fiable pour qu'une question retirée ne soit pas une
// question qui manquait.

/**
 * Les questions des dimensions demandées, dans l'ordre du questionnaire.
 * Par défaut, les 24 : c'est le seul comportement en production.
 */
export function questionsForDimensions(
  dimensions: readonly WorkPreferenceDimension[] = WORK_PREFERENCE_DIMENSIONS,
): WorkPreferenceQuestion[] {
  const wanted = new Set(dimensions);
  return WORK_PREFERENCE_QUESTIONS.filter((q) => wanted.has(q.dimension));
}

/**
 * Relit une sélection stockée. Renvoie null quand elle est absente, invalide
 * ou vide — et null vaut « les six dimensions ». Les valeurs inconnues sont
 * ignorées, l'ordre canonique est rétabli et les doublons écartés : ce qui
 * vient de la base ne décide pas de l'ordre des questions.
 */
export function parseSelectedDimensions(raw: unknown): WorkPreferenceDimension[] | null {
  if (!Array.isArray(raw)) return null;
  const kept = WORK_PREFERENCE_DIMENSIONS.filter((d) => raw.includes(d));
  return kept.length > 0 ? kept : null;
}

/**
 * Première question sans réponse : point de reprise. null quand tout est
 * répondu. L'index porte sur les questions réellement posées, pas sur les 24.
 */
export function firstUnansweredIndex(
  answers: Record<string, number>,
  questions: readonly WorkPreferenceQuestion[] = WORK_PREFERENCE_QUESTIONS,
): number | null {
  const index = questions.findIndex((q) => !isAnswerValue(answers[q.id]));
  return index === -1 ? null : index;
}
