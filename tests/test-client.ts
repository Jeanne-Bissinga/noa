import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

// Node 20 n'a pas de WebSocket natif (arrivé en Node 22) ; le client Supabase
// en instancie un pour Realtime même quand on ne l'utilise pas, et plante à
// la construction sans ce polyfill.
if (!globalThis.WebSocket) {
  (globalThis as { WebSocket?: typeof WebSocket }).WebSocket = WebSocket;
}

/**
 * Client de test : service role key, donc RLS ignorée. À n'utiliser que
 * contre le projet Supabase de test (SUPABASE_TEST_URL) — jamais contre la
 * base de prod (NEXT_PUBLIC_SUPABASE_URL), qui n'a pas cette clé ici.
 */
export function createTestClient() {
  const url = process.env.SUPABASE_TEST_URL;
  const key = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY manquantes. " +
        "Crée .env.test.local à la racine avec les clés du projet Supabase de TEST — voir tests/README.md.",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
