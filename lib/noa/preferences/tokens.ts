import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";


// Accès du candidat à ses préférences de travail, sans compte Noa.
//
// Le candidat n'est pas un utilisateur du produit : Noa reste une plateforme de
// recruteurs et de managers. Il n'intervient qu'une fois, entre le premier
// entretien et l'entretien technique — un lien porteur d'un token suffit donc,
// sans seconde authentification ni portail.
//
// ─── Le token brut n'est jamais persisté ────────────────────────────────────
// Seule son empreinte SHA-256 est stockée (token_hash sur la table concernée,
// cf. scripts/011, 012 et 018). Le token en clair n'existe qu'à deux instants :
// dans la réponse de l'action qui l'émet, et dans l'URL que le candidat ouvre.
// Un accès en lecture à la base ne donne accès à aucune page.
//
// SHA-256 nu suffit, contrairement à un mot de passe : le token porte 256 bits
// d'aléa cryptographique, il n'est ni devinable ni attaquable par
// dictionnaire. Une dérivation lente ne protégerait rien et coûterait à chaque
// ouverture de lien.
//
// ─── Le purpose est dans l'empreinte ────────────────────────────────────────
// L'empreinte est calculée sur `purpose:token`. Un token émis pour un autre
// usage ne peut donc jamais résoudre une page de préférences, même si son
// empreinte était copiée d'une table à l'autre : la valeur ne correspondrait
// pas. C'est une garantie structurelle, pas une convention.
//
// ─── Pourquoi le client admin ───────────────────────────────────────────────
// La RLS ne donne accès à cette table qu'au recruteur de l'entreprise. Le
// visiteur d'un lien public n'a aucune session : aucune policy ne peut
// l'autoriser sans ouvrir la table à `anon`, ce qui la rendrait énumérable. La
// résolution passe donc par la clé service_role, ici, dans un module
// `server-only` — jamais dans le navigateur — et TOUJOURS filtrée sur
// l'empreinte exacte.
//
// Ce que la page publique reçoit est strictement ce que PublicWorkPreferences
// décrit : un prénom et l'avancement du questionnaire. Ni scorecard, ni notes
// d'entretien, ni score, ni décision, ni les autres candidats — aucune de ces
// données ne traverse cette frontière.

/**
 * Un seul usage aujourd'hui, mais le purpose reste : il entre dans le calcul
 * de l'empreinte, donc un lien émis pour un usage ne peut pas en servir un
 * autre. C'est une garantie structurelle, pas une convention — et elle vaut
 * d'être conservée pour le jour où un second usage apparaîtra.
 */
export type TokenPurpose = "work_preferences";

/** 32 octets aléatoires : 256 bits d'entropie, impossible à deviner ou énumérer. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Durée de validité du lien d'invitation aux préférences de travail, en jours. */
export const TOKEN_TTL_DAYS = 21;

/**
 * Fin de validité d'un lien émis maintenant. La référence est reçue en
 * argument plutôt que lue sur l'horloge : c'est ce qui rend l'expiration
 * testable sans figer le temps.
 */
export function tokenExpiryFor(reference: Date): Date {
  return new Date(reference.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Empreinte stockée en base, liée à l'usage. Seule cette valeur est persistée. */
export function hashToken(purpose: TokenPurpose, token: string): string {
  return createHash("sha256").update(`${purpose}:${token}`, "utf8").digest("hex");
}

/**
 * Comparaison d'empreintes à temps constant.
 *
 * La recherche en base se fait déjà par égalité sur un index, ce qui ne fuit
 * rien d'exploitable ; cette vérification finale ferme le sujet côté
 * application sans rien coûter.
 */
export function tokenMatchesHash(purpose: TokenPurpose, token: string, hash: string): boolean {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashToken(purpose, token), "hex");
  if (expected.length !== actual.length || expected.length === 0) return false;
  return timingSafeEqual(expected, actual);
}

const PUBLIC_PATH: Record<TokenPurpose, (token: string) => string> = {
  work_preferences: (token) => `/integration/preferences/${token}`,
};

/** URL publique complète, pour l'e-mail comme pour le copier-coller. */
export function publicUrl(purpose: TokenPurpose, token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}${PUBLIC_PATH[purpose](token)}`;
}

/** Longueur plausible avant toute requête : évite d'interroger la base sur des chaînes fabriquées. */
function looksLikeToken(token: string): boolean {
  return Boolean(token) && token.length >= 32 && token.length <= 128;
}

export type TokenFailure = "introuvable" | "expire" | "indisponible";

// ─── Préférences de travail ─────────────────────────────────────────────────

export interface PublicWorkPreferences {
  preferencesId: string;
  firstName: string;
  completed: boolean;
  /** Réponses déjà enregistrées au questionnaire Noa, pour la reprise. */
  answers: Record<string, number>;
  /** Le texte d'information a-t-il déjà été horodaté ? Évite de le réécrire. */
  noticeAlreadyRecorded: boolean;
}

export type WorkPreferencesResolution =
  | { ok: true; preferences: PublicWorkPreferences }
  | { ok: false; reason: Exclude<TokenFailure, "deja_repondu"> };

/**
 * Vérifie un token de préférences de travail. Un questionnaire déjà complété
 * reste résolvable — la page affiche alors le remerciement, sans rien
 * réécrire — c'est ce qui rend la double soumission inoffensive.
 */
export async function resolveWorkPreferencesToken(token: string): Promise<WorkPreferencesResolution> {
  if (!looksLikeToken(token)) return { ok: false, reason: "introuvable" };

  const supabase = createAdminClient();
  if (!supabase) {
    console.error("[noa] SUPABASE_SERVICE_ROLE_KEY manquante : page publique indisponible.");
    return { ok: false, reason: "indisponible" };
  }

  // Le prénom vient désormais directement du candidat : la ligne est rattachée
  // à lui depuis scripts/018. La jointure par l'onboarding reste en repli pour
  // les lignes créées avant, qui n'ont pas encore été rattachées.
  const { data, error } = await supabase
    .from("onboarding_work_preferences")
    // Chaîne d'un seul tenant : le client Supabase infère le type de la ligne
    // depuis ce littéral, une concaténation lui rend la colonne inconnue.
    .select("id, status, token_hash, token_expires_at, questionnaire_answers, notice_shown_at, candidate:candidates(first_name), onboarding:onboardings(candidate:candidates(first_name))")
    .eq("token_hash", hashToken("work_preferences", token))
    .maybeSingle();

  if (error || !data || !data.token_hash) return { ok: false, reason: "introuvable" };
  if (!tokenMatchesHash("work_preferences", token, data.token_hash as string)) return { ok: false, reason: "introuvable" };
  if (!data.token_expires_at || new Date(data.token_expires_at as string) <= new Date()) {
    return { ok: false, reason: "expire" };
  }

  const candidate = data.candidate as unknown as { first_name: string } | null;
  const onboarding = data.onboarding as unknown as { candidate: { first_name: string } | null } | null;
  const rawAnswers = data.questionnaire_answers as Record<string, unknown> | null;
  const answers: Record<string, number> = {};
  for (const [key, value] of Object.entries(rawAnswers ?? {})) {
    if (typeof value === "number") answers[key] = value;
  }

  return {
    ok: true,
    preferences: {
      preferencesId: data.id as string,
      firstName: candidate?.first_name ?? onboarding?.candidate?.first_name ?? "",
      completed: data.status === "completed",
      answers,
      noticeAlreadyRecorded: Boolean(data.notice_shown_at),
    },
  };
}

// ─── Traçabilité du texte d'information ─────────────────────────────────────

/**
 * Horodate la présentation du texte « Pourquoi ces informations ? ».
 *
 * Ce n'est PAS un consentement, et rien n'en dépend : ni l'accès à la page, ni
 * l'enregistrement des réponses, ni quoi que ce soit en aval. On note seulement
 * quelle version du texte a été affichée, et quand, pour pouvoir le redire si
 * la question est posée. Écrit une seule fois — la première présentation est la
 * seule qui renseigne quelque chose.
 *
 * Un échec ici ne doit jamais empêcher quelqu'un de répondre : l'erreur est
 * journalisée et la page continue.
 */
export async function recordNoticeShown(preferencesId: string, version: string): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("onboarding_work_preferences")
    .update({ notice_version: version, notice_shown_at: new Date().toISOString() })
    .eq("id", preferencesId)
    .is("notice_shown_at", null);

  if (error) console.error(`[noa] recordNoticeShown : ${error.message}`);
}
