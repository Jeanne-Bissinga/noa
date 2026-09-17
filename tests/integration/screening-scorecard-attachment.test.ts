import { describe, expect, it } from "vitest";
import { generateScreeningCriteria, NO_SCORECARD_SKILL } from "@/lib/noa/ai";
import type { JobSpecContext, CandidateContext, ScorecardCriterionContext } from "@/lib/noa/ai";

// Le schéma d'outil est-il accepté, et le rattachement tient-il ?
//
// Cet appel est payant (quelques centimes), d'où sa place dans tests/integration
// — hors de `npm test`, lancé par `npm run test:ai`. Il n'y est pas par excès de
// prudence : ce dépôt s'est déjà fait refuser deux schémas en production
// (`maxItems` sur un tableau, `enum: []`), et un refus ici est SILENCIEUX. La
// génération lève, seedGridCriteria retombe sur la grille statique React, et le
// candidat se retrouve évalué sur des critères étrangers à sa campagne.

const JOB: JobSpecContext = {
  title: "Développeur IA",
  missionText: "Concevoir et déployer des services d'IA générative pour les équipes métier.",
  objectives: ["Mettre en production un premier assistant interne sous 6 mois"],
  skills: ["Python avancé", "LLM & prompt engineering", "Collaboration transverse"],
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
  { id: "11111111-1111-1111-1111-111111111111", category: "technique", name: "Python avancé", justification: null },
  { id: "22222222-2222-2222-2222-222222222222", category: "technique", name: "LLM & prompt engineering", justification: null },
  { id: "33333333-3333-3333-3333-333333333333", category: "relationnelle", name: "Collaboration transverse", justification: null },
];

describe("rattachement des critères de screening à la Scorecard", () => {
  it("produit des critères rattachés à des compétences réelles", async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY manquante — vérifie .env.local.");
    }

    const criteria = await generateScreeningCriteria(JOB, CANDIDATE, SCORECARD);
    expect(criteria.length).toBeGreaterThan(0);

    const known = new Set(SCORECARD.map((s) => s.id));
    const attached = criteria.map((c) => c.skillId).filter((id): id is string => id !== null);

    // Au moins un rattachement : sinon le schéma est passé mais la consigne n'a
    // pas pris, et la page de comparaison ne confirmera jamais rien.
    expect(attached.length).toBeGreaterThan(0);
    // Aucun identifiant inventé, et jamais la valeur sentinelle en guise d'identifiant.
    for (const id of attached) {
      expect(known.has(id), id).toBe(true);
      expect(id).not.toBe(NO_SCORECARD_SKILL);
    }
    // Une compétence ne peut être rattachée qu'à un seul critère.
    expect(new Set(attached).size).toBe(attached.length);
  }, 60_000);

  it("n'exige aucun rattachement quand la campagne n'a pas de Scorecard", async () => {
    // `enum: []` est un schéma invalide : sans Scorecard, le champ ne doit pas
    // exister du tout. Ce cas arrive pour toute campagne sans compétences.
    //
    // Aucune assertion sur le NOMBRE de critères ici : un schéma refusé lève
    // (400), il ne renvoie pas une liste vide. Compter serait mesurer l'humeur
    // du modèle, et c'est exactement ce qui a fait clignoter ce test une fois.
    const criteria = await generateScreeningCriteria(JOB, CANDIDATE, []);
    expect(criteria.every((c) => c.skillId === null)).toBe(true);
  }, 60_000);
});
