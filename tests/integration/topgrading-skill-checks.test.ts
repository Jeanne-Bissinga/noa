import { describe, expect, it } from "vitest";
import { generateTopgradingSkillChecks, evaluateTopgradingSkillChecks } from "@/lib/noa/ai";
import type { JobSpecContext, CandidateContext, ScorecardCriterionContext } from "@/lib/noa/ai";
import { MAX_SKILL_CHECKS } from "@/lib/noa/skill-checks";

// Appels payants (quelques centimes), d'où la place dans tests/integration —
// hors de `npm test`, lancés par `npm run test:ai`.
//
// Ce n'est pas de la prudence d'ornement : ce dépôt s'est déjà fait refuser deux
// schémas d'outil en production (`maxItems` sur un tableau, `enum: []`), et un
// refus ICI est silencieux. La génération lève, le bloc de critères n'est pas
// créé, et les deux catégories de la page de comparaison restent vides —
// exactement le bug que cette fonctionnalité prétend corriger.

const JOB: JobSpecContext = {
  title: "Développeur IA",
  missionText: "Concevoir et déployer des services d'IA générative pour les équipes métier.",
  objectives: ["Mettre en production un premier assistant interne sous 6 mois"],
  skills: ["Python avancé", "Collaboration transverse", "Autonomie sur des sujets complexes"],
};

const CANDIDATE: CandidateContext = {
  fullName: "Alex Dupont",
  title: "ML Engineer",
  summary: "5 ans en ML, deux mises en production de modèles de recommandation.",
  experiences: [
    { role: "ML Engineer", company: "Scaleway", period: "2021-2025", bullets: ["Pipelines de features", "Mise en production"] },
  ],
  skills: ["Python", "PyTorch"],
};

const SCORECARD: ScorecardCriterionContext[] = [
  { id: "11111111-1111-1111-1111-111111111111", category: "relationnelle", name: "Collaboration transverse", justification: null },
  { id: "22222222-2222-2222-2222-222222222222", category: "relationnelle", name: "Communication technique claire", justification: null },
  { id: "33333333-3333-3333-3333-333333333333", category: "comportementale", name: "Autonomie sur des sujets complexes", justification: null },
];

describe("critères de compétence de l'entretien technique", () => {
  it("produit des critères rattachés à des compétences réelles", async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY manquante — vérifie .env.local.");
    }

    const criteria = await generateTopgradingSkillChecks({ job: JOB, candidate: CANDIDATE, scorecard: SCORECARD });
    expect(criteria.length).toBeGreaterThan(0);
    expect(criteria.length).toBeLessThanOrEqual(MAX_SKILL_CHECKS);

    const known = new Set(SCORECARD.map((s) => s.id));
    for (const c of criteria) {
      expect(known.has(c.skillId), c.skillId).toBe(true);
      expect(c.q.trim().length).toBeGreaterThan(0);
      expect(c.evidence.trim().length).toBeGreaterThan(0);
    }
    // Une compétence ne peut être vérifiée que par un seul critère.
    expect(new Set(criteria.map((c) => c.skillId)).size).toBe(criteria.length);
  }, 60_000);

  it("ne demande rien au modèle sans Scorecard", async () => {
    // `enum: []` est un schéma invalide : sans compétence, il ne faut pas
    // appeler. Ce cas ne coûte donc rien.
    expect(await generateTopgradingSkillChecks({ job: JOB, candidate: CANDIDATE, scorecard: [] })).toEqual([]);
  });

  it("distingue un récit vécu d'une simple affirmation", async () => {
    // Le cœur comportemental : c'est ce qui sépare « la personne le dit » de
    // « la personne l'a fait ». Si cette distinction tombe, la coche verte ne
    // vaut plus rien.
    const criteria = [
      { id: "c-recit", q: "Racontez un désaccord technique que vous avez traité.", evidence: "Un exemple situé, le rôle du candidat, l'issue." },
      { id: "c-affirmation", q: "Comment travaillez-vous en autonomie ?", evidence: "Un exemple situé où le candidat a décidé seul, et le résultat." },
    ];
    const transcript = [
      "Recruteur : parlez-moi d'un désaccord technique.",
      "Candidat : en mars 2023 chez Scaleway, on n'était pas d'accord avec le lead sur le choix de la base.",
      "J'ai proposé qu'on chiffre les deux options sur une semaine, j'ai fait les benchmarks moi-même,",
      "et on a tranché sur les chiffres. On est partis sur Postgres, et la latence a baissé de moitié.",
      "Recruteur : et l'autonomie ?",
      "Candidat : je suis quelqu'un de très autonome, j'aime bien qu'on me laisse tranquille.",
    ].join("\n");

    const verdicts = await evaluateTopgradingSkillChecks(criteria, transcript, JOB, CANDIDATE);
    expect(verdicts["c-recit"]).toBe("Oui");
    expect(verdicts["c-affirmation"]).not.toBe("Oui");
  }, 60_000);
});
