import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Le compteur de replis IA ne doit jamais devenir un risque pour le parcours
// qu'il observe : il compte, et c'est tout. Ces tests vérifient donc surtout ce
// qu'il NE fait PAS — ne pas lever, ne pas envoyer de donnée sensible, ne pas
// changer le comportement du repli.
//
// Le client admin est simulé : aucun appel réseau, aucun secret, aucune base.

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordAiFallback,
  classifyAiFallback,
  AI_FALLBACK_OPERATIONS,
  AI_FALLBACK_REASONS,
} from "@/lib/noa/ai-fallbacks";

const admin = vi.mocked(createAdminClient);

/** Client simulé qui capture ce qui est inséré, sans rien envoyer. */
function fakeClient(onInsert: (payload: unknown) => { error: { message: string } | null }) {
  const calls: { table: string; payload: unknown }[] = [];
  const client = {
    from(table: string) {
      return {
        insert(payload: unknown) {
          calls.push({ table, payload });
          return Promise.resolve(onInsert(payload));
        },
      };
    },
  };
  return { client, calls };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  admin.mockReset();
});

describe("classification d'une cause d'échec", () => {
  it("lit d'abord le code HTTP, qui est l'information la plus fiable", () => {
    expect(classifyAiFallback({ status: 400, message: "invalid_request_error" })).toBe("bad_request");
    expect(classifyAiFallback({ status: 429 })).toBe("rate_limit");
    expect(classifyAiFallback({ status: 401 })).toBe("auth");
    expect(classifyAiFallback({ status: 403 })).toBe("auth");
    expect(classifyAiFallback({ status: 500 })).toBe("server_error");
    expect(classifyAiFallback({ status: 529, message: "overloaded" })).toBe("server_error");
  });

  it("retombe sur le message quand il n'y a pas de réponse HTTP", () => {
    // Un délai dépassé ou une coupure réseau n'a pas de statut.
    expect(classifyAiFallback(new Error("Request timed out."))).toBe("timeout");
    expect(classifyAiFallback({ name: "AbortError" })).toBe("timeout");
    expect(classifyAiFallback(new Error("ECONNRESET"))).toBe("timeout");
    expect(classifyAiFallback(new Error("Overloaded"))).toBe("server_error");
  });

  it("classe en « other » plutôt que d'inventer une catégorie", () => {
    expect(classifyAiFallback(new Error("quelque chose d'inattendu"))).toBe("other");
  });

  it("accepte n'importe quelle forme de cause sans lever", () => {
    // La cause vient d'un `catch` : elle peut être absolument n'importe quoi.
    for (const cause of [null, undefined, "texte", 42, {}, [], new Error()]) {
      expect(() => classifyAiFallback(cause)).not.toThrow();
      expect(AI_FALLBACK_REASONS).toContain(classifyAiFallback(cause));
    }
  });

  it("ne peut JAMAIS laisser fuiter le contenu de l'erreur", () => {
    // La sortie est une catégorie prise dans une liste fermée. Même si le
    // message contient un CV, un nom ou une clé, rien n'en ressort.
    const sensible = new Error("Jean Dupont, 06 12 34 56 78, CLE-API-FACTICE-POUR-CE-TEST");
    const reason = classifyAiFallback(sensible);
    expect(AI_FALLBACK_REASONS).toContain(reason);
    expect(reason).not.toContain("Dupont");
    expect(reason).not.toContain("CLE-API");
  });
});

describe("enregistrement d'un repli", () => {
  it("n'envoie que l'opération, la cause et l'entreprise", async () => {
    const { client, calls } = fakeClient(() => ({ error: null }));
    admin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await recordAiFallback({ operation: "skill_suggestions", reason: "bad_request", companyId: "c-1" });

    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("ai_fallbacks");
    // Jeu de clés EXACT : c'est ce qui garantit qu'aucun prompt, aucun CV,
    // aucun message d'erreur brut ne part en base par inadvertance.
    expect(Object.keys(calls[0].payload as object).sort()).toEqual(["company_id", "operation", "reason"]);
    expect(calls[0].payload).toEqual({ operation: "skill_suggestions", reason: "bad_request", company_id: "c-1" });
  });

  it("écrit null plutôt que d'omettre l'entreprise quand elle est inconnue", async () => {
    const { client, calls } = fakeClient(() => ({ error: null }));
    admin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await recordAiFallback({ operation: "topgrading_skill_checks", reason: "other" });

    expect(calls[0].payload).toEqual({ operation: "topgrading_skill_checks", reason: "other", company_id: null });
  });

  it("ne lève pas quand la clé service_role est absente", async () => {
    // Environnement de dev incomplet : on ne compte pas, et on ne casse rien.
    admin.mockReturnValue(null);
    await expect(recordAiFallback({ operation: "mission_text", reason: "other" })).resolves.toBeUndefined();
  });

  it("ne lève pas quand l'insert renvoie une erreur, et la journalise", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = fakeClient(() => ({ error: { message: "relation absente" } }));
    admin.mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>);

    await expect(recordAiFallback({ operation: "screening_grid", reason: "auth" })).resolves.toBeUndefined();
    expect(String(logged.mock.calls[0][0])).toContain("recordAiFallback");
  });

  it("ne lève pas quand le client lui-même explose", async () => {
    // Le pire cas : un compteur qui lèverait annulerait le repli qu'il observe.
    admin.mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(recordAiFallback({ operation: "topgrading_grid", reason: "other" })).resolves.toBeUndefined();
  });

  it("ne rend jamais rien d'autre que undefined, quoi qu'il arrive", async () => {
    // L'appelant est dans un `catch` : la valeur de retour ne doit pas pouvoir
    // modifier la suite du repli.
    admin.mockReturnValue(null);
    expect(await recordAiFallback({ operation: "mission_text", reason: "other" })).toBeUndefined();
  });
});

describe("cohérence entre le code et la migration", () => {
  const sql = readFileSync(path.resolve(__dirname, "../..", "scripts/019_ai_fallbacks.sql"), "utf8");

  // Les commentaires `--` sont retirés avant analyse : ils documentent chaque
  // valeur de la liste, et une apostrophe française (« rien d'exploitable »)
  // suffirait à désaligner le comptage des quotes.
  const code = sql
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");

  /** Valeurs d'une contrainte `check (<colonne> in ('a', 'b', ...))`. */
  function checkedValues(column: string): string[] {
    const match = code.match(new RegExp(`check \\(${column} in \\(([^)]*)\\)`));
    if (!match) return [];
    return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  }

  it("la liste des opérations est la même en base et dans le code", () => {
    // Une divergence ici, et le compteur refuserait en silence une opération
    // que le code croit instrumentée.
    expect(checkedValues("operation").sort()).toEqual([...AI_FALLBACK_OPERATIONS].sort());
  });

  it("la liste des causes est la même en base et dans le code", () => {
    expect(checkedValues("reason").sort()).toEqual([...AI_FALLBACK_REASONS].sort());
  });

  it("la vue de lecture vit dans le schéma reporting, pas dans public", () => {
    // Même règle que 008_secure_reporting_views.sql : `public` est exposé par
    // l'API REST de Supabase, `reporting` non.
    expect(sql).toContain("create or replace view reporting.vw_kpi_ai_fallbacks_7d");
    expect(sql).not.toMatch(/create or replace view vw_/);
  });

  it("le monitoring s'ajoute au journal, il ne le remplace pas", () => {
    // Exigence de conception : journal et compteur ont deux rôles distincts.
    // Un refactoring qui remplacerait `console.error` par `recordAiFallback`
    // ferait perdre le détail technique — celui qui sert à diagnostiquer.
    const instrumented = [
      "app/missions/nouvelle/actions.ts",
      "app/missions/nouvelle/[missionId]/actions.ts",
      "app/candidats/[id]/actions.ts",
    ];

    for (const file of instrumented) {
      const source = readFileSync(path.resolve(__dirname, "../..", file), "utf8");
      const records = source.match(/recordAiFallback\(/g) ?? [];
      // Les deux gabarits sont utilisés dans le dépôt : chaîne simple quand le
      // message est fixe, gabarit avec accent grave quand il interpole l'erreur.
      const logs = source.match(/console\.error\(\s*["'`]\[noa\]/g) ?? [];

      expect(records.length, `${file} devrait appeler recordAiFallback`).toBeGreaterThan(0);
      expect(
        logs.length,
        `${file} : chaque repli compté doit garder son journal [noa]`,
      ).toBeGreaterThanOrEqual(records.length);
    }
  });

  it("la table n'est accessible ni à anon ni à authenticated", () => {
    expect(sql).toContain("alter table ai_fallbacks enable row level security");
    expect(sql).toContain("revoke all on ai_fallbacks from anon, authenticated");
    // Aucune policy : rien n'est lisible depuis un navigateur.
    expect(sql).not.toMatch(/create policy[\s\S]*on ai_fallbacks/);
  });
});
