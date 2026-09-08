import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import * as disc from "@/lib/noa/onboarding/disc";

// Vérifie que l'ancienne direction produit (DISC saisi par le manager,
// abstraction fournisseur externe, question principale variable selon le
// profil) a bien disparu — et ne revient pas par un merge distrait.

const ROOT = path.resolve(__dirname, "../..");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

describe("nettoyage de l'ancienne direction DISC", () => {
  it("n'a plus de saisie manuelle du DISC par le manager", () => {
    expect(existsSync(path.join(ROOT, "app/candidats/[id]/integration/disc-field.tsx"))).toBe(false);
    const actions = readFileSync(path.join(ROOT, "app/integrations/[id]/actions.ts"), "utf8");
    expect(actions).not.toContain("setDiscProfile");
  });

  it("n'a plus d'abstraction fournisseur externe", () => {
    const exported = Object.keys(disc);
    expect(exported).not.toContain("manualProvider");
    expect(exported).not.toContain("getAssessmentProvider");
    expect(exported.sort()).toEqual(["DISC_LABEL", "DISC_PROFILES", "formatDisc", "isDiscProfile"]);
  });

  it("n'a plus de bibliothèque de questionnaire envoyé au collaborateur", () => {
    expect(existsSync(path.join(ROOT, "lib/noa/onboarding/questions.ts"))).toBe(false);
    expect(existsSync(path.join(ROOT, "app/integration/[token]"))).toBe(false);
  });

  it("n'a plus aucun point de suivi hebdomadaire", () => {
    // Le parcours tient en quatre entretiens : ni S1 à S4, ni questionnaire.
    for (const file of walk(path.join(ROOT, "lib/noa/onboarding"))) {
      const content = readFileSync(file, "utf8");
      expect(content, path.relative(ROOT, file)).not.toMatch(/\bweekly\b/);
      expect(content, path.relative(ROOT, file)).not.toMatch(/week_number/);
    }
  });

  it("garde les quatre entretiens hors du pipeline de recrutement", () => {
    // savePreparation écrit candidates.screening_status ou topgrading_status :
    // le typage doit interdire de l'appeler avec un entretien d'intégration.
    const actions = readFileSync(path.join(ROOT, "app/candidats/[id]/actions.ts"), "utf8");
    expect(actions).toContain("step: RecruitmentInterviewType");
    expect(actions).not.toContain("as RecruitmentInterviewType");
  });

  it("ne mentionne plus « profil de fonctionnement » dans l'interface", () => {
    const files = [
      "app/integrations/[id]/integration-view.tsx",
      "app/integrations/[id]/work-preferences-card.tsx",
      "app/integrations/[id]/invite-preferences-modal.tsx",
      "app/integrations/[id]/entretiens/interview-screen.tsx",
      "app/integrations/integrations-board.tsx",
      "app/integration/preferences/[token]/preferences-flow.tsx",
    ];
    for (const f of files) {
      expect(readFileSync(path.join(ROOT, f), "utf8").toLowerCase()).not.toContain("profil de fonctionnement");
    }
  });

  it("n'a plus d'écran intermédiaire « Préparer l'intégration »", () => {
    // La fiche d'intégration existe dès que la personne est recrutée.
    expect(existsSync(path.join(ROOT, "app/candidats/[id]/integration/prepare-integration.tsx"))).toBe(false);
    expect(existsSync(path.join(ROOT, "app/integrations/[id]/prepare-integration.tsx"))).toBe(false);
  });

  it("ne devine plus de cible chiffrée depuis le texte de la Scorecard", () => {
    const plan = readFileSync(path.join(ROOT, "lib/noa/onboarding/plan.ts"), "utf8");
    expect(plan).not.toContain("extractNumericTarget");
  });

  it("garde la section Intégrations hors des routes publiques", () => {
    // isPublicPath ouvre « /integration/ » (singulier, pages du collaborateur).
    // Un « s » perdu ouvrirait toute la section manager aux visiteurs anonymes.
    const proxy = readFileSync(path.join(ROOT, "lib/supabase/proxy.ts"), "utf8");
    expect(proxy).toContain("'/integration/'");
    expect("/integrations/abc".startsWith("/integration/")).toBe(false);
  });

  it("ne renvoie plus vers la fiche candidat depuis les écrans d'intégration", () => {
    const files = [
      "app/integrations/[id]/integration-view.tsx",
      "app/integrations/[id]/plan/plan-editor.tsx",
      "app/integrations/[id]/entretiens/interview-screen.tsx",
      "app/integrations/integrations-board.tsx",
    ];
    for (const f of files) {
      const content = readFileSync(path.join(ROOT, f), "utf8");
      expect(content).not.toContain("/integration`");
      expect(content).not.toContain("integration/bilan");
    }
  });

  it("ne présente jamais le questionnaire Noa comme un test", () => {
    const flow = readFileSync(path.join(ROOT, "app/integration/preferences/[token]/preferences-flow.tsx"), "utf8");
    expect(flow).not.toMatch(/test psychométrique|test de personnalité|test DISC Noa/i);
  });
});
