import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// Garde-fou sur les schémas d'outil envoyés à Anthropic.
//
// Le schéma d'outil « strict » refuse `maxItems` sur un type `array` : l'appel
// part en 400 et l'appelant retombe sur son repli statique, SANS erreur visible.
// Le dépôt s'est déjà fait refuser ce schéma en production, dans
// `generateSkillSuggestions` — introduit par a773cfd, retiré par 3e557aa deux
// mois plus tard, sans que rien ne le signale entre-temps.
//
// Deux assertions existantes couvraient déjà ce point, mais chacune sur UNE
// fonction découpée à la main dans le source (cf. preferences-guardrails).
// Celle-ci couvre le fichier entier : c'est la fonction où l'incident a eu lieu
// qui n'était pas protégée.
//
// Un plafond de cardinalité se porte donc dans le prompt, et se constate côté
// serveur (cf. `kept.slice(0, MAX_SKILL_CHECKS)`), jamais dans le schéma.
//
// Aucun appel réseau, aucun secret : le test lit le source comme du texte,
// comme le font déjà errors.test.ts et preferences-guardrails.test.ts.

const AI_PATH = "lib/noa/ai.ts";
const source = readFileSync(path.resolve(__dirname, "../..", AI_PATH), "utf8");

/** Une ligne de commentaire a le droit de nommer la contrainte pour l'expliquer. */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

/** Le code effectif d'une ligne : ce qui précède un commentaire de fin de ligne. */
function codePart(line: string): string {
  return line.split("//")[0];
}

describe("schémas d'outil IA", () => {
  it("n'utilise `maxItems` dans aucun schéma de lib/noa/ai.ts", () => {
    const offending = source
      .split("\n")
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => !isCommentLine(line) && /maxItems/.test(codePart(line)));

    // Message d'échec lisible : le numéro de ligne et la ligne fautive.
    expect(
      offending.map(({ lineNumber, line }) => `${AI_PATH}:${lineNumber} ${line.trim()}`),
      "`maxItems` est refusé par le schéma d'outil strict d'Anthropic (400). Le plafond se porte dans le prompt, et se constate côté serveur.",
    ).toEqual([]);
  });

  it("garde les commentaires qui expliquent l'interdiction", () => {
    // Le garde-fou ci-dessus ne doit pas pousser à effacer l'explication : sans
    // elle, la règle se perd et la régression revient par méconnaissance.
    const explanations = source.split("\n").filter((line) => isCommentLine(line) && /maxItems/.test(line));
    expect(explanations.length).toBeGreaterThan(0);
  });
});
