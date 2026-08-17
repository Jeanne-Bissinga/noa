import { config } from "dotenv";
import path from "path";

// Loads test-only Supabase credentials, kept out of git (.env*.local is gitignored).
// Absent en CI/local tant que le projet Supabase de test n'est pas configuré :
// seuls les tests qui appellent createTestClient() en ont besoin (voir test-client.ts).
config({ path: path.resolve(__dirname, "../.env.test.local") });

// ANTHROPIC_API_KEY n'a pas d'équivalent "projet de test" séparé : on réutilise
// la clé de dev déjà présente dans .env.local pour le test de connectivité IA.
// Ne écrase pas les variables déjà injectées ci-dessus.
config({ path: path.resolve(__dirname, "../.env.local") });
