import { describe, it, expect } from "vitest";
import {
  mergeSkillChecks,
  skillCheckGuideSection,
  withSkillCheckGuideSection,
  skillCheckCriteriaBlock,
  MAX_SKILL_CHECKS,
  SKILL_CHECK_TITLE,
  DEFAULT_SKILL_CHECK_EVIDENCE,
} from "@/lib/noa/skill-checks";
import { splitTopgradingCriteria, SKILL_CHECK_KIND, generateNoaSynthesis } from "@/lib/noa/synthesis";
import { computeScoreBreakdown } from "@/lib/noa/score";

// Le bloc de critères vit dans la même grille que le parcours, sous une forme
// d'épisode. Ce qui est vérifié ici : il se sépare proprement, il n'entre pas
// dans la note, et une grille qui n'en a pas se comporte exactement comme avant.

const EPISODE = {
  co: "Scaleway",
  period: "2021-2025",
  role: "Senior Engineer",
  qs: [
    { id: "0-0", q: "Quelles étaient vos missions ?" },
    { id: "0-1", q: "Votre réalisation la plus marquante ?" },
  ],
};

const CHECKS = skillCheckCriteriaBlock(
  [
    { skillId: "skill-collab", q: "Racontez un désaccord que vous avez traité.", evidence: "Un exemple situé." },
    { skillId: "skill-auto", q: "Une décision prise sans vos consignes ?", evidence: "Un exemple situé." },
  ],
  1,
);

describe("séparation du parcours et des critères", () => {
  it("sépare les deux blocs", () => {
    const { episodes, checks } = splitTopgradingCriteria([EPISODE, CHECKS]);
    expect(episodes.map((e) => e.co)).toEqual(["Scaleway"]);
    expect(checks?.kind).toBe(SKILL_CHECK_KIND);
    expect(checks?.qs).toHaveLength(2);
  });

  it("renvoie checks à null sur une grille d'avant le bloc", () => {
    const { episodes, checks } = splitTopgradingCriteria([EPISODE]);
    expect(episodes).toHaveLength(1);
    expect(checks).toBeNull();
  });

  it("ne lève sur aucune forme malformée", () => {
    for (const raw of [null, undefined, "x", {}, [], [null], [{ qs: "x" }], [{ co: "Sans questions" }]]) {
      expect(() => splitTopgradingCriteria(raw)).not.toThrow();
    }
    expect(splitTopgradingCriteria([{ qs: "x" }]).episodes).toEqual([]);
  });

  it("garde un identifiant distinct de ceux du parcours", () => {
    // Les deux jeux de réponses cohabitent dans le même `answers` : un
    // identifiant partagé écraserait silencieusement une note.
    const parcours = EPISODE.qs.map((q) => q.id);
    const critères = CHECKS.qs.map((q) => q.id);
    expect(parcours.some((id) => critères.includes(id))).toBe(false);
  });
});

describe("la note ne compte pas les critères", () => {
  it("garde le taux de documentation du seul parcours", () => {
    // 2 questions de parcours dont 1 documentée = 50 %. Les trois « Oui » du
    // bloc ne doivent pas faire monter ce chiffre.
    const checks = skillCheckCriteriaBlock(
      [
        { skillId: "a", q: "Question A ?", evidence: "…" },
        { skillId: "b", q: "Question B ?", evidence: "…" },
        { skillId: "c", q: "Question C ?", evidence: "…" },
      ],
      1,
    );
    const breakdown = computeScoreBreakdown(null, {
      criteria: [EPISODE, checks],
      answers: { "0-0": "Réponse notée.", "1-0": "Oui", "1-1": "Oui", "1-2": "Oui" },
    });
    expect(breakdown.topgradingPercent).toBe(50);
  });

  it("ne change rien à une grille sans bloc", () => {
    const breakdown = computeScoreBreakdown(null, {
      criteria: [EPISODE],
      answers: { "0-0": "Réponse notée." },
    });
    expect(breakdown.topgradingPercent).toBe(50);
  });
});

describe("synthèse déterministe", () => {
  it("ne fait pas figurer le bloc parmi les épisodes du parcours", () => {
    const { content } = generateNoaSynthesis([EPISODE, CHECKS], { "0-0": "Noté.", "1-0": "Oui", "1-1": "Non" });
    expect(content).toContain("Scaleway");
    expect(content).not.toContain(`${SKILL_CHECK_TITLE},`);
    expect(content).toContain("1 validée");
    expect(content).toContain("1 non validée");
  });

  it("produit le même texte qu'avant sur une grille sans bloc", () => {
    const avec = generateNoaSynthesis([EPISODE], { "0-0": "Noté." });
    expect(avec.content).not.toContain("vérifiée");
    expect(avec.advice).toContain("Une partie significative du parcours");
  });
});

describe("fusion des questions", () => {
  const generated = [
    { skillId: "skill-collab", q: "Question générée sur la collaboration ?", evidence: "Fait attendu." },
    { skillId: "skill-auto", q: "Question générée sur l'autonomie ?", evidence: "Fait attendu." },
  ];

  it("garde les générées quand rien n'est figé", () => {
    expect(mergeSkillChecks([], generated).map((s) => s.skillId)).toEqual(["skill-collab", "skill-auto"]);
  });

  it("la question figée l'emporte pour sa compétence", () => {
    const merged = mergeSkillChecks([{ skillId: "skill-collab", question: "Question figée avant l'entretien ?" }], generated);
    expect(merged[0]).toMatchObject({ skillId: "skill-collab", q: "Question figée avant l'entretien ?" });
    expect(merged[0].evidence).toBe(DEFAULT_SKILL_CHECK_EVIDENCE);
    expect(merged.map((s) => s.skillId)).toEqual(["skill-collab", "skill-auto"]);
  });

  it("ne retient qu'une question par compétence", () => {
    const merged = mergeSkillChecks([], [...generated, { skillId: "skill-collab", q: "Doublon ?", evidence: "…" }]);
    expect(merged).toHaveLength(2);
  });

  it("écarte une question vide ou sans compétence", () => {
    expect(mergeSkillChecks([], [{ skillId: "", q: "Orpheline ?" }, { skillId: "x", q: "   " }])).toEqual([]);
  });

  it("écarte une question figée porteuse d'un verdict ou d'un jugement", () => {
    const suspectes = [
      { skillId: "skill-collab", question: "Faut-il recruter ce candidat malgré son manque d'autonomie ?" },
      { skillId: "skill-auto", question: "Sa personnalité lui permet-elle de tenir le poste ?" },
    ];
    expect(mergeSkillChecks(suspectes, [])).toEqual([]);
  });

  it("plafonne le nombre de critères", () => {
    const beaucoup = Array.from({ length: MAX_SKILL_CHECKS + 3 }, (_, i) => ({ skillId: `s-${i}`, q: `Question ${i} ?` }));
    expect(mergeSkillChecks([], beaucoup)).toHaveLength(MAX_SKILL_CHECKS);
  });
});

describe("section de guide", () => {
  it("reprend la question au mot près, avec les relances constantes", () => {
    const section = skillCheckGuideSection([{ text: "Racontez un désaccord que vous avez traité." }]);
    expect(section?.questions[0].q).toBe("Racontez un désaccord que vous avez traité.");
    expect(section?.questions[0].probes.length).toBeGreaterThan(0);
  });

  it("ne crée rien sans question", () => {
    expect(skillCheckGuideSection([])).toBeNull();
    expect(skillCheckGuideSection([{ text: "  " }])).toBeNull();
  });

  it("complète un guide auquel la section manque", () => {
    const guide = withSkillCheckGuideSection([{ title: "Scaleway", questions: [] }], [EPISODE, CHECKS]);
    expect(guide.map((s) => s.title)).toEqual(["Scaleway", SKILL_CHECK_TITLE]);
  });

  it("n'ajoute pas deux fois la même section", () => {
    const once = withSkillCheckGuideSection([], [EPISODE, CHECKS]);
    expect(withSkillCheckGuideSection(once, [EPISODE, CHECKS])).toHaveLength(1);
  });

  it("laisse le guide intact sur une grille sans bloc", () => {
    const guide = [{ title: "Scaleway", questions: [] }];
    expect(withSkillCheckGuideSection(guide, [EPISODE])).toEqual(guide);
  });
});
