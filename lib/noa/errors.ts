// Erreurs techniques : journalisées côté serveur, jamais montrées telles quelles.
//
// Une erreur Supabase ou PostgreSQL brute ne dit rien d'actionnable à un
// recruteur — « null value in column "start_date" of relation "onboardings"
// violates not-null constraint » le laisse démuni — et elle décrit au passage
// le schéma de la base à qui regarde. Elle a sa place dans les journaux du
// serveur, pas dans l'interface.
//
// Ce module ne masque rien : il journalise le détail complet, avec le contexte
// de l'appel, et rend à l'appelant une phrase compréhensible. C'est la
// traduction qui est ajoutée, pas la disparition de l'information.
//
// À n'utiliser que depuis les Server Actions et les modules serveur. Les
// constantes de message, elles, servent aussi côté client (toasts).

import { MIN_PASSWORD_LENGTH } from "@/lib/noa/auth";

export const GENERIC_ERROR = "Une erreur est survenue. Veuillez réessayer.";

/** Messages métier, écrits une seule fois et partagés par leurs appelants. */
export const ERROR_MESSAGE = {
  preparation: "Impossible de préparer le plan d'onboarding pour le moment. Veuillez réessayer.",
  invitation: "Impossible de générer l'invitation pour le moment. Veuillez réessayer.",
  lienSuivi: "Impossible de générer le lien pour le moment. Veuillez réessayer.",
  plan: "Impossible d'enregistrer le plan pour le moment. Veuillez réessayer.",
  objectif: "Impossible d'enregistrer cet objectif pour le moment. Veuillez réessayer.",
  dateArrivee: "Impossible d'enregistrer la date d'arrivée pour le moment. Veuillez réessayer.",
  bilan: "Impossible d'enregistrer le bilan pour le moment. Veuillez réessayer.",
  reponses: "Vos réponses n'ont pas pu être enregistrées. Réessayez dans un instant.",
  copieLien: "Le lien n'a pas pu être copié. Sélectionnez-le puis copiez-le à la main.",
  copieTexte: "Le texte n'a pas pu être copié. Sélectionnez-le puis copiez-le à la main.",

  // Recrutement
  mission: "Impossible d'enregistrer la campagne pour le moment. Veuillez réessayer.",
  missionCreation: "Impossible de créer la campagne pour le moment. Veuillez réessayer.",
  candidat: "Impossible d'enregistrer la fiche candidat pour le moment. Veuillez réessayer.",
  candidatCreation: "Impossible de créer la fiche candidat pour le moment. Veuillez réessayer.",
  cvImport: "Le CV n'a pas pu être importé. Veuillez réessayer.",
  entretien: "Impossible d'ouvrir l'entretien pour le moment. Veuillez réessayer.",
  grille: "Impossible d'enregistrer la grille d'évaluation pour le moment. Veuillez réessayer.",
  guide: "Impossible d'enregistrer le guide d'entretien pour le moment. Veuillez réessayer.",
  decision: "Impossible d'enregistrer la décision pour le moment. Veuillez réessayer.",
  synthese: "Impossible d'enregistrer la synthèse pour le moment. Veuillez réessayer.",

  // Compte
  profil: "Impossible d'enregistrer vos informations pour le moment. Veuillez réessayer.",
  entreprise: "Impossible d'enregistrer les informations de l'entreprise pour le moment. Veuillez réessayer.",
  suppressionCompte: "La suppression du compte n'a pas pu aboutir. Veuillez réessayer ou contacter le support.",
  inscription: "La création du compte n'a pas pu aboutir. Veuillez réessayer.",
} as const;

/** Détail lisible d'une erreur, quelle que soit sa forme. */
function describe(cause: unknown): string {
  if (cause instanceof Error) return cause.stack ?? cause.message;
  if (cause && typeof cause === "object") {
    const e = cause as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    // Forme des erreurs postgrest-js : message + code + details + hint. On garde
    // tout, c'est précisément ce qui sert à diagnostiquer.
    return [e.code && `[${String(e.code)}]`, e.message, e.details, e.hint].filter(Boolean).join(" · ");
  }
  return String(cause);
}

// ─── Erreurs d'authentification ─────────────────────────────────────────────
// Supabase Auth renvoie des messages anglais qui, eux, disent souvent quelque
// chose d'utile : « mot de passe trop court », « compte déjà existant ». Les
// remplacer par un message générique dégraderait l'inscription et la connexion.
// On les traduit donc, un par un, et on ne retombe sur le générique que pour
// ce qu'on ne reconnaît pas — cas où le détail anglais n'aiderait de toute
// façon personne.
const AUTH_TRANSLATIONS: { match: RegExp; message: string }[] = [
  { match: /already registered|already been registered|user already exists/i, message: "Un compte existe déjà avec cet email." },
  { match: /invalid login credentials/i, message: "Email ou mot de passe incorrect." },
  { match: /email not confirmed/i, message: "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail." },
  { match: /should be different/i, message: "Votre nouveau mot de passe doit être différent de l'ancien." },
  {
    match: /at least|password.*(short|weak)|weak password/i,
    message: `Votre mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
  },
  { match: /unable to validate email|invalid email|email address.*invalid/i, message: "Adresse e-mail invalide." },
  { match: /rate limit|too many requests|for security purposes/i, message: "Trop de tentatives. Réessayez dans quelques minutes." },
  { match: /token has expired|invalid token|expired/i, message: "Ce lien n'est plus valide. Demandez-en un nouveau." },
];

/**
 * Journalise une erreur d'authentification et rend sa traduction française.
 *
 * Même contrat que `userError` : le détail complet part dans les journaux, et
 * ce qui est affiché reste lisible — mais ici la traduction conserve le sens,
 * parce qu'il est actionnable pour la personne qui a le formulaire sous les
 * yeux.
 */
export function authError(context: string, cause: unknown, fallback: string = GENERIC_ERROR): string {
  console.error(`[noa] ${context} : ${describe(cause)}`);
  const raw = cause instanceof Error ? cause.message : String((cause as { message?: unknown })?.message ?? "");
  return AUTH_TRANSLATIONS.find((t) => t.match.test(raw))?.message ?? fallback;
}

/**
 * Journalise une erreur technique et rend le message à afficher.
 *
 * `context` situe l'appel dans le code (« validateOnboarding », « submitCheckIn »)
 * pour qu'une ligne de journal se relie à une fonction sans avoir à deviner.
 */
export function userError(context: string, cause: unknown, message: string = GENERIC_ERROR): string {
  console.error(`[noa] ${context} : ${describe(cause)}`);
  return message;
}

// ─── Verdict RH ─────────────────────────────────────────────────────────────
// Dernier rempart sur les synthèses d'entretien d'intégration. Le prompt les
// interdit, mais un prompt n'est pas une garantie. Ce filtre l'est davantage :
// il ne peut pas être contourné par accident.
//
// Corpus volontairement resserré, ancré sur des expressions et non des mots
// isolés : un filtre sur « essai » trébucherait sur « il a essayé ».

const HR_VERDICT = [
  /\bno[-\s]?go\b/i,
  /\bp[ée]riode d'essai\b/i,
  /\blicenci/i,
  /\bse s[ée]parer de\b/i,
  /\bmauvais recrutement\b/i,
  /\berreur de (casting|recrutement)\b/i,
  /\bne pas confirmer\b/i,
  /\bconfirmer (l'embauche|la titularisation)\b/i,
  /\bcandidat inadapt/i,
  /\brupture (de|anticip)/i,
];

/** La sortie contient-elle un verdict qui n'appartient pas à Noa ? */
export function containsHrVerdict(text: string): boolean {
  return HR_VERDICT.some((pattern) => pattern.test(text));
}
