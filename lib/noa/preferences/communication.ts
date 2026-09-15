import type { BigFiveLevel, BigFiveTrait, DiscProfile, WorkPreferenceDimension } from "@/lib/noa/types";
import { WORK_PREFERENCE_DIMENSIONS } from "@/lib/noa/preferences/questions";
import { highlightPreferences, type WorkPreferenceScores } from "@/lib/noa/preferences/scoring";
import { mbtiPreferences, type MbtiType } from "@/lib/noa/preferences/declared-tests";
import type { PreferenceContext } from "@/lib/noa/preferences/context";

// Conseils pour conduire l'entretien.
//
// ─── Ce qu'ils sont, et ce qu'ils ne sont pas ───────────────────────────────
// Ils disent au recruteur ce qu'il FAIT pendant l'échange pour obtenir des
// faits : annoncer le déroulé, laisser un silence, demander un exemple plutôt
// qu'une projection. Ils ne participent jamais à l'évaluation, ne nomment
// aucune compétence et ne préjugent d'aucune réponse.
//
// ─── Quatre modèles, quatre jeux de règles, aucun pont ──────────────────────
// Chaque source écrit ses conseils dans SON propre vocabulaire : les lettres
// DISC pour un DISC, les quatre axes pour un MBTI, les dimensions Big Five pour
// un Big Five, les six dimensions Noa pour le questionnaire Noa.
//
// Aucune table n'est partagée et aucune fonction n'appelle l'autre. Ce module a
// porté une version où toutes les sources étaient d'abord projetées sur les six
// dimensions Noa ; cela produisait une affirmation que le candidat n'avait
// jamais faite. Les six dimensions Noa n'appartiennent qu'au questionnaire Noa.
//
// ─── Pourquoi une table distincte de PREFERENCE_RECOMMENDATION ──────────────
// Celle de scoring.ts dit à un manager comment encadrer quelqu'un sur la durée
// (« Prévoyez des points de validation réguliers au démarrage des nouvelles
// missions »). Elle n'a rien à faire dans un entretien d'une heure avec une
// personne qu'on ne connaît pas encore. Les deux tables coexistent sans se
// recouvrir, et un test le vérifie.
//
// Module pur : aucune IA, aucun appel réseau, un résultat reproductible.

/** Au-delà, plus personne ne les lit avant d'entrer en entretien. */
export const MAX_CONDUCT_ADVICE = 4;

export type AdviceSource = "noa" | "disc" | "mbti" | "big_five";

export interface ConductAdviceItem {
  /**
   * Clé de rendu et d'assertion, préfixée par le modèle d'origine. Jamais
   * affichée. Le préfixe n'est pas décoratif : il rend la séparation des
   * modèles lisible dans la donnée produite, et donc vérifiable par un test.
   */
  id: string;
  source: AdviceSource;
  /**
   * Ce que le recruteur fait pendant l'entretien, à l'impératif.
   *
   * Aucun préambule : ni « Le résultat déclaré peut suggérer… », ni « Cela peut
   * indiquer… ». Chaque conseil a porté cette précaution, répétée d'une puce à
   * l'autre au point qu'on ne lisait plus qu'elle. La prudence est dite une
   * fois, au-dessus de la liste (cf. `guidanceSourceLine`) ; les puces disent
   * quoi faire.
   */
  action: string;
}

/**
 * La prudence, dite une fois pour toute la liste.
 *
 * `null` pour le questionnaire Noa : les réponses viennent de la personne, il
 * n'y a rien à relativiser — les conseils s'affichent directement.
 *
 * Pour un test déclaré, la phrase nomme le modèle et jamais le résultat. Savoir
 * qu'un conseil vient d'un MBTI aide le recruteur à doser la confiance qu'il lui
 * accorde ; lire « INTJ » ne lui apprendrait rien d'actionnable et donnerait à
 * l'écran l'allure d'une fiche de profil.
 *
 * Une seule formulation, partagée par la fiche candidat et la page de
 * préparation : deux phrasés pour une même mise en garde finissaient par se
 * contredire dans le détail.
 */
export function guidanceSourceLine(source: AdviceSource): string | null {
  switch (source) {
    case "noa":
      return null;
    case "disc":
      return "D'après un résultat DISC déclaré. Ces pistes restent indicatives.";
    case "mbti":
      return "D'après un résultat MBTI déclaré. Ces pistes restent indicatives.";
    case "big_five":
      return "D'après un résultat Big Five déclaré. Ces pistes restent indicatives.";
  }
}

/** Rappel affiché sous la liste, quelle que soit la source. */
export const GUIDANCE_FOOTNOTE =
  "Ces conseils servent uniquement à faciliter l'échange et n'entrent pas dans l'évaluation.";

// ─── Questionnaire Noa ──────────────────────────────────────────────────────
// Les six dimensions, et elles seules ici. Les réponses viennent de la
// personne : les conseils sont affirmatifs, sans conditionnel.

type ConductAdvice = Record<"low_preference" | "high_preference", string>;

export const INTERVIEW_CONDUCT_ADVICE: Record<WorkPreferenceDimension, ConductAdvice> = {
  structure: {
    high_preference: "Annoncez le déroulé et la durée de l'entretien avant la première question : un cadre posé libère la parole.",
    low_preference: "Laissez les exemples venir dans l'ordre choisi, quitte à remettre vous-même les faits en ordre ensuite.",
  },
  autonomy: {
    high_preference: "Posez des questions larges et laissez l'exemple se dérouler sans le découper.",
    low_preference: "Donnez le contexte de la question avant de la poser, et dites quel degré de détail vous attendez.",
  },
  interaction: {
    high_preference: "Gardez cinq minutes d'échange ouvert à la fin : c'est souvent là qu'arrivent les exemples les plus précis.",
    low_preference: "Laissez le silence s'installer après une question, et ne relancez qu'au bout de quelques secondes.",
  },
  initiative: {
    high_preference: "Demandez ce qui a été proposé spontanément, à qui, et ce que la proposition est devenue.",
    low_preference: "Préférez des questions sur des situations vécues plutôt que des mises en situation hypothétiques.",
  },
  change: {
    high_preference: "Faites raconter un changement de priorité subi, et ce qui a été réorganisé concrètement.",
    low_preference: "Annoncez vos changements de sujet plutôt que d'enchaîner directement.",
  },
  feedback: {
    high_preference: "Reformulez au fil de l'entretien ce que vous avez compris, et dites quand vous reviendrez avec une réponse.",
    low_preference: "Regroupez vos remarques en fin d'entretien plutôt que de réagir après chaque réponse.",
  },
};

/**
 * Conseils tirés du questionnaire Noa, de la préférence la plus nette à la
 * moins nette. Une dimension « mixed » ou non posée ne porte aucun conseil.
 */
export function noaAdvice(scores: WorkPreferenceScores, max: number = MAX_CONDUCT_ADVICE): ConductAdviceItem[] {
  return highlightPreferences(scores, WORK_PREFERENCE_DIMENSIONS.length)
    .slice(0, max)
    .map((h) => ({
      id: `noa:${h.dimension}:${h.orientation}`,
      source: "noa" as const,
      action: INTERVIEW_CONDUCT_ADVICE[h.dimension][h.orientation],
    }));
}

// ─── DISC déclaré ───────────────────────────────────────────────────────────
// Lu par ses quatre lettres, telles que le modèle les définit. Aucune n'est
// traduite en dimension Noa, et aucune ne qualifie la personne : « C » ne dit
// rien d'un manque de créativité, seulement d'une manière d'échanger.

export const DISC_CONDUCT_ADVICE: Record<DiscProfile, string> = {
  D: "Allez à l'essentiel, et demandez ce qui a été décidé plutôt que ce qui a été fait.",
  I: "Privilégiez un échange vivant plutôt qu'une suite de questions fermées.",
  S: "Annoncez le déroulé, et laissez le temps de développer chaque exemple sans enchaîner.",
  C: "Accueillez les réponses détaillées : la précision fait partie de la réponse.",
};

/**
 * Conseils tirés d'un DISC déclaré : le profil principal, puis le secondaire
 * s'il existe. Les deux lettres diffèrent toujours (parseDiscResult refuse un
 * secondaire identique), donc les deux conseils diffèrent aussi.
 */
export function discAdvice(
  primary: DiscProfile,
  secondary: DiscProfile | null,
  max: number = MAX_CONDUCT_ADVICE,
): ConductAdviceItem[] {
  const letters = secondary ? [primary, secondary] : [primary];
  return letters.slice(0, max).map((letter) => ({
    id: `disc:${letter}`,
    source: "disc" as const,
    action: DISC_CONDUCT_ADVICE[letter],
  }));
}

// ─── MBTI déclaré ───────────────────────────────────────────────────────────
// Quatre axes, pas seize portraits. Jamais « les INFJ sont… » : chaque axe est
// lu séparément, comme une préférence déclarée.

export type MbtiLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export const MBTI_CONDUCT_ADVICE: Record<MbtiLetter, string> = {
  E: "Laissez de la place au dialogue plutôt qu'à l'exposé.",
  I: "Laissez-lui quelques secondes pour réfléchir avant de relancer.",
  S: "Demandez des exemples situés — un contexte, des faits — plutôt que des principes généraux.",
  N: "Demandez à quel enjeu plus large ses exemples se rattachent.",
  T: "Demandez sur quels critères ses décisions se sont appuyées.",
  F: "Demandez comment l'équipe a été associée aux décisions.",
  J: "Présentez le déroulé de l'entretien avant de commencer.",
  P: "Acceptez qu'un exemple en amène un autre, puis revenez à votre trame.",
};

/** Conseils tirés d'un MBTI déclaré, un par axe, dans l'ordre du type. */
export function mbtiAdvice(type: MbtiType, max: number = MAX_CONDUCT_ADVICE): ConductAdviceItem[] {
  const prefs = mbtiPreferences(type);
  const letters: MbtiLetter[] = [prefs.energy, prefs.information, prefs.decision, prefs.organisation];
  return letters.slice(0, max).map((letter) => ({
    id: `mbti:${letter}`,
    source: "mbti" as const,
    action: MBTI_CONDUCT_ADVICE[letter],
  }));
}

// ─── Big Five déclaré ───────────────────────────────────────────────────────
// Les dimensions sont lues séparément, jamais agrégées, jamais transformées en
// prédiction de performance.
//
// ─── Pourquoi la stabilité émotionnelle n'est pas ici ───────────────────────
// C'est la seule des cinq dimensions qui touche à un terrain adjacent à la
// santé. En tirer une consigne, même limitée à la conduite de l'entretien,
// reviendrait à inférer quelque chose qu'un recruteur n'a pas à inférer — et
// qui se défendrait mal devant un candidat demandant ce qui a été déduit de son
// résultat. Elle reste enregistrée telle qu'elle a été déclarée ; elle ne
// produit simplement aucun conseil.

export const BIG_FIVE_CONDUCT_ADVICE: Partial<Record<BigFiveTrait, Record<"low" | "high", string>>> = {
  openness: {
    high: "Faites raconter un moment où le contexte a changé : les exemples y seront plus riches.",
    low: "Demandez comment une méthode connue a été reconduite, et ce qui a été ajusté au passage.",
  },
  conscientiousness: {
    high: "Laissez dérouler les réponses structurées sans les écourter.",
    low: "Remettez vous-même les faits en ordre après coup, plutôt que d'imposer un plan pendant l'échange.",
  },
  extraversion: {
    high: "Prévoyez un moment d'échange libre avant de conclure.",
    low: "Donnez un temps de silence après chaque question.",
  },
  agreeableness: {
    high: "Demandez explicitement un désaccord qu'il a fallu porter : sans la question, il ne viendra pas.",
    low: "Ne prenez pas une réponse tranchée pour une fin de discussion.",
  },
};

/**
 * Conseils tirés d'un Big Five déclaré. Une dimension « medium » ne produit
 * rien : un niveau intermédiaire ne porte pas de préférence. La stabilité
 * émotionnelle n'en produit jamais (cf. commentaire ci-dessus), et peut donc
 * ramener une liste vide.
 */
export function bigFiveAdvice(
  levels: Record<BigFiveTrait, BigFiveLevel>,
  max: number = MAX_CONDUCT_ADVICE,
): ConductAdviceItem[] {
  const items: ConductAdviceItem[] = [];
  for (const [trait, byLevel] of Object.entries(BIG_FIVE_CONDUCT_ADVICE) as [
    BigFiveTrait,
    Record<"low" | "high", string>,
  ][]) {
    if (items.length >= max) break;
    const level = levels[trait];
    if (level !== "low" && level !== "high") continue;
    items.push({ id: `big_five:${trait}:${level}`, source: "big_five", action: byLevel[level] });
  }
  return items;
}

/**
 * Conseils de conduite, quelle que soit la source.
 *
 * Simple aiguillage : chaque modèle a écrit ses propres règles, rien n'est
 * converti au passage.
 */
export function buildCommunicationGuidance(
  context: PreferenceContext,
  max: number = MAX_CONDUCT_ADVICE,
): ConductAdviceItem[] {
  if (max <= 0) return [];
  switch (context.kind) {
    case "none":
      return [];
    case "noa":
      return noaAdvice(context.scores, max);
    case "disc":
      return discAdvice(context.primary, context.secondary, max);
    case "mbti":
      return mbtiAdvice(context.type, max);
    case "big_five":
      return bigFiveAdvice(context.levels, max);
  }
}
