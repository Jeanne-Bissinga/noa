import { describe, it, expect } from "vitest";
import {
  generateToken, hashToken, tokenMatchesHash, publicUrl, resolveWorkPreferencesToken,
} from "@/lib/noa/preferences/tokens";

describe("génération", () => {
  it("produit des tokens uniques, longs et sûrs pour une URL", () => {
    const tokens = new Set(Array.from({ length: 500 }, generateToken));
    expect(tokens.size).toBe(500);
    expect([...tokens].every((t) => t.length === 43 && /^[A-Za-z0-9_-]+$/.test(t))).toBe(true);
  });
});

describe("hachage lié à l'usage", () => {
  it("produit une empreinte SHA-256 hexadécimale stable", () => {
    const hash = hashToken("work_preferences", "token-de-test");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("work_preferences", "token-de-test")).toBe(hash);
  });

  it("ne laisse pas retrouver le token dans son empreinte", () => {
    const token = generateToken();
    const hash = hashToken("work_preferences", token);
    expect(hash).not.toContain(token);
  });

  it("lie l'empreinte à son usage", () => {
    // Le purpose entre dans le calcul de l'empreinte : un lien émis pour un
    // usage ne pourra jamais en servir un autre, le jour où un second usage
    // existera.
    const token = generateToken();
    expect(hashToken("work_preferences", token)).not.toBe(
      require("node:crypto").createHash("sha256").update(token).digest("hex"),
    );
  });

  it("reconnaît le bon token pour le bon usage et rejette les autres", () => {
    const token = generateToken();
    const hash = hashToken("work_preferences", token);
    expect(tokenMatchesHash("work_preferences", token, hash)).toBe(true);
    expect(tokenMatchesHash("work_preferences", generateToken(), hash)).toBe(false);
  });

  it("rejette une empreinte vide ou malformée sans lever", () => {
    expect(tokenMatchesHash("work_preferences", generateToken(), "")).toBe(false);
    expect(tokenMatchesHash("work_preferences", generateToken(), "zz")).toBe(false);
  });

  it("invalide l'ancien lien dès qu'un nouveau est émis", () => {
    const ancien = generateToken();
    const nouveau = generateToken();
    const stocke = hashToken("work_preferences", nouveau);
    expect(tokenMatchesHash("work_preferences", nouveau, stocke)).toBe(true);
    expect(tokenMatchesHash("work_preferences", ancien, stocke)).toBe(false);
  });
});

describe("publicUrl", () => {
  it("route chaque usage vers sa page", () => {
    expect(publicUrl("work_preferences", "abc", "https://noa.example.com")).toBe(
      "https://noa.example.com/integration/preferences/abc",
    );
    expect(publicUrl("work_preferences", "abc", "https://noa.example.com/")).toBe(
      "https://noa.example.com/integration/preferences/abc",
    );
  });
});

describe("résolution", () => {
  // Le rejet des tokens manifestement invalides précède tout accès à la base.
  it("refuse un token vide, trop court ou trop long", async () => {
    for (const token of ["", "abc", "x".repeat(31), "x".repeat(129)]) {
      await expect(resolveWorkPreferencesToken(token)).resolves.toEqual({ ok: false, reason: "introuvable" });
    }
  });
});
