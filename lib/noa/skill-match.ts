import type { CandidateSkill, MissionSkill } from "@/lib/noa/types";

// Ce qui rattache une compétence attendue à ce qu'on sait d'un candidat.
//
// Deux sources, deux degrés de certitude :
//   - le CV la mentionne : rapprochement APPROCHÉ de deux textes écrits
//     indépendamment, indicatif et rien de plus ;
//   - l'entretien l'a confirmée : le critère de la grille porte l'identifiant de
//     la compétence qu'il vérifie (posé à la génération, lib/noa/ai.ts) et il a
//     reçu « Oui » ou « Partiel ». Là, il n'y a rien à deviner.
//
// Le rattachement exact existe parce que le rapprochement de textes ne
// fonctionnait pas là où il comptait : les critères de screening sont rédigés
// depuis la fiche de poste, sans jamais citer les compétences de la Scorecard.
// Sur une campagne réelle, il retrouvait 2 compétences techniques sur 5, et
// aucune des 4 compétences relationnelles.
//
// Module pur : testable sans IA ni base, et importable depuis un composant
// client.

/** Minuscules, accents retirés : le CV et la Scorecard n'ont pas de référentiel commun. */
export function normalizeSkillName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/**
 * Rapprochement approché entre le nom d'une compétence attendue et un autre
 * texte (libellé de compétence du CV, intitulé de critère). Sous-chaîne dans les
 * deux sens, insensible à la casse et aux accents.
 */
function textsOverlap(skillName: string, other: string): boolean {
  const target = normalizeSkillName(skillName);
  const candidate = normalizeSkillName(other);
  // La garde sur la longueur n'est pas cosmétique : une chaîne vide est une
  // sous-chaîne de tout, et cocherait la Scorecard entière.
  return candidate.length > 0 && (target.includes(candidate) || candidate.includes(target));
}

/**
 * La compétence attendue apparaît-elle dans les compétences déclarées du CV ?
 *
 * Pas de référentiel commun entre les deux tables : une correspondance
 * approchée reste plus utile qu'une absence de rapprochement, tant qu'elle est
 * présentée comme indicative — d'où un état distinct de « confirmée ».
 */
export function candidateCoversSkill(
  candidateSkills: Pick<CandidateSkill, "name">[],
  skillName: string,
): boolean {
  return candidateSkills.some((s) => textsOverlap(skillName, s.name));
}

/** Réponses de grille qui valent confirmation. « Non » et l'absence de réponse n'en sont pas. */
const VALIDATING_ANSWERS = new Set(["Oui", "Partiel"]);

type GridCriterion = { id?: unknown; q?: unknown; skillId?: unknown };

export type GridLike = { criteria: unknown; answers: Record<string, unknown> };

/**
 * Compétences attendues confirmées par une grille d'entretien : un critère qui
 * les vérifie a reçu « Oui » ou « Partiel ».
 *
 * Deux chemins, et un seul s'applique par grille :
 *   - la grille porte des rattachements (`skillId`) : on ne lit qu'eux. Un
 *     critère laissé sans rattachement l'a été DÉLIBÉRÉMENT — le modèle a jugé
 *     qu'il ne vérifiait aucune compétence de la Scorecard — et le rapprocher
 *     quand même par son libellé reviendrait à défaire ce choix ;
 *   - aucun rattachement nulle part : la grille précède cette mécanique, et on
 *     retombe sur le rapprochement de textes pour ne pas faire disparaître ce
 *     qu'elle montrait déjà.
 *
 * Les deux grilles sont lues. Le parcours topgrading reste inerte — ses réponses
 * sont des notes en texte libre, jamais un statut fermé — mais le bloc de
 * critères rattachés à la Scorecard, lui, porte des verdicts.
 */
/**
 * Aplatit une grille quelle que soit sa forme : critères plats (screening) ou
 * questions portées par des épisodes (topgrading).
 */
function flattenCriteria(criteria: unknown): GridCriterion[] {
  if (!Array.isArray(criteria)) return [];
  return criteria
    .flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const block = raw as { qs?: unknown };
      return Array.isArray(block.qs) ? (block.qs as unknown[]) : [raw];
    })
    // Une grille est du JSON libre : une entrée nulle ou scalaire n'a rien
    // d'impossible, et la lecture d'une compétence ne doit pas faire tomber la
    // page de comparaison pour autant.
    .filter((c): c is GridCriterion => !!c && typeof c === "object");
}

export function validatedSkillIds(
  grid: GridLike | null | undefined,
  missionSkills: Pick<MissionSkill, "id" | "name">[],
): Set<string> {
  const validated = new Set<string>();
  if (!grid || !Array.isArray(grid.criteria)) return validated;

  const criteria = flattenCriteria(grid.criteria);
  const known = new Set(missionSkills.map((s) => s.id));
  const attached = criteria.some((c) => typeof c.skillId === "string" && known.has(c.skillId));
  // Le repli par rapprochement de textes n'a de sens que sur une grille plate :
  // une grille par épisodes n'a jamais précédé cette mécanique, et y rapprocher
  // un libellé de question du nom d'une compétence inventerait une confirmation.
  const episodeShaped = (grid.criteria as unknown[]).some(
    (raw) => !!raw && typeof raw === "object" && Array.isArray((raw as { qs?: unknown }).qs),
  );

  for (const criterion of criteria) {
    const answer = grid.answers?.[String(criterion.id)];
    if (typeof answer !== "string" || !VALIDATING_ANSWERS.has(answer)) continue;

    if (attached || episodeShaped) {
      if (typeof criterion.skillId === "string" && known.has(criterion.skillId)) {
        validated.add(criterion.skillId);
      }
      continue;
    }

    const label = typeof criterion.q === "string" ? criterion.q : "";
    const hit = missionSkills.find((s) => textsOverlap(s.name, label));
    if (hit) validated.add(hit.id);
  }

  return validated;
}
