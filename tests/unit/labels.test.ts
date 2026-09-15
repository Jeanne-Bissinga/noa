import { describe, expect, it } from "vitest";
import { canMoveCandidate, workPreferencesInviteIntro } from "@/lib/noa/labels";

describe("canMoveCandidate (règle du kanban)", () => {
  it("autorise un retour en arrière", () => {
    expect(canMoveCandidate("Topgrading", "Screening").ok).toBe(true);
  });

  it("refuse d'atteindre un statut terminal via le kanban", () => {
    const result = canMoveCandidate("Decision finale", "Recrute");
    expect(result.ok).toBe(false);
  });

  it("refuse de faire progresser via le kanban (doit passer par une décision tracée)", () => {
    const result = canMoveCandidate("Screening", "Topgrading");
    expect(result.ok).toBe(false);
  });

  it("autorise de rester sur le même statut", () => {
    expect(canMoveCandidate("Screening", "Screening").ok).toBe(true);
  });
});

// Le prénom était collé au mot suivant dans la modale d'invitation : composée
// en JSX sur deux lignes de source, la phrase perdait l'espace qui suivait
// {firstName} et l'écran affichait « Alexpourra ». La phrase est désormais
// construite ici, où l'espace ne dépend plus de la mise en forme du code.
describe("workPreferencesInviteIntro", () => {
  it("sépare le prénom du mot qui suit", () => {
    expect(workPreferencesInviteIntro("Alex").startsWith("Alex peut ")).toBe(true);
    expect(workPreferencesInviteIntro("Alex")).not.toContain("Alexpeut");
  });

  it("rend le texte attendu, au mot près", () => {
    expect(workPreferencesInviteIntro("Alex")).toBe(
      "Alex peut renseigner le résultat d'un test DISC, MBTI ou Big Five déjà réalisé. " +
        "Sinon, un court questionnaire Noa de 24 questions est proposé.",
    );
  });

  it("n'accorde pas en genre", () => {
    // Le produit ne stocke ni genre ni civilité, et le déduire du prénom se
    // tromperait sur une partie des gens.
    expect(workPreferencesInviteIntro("Alex")).not.toMatch(/\b(il|elle|s'il|lui)\b/i);
  });

  it("tient avec un prénom composé ou accentué", () => {
    for (const prenom of ["Hélène", "Jean-Baptiste", "Zoé"]) {
      const texte = workPreferencesInviteIntro(prenom);
      expect(texte.startsWith(`${prenom} peut `)).toBe(true);
      expect(texte).not.toContain(`${prenom}peut`);
    }
  });

  it("ne présente jamais le questionnaire Noa comme un test", () => {
    // Les tests déclarés sont ceux que la personne a déjà passés ailleurs ; le
    // questionnaire Noa n'en est pas un, et la phrase les distingue.
    expect(workPreferencesInviteIntro("Alex")).not.toMatch(/test Noa|test de personnalité/i);
  });
});
