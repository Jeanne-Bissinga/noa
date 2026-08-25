import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client admin (clé service_role) : contourne la RLS et donne accès à
 * auth.admin. Réservé aux Server Actions (jamais importé dans un fichier
 * "use client"). N'instancie rien si la clé n'est pas configurée, pour que
 * l'appelant puisse renvoyer une erreur explicite plutôt qu'un crash silencieux.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
