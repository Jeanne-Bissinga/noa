import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Compteur des passages en mode dégradé de noa (cf. scripts/019_ai_fallbacks.sql).
//
// Ce module ne remplace aucun `console.error` : il s'ajoute à côté. Les deux
// n'ont pas le même rôle et n'ont pas la même durée de vie —
//
//   journal serveur : le détail technique complet, pour diagnostiquer une panne
//                     en cours. Éphémère, non agrégeable.
//   cette table     : de quoi COMPTER, pour répondre à « combien de fois cette
//                     semaine, et sur quelle opération ? ». Durable, agrégeable,
//                     sans donnée sensible.
//
// C'est la leçon de l'incident `maxItems` : la trace existait depuis le premier
// jour, mais personne ne pouvait la compter, et la panne a duré deux mois.

/**
 * Opérations instrumentées.
 *
 * Liste FERMÉE, et reprise à l'identique dans la contrainte `check` de
 * scripts/019_ai_fallbacks.sql : un compteur ne sert à rien si la même panne
 * s'écrit sous trois libellés différents. `tests/unit/ai-fallbacks.test.ts`
 * vérifie que le code et la migration ne divergent pas.
 *
 * Périmètre : la chaîne de génération d'une campagne et de ses grilles
 * d'entretien, c'est-à-dire les replis qui changent ce que le recruteur voit
 * pour décider. Les autres replis IA restent journalisés sans être comptés.
 */
export const AI_FALLBACK_OPERATIONS = [
  "mission_text",
  "objective_suggestions",
  "skill_suggestions",
  "screening_grid",
  "topgrading_grid",
  "topgrading_skill_checks",
] as const;

export type AiFallbackOperation = (typeof AI_FALLBACK_OPERATIONS)[number];

/**
 * Catégories de cause. Également reprises dans la contrainte `check` de la
 * migration.
 *
 * On enregistre une CATÉGORIE, jamais le message d'erreur brut : un message de
 * fournisseur peut contenir un extrait de la requête, une URL signée ou un
 * identifiant interne, et le recopier en base n'apporterait rien au comptage.
 */
export const AI_FALLBACK_REASONS = [
  "empty_response",
  "bad_request",
  "rate_limit",
  "auth",
  "server_error",
  "timeout",
  "other",
] as const;

export type AiFallbackReason = (typeof AI_FALLBACK_REASONS)[number];

/** Forme des erreurs du SDK Anthropic : `status` porte le code HTTP. */
type CauseLike = { status?: unknown; message?: unknown; name?: unknown };

/**
 * Classe une cause d'échec en catégorie agrégeable.
 *
 * Le code HTTP est lu en premier quand il est là : c'est l'information la plus
 * fiable. Le message ne sert qu'en second, pour les échecs qui n'ont pas de
 * réponse HTTP du tout (délai dépassé, coupure réseau).
 *
 * Rien de ce qui est lu ici n'est conservé : seule la catégorie ressort.
 */
export function classifyAiFallback(cause: unknown): AiFallbackReason {
  const e = (cause ?? {}) as CauseLike;

  const status = typeof e.status === "number" ? e.status : undefined;
  if (status === 400) return "bad_request";
  if (status === 429) return "rate_limit";
  if (status === 401 || status === 403) return "auth";
  if (status !== undefined && status >= 500) return "server_error";

  const text = `${typeof e.name === "string" ? e.name : ""} ${typeof e.message === "string" ? e.message : ""}`;
  // `abort` et non `aborted` : un délai dépassé remonte le plus souvent sous le
  // nom `AbortError` (fetch interrompu), pas sous une phrase contenant « timeout ».
  if (/timeout|timed out|abort|ETIMEDOUT|ECONNRESET/i.test(text)) return "timeout";
  if (/rate limit|too many requests/i.test(text)) return "rate_limit";
  if (/overloaded|internal server error|bad gateway|unavailable/i.test(text)) return "server_error";
  if (/invalid[_ ]request|invalid schema|unexpected keyword/i.test(text)) return "bad_request";
  if (/api key|unauthorized|forbidden|authentication/i.test(text)) return "auth";

  return "other";
}

/**
 * Enregistre un passage en mode dégradé. BEST-EFFORT, toujours.
 *
 * Rien de ce que fait cette fonction ne doit pouvoir interrompre un parcours :
 * le monitoring d'un repli ne va pas casser ce que le repli vient de sauver.
 * Elle ne lève donc jamais, et un échec d'écriture est lui-même journalisé —
 * même contrat que recordNoticeShown (lib/noa/preferences/tokens.ts).
 *
 * À appeler EN PLUS du `console.error` existant, jamais à sa place.
 */
export async function recordAiFallback(input: {
  operation: AiFallbackOperation;
  reason: AiFallbackReason;
  companyId?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    // Clé service_role absente (environnement de dev incomplet) : on ne compte
    // pas, et surtout on ne fait rien échouer.
    if (!supabase) return;

    const { error } = await supabase.from("ai_fallbacks").insert({
      operation: input.operation,
      reason: input.reason,
      company_id: input.companyId ?? null,
    });

    if (error) console.error(`[noa] recordAiFallback (${input.operation}) : ${error.message}`);
  } catch (e) {
    // Un compteur qui lève serait pire que pas de compteur du tout.
    const err = e as { message?: string };
    console.error(`[noa] recordAiFallback (${input.operation}) : ${err?.message ?? String(e)}`);
  }
}
