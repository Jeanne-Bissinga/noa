import type { MissionSkill, MissionSkillCategory, WorkPreferenceDimension } from "@/lib/noa/types";
import { containsHrVerdict } from "@/lib/noa/errors";
import { WORK_PREFERENCE_DIMENSIONS } from "@/lib/noa/preferences/questions";

// Sujets à approfondir : la garde, pas la suggestion.
//
// ─── La règle que ce module fait respecter ──────────────────────────────────
// Un sujet à approfondir ne s'affiche QUE s'il se rattache à une compétence
// réellement présente dans la Scorecard. Une préférence sans lien avec ce qui
// doit être évalué peut servir à conduire la conversation (cf.
// communication.ts) ; elle ne devient jamais un élément d'évaluation.
//
// Le modèle reçoit les identifiants réels des compétences et un schéma qui les
// contraint par énumération. Ce n'est pas suffisant : un schéma est une
// demande, pas une garantie. La garantie est ici, dans `keepGroundedTopics`,
// qui rejette tout ce qui ne correspond pas — sans essayer de le réparer. Un
// sujet douteux ne s'affiche pas, il disparaît.
//
// Module pur : testable sans IA ni base.

export interface PreferenceTopic {
  /** mission_skills.id — le critère de la Scorecard auquel le sujet se rattache. */
  skillId: string;
  /** Libellé et catégorie figés à la génération : renommer une compétence plus
   *  tard ne doit pas réécrire ce qui a été formulé avant l'entretien. */
  skillName: string;
  skillCategory: MissionSkillCategory;
  dimension: WorkPreferenceDimension;
  /** La préférence déclarée, reformulée en hypothèse à vérifier. */
  hypothesis: string;
  /** Pourquoi ce sujet mérite d'être approfondi sur ce poste. */
  rationale: string;
  /** Question comportementale suggérée, sur une situation vécue. */
  question: string;
}

export interface PreferenceBriefing {
  version: 1;
  topics: PreferenceTopic[];
  /** Identifiants de compétences au moment de la génération : sert à détecter
   *  qu'une Scorecard a changé depuis, et donc qu'il faut régénérer. */
  scorecardSkillIds: string[];
}

/** Au-delà, ce n'est plus une préparation, c'est une fiche à lire pendant l'entretien. */
export const MAX_TOPICS = 3;

// Vocabulaire proscrit dans un sujet à approfondir. Ces motifs attrapent ce
// que le prompt interdit déjà : la note chiffrée, le verdict de recrutement, et
// le glissement de la préférence vers le trait de personnalité.
//
// Ils complètent `containsHrVerdict` (lib/noa/errors.ts) sans le doubler :
// celui-ci couvre les verdicts d'APRÈS l'embauche (période d'essai,
// licenciement, « erreur de casting »), écrit pour un autre contexte. Ici, la
// décision qu'il ne faut pas prendre est celle de recruter ou d'écarter.
const FORBIDDEN_WORDING = [
  // Personnalité et traits — ce que le questionnaire ne mesure pas.
  /\btests? (de personnalit|psychom)/i,
  /\bprofil (comportemental|psychologique)\b/i,
  /\banalyse de personnalit/i,
  /\btraits? de caract[èe]re\b/i,
  /\bpersonnalit[ée]\b/i,
  // Valeur chiffrée sur la personne. Pas de \b final : « 70 %. » n'a pas de
  // frontière de mot après le signe, et se serait glissé au travers.
  /\b\d+\s*(%|\/\s*\d+|points?\b)/,
  /\b(scor(e|é)|notation|probabilit[ée]|compatibilit[ée]|ad[ée]quation)\b/i,
  // Verdict de recrutement.
  //
  // Pas de `\b` en tête : `\w` de JavaScript est limité à l'ASCII, donc une
  // lettre accentuée n'est pas un caractère de mot et `\bécarter` ne peut
  // jamais correspondre. La classe explicite fait le travail de la frontière.
  /(?:^|[^A-Za-zÀ-ÿ])(recruter|embaucher|[ée]carter|rejeter|retenir ce candidat)\b/i,
  /\brecommandation\s*:/i,
  /\bprofil (à risque|solide|insuffisant|recommand)/i,
  // Jugement déguisé en constat.
  /\bmanque d[e']\s*\w/i,
];

export function containsForbiddenPreferenceWording(text: string): boolean {
  return FORBIDDEN_WORDING.some((pattern) => pattern.test(text));
}

export interface RawTopic {
  scorecard_skill_id?: unknown;
  dimension?: unknown;
  hypothesis?: unknown;
  rationale?: unknown;
  question?: unknown;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Ne garde que les sujets réellement ancrés.
 *
 * Rejette, dans l'ordre : une compétence absente de la Scorecard, une
 * compétence déjà traitée, une dimension que le candidat n'a pas exprimée
 * nettement, un champ vide, un texte portant un verdict RH
 * (`containsHrVerdict`) ou du vocabulaire proscrit. Plafonne à MAX_TOPICS.
 *
 * `clearDimensions` est la liste des préférences nettes réellement déclarées :
 * sans elle, un sujet pourrait s'appuyer sur une dimension « mixed », c'est-à-
 * dire sur rien.
 */
export function keepGroundedTopics(
  topics: RawTopic[],
  scorecard: Pick<MissionSkill, "id" | "name" | "category">[],
  clearDimensions: WorkPreferenceDimension[],
): PreferenceTopic[] {
  const byId = new Map(scorecard.map((s) => [s.id, s]));
  const allowedDimensions = new Set(clearDimensions);
  const seen = new Set<string>();
  const kept: PreferenceTopic[] = [];

  for (const raw of topics) {
    if (kept.length >= MAX_TOPICS) break;

    const skillId = text(raw.scorecard_skill_id);
    const skill = byId.get(skillId);
    if (!skill || seen.has(skillId)) continue;

    const dimension = text(raw.dimension) as WorkPreferenceDimension;
    if (!WORK_PREFERENCE_DIMENSIONS.includes(dimension) || !allowedDimensions.has(dimension)) continue;

    const hypothesis = text(raw.hypothesis);
    const rationale = text(raw.rationale);
    const question = text(raw.question);
    if (!hypothesis || !rationale || !question) continue;

    const whole = `${hypothesis} ${rationale} ${question}`;
    if (containsHrVerdict(whole) || containsForbiddenPreferenceWording(whole)) continue;

    seen.add(skillId);
    kept.push({
      skillId: skill.id,
      skillName: skill.name,
      skillCategory: skill.category,
      dimension,
      hypothesis,
      rationale,
      question,
    });
  }

  return kept;
}

/**
 * Relit un briefing stocké et revérifie l'ancrage.
 *
 * Une compétence retirée de la Scorecard depuis la génération fait disparaître
 * son sujet : il n'a plus rien à approfondir. C'est le prix assumé de la règle
 * « jamais de sujet sans lien Scorecard », y compris a posteriori.
 */
export function parsePreferenceBriefing(
  raw: unknown,
  scorecard: Pick<MissionSkill, "id" | "name" | "category">[],
): PreferenceTopic[] {
  if (!raw || typeof raw !== "object") return [];
  const stored = (raw as { topics?: unknown }).topics;
  if (!Array.isArray(stored)) return [];

  const byId = new Map(scorecard.map((s) => [s.id, s]));
  return (stored as PreferenceTopic[])
    .filter((t) => t && typeof t === "object" && byId.has(t.skillId))
    .filter((t) => text(t.hypothesis) && text(t.rationale) && text(t.question))
    .slice(0, MAX_TOPICS);
}

/**
 * Le briefing stocké est-il encore valable pour cette Scorecard ?
 *
 * Non si une compétence citée a disparu, ou si la Scorecard a gagné des
 * compétences depuis : dans les deux cas, ce qui pouvait être approfondi a
 * changé, et le briefing doit être régénéré plutôt que rafistolé.
 */
export function briefingMatchesScorecard(raw: unknown, scorecardSkillIds: string[]): boolean {
  if (!raw || typeof raw !== "object") return false;
  const stored = (raw as { scorecardSkillIds?: unknown }).scorecardSkillIds;
  if (!Array.isArray(stored)) return false;
  const a = [...(stored as string[])].sort();
  const b = [...scorecardSkillIds].sort();
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
