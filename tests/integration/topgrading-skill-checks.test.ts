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

// Contexte volontairement de TAILLE RÉELLE : profil d'entreprise, objectifs,
// expériences détaillées, neuf compétences attendues. Une première version de ce
// test passait en 9 secondes sur un contexte squelettique, pendant que le même
// appel dépassait le délai sur une vraie campagne — et l'échec est silencieux
// côté produit (le bloc n'apparaît simplement pas). Un test d'intégration qui ne
// reproduit pas la charge réelle ne prouve que le schéma, pas le service.
const JOB: JobSpecContext = {
  title: "Développeur IA",
  missionText:
    "Concevoir et déployer des services d'IA générative pour les équipes métier : assistants internes, recherche documentaire augmentée, automatisation de tâches répétitives. Le poste couvre la conception, la mise en production et le suivi des modèles, en lien direct avec les équipes produit et support.",
  objectives: [
    "Mettre en production un premier assistant interne sous 6 mois",
    "Réduire de moitié le temps de traitement des demandes support",
  ],
  skills: [
    "Python avancé", "Frameworks ML (PyTorch/TensorFlow)", "LLM & prompt engineering",
    "API REST", "MLOps & déploiement en production", "Collaboration transverse",
    "Communication technique claire", "Autonomie sur des sujets complexes", "Rigueur scientifique",
  ],
  company: {
    sector: "Santé",
    activityDescription: "Éditeur de logiciels pour les cabinets médicaux, 40 personnes.",
    techStack: ["Python", "FastAPI", "Postgres", "Vercel"],
    cultureValues: "Exigence, transparence, autonomie encadrée",
    teamSize: "20-49",
    mainObjective: "Industrialiser l'IA au service des praticiens",
  },
};

const CANDIDATE: CandidateContext = {
  fullName: "Alex Dupont",
  title: "ML Engineer",
  summary: "5 ans en ML, deux mises en production de modèles de recommandation à fort trafic.",
  experiences: [
    { role: "ML Engineer", company: "Scaleway", period: "2021-2025", bullets: ["Pipelines de features temps réel", "Mise en production de modèles de recommandation", "Encadrement de deux alternants"] },
    { role: "Data Scientist", company: "Skello", period: "2019-2021", bullets: ["Prévision de charge", "Tableaux de bord métier"] },
    { role: "Développeur", company: "Freelance", period: "2017-2019", bullets: ["Projets web pour des PME"] },
  ],
  skills: ["Python", "PyTorch", "FastAPI", "Docker"],
};

// Neuf compétences avec leur justification, comme sur une campagne générée par
// noa : c'est ce volume qui a fait tomber la première version.
const SOFT_SKILLS = [
  ["relationnelle", "Collaboration transverse"],
  ["relationnelle", "Communication technique claire"],
  ["relationnelle", "Communication claire avec les parties prenantes"],
  ["relationnelle", "Autonomie sur des sujets complexes"],
  ["comportementale", "Autonomie"],
  ["comportementale", "Rigueur scientifique"],
  ["comportementale", "Curiosité technologique"],
  ["comportementale", "Orienté livraison et résultats"],
  ["comportementale", "Curiosité et envie d'apprendre"],
] as const;

const SCORECARD: ScorecardCriterionContext[] = SOFT_SKILLS.map(([category, name], i) => ({
  id: `${i + 1}${"1".repeat(7)}-1111-1111-1111-111111111111`.slice(0, 36),
  category,
  name,
  justification: "Signalée comme déterminante pour ce poste par l'analyse de la fiche de mission.",
}));

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
