import { describe, expect, it } from "vitest";
import { canMoveCandidate } from "@/lib/noa/labels";

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
