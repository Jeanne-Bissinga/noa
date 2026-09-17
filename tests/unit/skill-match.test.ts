import { describe, it, expect } from "vitest";
import { candidateCoversSkill, validatedSkillIds, normalizeSkillName, type GridLike } from "@/lib/noa/skill-match";
import type { MissionSkill } from "@/lib/noa/types";

// Deux sources, deux degrés de certitude : le CV mentionne, l'entretien
// confirme. Ce qui est vérifié ici, c'est qu'on ne confond jamais les deux, et
// qu'un rattachement posé à la génération prime sur tout rapprochement de texte.

const SCORECARD: Pick<MissionSkill, "id" | "name">[] = [
  { id: "skill-python", name: "Python avancé" },
  { id: "skill-collab", name: "Collaboration transverse" },
  { id: "skill-autonomie", name: "Autonomie sur des sujets complexes" },
];

const grid = (criteria: unknown, answers: Record<string, unknown>): GridLike => ({ criteria, answers });

describe("rapprochement avec le CV", () => {
  it("ignore la casse et les accents", () => {
    expect(candidateCoversSkill([{ name: "PYTHON AVANCE" }], "Python avancé")).toBe(true);
    expect(normalizeSkillName("  Rigueur Scientifique ")).toBe("rigueur scientifique");
  });

  it("rapproche dans les deux sens", () => {
    expect(candidateCoversSkill([{ name: "Python avancé et scripting" }], "Python avancé")).toBe(true);
    expect(candidateCoversSkill([{ name: "Python" }], "Python avancé")).toBe(true);
  });

  it("ne rapproche rien sur un libellé vide", () => {
    // Une chaîne vide est une sous-chaîne de tout : sans garde, elle cocherait
    // la Scorecard entière.
    expect(candidateCoversSkill([{ name: "   " }], "Python avancé")).toBe(false);
  });

  it("renvoie faux quand rien ne correspond", () => {
    expect(candidateCoversSkill([{ name: "Figma" }], "Python avancé")).toBe(false);
  });
});

describe("compétences confirmées par la grille", () => {
  it("lit le rattachement posé à la génération", () => {
    const g = grid(
      [
        { id: "1", q: "Maîtrise Python avancé", skillId: "skill-python" },
        { id: "2", q: "Gestion d'un désaccord d'équipe", skillId: "skill-collab" },
      ],
      { "1": "Oui", "2": "Partiel" },
    );
    expect([...validatedSkillIds(g, SCORECARD)].sort()).toEqual(["skill-collab", "skill-python"]);
  });

  it("confirme une compétence relationnelle que rien dans le libellé ne trahissait", () => {
    // Le cas qui justifie tout le rattachement : « Gestion d'un désaccord » et
    // « Collaboration transverse » n'ont pas un mot en commun.
    const g = grid([{ id: "1", q: "Gestion d'un désaccord d'équipe", skillId: "skill-collab" }], { "1": "Oui" });
    expect([...validatedSkillIds(g, SCORECARD)]).toEqual(["skill-collab"]);
  });

  it("ne confirme rien sur « Non » ni sur une réponse absente", () => {
    const g = grid(
      [
        { id: "1", q: "Maîtrise Python avancé", skillId: "skill-python" },
        { id: "2", q: "Gestion d'un désaccord d'équipe", skillId: "skill-collab" },
      ],
      { "1": "Non" },
    );
    expect([...validatedSkillIds(g, SCORECARD)]).toEqual([]);
  });

  it("ignore un rattachement vers une compétence qui a quitté la Scorecard", () => {
    const g = grid([{ id: "1", q: "Critère orphelin", skillId: "skill-supprimee" }], { "1": "Oui" });
    expect([...validatedSkillIds(g, SCORECARD)]).toEqual([]);
  });

  it("respecte un critère délibérément non rattaché", () => {
    // Le modèle a répondu « aucune » : ce critère ne vérifie aucune compétence
    // attendue. Le rapprocher quand même par son libellé déferait ce choix.
    const g = grid(
      [
        { id: "1", q: "Maîtrise Python avancé", skillId: "skill-python" },
        { id: "2", q: "Autonomie sur le budget de déplacement" },
      ],
      { "1": "Oui", "2": "Oui" },
    );
    expect([...validatedSkillIds(g, SCORECARD)]).toEqual(["skill-python"]);
  });

  it("retombe sur le rapprochement de textes pour une grille d'avant le rattachement", () => {
    // Sans ce repli, les grilles déjà remplies perdraient d'un coup ce qu'elles
    // montraient.
    const g = grid([{ id: "1", q: "Maîtrise Python avancé" }], { "1": "Partiel" });
    expect([...validatedSkillIds(g, SCORECARD)]).toEqual(["skill-python"]);
  });

  it("ne lève pas sur une grille absente ou malformée", () => {
    for (const g of [null, undefined, grid(null, {}), grid("x", {}), grid([{ id: "1" }], {})]) {
      expect([...validatedSkillIds(g as GridLike, SCORECARD)]).toEqual([]);
    }
  });
});
