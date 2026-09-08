import { describe, it, expect } from "vitest";
import { buildPlan, flattenPlan } from "@/lib/noa/onboarding/plan";
import type { MissionObjective, MissionSkill } from "@/lib/noa/types";

function objective(partial: Partial<MissionObjective> & { label: string }): MissionObjective {
  return {
    id: partial.id ?? `obj-${partial.label}`,
    mission_id: "mission",
    label: partial.label,
    metric: partial.metric ?? null,
    deadline: partial.deadline ?? null,
    threshold: partial.threshold ?? null,
    position: partial.position ?? 0,
  };
}

// Chaînes réellement présentes en base de production, qui produisaient toutes
// une fausse cible avec l'ancienne extraction heuristique.
const VRAIS_OBJECTIFS_DE_PROD = [
  {
    label: "Mise en place du backlog produit structuré",
    metric: "Nombre d'user stories rédigées, priorisées et estimées dans le backlog",
    threshold: "100% du backlog existant reformulé avec au moins 50 user stories priorisées selon la méthode MoSCoW ou RICE",
  },
  {
    label: "Adoption du rituel agile par l'équipe",
    metric: "Nombre de cérémonies agiles tenues par sprint",
    threshold: "100% des cérémonies agiles planifiées et réalisées sur 4 sprints consécutifs",
  },
  {
    label: "Fiabilisation des estimations et de la vélocité",
    metric: "Écart entre vélocité estimée et vélocité réelle par sprint",
    threshold: "Écart inférieur à 15% sur 3 sprints consécutifs",
  },
  {
    label: "Structuration de la collaboration avec l'équipe de développement",
    metric: "Taux de satisfaction de l'équipe dev sur la clarté du backlog",
    threshold: "Score moyen supérieur ou égal à 8/10",
  },
  {
    label: "Constituer une base de 150 prospects qualifiés",
    metric: "150 prospects qualifiés",
    threshold: "au moins 150",
  },
];

describe("aucune cible n'est devinée depuis le texte de la Scorecard", () => {
  it("laisse qualitatifs les objectifs réels de production", () => {
    // Le prompt qui génère les objectifs impose au modèle de TOUJOURS chiffrer
    // le seuil, y compris pour un résultat qualitatif. Chercher un nombre dans
    // ce texte transformait « sur 4 sprints consécutifs » en « cible : 4 ».
    const outcomes = buildPlan(VRAIS_OBJECTIFS_DE_PROD.map((o, i) => objective({ ...o, id: `o${i}`, position: i }))).outcomes;
    expect(outcomes.every((o) => o.kind === "qualitative")).toBe(true);
    expect(outcomes.every((o) => o.targetValue === null)).toBe(true);
  });

  it("ne devine rien non plus quand un nombre est dans l'intitulé ou la métrique", () => {
    const plan = buildPlan([
      objective({ id: "a", label: "8 rendez-vous qualifiés" }),
      objective({ id: "b", label: "Prospection", metric: "150 prospects qualifiés" }),
      objective({ id: "c", label: "Pipeline", threshold: "1,5 M€" }),
    ]);
    expect(plan.outcomes.map((o) => o.targetValue)).toEqual([null, null, null]);
    expect(plan.outcomes.map((o) => o.kind)).toEqual(["qualitative", "qualitative", "qualitative"]);
  });

  it("conserve la métrique, qui dit ce qui se mesure sans affirmer de cible", () => {
    const plan = buildPlan([objective({ id: "a", label: "Prospection", metric: "Nombre de prospects qualifiés" })]);
    expect(plan.outcomes[0].metric).toBe("Nombre de prospects qualifiés");
  });

  it("ne produit aucune cible à aucune des trois phases", () => {
    const all = flattenPlan(buildPlan(VRAIS_OBJECTIFS_DE_PROD.map((o, i) => objective({ ...o, id: `o${i}` }))));
    expect(all.every((g) => g.targetValue === null && g.kind === "qualitative")).toBe(true);
  });
});

describe("buildPlan", () => {
  const objectives = [
    objective({ id: "o1", label: "Constituer une base de 150 prospects qualifiés", metric: "150 prospects", position: 0 }),
    objective({ id: "o2", label: "Mettre en place un processus de prospection reproductible", position: 1 }),
    objective({ id: "o3", label: "Générer 8 rendez-vous qualifiés", metric: "8 RDV", position: 2 }),
  ];

  it("reprend les objectifs de la Scorecard comme résultats J90", () => {
    const plan = buildPlan(objectives);
    expect(plan.outcomes).toHaveLength(3);
    expect(plan.outcomes.map((o) => o.label)).toEqual(objectives.map((o) => o.label));
    // Le lien vers l'objectif de campagne est conservé : c'est ce qui permet de
    // comparer attendu et observé au bilan J90 sans dupliquer la donnée.
    expect(plan.outcomes.map((o) => o.missionObjectiveId)).toEqual(["o1", "o2", "o3"]);
  });

  it("rend tous les résultats qualitatifs : une cible ne se pose qu'à la main", () => {
    const plan = buildPlan(objectives);
    expect(plan.outcomes.every((o) => o.kind === "qualitative" && o.targetValue === null)).toBe(true);
  });

  it("propose des priorités J1-J30 même sans objectif défini", () => {
    // Une campagne sans objectif reste exploitable : le plan retombe alors sur
    // les seuls repères de prise de poste, sans rien inventer.
    const plan = buildPlan([]);
    expect(plan.outcomes).toHaveLength(0);
    expect(plan.midterm).toHaveLength(0);
    expect(plan.priorities.length).toBeGreaterThan(0);
    expect(plan.priorities.every((p) => p.phase === "j30")).toBe(true);
    expect(plan.priorities.every((p) => p.missionObjectiveId === null)).toBe(true);
  });

  it("intègre les compétences techniques attendues aux priorités", () => {
    const skills: MissionSkill[] = [
      { id: "s1", mission_id: "m", category: "technique", name: "HubSpot", position: 0 },
      { id: "s2", mission_id: "m", category: "relationnelle", name: "Écoute active", position: 1 },
    ];
    const labels = buildPlan(objectives, skills).priorities.map((p) => p.label);
    expect(labels).toContain("Être opérationnel sur HubSpot");
    // Les compétences relationnelles ne deviennent pas des priorités de prise
    // de poste : elles ne se « prennent pas en main ».
    expect(labels.some((l) => l.includes("Écoute active"))).toBe(false);
  });

  it("plafonne les priorités pour que les 30 premiers jours restent tenables", () => {
    const skills: MissionSkill[] = Array.from({ length: 6 }, (_, i) => ({
      id: `s${i}`,
      mission_id: "m",
      category: "technique" as const,
      name: `Outil ${i}`,
      position: i,
    }));
    expect(buildPlan(objectives, skills).priorities.length).toBeLessThanOrEqual(6);
  });

  it("amorce les premiers objectifs de la Scorecard dès les 30 premiers jours", () => {
    // Le point produit central : le premier mois doit préparer les résultats
    // attendus à J90, pas dérouler un onboarding interchangeable.
    const priorities = buildPlan(objectives).priorities;
    const rattachees = priorities.filter((p) => p.missionObjectiveId !== null);

    expect(rattachees).toHaveLength(2);
    expect(rattachees.map((p) => p.missionObjectiveId)).toEqual(["o1", "o2"]);
    expect(rattachees[0].label).toBe("Poser les bases de : Constituer une base de 150 prospects qualifiés");
  });

  it("garde les amorces d'objectifs même quand les compétences saturent la liste", () => {
    const skills: MissionSkill[] = Array.from({ length: 6 }, (_, i) => ({
      id: `s${i}`,
      mission_id: "m",
      category: "technique" as const,
      name: `Outil ${i}`,
      position: i,
    }));
    const priorities = buildPlan(objectives, skills).priorities;
    expect(priorities.filter((p) => p.missionObjectiveId !== null)).toHaveLength(2);
  });

  it("rattache chaque phase du plan à la Scorecard quand elle existe", () => {
    const plan = buildPlan(objectives);
    for (const phase of [plan.priorities, plan.midterm, plan.outcomes]) {
      expect(phase.some((g) => g.missionObjectiveId !== null)).toBe(true);
    }
  });

  it("pose un jalon intermédiaire J60 sans inventer de cible", () => {
    const plan = buildPlan(objectives);
    expect(plan.midterm).toHaveLength(3);
    expect(plan.midterm.every((g) => g.phase === "j60" && g.targetValue === null)).toBe(true);
  });

  it("aplatit le plan dans l'ordre J30 puis J60 puis J90", () => {
    const plan = buildPlan(objectives);
    const phases = flattenPlan(plan).map((g) => g.phase);
    expect(phases.indexOf("j30")).toBeLessThan(phases.indexOf("j60"));
    expect(phases.indexOf("j60")).toBeLessThan(phases.indexOf("j90"));
  });
});
