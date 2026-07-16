// noa's LLM-backed helpers. Server-only, never import from a client component.
//
// Uses the Anthropic SDK; requires ANTHROPIC_API_KEY in the environment.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { REASON_LABEL } from "@/lib/noa/labels";

// Plafond de temps pour l'appel LLM (ms). Au-delà, l'appel lève et l'appelant
// retombe sur les données statiques, le flux de création ne fige jamais.
const MISSION_TIMEOUT_MS = 30_000;

// Sonnet 5 : qualité proche d'Opus sur nos tâches de génération structurée,
// pour ~2,5× moins cher (tarif d'intro 2$/10$ le M-token jusqu'au 31/08/2026).
const MODEL = "claude-sonnet-5";

// Profil entreprise (renseigné à l'onboarding), pour cibler les suggestions.
export type CompanyProfile = {
  name?: string | null;
  sector?: string | null;
  activityDescription?: string | null;
  techStack?: string[];
  cultureValues?: string | null;
  teamSize?: string | null;
  mainObjective?: string | null;
};

// Contexte des étapes précédentes, réutilisé par tous les générateurs.
export type MissionContext = {
  reason: string;
  reasonDetail: string;
  title: string;
  missionText: string;
  company?: CompanyProfile;
};

function companyLines(c: CompanyProfile | undefined): string {
  if (!c) return "";
  const lines: string[] = [];
  if (c.sector) lines.push(`Secteur : ${c.sector}`);
  if (c.activityDescription) lines.push(`Activité : ${c.activityDescription}`);
  if (c.techStack && c.techStack.length) lines.push(`Stack technique de l'entreprise : ${c.techStack.join(", ")}`);
  if (c.teamSize) lines.push(`Taille d'équipe : ${c.teamSize}`);
  if (c.mainObjective) lines.push(`Objectif principal de l'entreprise : ${c.mainObjective}`);
  if (c.cultureValues) lines.push(`Culture / valeurs : ${c.cultureValues}`);
  if (!lines.length) return "";
  return `\nProfil de l'entreprise :\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

function contextLines(ctx: MissionContext): string {
  const reasonLabel = REASON_LABEL[ctx.reason] ?? ctx.reason;
  return `Motif du recrutement : ${reasonLabel}${ctx.reasonDetail ? ` (${ctx.reasonDetail})` : ""}
Intitulé du poste : ${ctx.title}
Mission du poste : ${ctx.missionText || "(non renseignée)"}${companyLines(ctx.company)}`;
}

const MISSION_SYSTEM = `Tu es noa, un assistant de recrutement expert. À partir du contexte fourni par le recruteur, tu rédiges la "mission du poste" : 1 à 5 phrases décrivant la raison d'être du poste et son impact stratégique.

Règles :
- Formule l'impact attendu en termes concrets et si possible mesurables.
- Précise le périmètre d'action.
- Évite les formulations vagues et les listes de tâches.
- Écris en français, à la 3e personne, ton professionnel et direct.
- Réponds UNIQUEMENT avec le texte de la mission, sans préambule, sans titre, sans guillemets.`;

/**
 * Rédige la "mission du poste" à partir du contexte défini à l'étape 1 de la
 * création de mission. Retourne le texte généré, ou "" en cas d'échec, l'appelant
 * décide du fallback (typiquement : garder le texte brut du recruteur).
 */
export async function generateMissionText(ctx: MissionContext): Promise<string> {
  // Instancié ici (pas au niveau module) : le constructeur lève si la clé est
  // absente, et on veut que cette erreur soit capturée par l'appelant (fallback)
  // plutôt qu'au moment de l'import du module.
  const client = new Anthropic();

  const userPrompt = `Motif du recrutement : ${
    REASON_LABEL[ctx.reason] ?? ctx.reason
  }${ctx.reasonDetail ? ` (${ctx.reasonDetail})` : ""}
Intitulé du poste : ${ctx.title}
Missions macro esquissées par le recruteur : ${ctx.missionText || "(non renseignées)"}`;

  const response = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 1024,
      // Pas de raisonnement étendu : tâche déterministe, on privilégie coût/latence.
      thinking: { type: "disabled" },
      system: MISSION_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    },
    { timeout: MISSION_TIMEOUT_MS },
  );

  const block = response.content.find((b) => b.type === "text");
  return block?.text.trim() ?? "";
}

// ─── Sortie structurée : on force un outil `strict` et on lit tool_use.input,
// ce qui garantit un JSON valide conforme au schéma (pas de parsing fragile).
async function generateStructured<T>(opts: {
  system: string;
  user: Anthropic.MessageParam["content"];
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<T> {
  const client = new Anthropic();
  const response = await client.messages.create(
    {
      model: MODEL,
      max_tokens: opts.maxTokens,
      // Pas de raisonnement étendu : sortie structurée via outil, on privilégie coût/latence.
      thinking: { type: "disabled" },
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      tools: [
        {
          name: opts.toolName,
          description: opts.toolDescription,
          strict: true,
          input_schema: opts.schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: opts.toolName },
    },
    { timeout: MISSION_TIMEOUT_MS },
  );

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Réponse noa sans sortie structurée.");
  }
  return toolUse.input as T;
}

// ─── Objectifs (étape 3 « Résultats ») ─────────────────────────────────────
export type ObjectiveSuggestion = {
  label: string;
  metric: string;
  deadline: string;
  threshold: string;
};

const OBJECTIVES_SYSTEM = `Tu es noa, un assistant de recrutement expert. À partir du contexte, de la mission du poste et du profil de l'entreprise, tu proposes les résultats attendus (objectifs) pour les 6 premiers mois.

Règles :
- Propose 3 à 4 objectifs, ancrés sur la mission ET le secteur, la taille et l'objectif de l'entreprise. Chaque objectif doit être spécifique à CE poste dans CETTE entreprise.
- Un objectif est un RÉSULTAT chiffré, jamais une tâche ni une activité.
- label : intitulé clair et concret du résultat visé.
- metric : la métrique précise qui mesure ce résultat.
- deadline : un délai réaliste (ex : "3 mois", "6 mois").
- threshold : TOUJOURS un chiffre ou un critère vérifiable (jamais "à définir" ni un adjectif seul).

Calibrage (imite le bon, évite le mauvais) :
- Bon : « Doubler le CA en 2 ans en pilotant la stratégie commerciale » (résultat chiffré, mesurable).
- Mauvais : « Développer les ventes » (vague, aucun chiffre, c'est une tâche).

Rejette tout objectif générique qui pourrait s'appliquer tel quel à un autre métier ou une autre entreprise sans changement. Français, formulations concises.`;

/**
 * Propose des objectifs mesurables à partir du contexte + mission (étapes 1-2).
 * Lève en cas d'échec ; l'appelant retombe sur des suggestions statiques.
 */
export async function generateObjectiveSuggestions(
  ctx: MissionContext,
): Promise<ObjectiveSuggestion[]> {
  const result = await generateStructured<{ objectives: ObjectiveSuggestion[] }>({
    system: OBJECTIVES_SYSTEM,
    user: contextLines(ctx),
    toolName: "proposer_objectifs",
    toolDescription: "Enregistre les objectifs mesurables proposés pour le poste.",
    maxTokens: 2048,
    schema: {
      type: "object",
      properties: {
        objectives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              metric: { type: "string" },
              deadline: { type: "string" },
              threshold: { type: "string" },
            },
            required: ["label", "metric", "deadline", "threshold"],
            additionalProperties: false,
          },
        },
      },
      required: ["objectives"],
      additionalProperties: false,
    },
  });
  return result.objectives ?? [];
}

// ─── Compétences (étape 4 « Compétences ») ─────────────────────────────────
export type SkillSuggestions = {
  technique: string[];
  relationnelle: string[];
  comportementale: string[];
};

const SKILLS_SYSTEM = `Tu es noa, un assistant de recrutement expert. À partir du contexte, de la mission, des objectifs et du profil de l'entreprise, tu proposes les compétences clés du poste.

Règles :
- Réparties en 3 catégories : techniques, relationnelles, comportementales.
- 4 à 6 compétences par catégorie, adaptées au poste et aux objectifs.
- Les compétences TECHNIQUES doivent provenir de la stack de l'entreprise (si fournie) ou en découler directement. N'invente pas de technologies non pertinentes pour ce contexte.
- Les compétences relationnelles et comportementales doivent refléter la mission, la culture et la taille de l'entreprise (ex : autonomie forte en petite structure, coordination transverse en grande équipe).
- Formulations concises (2 à 6 mots).

Calibrage :
- Bon (technique, stack Django/PostgreSQL) : « Django & Django REST », « Optimisation PostgreSQL ».
- Mauvais : « React & Next.js » alors que la stack ne le mentionne pas (hors sujet).

Rejette les compétences génériques applicables à n'importe quel poste. Français.`;

/**
 * Propose des compétences par catégorie à partir du contexte + mission + objectifs
 * (étapes 1-3). Lève en cas d'échec ; l'appelant retombe sur des suggestions statiques.
 */
export async function generateSkillSuggestions(
  ctx: MissionContext,
  objectives: { label: string }[],
): Promise<SkillSuggestions> {
  const objectivesText = objectives
    .map((o) => o.label)
    .filter((l) => l.trim())
    .map((l) => `- ${l}`)
    .join("\n");

  const user = `${contextLines(ctx)}
Objectifs / résultats attendus :
${objectivesText || "(aucun objectif défini)"}`;

  return generateStructured<SkillSuggestions>({
    system: SKILLS_SYSTEM,
    user,
    toolName: "proposer_competences",
    toolDescription: "Enregistre les compétences clés proposées, réparties par catégorie.",
    maxTokens: 2048,
    schema: {
      type: "object",
      properties: {
        technique: { type: "array", items: { type: "string" } },
        relationnelle: { type: "array", items: { type: "string" } },
        comportementale: { type: "array", items: { type: "string" } },
      },
      required: ["technique", "relationnelle", "comportementale"],
      additionalProperties: false,
    },
  });
}

// ─── Extraction du CV → fiche candidat (screening, étape A) ─────────────────
export type CandidateExperienceExtract = {
  role: string;
  company: string;
  period: string;
  bullets: string[];
};

export type CandidateProfileExtract = {
  title: string;
  location: string;
  email: string;
  summary: string;
  experiences: CandidateExperienceExtract[];
  skills: string[];
};

// Types MIME que Claude lit nativement (PDF + images). DOCX non pris en charge.
export const CV_SUPPORTED_MIME = /^(application\/pdf|image\/(jpeg|png|gif|webp))$/;

const CV_SYSTEM = `Tu es noa, un assistant de recrutement expert. Tu extrais le profil d'un candidat à partir de son CV.

Règles :
- N'invente RIEN. Si une information est absente du CV, laisse une chaîne vide (ou une liste vide).
- title : l'intitulé de poste le plus récent ou principal du candidat.
- location : ville ou zone géographique.
- email : email du candidat s'il figure sur le CV.
- summary : 1 à 2 phrases résumant le profil (séniorité, domaine).
- experiences : expériences professionnelles, de la plus récente à la plus ancienne. Pour chaque expérience, bullets = 2 à 4 réalisations ou responsabilités concises.
- skills : compétences techniques et fonctionnelles explicitement mentionnées.
- Français.`;

/**
 * Extrait un profil structuré depuis le CV (PDF ou image, base64).
 * Lève en cas d'échec ; l'appelant crée alors la fiche sans profil enrichi.
 */
export async function extractCandidateProfile(input: {
  base64: string;
  mediaType: string;
}): Promise<CandidateProfileExtract> {
  const fileBlock = input.mediaType.startsWith("image/")
    ? {
        type: "image" as const,
        source: { type: "base64" as const, media_type: input.mediaType as "image/png", data: input.base64 },
      }
    : {
        type: "document" as const,
        source: { type: "base64" as const, media_type: "application/pdf" as const, data: input.base64 },
      };

  return generateStructured<CandidateProfileExtract>({
    system: CV_SYSTEM,
    user: [fileBlock, { type: "text", text: "Extrais le profil de ce candidat à partir de son CV." }],
    toolName: "enregistrer_profil",
    toolDescription: "Enregistre le profil du candidat extrait du CV.",
    maxTokens: 4096,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        location: { type: "string" },
        email: { type: "string" },
        summary: { type: "string" },
        experiences: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              company: { type: "string" },
              period: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
            },
            required: ["role", "company", "period", "bullets"],
            additionalProperties: false,
          },
        },
        skills: { type: "array", items: { type: "string" } },
      },
      required: ["title", "location", "email", "summary", "experiences", "skills"],
      additionalProperties: false,
    },
  });
}

// ─── Préparation du screening : grille (B) et guide (C) ─────────────────────
// Contexte du poste (cadrage) et du candidat (CV extrait), pour cibler la
// grille et le guide.
export type JobSpecContext = {
  title: string;
  missionText: string;
  objectives: string[];
  skills: string[];
  company?: CompanyProfile;
};

export type CandidateContext = {
  fullName: string;
  title: string;
  summary: string;
  experiences: { role: string; company: string; period: string; bullets: string[] }[];
  skills: string[];
};

export type ScreeningCriterionSuggestion = { text: string; crit: string };
export type GuideSectionSuggestion = { title: string; questions: { q: string; probes: string[] }[] };

function jobSpecLines(job: JobSpecContext): string {
  const parts = [`Poste : ${job.title || "(non renseigné)"}`, `Mission : ${job.missionText || "(non renseignée)"}`];
  if (job.objectives.length) parts.push(`Objectifs attendus :\n${job.objectives.map((o) => `- ${o}`).join("\n")}`);
  if (job.skills.length) parts.push(`Compétences requises : ${job.skills.join(", ")}`);
  const cl = companyLines(job.company).trim();
  if (cl) parts.push(cl);
  return parts.join("\n");
}

function candidateLines(c: CandidateContext): string {
  const parts = [`Candidat : ${c.fullName}`];
  if (c.title) parts.push(`Titre actuel : ${c.title}`);
  if (c.summary) parts.push(`Résumé : ${c.summary}`);
  if (c.experiences.length) {
    parts.push(
      `Expériences :\n${c.experiences
        .map((e) => `- ${e.role} @ ${e.company} (${e.period})${e.bullets.length ? " : " + e.bullets.join(" ; ") : ""}`)
        .join("\n")}`,
    );
  }
  if (c.skills.length) parts.push(`Compétences du candidat : ${c.skills.join(", ")}`);
  return parts.join("\n");
}

// Dose le volume de RELANCES du guide selon la durée réelle de l'entretien,
// pour éviter des guides interminables sur des créneaux courts. La grille
// d'évaluation (critères / épisodes), elle, ne dépend pas de la durée : c'est
// un référentiel stable, que le recruteur édite lui-même si besoin. Repère :
// une question + ses relances prend 2 à 4 min en entretien.
type TimeBudget = {
  screeningProbes: string;
  topgradingProbes: string;
};

function timeBudget(minutes: number): TimeBudget {
  if (minutes <= 20) return { screeningProbes: "1 à 2", topgradingProbes: "1 à 2" };
  if (minutes <= 30) return { screeningProbes: "1 à 2", topgradingProbes: "1 à 2" };
  if (minutes <= 45) return { screeningProbes: "2 à 3", topgradingProbes: "2 à 3" };
  if (minutes <= 60) return { screeningProbes: "2 à 3", topgradingProbes: "2 à 3" };
  return { screeningProbes: "2 à 4", topgradingProbes: "2 à 4" };
}

const SCREENING_GRID_SYSTEM = `Tu es noa, un expert en recrutement. Tu conçois la grille d'ÉVALUATION d'un entretien de SCREENING : une liste de critères à valider rapidement pour décider si le candidat passe à l'étape suivante.

Règles :
- Propose 5 à 7 critères, ancrés sur les prérequis du poste (compétences requises, séniorité, objectifs) ET sur le profil réel du candidat.
- text : un LABEL COURT de 4 À 8 MOTS MAXIMUM (jamais une phrase complète, jamais une virgule ou un "et/ou" qui rallonge). Il doit tenir sur UNE seule ligne dans un champ étroit. UN seul sujet par critère : ne fusionne jamais deux technologies, deux compétences ou deux contraintes dans le même intitulé — crée un critère séparé pour chacune.
  BON : "Expérience React senior (3+ ans)" / "Maîtrise TypeScript" / "Disponibilité sous 4 semaines" / "Budget 60-75 k€".
  MAUVAIS (trop long, plusieurs sujets fusionnés) : "Expérience confirmée en développement backend Python et/ou NestJS sur des projets critiques" / "Disponibilité et prétentions salariales compatibles avec le poste et le contexte de forte croissance".
- Chaque critère est un FAIT VÉRIFIABLE à confirmer en entretien (pas une question ouverte).
- Ancre les critères techniques sur les compétences/la stack réellement demandées par le poste.
- Personnalise : quand le CV laisse un doute (stack différente de celle du poste, séniorité à confirmer, écart de contexte), transforme ce doute en critère.
- Inclus, si pertinent, la disponibilité, les prétentions salariales et la motivation (chacune dans un critère séparé, jamais combinées).
- crit : la catégorie du critère (parmi les valeurs autorisées). Inclus TOUJOURS 1 à 2 critères "Prérequis non négociable" : des critères d'ÉLIMINATION objectifs et vérifiables (diplôme/certification requis, autorisation de travail, zone géographique, disponibilité, budget plafond) — pas des critères d'appréciation subjective.
- Rejette les critères génériques applicables à n'importe quel poste. Français, formulations concises.`;

/**
 * Génère les critères de la grille d'évaluation de screening à partir du
 * cadrage (poste) et du profil candidat. Ce référentiel ne dépend pas de la
 * durée de l'entretien. Lève en cas d'échec ; l'appelant retombe sur la grille statique.
 */
export async function generateScreeningCriteria(
  job: JobSpecContext,
  candidate: CandidateContext,
): Promise<ScreeningCriterionSuggestion[]> {
  const result = await generateStructured<{ criteria: ScreeningCriterionSuggestion[] }>({
    system: SCREENING_GRID_SYSTEM,
    user: `${jobSpecLines(job)}\n\n${candidateLines(candidate)}`,
    toolName: "proposer_grille_screening",
    toolDescription: "Enregistre les critères de la grille de screening.",
    maxTokens: 2048,
    schema: {
      type: "object",
      properties: {
        criteria: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string", maxLength: 45 },
              crit: {
                type: "string",
                enum: [
                  "Prérequis non négociable",
                  "Critère important",
                  "Contrainte logistique",
                  "Contrainte budgétaire",
                  "Motivation & posture",
                ],
              },
            },
            required: ["text", "crit"],
            additionalProperties: false,
          },
        },
      },
      required: ["criteria"],
      additionalProperties: false,
    },
  });
  return result.criteria ?? [];
}

const SCREENING_GUIDE_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la grille de screening, du poste et du profil du candidat, tu rédiges le GUIDE d'entretien : pour chaque critère, les questions à poser et les relances pour creuser.

Règles :
- Couvre IMPÉRATIVEMENT chaque critère de la grille par au moins une question, quelle que soit la durée : ne saute jamais un critère.
- Le nombre de relances par question est indiqué dans le message utilisateur (dosé selon la durée réelle de l'entretien) : c'est le levier d'ajustement au temps disponible, respecte-le — une question + ses relances prend 2 à 4 minutes en entretien.
- Regroupe les questions en 2 à 4 sections thématiques cohérentes.
- Pour chaque question : q = la question principale (ouverte), probes = les relances qui creusent la réponse, dans la limite indiquée.
- Personnalise questions et relances avec le parcours RÉEL du candidat (entreprises, technologies, réalisations de son profil).
- Français, ton professionnel.`;

/**
 * Génère les sections du guide d'entretien (questions + relances) à partir de la
 * grille, du poste, du candidat et de la durée de l'entretien (dose le nombre de
 * relances). Lève en cas d'échec ; l'appelant retombe sur le guide statique.
 */
export async function generateScreeningGuideSections(
  criteria: ScreeningCriterionSuggestion[],
  job: JobSpecContext,
  candidate: CandidateContext,
  durationMinutes: number,
): Promise<GuideSectionSuggestion[]> {
  const budget = timeBudget(durationMinutes);
  const criteriaText = criteria.map((c) => `- ${c.text} (${c.crit})`).join("\n");
  const user = `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nCritères de la grille de screening (tous à couvrir) :\n${criteriaText || "(aucun)"}\n\nDurée de l'entretien : ${durationMinutes} min → ${budget.screeningProbes} relances par question.`;

  const result = await generateStructured<{ sections: GuideSectionSuggestion[] }>({
    system: SCREENING_GUIDE_SYSTEM,
    user,
    toolName: "proposer_guide_screening",
    toolDescription: "Enregistre les sections du guide d'entretien (questions + relances).",
    maxTokens: 4096,
    schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string" },
                    probes: { type: "array", items: { type: "string" } },
                  },
                  required: ["q", "probes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "questions"],
            additionalProperties: false,
          },
        },
      },
      required: ["sections"],
      additionalProperties: false,
    },
  });
  return result.sections ?? [];
}

// ─── Préparation du topgrading : grille (B') et guide (C') ──────────────────
// Un épisode = une expérience réelle du candidat (parcours chronologique).
export type TopgradingEpisodeSuggestion = {
  company: string;
  role: string;
  period: string;
  questions: string[];
};

const TOPGRADING_GRID_SYSTEM = `Tu es noa, un expert en recrutement spécialiste de la méthode Topgrading. Tu construis la grille d'ÉVALUATION d'un entretien Topgrading : un parcours CHRONOLOGIQUE des expériences réelles du candidat.

Règles :
- Crée UN épisode par expérience professionnelle réelle du candidat (fournies ci-dessous), de la plus récente à la plus ancienne.
- Recopie fidèlement company / role / period depuis les expériences fournies. N'invente jamais d'entreprise ni de poste.
- Pour chaque épisode, propose 3 à 4 questions Topgrading adaptées à CE poste précis : missions et responsabilités, réalisation majeure et impact mesurable, difficultés ou désaccords rencontrés, raison du départ. Personnalise selon le rôle, l'entreprise et le contexte réel.
- Relie, quand c'est pertinent, aux exigences du poste visé.
- Français, questions ouvertes et concises.`;

/**
 * Génère les épisodes de la grille d'évaluation Topgrading à partir du
 * parcours réel du candidat et du poste. Ce référentiel ne dépend pas de la
 * durée de l'entretien. Lève en cas d'échec ; l'appelant retombe sur la grille statique.
 */
export async function generateTopgradingEpisodes(
  job: JobSpecContext,
  candidate: CandidateContext,
): Promise<TopgradingEpisodeSuggestion[]> {
  const result = await generateStructured<{ episodes: TopgradingEpisodeSuggestion[] }>({
    system: TOPGRADING_GRID_SYSTEM,
    user: `${jobSpecLines(job)}\n\n${candidateLines(candidate)}`,
    toolName: "proposer_grille_topgrading",
    toolDescription: "Enregistre les épisodes de la grille Topgrading (un par expérience).",
    maxTokens: 3072,
    schema: {
      type: "object",
      properties: {
        episodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company: { type: "string" },
              role: { type: "string" },
              period: { type: "string" },
              questions: { type: "array", items: { type: "string" } },
            },
            required: ["company", "role", "period", "questions"],
            additionalProperties: false,
          },
        },
      },
      required: ["episodes"],
      additionalProperties: false,
    },
  });
  return result.episodes ?? [];
}

const TOPGRADING_GUIDE_SYSTEM = `Tu es noa, un expert en recrutement spécialiste du Topgrading. À partir des épisodes du parcours, du poste et du profil, tu rédiges le GUIDE : pour chaque épisode (expérience), les questions à poser et les relances pour aller chercher des exemples concrets et mesurables.

Règles :
- Crée UNE section par épisode. title = le nom de l'entreprise de l'épisode.
- Couvre IMPÉRATIVEMENT chaque question de chaque épisode, quelle que soit la durée : ne saute jamais une question de la grille.
- Pour chaque question : q = la question principale (ouverte), probes = les relances qui creusent (impact chiffré, rôle précis, ce que le manager de l'époque dirait).
- Le nombre de relances par question est indiqué dans le message utilisateur (dosé selon la durée réelle de l'entretien) : c'est le levier d'ajustement au temps disponible, respecte-le.
- Personnalise questions et relances avec le contexte réel de cette expérience.
- Français, ton professionnel.`;

/**
 * Génère le guide Topgrading (une section par épisode, questions + relances),
 * dosé selon la durée de l'entretien. Lève en cas d'échec ; l'appelant retombe sur le guide statique.
 */
export async function generateTopgradingGuideSections(
  episodes: TopgradingEpisodeSuggestion[],
  job: JobSpecContext,
  candidate: CandidateContext,
  durationMinutes: number,
): Promise<GuideSectionSuggestion[]> {
  const budget = timeBudget(durationMinutes);
  const episodesText = episodes
    .map((e) => `- ${e.company} (${e.period}, ${e.role}) : ${e.questions.join(" ; ")}`)
    .join("\n");
  const user = `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nÉpisodes du parcours (grille d'évaluation Topgrading, toutes les questions sont à couvrir) :\n${episodesText || "(aucun)"}\n\nDurée de l'entretien : ${durationMinutes} min → ${budget.topgradingProbes} relances par question.`;

  const result = await generateStructured<{ sections: GuideSectionSuggestion[] }>({
    system: TOPGRADING_GUIDE_SYSTEM,
    user,
    toolName: "proposer_guide_topgrading",
    toolDescription: "Enregistre les sections du guide Topgrading (une par épisode).",
    maxTokens: 4096,
    schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    q: { type: "string" },
                    probes: { type: "array", items: { type: "string" } },
                  },
                  required: ["q", "probes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["title", "questions"],
            additionalProperties: false,
          },
        },
      },
      required: ["sections"],
      additionalProperties: false,
    },
  });
  return result.sections ?? [];
}

// ─── Évaluation automatique de la grille à partir de la transcription ──────
// Le recruteur n'a plus rien à remplir pendant l'entretien : il consulte le
// guide, enregistre via un outil externe, colle la transcription, et noa
// détermine lui-même les réponses de la grille d'évaluation.
const SCREENING_EVAL_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la transcription d'un entretien de screening et de la grille de critères à évaluer, tu détermines pour CHAQUE critère si le candidat l'a validé.

Règles :
- Pour chaque critère, réponds "Oui" (clairement validé par les propos du candidat dans la transcription), "Partiel" (évoqué mais incomplet, ambigu ou nuancé) ou "Non" (non abordé dans la transcription, ou clairement pas validé).
- Base-toi UNIQUEMENT sur ce qui est dit dans la transcription. Si un critère n'est pas abordé, réponds "Non".
- N'invente rien, ne suppose rien. Sois factuel et rigoureux, pas complaisant envers le candidat.
- Réponds pour TOUS les critères fournis, sans exception.`;

/**
 * Détermine, à partir de la transcription de l'entretien, la réponse
 * (Oui/Partiel/Non) de chaque critère de la grille de screening. Lève en cas
 * d'échec ; l'appelant décide du repli (pas de fallback rule-based possible
 * sans saisie manuelle : à retenter).
 */
export async function evaluateScreeningGrid(
  criteria: { id: string; q: string; crit?: string }[],
  transcript: string,
  job: JobSpecContext,
  candidate: CandidateContext,
): Promise<Record<string, "Oui" | "Partiel" | "Non">> {
  const criteriaText = criteria.map((c) => `- [${c.id}] ${c.q}${c.crit ? ` (${c.crit})` : ""}`).join("\n");
  const user = `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nCritères à évaluer (tous, sans exception) :\n${criteriaText}\n\nTranscription de l'entretien :\n${transcript}`;

  const result = await generateStructured<{ evaluations: { id: string; answer: "Oui" | "Partiel" | "Non" }[] }>({
    system: SCREENING_EVAL_SYSTEM,
    user,
    toolName: "evaluer_grille_screening",
    toolDescription: "Enregistre l'évaluation Oui/Partiel/Non pour chaque critère de la grille.",
    maxTokens: 2048,
    schema: {
      type: "object",
      properties: {
        evaluations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              answer: { type: "string", enum: ["Oui", "Partiel", "Non"] },
            },
            required: ["id", "answer"],
            additionalProperties: false,
          },
        },
      },
      required: ["evaluations"],
      additionalProperties: false,
    },
  });

  const answers: Record<string, "Oui" | "Partiel" | "Non"> = {};
  for (const ev of result.evaluations ?? []) answers[ev.id] = ev.answer;
  return answers;
}

const TOPGRADING_EVAL_SYSTEM = `Tu es noa, un expert en recrutement spécialiste du Topgrading. À partir de la transcription d'un entretien Topgrading et des questions de la grille (organisées par épisode du parcours), tu rédiges pour CHAQUE question une note factuelle de ce que le candidat a répondu.

Règles :
- Pour chaque question, résume en 1 à 3 phrases factuelles ce que le candidat a dit (exemples concrets, chiffres, contexte), comme le ferait un recruteur qui prend des notes en direct.
- Si la question n'a pas été abordée dans la transcription, réponds exactement "(non abordé dans l'entretien)".
- Base-toi UNIQUEMENT sur la transcription. N'invente rien.
- Réponds pour TOUTES les questions fournies, sans exception.`;

/**
 * Rédige, à partir de la transcription de l'entretien, la note de chaque
 * question de la grille Topgrading. Lève en cas d'échec ; l'appelant décide du repli.
 */
export async function evaluateTopgradingGrid(
  episodes: { co: string; qs: { id: string; q: string }[] }[],
  transcript: string,
  job: JobSpecContext,
  candidate: CandidateContext,
): Promise<Record<string, string>> {
  const questionsText = episodes.flatMap((ep) => ep.qs.map((q) => `- [${q.id}] (${ep.co}) ${q.q}`)).join("\n");
  const user = `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nQuestions à documenter (toutes, sans exception) :\n${questionsText}\n\nTranscription de l'entretien :\n${transcript}`;

  const result = await generateStructured<{ notes: { id: string; note: string }[] }>({
    system: TOPGRADING_EVAL_SYSTEM,
    user,
    toolName: "evaluer_grille_topgrading",
    toolDescription: "Enregistre la note résumée pour chaque question de la grille.",
    maxTokens: 3072,
    schema: {
      type: "object",
      properties: {
        notes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              note: { type: "string" },
            },
            required: ["id", "note"],
            additionalProperties: false,
          },
        },
      },
      required: ["notes"],
      additionalProperties: false,
    },
  });

  const notes: Record<string, string> = {};
  for (const n of result.notes ?? []) notes[n.id] = n.note;
  return notes;
}

// ─── Synthèse post-entretien (D, partagée screening + topgrading) ───────────
const SYNTHESIS_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la grille d'entretien remplie par le recruteur (et, si elle est fournie, de la transcription de l'entretien), du poste et du profil du candidat, tu rédiges une SYNTHÈSE d'aide à la décision.

Règles :
- Si une transcription est fournie, appuie-toi en priorité sur les propos réels du candidat qu'elle contient ; la grille reste le fil conducteur des critères évalués.
- content : 3 à 5 phrases synthétisant la performance du candidat sur les critères évalués (points forts, points de vigilance, adéquation avec le poste). Factuel, appuyé sur la grille et la transcription le cas échéant.
- advice : 1 à 2 phrases de recommandation claire pour la décision (poursuivre, approfondir un point précis, écarter), avec la raison.
- N'invente aucun fait absent de la grille remplie et de la transcription. Français, ton professionnel et direct.`;

/**
 * Rédige la synthèse (content + advice) d'un entretien à partir de la grille
 * remplie, de la transcription (optionnelle) et du contexte. Lève en cas d'échec ;
 * l'appelant retombe sur la synthèse rule-based.
 */
export async function generateInterviewSynthesis(input: {
  type: "screening" | "topgrading";
  filledGrid: string;
  transcript?: string | null;
  job: JobSpecContext;
  candidate: CandidateContext;
}): Promise<{ content: string; advice: string }> {
  const stepLabel = input.type === "screening" ? "Screening" : "Topgrading";
  const user = `Type d'entretien : ${stepLabel}
${jobSpecLines(input.job)}

${candidateLines(input.candidate)}

Grille d'entretien remplie par le recruteur :
${input.filledGrid || "(grille vide)"}
${input.transcript?.trim() ? `\nTranscription de l'entretien (collée par le recruteur depuis un outil externe) :\n${input.transcript.trim()}` : ""}`;

  return generateStructured<{ content: string; advice: string }>({
    system: SYNTHESIS_SYSTEM,
    user,
    toolName: "enregistrer_synthese",
    toolDescription: "Enregistre la synthèse (content) et le conseil (advice).",
    maxTokens: 1024,
    schema: {
      type: "object",
      properties: {
        content: { type: "string" },
        advice: { type: "string" },
      },
      required: ["content", "advice"],
      additionalProperties: false,
    },
  });
}
