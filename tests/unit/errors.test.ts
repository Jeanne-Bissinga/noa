import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { userError, authError, GENERIC_ERROR, ERROR_MESSAGE } from "@/lib/noa/errors";
import { MIN_PASSWORD_LENGTH } from "@/lib/noa/auth";

const ROOT = path.resolve(__dirname, "../..");

// Erreurs réellement remontées par Supabase et vues à l'écran avant correction.
const ERREURS_TECHNIQUES = [
  { message: "Could not find the table 'public.onboarding_work_preferences' in the schema cache", code: "PGRST205" },
  {
    message: 'null value in column "start_date" of relation "onboardings" violates not-null constraint',
    code: "23502",
    details: "Failing row contains (…).",
  },
  { message: 'duplicate key value violates unique constraint "onboardings_candidate_id_key"', code: "23505" },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("userError", () => {
  it("ne rend jamais le détail technique à l'interface", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const cause of ERREURS_TECHNIQUES) {
      const shown = userError("test", cause);
      expect(shown).toBe(GENERIC_ERROR);
      // Ni le nom de table, ni la colonne, ni le code PostgreSQL ne doivent
      // transparaître : ils décrivent le schéma à qui regarde.
      expect(shown).not.toContain("onboarding");
      expect(shown).not.toContain("null value");
      expect(shown).not.toContain("constraint");
      expect(shown).not.toMatch(/PGRST|\d{5}/);
    }
  });

  it("journalise le détail complet côté serveur", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    userError("validateOnboarding", ERREURS_TECHNIQUES[1]);

    expect(logged).toHaveBeenCalledTimes(1);
    const line = String(logged.mock.calls[0][0]);
    // Rien n'est masqué : le contexte, le code, le message et les détails sont
    // tous là pour le diagnostic.
    expect(line).toContain("validateOnboarding");
    expect(line).toContain("23502");
    expect(line).toContain("start_date");
    expect(line).toContain("Failing row contains");
  });

  it("journalise la pile d'une vraie Error", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    userError("createDraftOnboarding", new Error("boom"));
    expect(String(logged.mock.calls[0][0])).toContain("boom");
  });

  it("accepte n'importe quelle forme de cause sans lever", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const cause of [null, undefined, "chaîne", 42, {}]) {
      expect(() => userError("test", cause)).not.toThrow();
      expect(userError("test", cause)).toBe(GENERIC_ERROR);
    }
  });

  it("rend le message métier demandé quand il y en a un", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(userError("x", ERREURS_TECHNIQUES[0], ERROR_MESSAGE.invitation)).toBe(
      "Impossible de générer l'invitation pour le moment. Veuillez réessayer.",
    );
    expect(userError("x", ERREURS_TECHNIQUES[0], ERROR_MESSAGE.preparation)).toBe(
      "Impossible de préparer le plan d'onboarding pour le moment. Veuillez réessayer.",
    );
  });

  it("formule tous les messages en français, sans jargon technique", () => {
    for (const message of [GENERIC_ERROR, ...Object.values(ERROR_MESSAGE)]) {
      expect(message).not.toMatch(/error|null|constraint|relation|schema|column|supabase|postgres/i);
      expect(message.endsWith(".")).toBe(true);
    }
  });
});

describe("authError", () => {
  it("traduit les messages Supabase qui disent quelque chose d'utile", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const cases: [string, string][] = [
      ["User already registered", "Un compte existe déjà avec cet email."],
      ["Invalid login credentials", "Email ou mot de passe incorrect."],
      ["Email not confirmed", "Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail."],
      ["New password should be different from the old password.", "Votre nouveau mot de passe doit être différent de l'ancien."],
      ["Password should be at least 8 characters", `Votre mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`],
      ["Unable to validate email address: invalid format", "Adresse e-mail invalide."],
      ["For security purposes, you can only request this after 51 seconds", "Trop de tentatives. Réessayez dans quelques minutes."],
    ];
    for (const [raw, expected] of cases) {
      expect(authError("test", { message: raw })).toBe(expected);
    }
  });

  it("retombe sur le message fourni pour ce qu'il ne reconnaît pas", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(authError("test", { message: "Database error querying schema" })).toBe(GENERIC_ERROR);
    expect(authError("test", { message: "???" }, ERROR_MESSAGE.inscription)).toBe(ERROR_MESSAGE.inscription);
  });

  it("journalise aussi les erreurs d'authentification", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    authError("signUp", { message: "User already registered", code: "user_already_exists" });
    const line = String(logged.mock.calls[0][0]);
    expect(line).toContain("signUp");
    expect(line).toContain("User already registered");
  });

  it("ne rend jamais un message anglais brut", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const shown = authError("test", { message: "unexpected_failure: internal server error" });
    expect(shown).not.toContain("unexpected_failure");
    expect(shown).not.toContain("internal server error");
  });
});

// ─── Aucune erreur brute ne doit repartir vers l'interface ──────────────────

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

describe("toute l'application", () => {
  const files = [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "lib"))].filter(
    (f) => !f.endsWith(path.join("lib", "noa", "errors.ts")),
  );

  it("ne renvoie jamais un message d'erreur technique à l'interface", () => {
    // C'est exactement cette forme qui faisait apparaître « Could not find the
    // table … » et « null value in column "start_date" … » à l'écran.
    const fautif = /(return|error:)\s*\{?\s*error:\s*`?[^;]*\b\w*[Ee]rror\??\.message/;
    const coupables: string[] = [];
    for (const file of files) {
      if (fautif.test(readFileSync(file, "utf8"))) coupables.push(path.relative(ROOT, file));
    }
    expect(coupables).toEqual([]);
  });

  it("ne propage jamais un message technique par une exception", () => {
    const fautif = /throw new Error\(\s*\w*[Ee]rror\??\.message/;
    const coupables: string[] = [];
    for (const file of files) {
      if (fautif.test(readFileSync(file, "utf8"))) coupables.push(path.relative(ROOT, file));
    }
    expect(coupables).toEqual([]);
  });

  it("attrape tout échec d'écriture dans le presse-papiers", () => {
    // Une promesse rejetée non attrapée faisait passer un échec de copie pour
    // un succès, sans aucune trace.
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      if (!content.includes("clipboard.writeText")) continue;
      expect(content, path.relative(ROOT, file)).toMatch(/try\s*\{[\s\S]*clipboard\.writeText[\s\S]*\}\s*catch/);
    }
  });
});

describe("module d'intégration", () => {
  it("passe par le helper partout où une écriture peut échouer", () => {
    const actions = readFileSync(path.join(ROOT, "app/integrations/[id]/actions.ts"), "utf8");
    const branches = actions.match(/if \(\w*[Ee]rror\) return \{ error: [^}]+\}/g) ?? [];
    expect(branches.length).toBeGreaterThan(0);
    for (const branch of branches) {
      expect(branch).toContain("userError(");
    }
  });
});
