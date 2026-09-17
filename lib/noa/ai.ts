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

// Contexte brut saisi à l'étape "Pourquoi ce recrutement ?", avant que noa ne
// le transforme en résumé exécutif (missions.mission_text). Distinct de
// MissionContext, qui lui porte le résumé déjà rédigé (utilisé par les
// générateurs des étapes suivantes : objectifs, compétences).
export type MissionDraftContext = {
  reason: string;
  reasonDetail: string;
  title: string;
  startingPoint: string;
  targetObjective: string;
};

const MISSION_SYSTEM = `Tu es noa, un assistant de recrutement expert, méthode Scorecard (Topgrading). À partir du point de départ et de l'objectif fournis par le recruteur, tu rédiges la MISSION du poste : 1 à 3 phrases (jamais plus de 5) décrivant sa raison d'être.

Structure à respecter (imite exactement ce gabarit) :
[Verbes d'action à l'infinitif + périmètre concret du poste], en collaboration avec [équipe / interlocuteurs concernés], pour [finalité / impact recherché].

Règles :
- Ouvre par 2 à 4 verbes d'action à l'infinitif qui décrivent concrètement ce que fait le poste au quotidien (ex : concevoir, développer, maintenir, piloter, structurer, coordonner...), jamais une formulation abstraite.
- Précise le périmètre : technologies, produit, processus ou domaine concerné — reprends ce que le recruteur a fourni, n'invente pas de détails absents du contexte.
- Mentionne, si le contexte le permet, l'équipe ou les interlocuteurs avec qui le poste collabore ("en collaboration avec...").
- Termine par la finalité recherchée ("pour..."). Sur un poste business/stratégique, chiffre et date cet impact quand c'est naturel (ex : "doubler le CA en 2 ans"). Sur un poste technique/opérationnel/junior, une finalité concrète et qualitative suffit (ex : "accélérer la roadmap et améliorer l'expérience utilisateur") — les chiffres précis (KPI, seuils, délais) seront définis séparément à l'étape suivante, ne les invente pas ici.
- Concret toujours, vague jamais : rejette les formulations qui pourraient s'appliquer à n'importe quel poste (ex : "développer les ventes", "améliorer les choses").
- Écris en français, à la 3e personne, ton professionnel et direct.
- Réponds UNIQUEMENT avec le texte de la mission, sans préambule, sans titre, sans guillemets.

Calibrage (imite le bon, évite le mauvais) :
- Bon (poste business) : « Développer et piloter la stratégie commerciale pour doubler le CA en 2 ans. »
- Bon (poste technique/junior) : « Concevoir, développer et maintenir des fonctionnalités produit robustes en React/Node.js, en collaboration avec l'équipe produit, pour accélérer la roadmap et améliorer l'expérience utilisateur. »
- Mauvais : « Développer les ventes » → pas de verbe d'action concret ni de périmètre, trop vague.`;

/**
 * Rédige le résumé exécutif du poste à partir du point de départ et de
 * l'objectif saisis à l'étape "Pourquoi ce recrutement ?". Retourne le texte
 * généré, ou "" en cas d'échec, l'appelant décide du fallback (typiquement :
 * garder le texte brut du recruteur).
 */
export async function generateMissionText(ctx: MissionDraftContext): Promise<string> {
  // Instancié ici (pas au niveau module) : le constructeur lève si la clé est
  // absente, et on veut que cette erreur soit capturée par l'appelant (fallback)
  // plutôt qu'au moment de l'import du module.
  const client = new Anthropic();

  const userPrompt = `Motif du recrutement : ${
    REASON_LABEL[ctx.reason] ?? ctx.reason
  }${ctx.reasonDetail ? ` (${ctx.reasonDetail})` : ""}
Intitulé du poste : ${ctx.title}
Point de départ (situation actuelle) : ${ctx.startingPoint || "(non renseigné)"}
Objectif visé (avec échéance) : ${ctx.targetObjective || "(non renseigné)"}`;

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

const OBJECTIVES_SYSTEM = `Tu es noa, un assistant de recrutement expert. À partir du contexte, du résumé exécutif du poste et du profil de l'entreprise, tu proposes les résultats attendus (KPI) pour les 6 premiers mois.

Règles :
- Propose 5 à 7 objectifs, ancrés sur le résumé exécutif ET le motif du recrutement, le secteur, la taille et l'objectif de l'entreprise. Chaque objectif doit être spécifique à CE poste dans CETTE entreprise.
- Un objectif est un RÉSULTAT chiffré, jamais une tâche ni une activité.
- Règle d'or : si ce n'est pas mesurable, ce n'est pas un résultat.
- label : intitulé clair et concret du résultat visé.
- metric : la métrique précise qui mesure ce résultat.
- deadline : un délai réaliste, cohérent avec les jalons de bilan à 30, 60 ou 90 jours (ex : "30 jours", "60 jours", "90 jours"), ou au-delà si l'objectif le justifie.
- threshold : TOUJOURS un chiffre ou un critère vérifiable (jamais "à définir" ni un adjectif seul). Chaque objectif doit pouvoir être évalué sans ambiguïté lors des bilans 30-60-90 jours.

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

// ─── Compétences (étape « Compétences ») ────────────────────────────────────
// essential=true : compétence indispensable, noa la pré-sélectionne d'emblée.
// essential=false : suggestion complémentaire, affichée mais laissée au choix
// du recruteur (case non cochée).
// reason : justification courte affichée au recruteur/manager, pour qu'il
// comprenne pourquoi noa propose cette compétence (signal marché cité, ou
// lien avec la stack/le secteur/la mission de l'entreprise) plutôt que de la
// recevoir comme une boîte noire.
export type SkillItem = { name: string; essential: boolean; reason: string };
export type SkillSuggestions = {
  technique: SkillItem[];
  relationnelle: SkillItem[];
  comportementale: SkillItem[];
};

function skillsSystem(signalsBlock: string): string {
  return `Tu es noa, un assistant de recrutement expert. À partir du contexte, de la mission, des objectifs et du profil de l'entreprise, tu proposes les compétences clés du poste, à jour des tendances marché.

Règles :
- Réparties en 3 catégories : techniques, relationnelles, comportementales.
- Maximum 8 compétences par catégorie. Parmi elles :
  - essential=true pour les 4 à 6 compétences réellement INDISPENSABLES au poste (le recruteur les verra pré-sélectionnées).
  - essential=false pour 2 à 3 compétences complémentaires, pertinentes mais non bloquantes (suggérées, à cocher par le recruteur s'il les retient).
- Les compétences TECHNIQUES doivent d'abord correspondre au MÉTIER réel indiqué par l'intitulé du poste (ex : un designer a des compétences en design/outils UX, un commercial en vente/CRM, un RH en droit du travail/SIRH), PAS systématiquement à la stack technique de l'entreprise. La stack technique de l'entreprise ne s'applique que si le poste est lui-même un poste de développement/ingénierie logicielle ; pour tout autre métier, ignore-la et base-toi sur les outils et savoir-faire propres à ce métier.
- Une compétence TECHNIQUE doit TOUJOURS nommer un outil, logiciel, langage, framework, méthode ou certification concret et vérifiable (nom propre ou terme précis du métier) — jamais une catégorie abstraite. Si tu hésites entre une formulation vague et un nom d'outil précis, choisis toujours l'outil précis, quitte à en proposer plusieurs pour couvrir le poste.
- Les compétences relationnelles et comportementales doivent refléter la mission, la culture et la taille de l'entreprise (ex : autonomie forte en petite structure, coordination transverse en grande équipe).
- Formulations concises (2 à 6 mots).
- reason : 1 phrase courte expliquant CE choix précis. Quand un signal marché ci-dessous l'appuie, cite-le explicitement (nom du média entre parenthèses) et reprends son constat concret. Sinon, justifie par le lien avec le poste, la mission ou le profil de l'entreprise (stack, secteur, culture). N'invente jamais un signal ou un chiffre absent de la liste fournie.

Calibrage (compétences TECHNIQUES) :
- Bon (poste développeur, stack Django/PostgreSQL) : « Django & Django REST », « Optimisation PostgreSQL ».
- Bon (poste designer, même si la stack entreprise est Django/PostgreSQL) : « Figma », « Design systems », « Prototypage sur Framer » — des logiciels et pratiques concrets, pas de technologies backend (non pertinentes pour ce métier).
- Bon (poste commercial) : « Négociation grands comptes », « Salesforce ou HubSpot », « Prospection outbound ».
- Mauvais : « React & Next.js » ou toute techno de développement pour un poste non-dev.
- Mauvais (trop vague, à bannir même quand tu ne connais pas le détail du poste) : « Maîtrise des outils du métier », « Bonnes compétences techniques », « Connaissance des logiciels du secteur », « Compétences digitales ». Remplace-les toujours par les outils/logiciels réels de ce métier (déduis-les du contexte si besoin, mais nomme-les).

Rejette les compétences génériques applicables à n'importe quel poste. Français.

Signaux marché disponibles (les plus récents, filtrés sur ce poste) :
${signalsBlock}`;
}

/**
 * Propose des compétences par catégorie à partir du contexte + mission +
 * objectifs déjà définis (s'il y en a) + signaux marché (flux RSS ingérés
 * dans skills_signals), avec une distinction indispensable/complémentaire
 * (essential) et une justification par compétence (reason). Lève en cas
 * d'échec ; l'appelant retombe sur des suggestions statiques.
 */
export async function generateSkillSuggestions(
  ctx: MissionContext,
  objectives: { label: string }[],
  signals: ScorecardSignalContext[] = [],
): Promise<SkillSuggestions> {
  const objectivesText = objectives
    .map((o) => o.label)
    .filter((l) => l.trim())
    .map((l) => `- ${l}`)
    .join("\n");

  const user = `${contextLines(ctx)}
Objectifs / résultats attendus :
${objectivesText || "(aucun objectif défini pour le moment)"}`;

  const signalsBlock = signals.length
    ? signals
        .map((s) => `- [${s.sourceName}]${s.publishedAt ? ` (${new Date(s.publishedAt).toLocaleDateString("fr-FR")})` : ""} ${s.title} — ${s.summary}`)
        .join("\n")
    : "(aucun signal marché disponible pour le moment)";

  // Pas de `maxItems` ici : le schéma d'outil "strict" d'Anthropic rejette
  // cette propriété sur un type "array" (400 invalid_request_error). La
  // limite de 8 par catégorie reste portée par le prompt (skillsSystem).
  const skillItemSchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        essential: { type: "boolean" },
        reason: { type: "string" },
      },
      required: ["name", "essential", "reason"],
      additionalProperties: false,
    },
  } as const;

  return generateStructured<SkillSuggestions>({
    system: skillsSystem(signalsBlock),
    user,
    toolName: "proposer_competences",
    toolDescription: "Enregistre les compétences clés proposées, réparties par catégorie, avec leur caractère indispensable ou non et leur justification.",
    maxTokens: 2560,
    schema: {
      type: "object",
      properties: {
        technique: skillItemSchema,
        relationnelle: skillItemSchema,
        comportementale: skillItemSchema,
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
  firstName: string;
  lastName: string;
  title: string;
  location: string;
  email: string;
  summary: string;
  experiences: CandidateExperienceExtract[];
  skills: string[];
};

// Claude lit nativement le PDF et les images. Le DOCX, non : on en extrait le
// texte avec mammoth avant de l'envoyer (cf. cvContentBlock). Le .doc binaire
// (Word 97-2003) reste hors de portée — mammoth ne gère que l'OOXML.
export const CV_DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const CV_SUPPORTED_MIME = new RegExp(
  `^(application/pdf|image/(jpeg|png|gif|webp)|${CV_DOCX_MIME.replace(/[.+]/g, "\\$&")})$`,
);

// Un CV tient très largement dans cette limite ; elle n'existe que pour qu'un
// document aberrant ne parte pas en entier dans le prompt.
const CV_TEXT_MAX_CHARS = 100_000;

/**
 * Construit le bloc de contenu envoyé à Claude selon le type de CV :
 * PDF et images partent tels quels, le DOCX est converti en texte au préalable.
 */
async function cvContentBlock(input: { base64: string; mediaType: string }) {
  if (input.mediaType === CV_DOCX_MIME) {
    // Import différé : mammoth ne sert qu'aux DOCX, inutile de le charger sinon.
    const mammoth = (await import("mammoth")).default;
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(input.base64, "base64") });

    let text = value.trim();
    if (!text) {
      // Word sans texte brut (CV entièrement en images/zones de texte) : mieux
      // vaut lever et laisser l'appelant proposer la saisie manuelle que
      // demander à Claude d'extraire un profil depuis une chaîne vide.
      throw new Error("Document Word sans texte exploitable.");
    }
    if (text.length > CV_TEXT_MAX_CHARS) {
      console.warn(`[noa] CV Word tronqué à ${CV_TEXT_MAX_CHARS} caractères (${text.length} au total).`);
      text = text.slice(0, CV_TEXT_MAX_CHARS);
    }

    return { type: "text" as const, text: `CV du candidat (texte extrait du document Word) :\n\n${text}` };
  }

  if (input.mediaType.startsWith("image/")) {
    return {
      type: "image" as const,
      source: { type: "base64" as const, media_type: input.mediaType as "image/png", data: input.base64 },
    };
  }

  return {
    type: "document" as const,
    source: { type: "base64" as const, media_type: "application/pdf" as const, data: input.base64 },
  };
}

const CV_SYSTEM = `Tu es noa, un assistant de recrutement expert. Tu extrais le profil d'un candidat à partir de son CV.

Règles :
- N'invente RIEN. Si une information est absente du CV, laisse une chaîne vide (ou une liste vide).
- firstName / lastName : prénom et nom de famille du candidat. Sépare-les correctement même si le CV les écrit sur une seule ligne ou en majuscules ; restitue-les en casse normale (ex. "MARIE DUPONT" → firstName "Marie", lastName "Dupont"). Ne confonds pas le nom du candidat avec celui d'une entreprise ou d'une école.
- title : l'intitulé de poste le plus récent ou principal du candidat.
- location : ville ou zone géographique.
- email : email du candidat s'il figure sur le CV.
- summary : 1 à 2 phrases résumant le profil (séniorité, domaine).
- experiences : expériences professionnelles, de la plus récente à la plus ancienne. Pour chaque expérience, bullets = 2 à 4 réalisations ou responsabilités concises.
- skills : compétences techniques et fonctionnelles explicitement mentionnées.
- Français.`;

/**
 * Extrait un profil structuré depuis le CV (PDF, image ou DOCX, base64).
 * Lève en cas d'échec ; l'appelant crée alors la fiche sans profil enrichi.
 */
export async function extractCandidateProfile(input: {
  base64: string;
  mediaType: string;
}): Promise<CandidateProfileExtract> {
  const fileBlock = await cvContentBlock(input);

  return generateStructured<CandidateProfileExtract>({
    system: CV_SYSTEM,
    user: [fileBlock, { type: "text", text: "Extrais le profil de ce candidat à partir de son CV." }],
    toolName: "enregistrer_profil",
    toolDescription: "Enregistre le profil du candidat extrait du CV.",
    maxTokens: 4096,
    schema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
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
      required: ["firstName", "lastName", "title", "location", "email", "summary", "experiences", "skills"],
      additionalProperties: false,
    },
  });
}

// ─── Repère CV/mission, à l'import (avant toute fiche, avant tout entretien) ─
// Volontairement pas un filtre : chaque candidat garde sa chance d'être reçu
// en entretien s'il le souhaite. Le verdict décrit l'écart avec le poste tel
// que rédigé, jamais la valeur de la personne — et le mot "recruter" n'y
// figure même pas, cette étape n'a rien à voir avec une décision d'embauche.
const CV_FIT_VERDICTS = [
  "Bon socle pour un premier entretien",
  "Des points à creuser en entretien",
  "Écart important avec le poste",
] as const;
export type CvFitVerdict = (typeof CV_FIT_VERDICTS)[number];

export type CvFitSuggestion = {
  verdict: CvFitVerdict;
  reasoning: string;
};

const CV_FIT_SYSTEM = `Tu es noa, assistant de recrutement. Un CV vient d'être importé, avant toute création de fiche candidat et avant tout entretien. Compare le profil extrait aux compétences attendues du poste, pour donner au recruteur un premier repère — jamais un filtre ni une décision.

Règles strictes :
- Ce n'est JAMAIS un motif de refus. Le recruteur reste toujours libre de recevoir ce candidat en entretien, quel que soit le repère. N'emploie jamais les mots "rejeter", "refuser", "écarter", "ne pas retenir", "disqualifié", "recruter".
- verdict : uniquement une des valeurs autorisées, qui décrit l'écart entre le CV et le poste tel que rédigé — jamais un jugement sur la personne.
- reasoning : 1 à 2 phrases factuelles, citant les compétences du poste retrouvées ou non dans le CV. Aucun commentaire sur l'âge, le parcours scolaire, la présentation ou toute autre caractéristique personnelle.
- N'invente rien qui ne figure pas dans le CV ou la fiche de poste.
- Français.`;

/**
 * Repère de correspondance entre le CV importé et les compétences attendues
 * de la mission. Purement informatif : un échec ou une mission sans
 * compétences renseignées ne doit jamais bloquer l'import du CV, l'appelant
 * traite ce cas en retombant sur `null`.
 */
export async function generateCvFitSuggestion(input: {
  missionTitle: string;
  missionText: string;
  missionSkills: string[];
  profile: CandidateProfileExtract;
}): Promise<CvFitSuggestion> {
  const experienceLines = input.profile.experiences
    .map((e) => `${e.role || "(poste non précisé)"} chez ${e.company || "(entreprise non précisée)"} (${e.period || "période non précisée"})`)
    .join(" ; ");

  const user = `Poste : ${input.missionTitle || "(non renseigné)"}
Mission : ${input.missionText || "(non renseignée)"}
Compétences attendues : ${input.missionSkills.join(", ")}

Profil extrait du CV :
Résumé : ${input.profile.summary || "(non renseigné)"}
Compétences citées sur le CV : ${input.profile.skills.length ? input.profile.skills.join(", ") : "(aucune)"}
Expériences : ${experienceLines || "(aucune)"}`;

  return generateStructured<CvFitSuggestion>({
    system: CV_FIT_SYSTEM,
    user,
    toolName: "enregistrer_repere_cv",
    toolDescription: "Enregistre un premier repère de correspondance entre le CV et la mission, jamais un filtre.",
    maxTokens: 512,
    schema: {
      type: "object",
      properties: {
        verdict: { type: "string", enum: [...CV_FIT_VERDICTS] },
        reasoning: { type: "string" },
      },
      required: ["verdict", "reasoning"],
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

export type ScreeningCriterionSuggestion = {
  text: string;
  crit: string;
  /**
   * mission_skills.id de la compétence attendue que ce critère vérifie, ou null
   * quand il n'en vérifie aucune (disponibilité, budget, motivation).
   *
   * C'est ce rattachement qui permet de dire plus tard qu'une compétence a été
   * confirmée en entretien. Sans lui, il faudrait rapprocher deux textes écrits
   * indépendamment — ce que faisait la page de comparaison, et qui ne
   * retrouvait presque jamais une compétence relationnelle ou de savoir-être.
   */
  skillId: string | null;
};

/** Valeur que le modèle renvoie quand un critère ne vérifie aucune compétence de la Scorecard. */
export const NO_SCORECARD_SKILL = "aucune";
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

// Complément ajouté au prompt quand la campagne a une Scorecard.
//
// Deux choses s'y jouent. D'abord le rattachement : un critère dit QUELLE
// compétence attendue il vérifie, au lieu qu'on tente de le deviner plus tard en
// rapprochant son libellé du nom d'une compétence. Ensuite la couverture : sans
// cette consigne, le modèle ne produit que des prérequis techniques et
// logistiques, et les compétences relationnelles ou de savoir-être de la
// Scorecard ne sont jamais vérifiées nulle part.
const SCORECARD_ATTACHMENT_RULES = `
Rattachement à la Scorecard :
- scorecard_skill_id : l'identifiant de la compétence attendue que ce critère vérifie, pris dans la liste fournie. Tu ne peux utiliser QUE ces identifiants, tels quels.
- Quand un critère ne vérifie aucune compétence de la liste (disponibilité, prétentions salariales, motivation, contrainte géographique), réponds exactement "${NO_SCORECARD_SKILL}". C'est une réponse normale, pas un échec.
- Une compétence ne peut être rattachée qu'à UN seul critère. Ne découpe pas la même compétence en plusieurs critères.
- Couvre en priorité les compétences non négociables du poste. Mais inclus AUSSI 1 à 2 critères portant sur des compétences relationnelles ou de savoir-être de la Scorecard, à condition qu'un premier entretien puisse réellement les vérifier en demandant un exemple vécu (une collaboration difficile, une priorité renégociée, une décision prise seul).
- Ne rattache jamais un critère à une compétence qu'il ne vérifie pas vraiment, seulement parce que les mots se ressemblent : mieux vaut "${NO_SCORECARD_SKILL}".`;

/**
 * Génère les critères de la grille d'évaluation de screening à partir du
 * cadrage (poste) et du profil candidat. Ce référentiel ne dépend pas de la
 * durée de l'entretien. Lève en cas d'échec ; l'appelant retombe sur la grille statique.
 */
export async function generateScreeningCriteria(
  job: JobSpecContext,
  candidate: CandidateContext,
  scorecard: ScorecardCriterionContext[] = [],
): Promise<ScreeningCriterionSuggestion[]> {
  // Sans Scorecard, le rattachement n'a pas d'objet — et `enum: []` est un
  // schéma invalide, refusé par l'API avant même d'être évalué.
  const withScorecard = scorecard.length > 0;

  const criterionProperties: Record<string, unknown> = {
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
  };
  const required = ["text", "crit"];

  if (withScorecard) {
    // Énumération contrainte aux identifiants réels : le modèle ne PEUT pas en
    // inventer un. La valeur sentinelle fait partie de l'énumération pour que le
    // champ reste requis en mode strict, où un champ optionnel n'existe pas.
    criterionProperties.scorecard_skill_id = {
      type: "string",
      enum: [...scorecard.map((s) => s.id), NO_SCORECARD_SKILL],
    };
    required.push("scorecard_skill_id");
  }

  const scorecardLines = scorecard
    .map((s) => `- [id: ${s.id}] (${s.category}) ${s.name}${s.justification ? ` — ${s.justification}` : ""}`)
    .join("\n");

  const result = await generateStructured<{
    criteria: { text: string; crit: string; scorecard_skill_id?: string }[];
  }>({
    system: withScorecard ? `${SCREENING_GRID_SYSTEM}\n${SCORECARD_ATTACHMENT_RULES}` : SCREENING_GRID_SYSTEM,
    user: withScorecard
      ? `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nCompétences attendues pour le poste :\n${scorecardLines}`
      : `${jobSpecLines(job)}\n\n${candidateLines(candidate)}`,
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
            properties: criterionProperties,
            required,
            additionalProperties: false,
          },
        },
      },
      required: ["criteria"],
      additionalProperties: false,
    },
  });

  // Une compétence ne peut être rattachée qu'à un seul critère : le prompt le
  // demande, ce filtre le garantit. Deux critères sur la même compétence la
  // feraient basculer en « confirmée » sur la foi d'une seule réponse.
  const known = new Set(scorecard.map((s) => s.id));
  const taken = new Set<string>();
  return (result.criteria ?? []).map((c) => {
    const claimed = c.scorecard_skill_id ?? "";
    const skillId = known.has(claimed) && !taken.has(claimed) ? claimed : null;
    if (skillId) taken.add(skillId);
    return { text: c.text, crit: c.crit, skillId };
  });
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
  // Le guide ne pose que des questions : le rattachement à la Scorecard ne lui
  // sert à rien, et l'exiger obligerait l'écran de préparation à le transporter
  // jusqu'ici sans jamais s'en servir.
  criteria: Pick<ScreeningCriterionSuggestion, "text" | "crit">[],
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

// ─── Critères de compétence de l'entretien technique ───────────────────────
//
// Le parcours Topgrading fait raconter des situations vécues, mais ses réponses
// sont des notes libres : rien n'y confirme jamais une compétence attendue. Ce
// bloc ajoute des critères à réponse fermée, rattachés à la Scorecard, pour que
// les compétences relationnelles et de savoir-être puissent enfin être
// documentées par ce que le candidat raconte.
//
// Ce que ces critères peuvent produire : une question et un fait à chercher.
// Rien d'autre. `scorecard_skill_id` est contraint par énumération aux
// identifiants réels : le modèle ne PEUT pas en inventer un.
const TOPGRADING_SKILL_CHECKS_SYSTEM = `Tu es noa, un expert en recrutement spécialiste du Topgrading. En plus du parcours chronologique, tu prépares une courte série de CRITÈRES à réponse fermée portant sur les compétences relationnelles et de savoir-être attendues pour le poste.

Pour chaque critère tu produis :
- scorecard_skill_id : l'identifiant de la compétence attendue que ce critère vérifie, pris dans la liste fournie. Tu ne peux utiliser QUE ces identifiants, tels quels.
- question : UNE question à poser en entretien. Ouverte, au passé, sur une SITUATION RÉELLEMENT VÉCUE par le candidat, et qui demande comment il a procédé. Jamais une question d'opinion, jamais une mise en situation hypothétique (« que feriez-vous si… »), jamais une question à laquelle on répond par oui ou par non.
- fait_attendu : en une phrase, ce que la réponse doit CONTENIR pour que le critère soit validé — un exemple situé dans le temps, le rôle exact du candidat, ce qu'il a fait lui-même, et l'issue. C'est ce fait qui sera cherché dans la transcription, pas une impression générale.

Règles :
- UN seul critère par compétence, CINQ critères au maximum. Mieux vaut trois critères vérifiables que cinq artificiels.
- Ne retiens que les compétences qu'un récit d'expérience peut réellement vérifier. Si une compétence ne s'y prête pas, ne produis pas de critère pour elle : en renvoyer moins est une réponse normale.
- Ancre la question dans le parcours réel du candidat (entreprise, rôle, contexte fournis) quand c'est possible.
- Une déclaration d'intention (« je suis quelqu'un de très collaboratif ») ne vaut pas exemple : la question doit aller chercher un fait.
- N'évalue rien et ne préjuge de rien : tu écris ce qu'il faudra demander, pas ce que le candidat vaut.
- Français, une seule phrase par question, ton professionnel.`;

export type SkillCheckSuggestion = {
  q: string;
  /** mission_skills.id — jamais null : un critère de ce bloc n'existe que pour vérifier une compétence. */
  skillId: string;
  evidence: string;
};

/**
 * Prépare les critères de compétence de l'entretien technique, rattachés à la
 * Scorecard. Lève en cas d'échec ; l'appelant se passe du bloc et l'entretien se
 * déroule comme avant.
 */
export async function generateTopgradingSkillChecks(input: {
  job: JobSpecContext;
  candidate: CandidateContext;
  scorecard: ScorecardCriterionContext[];
}): Promise<SkillCheckSuggestion[]> {
  // Sans compétence à vérifier, rien à préparer — et `enum: []` est un schéma
  // invalide, refusé par l'API avant même d'être évalué.
  if (input.scorecard.length === 0) return [];

  const skillsText = input.scorecard
    .map((s) => `- [id: ${s.id}] (${s.category}) ${s.name}${s.justification ? ` — ${s.justification}` : ""}`)
    .join("\n");
  const user = `${jobSpecLines(input.job)}\n\n${candidateLines(input.candidate)}\n\nCompétences attendues à vérifier :\n${skillsText}`;

  const result = await generateStructured<{
    criteria: { scorecard_skill_id: string; question: string; fait_attendu: string }[];
  }>({
    system: TOPGRADING_SKILL_CHECKS_SYSTEM,
    user,
    toolName: "proposer_criteres_competences",
    toolDescription: "Enregistre les critères de compétence à vérifier par un exemple vécu.",
    maxTokens: 2048,
    schema: {
      type: "object",
      properties: {
        criteria: {
          // Pas de `maxItems` : refusé par le schéma d'outil strict d'Anthropic
          // sur un tableau (400). Le plafond de cinq vit dans le prompt, et
          // devient certain côté serveur (mergeSkillChecks).
          type: "array",
          items: {
            type: "object",
            properties: {
              scorecard_skill_id: { type: "string", enum: input.scorecard.map((s) => s.id) },
              question: { type: "string" },
              fait_attendu: { type: "string" },
            },
            required: ["scorecard_skill_id", "question", "fait_attendu"],
            additionalProperties: false,
          },
        },
      },
      required: ["criteria"],
      additionalProperties: false,
    },
  });

  const known = new Set(input.scorecard.map((s) => s.id));
  const taken = new Set<string>();
  const kept: SkillCheckSuggestion[] = [];
  for (const c of result.criteria ?? []) {
    const skillId = c.scorecard_skill_id ?? "";
    if (!known.has(skillId) || taken.has(skillId)) continue;
    taken.add(skillId);
    kept.push({ skillId, q: stripFieldTags(c.question ?? ""), evidence: stripFieldTags(c.fait_attendu ?? "") });
  }
  return kept;
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

const SKILL_CHECK_EVAL_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la transcription d'un entretien et d'une liste de critères, tu détermines pour CHAQUE critère si ce que le candidat a RACONTÉ le valide.

Ce qui vaut validation, et rien d'autre : un exemple vécu, situé (quand, où, avec qui), dans lequel le candidat dit ce qu'IL a fait, et ce que cela a produit.

Règles :
- "Oui" : le candidat raconte une situation précise qu'il a vécue, avec son rôle et l'issue, et cette situation correspond au fait attendu.
- "Partiel" : il aborde le sujet mais reste général, parle au nom de l'équipe sans dire ce qu'il a fait lui-même, ne situe pas l'exemple, ou l'exemple ne correspond qu'en partie au fait attendu.
- "Non" : le sujet n'est pas abordé, ou le candidat se contente d'affirmer une qualité (« je suis quelqu'un de très collaboratif ») sans exemple, ou ce qu'il raconte contredit le fait attendu.
- Une intention, une opinion, une réponse à une mise en situation hypothétique ne valent JAMAIS "Oui" : ce ne sont pas des faits vécus.
- Base-toi UNIQUEMENT sur la transcription. N'invente rien, ne complète rien par ce que le profil laisse supposer.
- Réponds pour TOUS les critères fournis, sans exception.`;

/**
 * Rend un verdict fermé sur chaque critère de compétence, à partir du seul récit
 * du candidat.
 *
 * La signature ne prend NI identifiant de compétence, NI hypothèse formulée
 * avant l'entretien : le verdict porte sur ce qui a été raconté, et il n'existe
 * aucun canal par lequel une déclaration antérieure pourrait l'influencer. C'est
 * une garantie de structure, pas une consigne de prompt.
 *
 * Lève en cas d'échec ; l'appelant décide du repli.
 */
export async function evaluateTopgradingSkillChecks(
  criteria: { id: string; q: string; evidence?: string }[],
  transcript: string,
  job: JobSpecContext,
  candidate: CandidateContext,
): Promise<Record<string, "Oui" | "Partiel" | "Non">> {
  if (criteria.length === 0) return {};

  const criteriaText = criteria
    .map((c) => `- [${c.id}] ${c.q}${c.evidence ? `\n  Fait attendu : ${c.evidence}` : ""}`)
    .join("\n");
  const user = `${jobSpecLines(job)}\n\n${candidateLines(candidate)}\n\nCritères à évaluer (tous, sans exception) :\n${criteriaText}\n\nTranscription de l'entretien :\n${transcript}`;

  const result = await generateStructured<{ evaluations: { id: string; answer: "Oui" | "Partiel" | "Non" }[] }>({
    system: SKILL_CHECK_EVAL_SYSTEM,
    user,
    toolName: "evaluer_criteres_competences",
    toolDescription: "Enregistre le verdict de chaque critère de compétence.",
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

  const known = new Set(criteria.map((c) => c.id));
  const verdicts: Record<string, "Oui" | "Partiel" | "Non"> = {};
  for (const ev of result.evaluations ?? []) {
    if (known.has(ev.id)) verdicts[ev.id] = ev.answer;
  }
  return verdicts;
}

// ─── Synthèse post-entretien (D, partagée screening + topgrading) ───────────
const SYNTHESIS_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la grille d'entretien remplie par le recruteur (et, si elle est fournie, de la transcription de l'entretien), du poste et du profil du candidat, tu rédiges une SYNTHÈSE d'aide à la décision.

Règles :
- Si une transcription est fournie, appuie-toi en priorité sur les propos réels du candidat qu'elle contient ; la grille reste le fil conducteur des critères évalués.
- content : 3 à 5 phrases synthétisant la performance du candidat sur les critères évalués (points forts, points de vigilance, adéquation avec le poste). Factuel, appuyé sur la grille et la transcription le cas échéant.
- advice : 1 à 2 phrases de recommandation claire pour la décision (poursuivre, approfondir un point précis, écarter), avec la raison.
- N'invente aucun fait absent de la grille remplie et de la transcription. Français, ton professionnel et direct.`;

// Le modèle referme parfois un champ par une pseudo-balise (`</advice>`) dans le
// texte lui-même. On ne retire que ces balises de champ, connues : un filtre plus
// large sur `<...>` abîmerait du texte légitime (« CA < 10M », « <5 ans »).
const FIELD_TAG = /<\/?(?:advice|content|synthese|synthesis|answer|reponse)>/gi;

function stripFieldTags(text: string): string {
  return text.replace(FIELD_TAG, "").trim();
}

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

  const result = await generateStructured<{ content: string; advice: string }>({
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

  return {
    content: stripFieldTags(result.content ?? ""),
    advice: stripFieldTags(result.advice ?? ""),
  };
}

// ─── Recommandation globale (page Décision finale) ─────────────────────────
// Les 3 valeurs de verdict sont contraintes par schéma (enum) plutôt que
// dérivées d'un texte libre : l'UI mappe directement la valeur à un badge de
// couleur, sans regex/heuristique fragile sur le texte généré.
const FINAL_RECOMMENDATION_VERDICTS = [
  "Recommandation : recruter",
  "Recommandation : à discuter",
  "Recommandation : écarter",
] as const;
export type FinalRecommendationVerdict = (typeof FINAL_RECOMMENDATION_VERDICTS)[number];

const FINAL_RECOMMENDATION_SYSTEM = `Tu es noa, un expert en recrutement. À partir de la campagne de recrutement, du profil du candidat, des synthèses de Screening et de Topgrading et de la note globale, tu formules une RECOMMANDATION GLOBALE pour aider le recruteur à trancher.

Règles :
- content : 2 à 4 phrases maximum. Croise l'adéquation au poste, les points forts et points de vigilance des deux entretiens, et la note globale. Direct et factuel, pas de round de négociation.
- advice : le verdict, parmi les valeurs autorisées uniquement.
- Ne recommande jamais sur la seule note chiffrée : croise-la avec le contenu qualitatif des synthèses. Si une étape n'a pas encore eu lieu, dis-le explicitement plutôt que de l'ignorer.
- N'invente aucun fait absent des informations fournies. Français, ton professionnel et direct.`;

/**
 * Recommandation globale de fin de process, croisant mission + profil +
 * synthèses des deux entretiens + score. Lève en cas d'échec ; l'appelant
 * décide du repli (pas de fallback rule-based : la page peut simplement ne
 * pas afficher de suggestion).
 */
export async function generateFinalRecommendation(input: {
  job: JobSpecContext;
  candidate: CandidateContext;
  score: number | null;
  screeningSynthesis: { content: string; advice: string } | null;
  topgradingSynthesis: { content: string; advice: string } | null;
}): Promise<{ content: string; advice: FinalRecommendationVerdict }> {
  const stageBlock = (label: string, s: { content: string; advice: string } | null) =>
    s ? `${label} :\n${s.content}\nConseil noté à l'époque : ${s.advice}` : `${label} : (pas encore réalisé)`;

  const user = `${jobSpecLines(input.job)}

${candidateLines(input.candidate)}

${stageBlock("Synthèse Screening", input.screeningSynthesis)}

${stageBlock("Synthèse Topgrading", input.topgradingSynthesis)}

Note globale : ${input.score !== null ? `${input.score}/100` : "(pas encore calculée)"}`;

  const result = await generateStructured<{ content: string; advice: FinalRecommendationVerdict }>({
    system: FINAL_RECOMMENDATION_SYSTEM,
    user,
    toolName: "enregistrer_recommandation_finale",
    toolDescription: "Enregistre la recommandation globale (content) et le verdict (advice).",
    maxTokens: 1024,
    schema: {
      type: "object",
      properties: {
        content: { type: "string" },
        advice: { type: "string", enum: [...FINAL_RECOMMENDATION_VERDICTS] },
      },
      required: ["content", "advice"],
      additionalProperties: false,
    },
  });

  return {
    content: stripFieldTags(result.content ?? ""),
    advice: result.advice,
  };
}

// ─── Sujets à approfondir, dérivés des préférences de travail ──────────────
//
// Ce que cette génération peut produire : une hypothèse, la raison de
// l'approfondir, une question comportementale. Rien d'autre.
//
// Ce qu'elle ne peut pas produire, structurellement et pas seulement par
// consigne : le schéma d'outil est en `strict` avec `additionalProperties:
// false`, donc un champ hors schéma — un score, une recommandation, une
// probabilité — ne serait pas ignoré, il rendrait l'appel invalide. Et
// `skillId` est contraint par énumération aux identifiants réels de la
// Scorecard : le modèle ne PEUT pas en inventer un.
//
// La garantie finale reste côté serveur (lib/noa/preferences/briefing.ts,
// keepGroundedTopics) : un schéma est une demande, pas une preuve.

const PREFERENCE_TOPICS_SYSTEM = `Tu es noa. Tu aides un recruteur à préparer un entretien technique (méthode Topgrading). Tu ne l'évalues pas, et tu ne décides de rien.

On te donne trois choses :
1. La Scorecard du poste : la liste EXACTE des compétences attendues, chacune avec un identifiant.
2. Les préférences de travail que la personne a décrites elle-même, avant l'entretien, sous forme de phrases déjà rédigées.
3. Ce que le premier entretien a établi, s'il a eu lieu.

Tu produis des SUJETS À APPROFONDIR : des points précis que le recruteur ira vérifier PAR DES FAITS pendant l'entretien.

Chaque sujet comporte :
- scorecard_skill_id : l'identifiant d'une compétence de la liste fournie. Tu ne peux utiliser QUE ces identifiants, tels quels, aucun autre.
- dimension : la préférence de travail d'où vient l'hypothèse, parmi structure, autonomy, interaction, initiative, change, feedback.
- hypothesis : une hypothèse de travail, au conditionnel, qui relie une préférence décrite à cette compétence. Formule-la TOUJOURS comme une préférence (« apprécie disposer de repères au démarrage »), jamais comme une caractéristique de la personne.
- rationale : une phrase qui dit d'où vient l'hypothèse et pourquoi elle touche CETTE compétence précise.
- question : UNE question comportementale à poser. Ouverte, au passé, sur une situation réellement vécue, et qui demande comment la personne a procédé.

Règles :
- Une préférence n'est JAMAIS une preuve, ni en faveur ni en défaveur. Elle ne dit rien du niveau de compétence. Elle sert uniquement à choisir OÙ creuser.
- Ne relie une préférence à une compétence que si cette compétence met en jeu une manière de travailler : autonomie, cadre, coordination, rythme, prise d'initiative, adaptation au changement, retours. Ne fabrique jamais un lien : « apprécie des échanges réguliers » ne dit rien d'une maîtrise technique.
- Trois sujets au maximum, un seul par compétence. Mieux vaut un seul sujet utile que trois artificiels.
- S'il n'existe aucun lien solide entre les préférences fournies et les compétences de la Scorecard, renvoie une liste VIDE. C'est une réponse acceptable, et souvent la bonne.
- Français, phrases courtes, ton professionnel. Pas de préambule, pas de titre.

INTERDICTIONS ABSOLUES. Tu ne dois jamais :
- produire une note, un score, un pourcentage, un niveau d'adéquation, une probabilité de réussite ou de succès, ni aucune valeur chiffrée sur la personne ;
- recommander de recruter, d'écarter, de poursuivre ou d'arrêter, ni évoquer une décision, une embauche ou une période d'essai ;
- qualifier la personne (« manque d'autonomie », « bon profil », « profil à risque ») : tu décris au conditionnel une préférence qu'elle a elle-même déclarée ;
- employer les mots « personnalité », « trait de caractère », « profil comportemental », « profil psychologique », « test psychométrique », « analyse de personnalité ». Tu dis « préférences de travail » et « manière de travailler » ;
- évoquer un état de santé, un risque psychologique, ou une caractéristique protégée (âge, genre, origine, situation familiale, handicap, convictions) ;
- inventer un fait absent des informations fournies, ni un identifiant absent de la Scorecard.

L'évaluation appartient au recruteur, à partir de ce que le candidat racontera.

Exemple de ce qui est attendu — compétence « Autonomie sur un périmètre produit », préférence déclarée « Apprécie des repères et validations régulières » :
- hypothesis : « Les préférences déclarées suggèrent que la personne apprécie disposer de repères au démarrage. »
- rationale : « L'autonomie est attendue sur ce poste : il vaut la peine de vérifier comment elle fonctionne lorsqu'elle doit avancer avec peu de directives. »
- question : « Parlez-moi d'une situation dans laquelle vous avez dû avancer sans disposer de toutes les consignes au départ. Comment avez-vous procédé ? »

Exemples de ce qui est proscrit :
- « La personne manque d'autonomie. » — c'est un verdict, et cela prend une préférence pour une preuve.
- Relier « apprécie des retours réguliers » à une compétence « Optimisation PostgreSQL ». — aucun lien réel ; ne produis rien plutôt que d'inventer.
- « Adéquation estimée : 70 %. » — aucune valeur chiffrée, jamais.`;

export type ScorecardCriterionContext = {
  /** mission_skills.id : l'identifiant RÉEL, celui que le modèle doit citer. */
  id: string;
  category: string;
  name: string;
  justification: string | null;
};

export type PreferenceTopicSuggestion = {
  scorecard_skill_id: string;
  dimension: string;
  hypothesis: string;
  rationale: string;
  question: string;
};

/**
 * Propose des sujets à approfondir à partir de la Scorecard, des préférences
 * déclarées et de ce que le premier entretien a établi.
 *
 * Aucun score n'entre ici et aucun n'en sort : le modèle ne reçoit que des
 * phrases déjà rédigées (PREFERENCE_LABEL), jamais une moyenne, un écart-type
 * ni une orientation brute. Lève en cas d'échec — l'appelant n'affiche alors
 * aucun sujet et la préparation continue.
 */
export async function generatePreferenceTopics(input: {
  job: JobSpecContext;
  candidate: CandidateContext;
  scorecard: ScorecardCriterionContext[];
  preferences: { dimension: string; label: string }[];
  screeningSynthesis: string | null;
}): Promise<PreferenceTopicSuggestion[]> {
  // Sans compétence, aucun ancrage possible — et `enum: []` est un schéma
  // invalide (400). Sans préférence nette, il n'y a rien à relier. Dans les
  // deux cas on n'appelle pas le modèle.
  if (input.scorecard.length === 0 || input.preferences.length === 0) return [];

  const user = `${jobSpecLines(input.job)}

${candidateLines(input.candidate)}

Compétences de la Scorecard (utilise UNIQUEMENT ces identifiants) :
${input.scorecard
  .map((s) => `- [id: ${s.id}] (${s.category}) ${s.name}${s.justification ? ` — ${s.justification}` : ""}`)
  .join("\n")}

Préférences de travail décrites par la personne :
${input.preferences.map((p) => `- [${p.dimension}] ${p.label}`).join("\n")}

Ce que le premier entretien a établi :
${input.screeningSynthesis || "(premier entretien pas encore synthétisé)"}`;

  const result = await generateStructured<{ topics: PreferenceTopicSuggestion[] }>({
    system: PREFERENCE_TOPICS_SYSTEM,
    user,
    toolName: "proposer_sujets_a_approfondir",
    toolDescription: "Enregistre les sujets à approfondir, chacun rattaché à une compétence de la Scorecard.",
    maxTokens: 1536,
    schema: {
      type: "object",
      properties: {
        topics: {
          // Pas de `maxItems` : le schéma d'outil strict d'Anthropic le rejette
          // sur un tableau (400). La limite de trois vit dans le prompt, et
          // devient certaine côté serveur (keepGroundedTopics).
          type: "array",
          items: {
            type: "object",
            properties: {
              scorecard_skill_id: { type: "string", enum: input.scorecard.map((s) => s.id) },
              dimension: {
                type: "string",
                enum: ["structure", "autonomy", "interaction", "initiative", "change", "feedback"],
              },
              hypothesis: { type: "string" },
              rationale: { type: "string" },
              question: { type: "string" },
            },
            required: ["scorecard_skill_id", "dimension", "hypothesis", "rationale", "question"],
            additionalProperties: false,
          },
        },
      },
      required: ["topics"],
      additionalProperties: false,
    },
  });

  return (result.topics ?? []).map((t) => ({
    scorecard_skill_id: t.scorecard_skill_id,
    dimension: t.dimension,
    hypothesis: stripFieldTags(t.hypothesis ?? ""),
    rationale: stripFieldTags(t.rationale ?? ""),
    question: stripFieldTags(t.question ?? ""),
  }));
}

// ─── Question libre sur l'entretien (page Synthèse) ─────────────────────────
const QUESTION_SYSTEM = `Tu es noa, un expert en recrutement. Le recruteur te pose une question sur un entretien qu'il vient de mener. Tu réponds à partir de la transcription de cet entretien, croisée avec le poste et le profil du candidat.

Règles :
- Réponds en 1 à 3 phrases maximum : court et synthétique, le recruteur survole. Pas de préambule ("D'après la transcription...", "Voici..."), pas de titre, pas de liste à puces sauf si la question demande explicitement une énumération (ex : "les 3 points forts") — dans ce cas, une ligne par élément, sans autre développement.
- Appuie-toi sur les propos réels du candidat dans la transcription. Cite-les brièvement entre guillemets quand la question porte sur ce qu'il a dit exactement.
- N'invente rien. Si la transcription ne permet pas de répondre, dis-le en une phrase (ex : « Ce point n'a pas été abordé pendant l'entretien. ») plutôt que de spéculer.
- Reste factuel : tu rapportes et synthétises, la décision appartient au recruteur.
- Français, ton professionnel et direct.`;

/**
 * Répond à une question libre du recruteur sur un entretien, à partir de la
 * transcription. Lève en cas d'échec ; l'appelant affiche un disclaimer (il n'y
 * a pas de repli possible, la réponse ne peut venir que du modèle).
 */
export async function answerInterviewQuestion(input: {
  type: "screening" | "topgrading";
  question: string;
  transcript: string;
  job: JobSpecContext;
  candidate: CandidateContext;
}): Promise<string> {
  const stepLabel = input.type === "screening" ? "Screening" : "Topgrading";
  const user = `Type d'entretien : ${stepLabel}
${jobSpecLines(input.job)}

${candidateLines(input.candidate)}

Transcription de l'entretien (collée par le recruteur depuis un outil externe) :
${input.transcript.trim()}

Question du recruteur :
${input.question.trim()}`;

  const result = await generateStructured<{ answer: string }>({
    system: QUESTION_SYSTEM,
    user,
    toolName: "repondre_question",
    toolDescription: "Enregistre la réponse courte à la question du recruteur.",
    maxTokens: 512,
    schema: {
      type: "object",
      properties: {
        answer: { type: "string" },
      },
      required: ["answer"],
      additionalProperties: false,
    },
  });

  return stripFieldTags(result.answer ?? "");
}

// Signal marché (article d'un flux RSS ingéré dans skills_signals) utilisé
// pour contextualiser generateSkillSuggestions ci-dessus.
export type ScorecardSignalContext = {
  sourceName: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string | null;
};
