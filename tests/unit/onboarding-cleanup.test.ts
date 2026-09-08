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

// Le module s'appelle « Plans d'onboarding » dans l'interface. Les routes, les
// tables et les types gardent « integration » : les renommer casserait des
// liens partagés, et surtout la garde qui tient /integration/ — les pages
// publiques du recruté — hors de la section authentifiée.
describe("le module s'appelle « Plans d'onboarding »", () => {
  it("le dit dans la barre latérale, la liste et la fiche", () => {
    const shell = readFileSync(path.join(ROOT, "components/noa/app-shell.tsx"), "utf8");
    expect(shell).toContain(`label: "Plans d'onboarding"`);
    expect(shell).toContain(`href: "/integrations"`);

    const board = readFileSync(path.join(ROOT, "app/integrations/integrations-board.tsx"), "utf8");
    expect(board).toContain(`headerTitle="Plans d'onboarding"`);
    expect(board).toContain("Plans d&apos;onboarding");

    const view = readFileSync(path.join(ROOT, "app/integrations/[id]/integration-view.tsx"), "utf8");
    expect(view).toContain(`label="Plans d'onboarding"`);
    expect(view).toContain("Plan d&apos;onboarding de");
  });

  it("nomme le document 30-60-90 autrement que le module", () => {
    // « Plan d'onboarding » désigne le dossier d'une personne ; le document
    // généré depuis le recrutement garde son nom de recrutement.
    const editor = readFileSync(path.join(ROOT, "app/integrations/[id]/plan/plan-editor.tsx"), "utf8");
    expect(editor).toContain("Plan 30-60-90 de {firstName}");
  });
});

describe("la liste ne montre plus que ce qui a quelque chose à dire", () => {
  const board = () =>
    readFileSync(path.join(ROOT, "app/integrations/integrations-board.tsx"), "utf8");

  it("n'imprime plus de négation sur les lignes saines", () => {
    expect(board()).not.toContain("Aucun point d");
  });

  it("n'a plus de colonne Préférences", () => {
    // Trois états, dont deux qui ne demandaient rien : l'information vit dans
    // la fiche, avec le geste qui va avec.
    expect(board()).not.toContain("WORK_PREFERENCES_STATUS_LABEL");
  });

  it("n'offre que quatre filtres", () => {
    const filters = board().match(/const FILTERS: OverviewFilter\[\] = \[([^\]]*)\]/);
    expect(filters).not.toBeNull();
    expect(filters![1].split(",").filter((s) => s.trim()).length).toBe(4);
  });
});

// L'écran affiché juste après « Marquer comme recruté ». Les garanties se
// lisent dans le source : les tests tournent sous `environment: "node"`, sans
// DOM ni bibliothèque de rendu.
describe("l'écran d'après-recrutement", () => {
  const view = () =>
    readFileSync(path.join(ROOT, "app/candidats/[id]/decision-finale/final-decision-view.tsx"), "utf8");

  it("confirme le recrutement sans accorder en genre", () => {
    // Le produit ne stocke ni genre ni civilité, et déduire l'un de l'autre
    // depuis le prénom se tromperait sur une partie des gens.
    expect(view()).toContain("Recrutement de {name} confirmé");
    expect(view()).not.toMatch(/marqué\w* comme recruté/);
  });

  it("dit ce que fait la case à cocher, et dans quel sens", () => {
    expect(view()).toContain("Marquer cette campagne comme pourvue");
    expect(view()).toContain("Cochez cette case si vous ne recrutez plus");
    expect(view()).toContain("Laissez-la décochée si la campagne reste ouverte");
  });

  it("coche pour pourvoir, décoche pour laisser la campagne ouverte", () => {
    // La case pilote fillMission, et markMissionFilled n'est appelé que sous
    // cette garde : cochée vaut pourvue, décochée ne touche à rien.
    expect(view()).toContain("checked={fillMission}");
    expect(view()).toContain("onChange={(e) => setFillMission(e.target.checked)}");
    expect(view()).toMatch(/if \(fillMission && hired\?\.missionId\) \{[\s\S]{0,120}markMissionFilled/);
  });

  it("renvoie vers un plan déjà généré, qu'il reste à relire", () => {
    expect(view()).toContain("Relire le plan d&apos;onboarding");
    expect(view()).not.toContain("Préparer son intégration");
  });

  it("parle de plan d'onboarding, plus de plan d'intégration", () => {
    expect(view()).toContain("Son plan d&apos;onboarding a été préparé à partir des éléments");
    expect(view()).not.toMatch(/plan d(&apos;|')intégration/);
  });
});
