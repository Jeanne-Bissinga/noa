import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { computeAggregateScore } from "@/lib/noa/score";
import { NOTICE_PARAGRAPHS, NOTICE_TITLE, NOTICE_VERSION, PRIVACY_PATH } from "@/lib/noa/preferences/information-notice";

// Ce que les préférences de travail ne doivent JAMAIS pouvoir faire.
//
// Ces garanties ne peuvent pas s'écrire comme des tests de fonctions pures :
// ce qu'elles vérifient, c'est une ABSENCE de lien entre des modules. On les
// lit donc dans le source, comme le faisait déjà errors.test.ts — les tests
// tournent sous environment: "node", sans DOM ni bibliothèque de rendu.

const ROOT = path.resolve(__dirname, "../..");
const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

/** Fichiers d'interface qui montrent des préférences à un utilisateur. */
const UI_FILES = [
  "app/candidats/[id]/preferences/preferences-step-card.tsx",
  "app/candidats/[id]/preferences/invite-modal.tsx",
  "app/candidats/[id]/preparation/preferences-view.tsx",
  "app/candidats/[id]/synthese/preferences-signal.tsx",
  "app/integration/preferences/[token]/preferences-flow.tsx",
  "app/integration/preferences/[token]/page.tsx",
  "app/integration/preferences/[token]/thank-you.tsx",
  "lib/noa/preferences/information-notice.ts",
  "lib/noa/preferences/emails.ts",
];

// ─── La note ne connaît pas les préférences ─────────────────────────────────

describe("candidates.score", () => {
  it("se calcule à partir des deux grilles, et de rien d'autre", () => {
    expect(computeAggregateScore.length).toBe(2);
    const source = read("lib/noa/score.ts");
    expect(source).not.toMatch(/pr[ée]f[ée]renc|work_preferences|questionnaire|briefing|disc|mbti|big_five/i);
  });

  it("ne bouge pas selon qu'un candidat a répondu ou non", () => {
    // La garantie est structurelle — la fonction n'a aucun paramètre par où
    // une préférence entrerait — mais l'écrire noir sur blanc rend l'intention
    // visible à qui voudrait ajouter un troisième argument.
    const grids = {
      screening: { criteria: [{ id: "1", q: "A" }, { id: "2", q: "B" }], answers: { "1": "Oui", "2": "Non" } },
      topgrading: null,
    };
    expect(computeAggregateScore(grids.screening, grids.topgrading)).toBe(50);
  });

  it("n'est jamais écrit depuis un module de préférences", () => {
    for (const file of walk(path.join(ROOT, "lib/noa/preferences"))) {
      const content = readFileSync(file, "utf8");
      const relative = path.relative(ROOT, file);
      expect(content, relative).not.toContain("computeAggregateScore");
      expect(content, relative).not.toMatch(/from\("candidates"\)[\s\S]{0,80}\.update/);
      expect(content, relative).not.toMatch(/\bscore\s*:/);
      expect(content, relative).not.toContain('from("decisions")');
      expect(content, relative).not.toContain("decideFinal");
      expect(content, relative).not.toContain("generateFinalRecommendation");
    }
  });
});

describe("la décision", () => {
  it("ne reçoit aucune préférence", () => {
    const actions = read("app/candidats/[id]/actions.ts");
    const decideFinal = actions.slice(actions.indexOf("export async function decideFinal"));
    const body = decideFinal.slice(0, decideFinal.indexOf("\n}\n") + 3);
    expect(body).not.toMatch(/pr[ée]f[ée]renc|briefing|work_preferences/i);

    for (const file of ["app/candidats/[id]/decision-finale/page.tsx", "app/candidats/[id]/decision-finale/final-decision-view.tsx"]) {
      expect(read(file), file).not.toMatch(/pr[ée]f[ée]renc|briefing|work_preferences/i);
    }
  });

  it("garde une recommandation globale aveugle aux préférences", () => {
    const ai = read("lib/noa/ai.ts");
    const start = ai.indexOf("const FINAL_RECOMMENDATION_SYSTEM");
    const end = ai.indexOf("// ─── Sujets à approfondir");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(ai.slice(start, end)).not.toMatch(/pr[ée]f[ée]renc|questionnaire|briefing|sujet à approfondir/i);
  });
});

// ─── Ce que l'IA ne peut pas produire ───────────────────────────────────────

describe("génération des sujets à approfondir", () => {
  const ai = () => read("lib/noa/ai.ts");

  it("n'expose aucun champ de scoring ou de recommandation", () => {
    for (const forbidden of [
      "personality_score",
      "candidate_fit_score",
      "hire_recommendation",
      "reject_recommendation",
      "probability_of_success",
      "fit_score",
    ]) {
      expect(ai(), forbidden).not.toContain(forbidden);
    }
  });

  it("ferme le schéma et contraint l'identifiant de compétence", () => {
    const source = ai();
    const start = source.indexOf("export async function generatePreferenceTopics");
    const block = source.slice(start, source.indexOf("// ─── Question libre", start));
    // `additionalProperties: false` : un champ hors schéma ne serait pas
    // ignoré, il rendrait l'appel invalide.
    expect(block).toContain("additionalProperties: false");
    // L'énumération empêche le modèle d'inventer une compétence.
    expect(block).toMatch(/scorecard_skill_id:\s*\{\s*type:\s*"string",\s*enum:/);
    // `maxItems` provoque un 400 sur un schéma strict : la limite vit dans le
    // prompt et dans keepGroundedTopics. C'est la clé de schéma qui est
    // proscrite, pas le mot — le commentaire du code l'emploie pour l'expliquer.
    expect(block).not.toMatch(/maxItems\s*:/);
    // Sans compétence, pas d'appel : `enum: []` est un schéma invalide.
    expect(block).toContain("input.scorecard.length === 0");
  });

  it("porte les interdictions dans le prompt système", () => {
    const source = ai();
    const prompt = source.slice(
      source.indexOf("const PREFERENCE_TOPICS_SYSTEM"),
      source.indexOf("export type ScorecardCriterionContext"),
    );
    for (const clause of [
      "INTERDICTIONS ABSOLUES",
      "probabilité de réussite",
      "personnalité",
      "renvoie une liste VIDE",
      "Tu ne peux utiliser QUE ces identifiants",
      "JAMAIS une preuve",
    ]) {
      expect(prompt, clause).toContain(clause);
    }
  });

  it("valide la réponse du modèle côté serveur avant de l'afficher", () => {
    const briefing = read("app/candidats/[id]/preferences/briefing-actions.ts");
    expect(briefing).toContain("keepGroundedTopics(");
    // Échec IA : liste vide, et la préparation continue.
    expect(briefing).toMatch(/catch[\s\S]{0,400}return \[\]/);
  });
});

// ─── L'étape ne bloque rien ─────────────────────────────────────────────────

describe("étape non bloquante", () => {
  it("laisse préparer l'entretien technique sans préférences", () => {
    const page = read("app/candidats/[id]/preparation/page.tsx");
    expect(page).not.toContain("redirect(");
    // La seule sortie anticipée porte sur le candidat et le type d'étape.
    expect(page.match(/notFound\(\)/g) ?? []).toHaveLength(2);
    // Les sections ne sont rendues que s'il y a quelque chose à dire.
    expect(page).toMatch(/guidance\.length > 0 \|\| topics\.length > 0/);
  });

  it("ne conditionne aucun bouton du parcours à l'état des préférences", () => {
    for (const file of ["app/candidats/[id]/candidate-frise.tsx", "app/candidats/[id]/preparation/preparation-view.tsx"]) {
      const content = read(file);
      expect(content, file).not.toMatch(/disabled=\{[^}]*(preference|briefing|guidance)/i);
    }
  });

  it("le dit à l'écran tant que la réponse n'est pas arrivée", () => {
    const card = read("app/candidats/[id]/preferences/preferences-step-card.tsx");
    expect(card).toContain("Facultatif.");
    expect(card).toMatch(/sans attendre cette\s*\n?\s*réponse/);
    // ...et cesse de le dire une fois complété : la phrase n'apprendrait plus
    // rien. Elle vit donc dans la branche `!complete` du ternaire de statut.
    const apresComplete = card.slice(card.indexOf("{complete ? ("));
    const branches = apresComplete.slice(0, apresComplete.indexOf("{status === \"invite\""));
    const [siComplete, siPasComplete] = branches.split(") : (");
    expect(siComplete).not.toContain("Facultatif.");
    expect(siPasComplete).toContain("Facultatif.");
  });
});

// ─── Un seul chemin vers la préparation ─────────────────────────────────────

describe("carte « Préférences de travail »", () => {
  const card = () => read("app/candidats/[id]/preferences/preferences-step-card.tsx");

  it("ne navigue nulle part", () => {
    // Elle a porté un « Voir les conseils pour l'échange » qui menait à la même
    // page que « Préparer l'entretien » dans la frise. Deux libellés pour une
    // seule destination se lisent comme deux actions différentes : la
    // navigation appartient au seul CTA de la frise.
    //
    // L'assertion porte sur le CODE : l'en-tête du composant nomme le bouton
    // retiré pour expliquer pourquoi il l'est, et doit pouvoir le faire.
    const code = card()
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("//"))
      .join("\n");
    expect(code).not.toContain("LinkBtn");
    expect(code).not.toContain("href=");
    expect(code).not.toContain("/preparation");
    expect(code).not.toContain("Voir les conseils");
  });

  it("montre les conseils sur place", () => {
    const content = card();
    expect(content).toContain("Pour votre échange avec");
    expect(content).toContain("guidanceSourceLine");
    expect(content).toContain("item.action");
    // Aucun dépliage : le plafond global est déjà de 4, tout tient à l'écran.
    expect(content).not.toMatch(/Afficher tous les conseils|slice\(0, 3\)/);
  });

  it("n'affiche jamais l'étiquette brute d'un test déclaré", () => {
    const content = card();
    for (const interdit of [
      "formatDisc",
      "context.type",
      "BIG_FIVE_LEVEL_LABEL",
      "BIG_FIVE_TRAIT_LABEL",
      "highlightPreferences",
      "contextSourceLabel",
    ]) {
      expect(content, interdit).not.toContain(interdit);
    }
  });

  it("garde la règle de non-évaluation sous les conseils", () => {
    // Le texte vit dans GUIDANCE_FOOTNOTE, vérifié au mot près dans
    // preferences-communication.test.ts : ici on s'assure que la carte l'affiche.
    expect(card()).toContain("{GUIDANCE_FOOTNOTE}");
  });

  it("prévient que rien de tout cela ne s'affichera pendant l'entretien", () => {
    // L'écran d'entretien ne montre que la grille et le guide : c'est voulu,
    // aucune lecture de préférences ne doit rester sous les yeux au moment
    // d'évaluer. Mais une question suggérée non recopiée dans le guide ne sera
    // plus là quand il faudra la poser — le recruteur doit le savoir tant qu'il
    // peut encore agir, c'est-à-dire sur la page de préparation.
    const view = read("app/candidats/[id]/preparation/preferences-view.tsx");
    expect(view).toContain("ne s&apos;affichent pas pendant l&apos;entretien");
    expect(view).toContain("Recopiez dans le guide");
  });

  it("ne répète pas la précaution sur chaque puce", () => {
    // Chaque conseil a commencé par « Le résultat déclaré peut suggérer… ».
    // Répété quatre fois, ce préambule masquait le conseil. La prudence est
    // désormais dite une seule fois, dans la ligne de source.
    for (const file of [
      "app/candidats/[id]/preferences/preferences-step-card.tsx",
      "app/candidats/[id]/preparation/preferences-view.tsx",
    ]) {
      const code = read(file)
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("//"))
        .join("\n");
      expect(code, file).not.toContain("peut suggérer");
      expect(code, file).not.toContain("item.suggests");
    }
  });

  it("ne redit pas ce que le titre et le statut disent déjà", () => {
    // « Thomas a partagé des informations sur ses préférences de travail » sous
    // un titre « Préférences de travail » marqué « Complétées » : la phrase
    // n'apprenait rien.
    expect(card()).not.toContain("a partagé des informations");
  });

  it("n'a plus de carte de résultat brut", () => {
    expect(existsSync(path.join(ROOT, "app/candidats/[id]/preferences/preferences-result.tsx"))).toBe(false);
  });
});

// ─── Vocabulaire ────────────────────────────────────────────────────────────

describe("vocabulaire visible par un humain", () => {
  it("ne présente jamais le questionnaire comme un test de personnalité", () => {
    for (const file of UI_FILES) {
      expect(read(file).toLowerCase(), file).not.toMatch(
        /test de personnalité|test psychométrique|test de soft skills|profil comportemental|profil psychologique|analyse de personnalité/,
      );
    }
  });

  it("n'affiche aucun score brut ni code de profil", () => {
    // « Autonomie 1.8 » ou « DISC C/S » n'aident personne à mener un entretien.
    for (const file of [
      "app/candidats/[id]/preparation/preferences-view.tsx",
      "app/candidats/[id]/synthese/preferences-signal.tsx",
      "app/candidats/[id]/preferences/preferences-step-card.tsx",
    ]) {
      const content = read(file);
      expect(content, file).not.toMatch(/\.mean\b|standardDeviation|DIMENSION_LABEL|formatDisc/);
    }
  });

  it("emploie les formulations retenues", () => {
    const prep = read("app/candidats/[id]/preparation/preferences-view.tsx");
    expect(prep).toContain("Pour votre échange avec");
    expect(prep).toContain("Sujet à approfondir");
    expect(prep).toContain("À vérifier par un exemple concret");
    expect(prep).toContain("Attendu pour le poste");
  });

  it("rattache chaque sujet affiché à une compétence nommée", () => {
    expect(read("app/candidats/[id]/preparation/preferences-view.tsx")).toContain("topic.skillName");
    expect(read("app/candidats/[id]/synthese/preferences-signal.tsx")).toContain("topic.skillName");
  });
});

// ─── Information du candidat ────────────────────────────────────────────────

describe("texte d'information", () => {
  it("dit pourquoi, et ce qui ne sera pas décidé", () => {
    expect(NOTICE_TITLE).toBe("Pourquoi ces informations ?");
    expect(NOTICE_PARAGRAPHS.length).toBeGreaterThan(0);
    const whole = NOTICE_PARAGRAPHS.join(" ");
    expect(whole).toContain("préparer les prochains échanges");
    expect(whole).toContain("ne déterminent pas automatiquement l'issue de votre candidature");
    expect(whole).toContain("compétences attendues pour le poste");
  });

  it("s'affiche avant toute question, avec le lien de confidentialité", () => {
    const flow = read("app/integration/preferences/[token]/preferences-flow.tsx");
    expect(flow).toContain("NOTICE_TITLE");
    expect(flow).toContain("NOTICE_PARAGRAPHS");
    expect(flow).toContain("PRIVACY_PATH");
    expect(PRIVACY_PATH).toBe("/confidentialite");
    // La route est publique : le lien doit s'ouvrir sans session.
    expect(read("lib/supabase/proxy.ts")).toContain("'/confidentialite'");
  });

  it("n'est pas un consentement, et ne se fait pas passer pour tel", () => {
    // Pas de case à cocher : elle ne constituerait pas à elle seule la base
    // juridique du traitement, et la présenter ainsi serait faux.
    for (const file of ["app/integration/preferences/[token]/preferences-flow.tsx", "app/integration/preferences/[token]/page.tsx"]) {
      expect(read(file), file).not.toContain('type="checkbox"');
    }
    // Aucun identifiant, champ ni colonne ne s'appelle « consent ». Le mot
    // reste permis en prose française : les commentaires expliquent justement
    // pourquoi ce n'en est pas un, et leur interdire le mot rendrait
    // l'explication impossible à écrire.
    const identifier = /\bconsent[A-Za-z_]*\s*[:=(]|_consent|consent_/i;
    for (const file of [
      ...walk(path.join(ROOT, "lib/noa/preferences")),
      ...walk(path.join(ROOT, "app/integration")),
    ]) {
      const code = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("//") && !line.trimStart().startsWith("*"))
        .join("\n");
      expect(code, path.relative(ROOT, file)).not.toMatch(identifier);
    }
    const sqlCode = read("scripts/018_preferences_recrutement.sql")
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    expect(sqlCode).not.toMatch(/consent/i);
  });

  it("est versionné, et la version vient du serveur", () => {
    expect(NOTICE_VERSION).toMatch(/^\d{4}-\d{2}-v\d+$/);
    const page = read("app/integration/preferences/[token]/page.tsx");
    expect(page).toContain("NOTICE_VERSION");
    // Le navigateur n'a pas voix au chapitre sur ce qui est horodaté.
    expect(read("lib/noa/preferences/tokens.ts")).toMatch(/recordNoticeShown\(preferencesId: string, version: string\)/);
  });
});

// ─── Portée des données ─────────────────────────────────────────────────────

describe("portée des données", () => {
  it("lit les préférences du manager sous RLS, jamais en service_role", () => {
    const queries = read("lib/noa/preferences/queries.ts");
    expect(queries).toContain('from "@/lib/supabase/server"');
    expect(queries).not.toContain("createAdminClient");
  });

  it("réserve le client service_role à la résolution du lien public", () => {
    const admins = walk(path.join(ROOT, "lib/noa/preferences"))
      .filter((f) => readFileSync(f, "utf8").includes("createAdminClient"))
      .map((f) => path.basename(f));
    expect(admins).toEqual(["tokens.ts"]);
  });

  it("garde la page publique hors de la section authentifiée", () => {
    // Le singulier est la frontière : `/integration/` est public,
    // `/integrations` ne l'était pas. La garde reste juste pour toute route
    // future qui commencerait par ces lettres.
    const proxy = read("lib/supabase/proxy.ts");
    expect(proxy).toContain("'/integration/'");
    expect("/integrations/abc".startsWith("/integration/")).toBe(false);
  });

  it("ne transmet au candidat que son prénom et son avancement", () => {
    const tokens = read("lib/noa/preferences/tokens.ts");
    const select = tokens.match(/\.select\("([^"]+)"\)/)?.[1] ?? "";
    expect(select).not.toMatch(/score|decision|synthes|grid|criteria/i);
  });

  it("supprime les préférences avec le candidat, sans conservation séparée", () => {
    const sql = read("scripts/018_preferences_recrutement.sql");
    expect(sql).toContain("references candidates(id) on delete cascade");
    // Aucune durée de rétention propre : la politique candidat existante fait foi.
    expect(sql).not.toMatch(/retention|conservation_|purge|expire_after/i);
  });
});

// ─── Ce que la migration ne fait pas ────────────────────────────────────────

describe("migration 018", () => {
  const sql = () => read("scripts/018_preferences_recrutement.sql");

  it("ne supprime aucune table ni aucune donnée", () => {
    const active = sql()
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    expect(active).not.toMatch(/drop table/i);
    expect(active).not.toMatch(/drop column/i);
    expect(active).not.toMatch(/delete from/i);
    expect(active).not.toMatch(/truncate/i);
  });

  it("rattache au candidat et scope la RLS par l'entreprise", () => {
    expect(sql()).toContain("add column if not exists candidate_id");
    expect(sql()).toContain('create policy "candidate scoped all"');
    expect(sql()).toContain("current_company_id()");
  });

  it("garde un index unique non partiel, sinon l'upsert casse", () => {
    // PostgREST n'infère pas un index PARTIEL comme arbitre de on_conflict :
    // `upsert(..., { onConflict: "candidate_id" })` échouerait.
    const index = sql().match(/create unique index if not exists onboarding_work_preferences_candidate_id_idx[\s\S]*?;/)?.[0] ?? "";
    expect(index).toContain("on onboarding_work_preferences(candidate_id)");
    expect(index).not.toMatch(/\bwhere\b/i);
  });

  it("porte les mentions de mise en production du projet", () => {
    expect(sql()).toContain("sur CHAQUE projet");
    expect(sql()).toContain("Retour arrière");
    expect(sql()).toContain("notify pgrst");
  });
});

// ─── Le module d'onboarding a bien disparu ──────────────────────────────────

describe("retrait du plan d'onboarding", () => {
  it("n'a plus de routes ni de modules", () => {
    for (const gone of ["app/integrations", "app/candidats/[id]/integration", "lib/noa/onboarding"]) {
      expect(existsSync(path.join(ROOT, gone)), gone).toBe(false);
    }
  });

  it("n'a plus d'entrée de navigation ni de renvoi", () => {
    const shell = read("components/noa/app-shell.tsx");
    expect(shell).not.toContain("/integrations");
    expect(shell).not.toContain("Plans d'onboarding");

    const actions = read("app/candidats/[id]/actions.ts");
    expect(actions).not.toContain("createDraftOnboarding");
    expect(actions).not.toContain('revalidatePath("/integrations")');

    expect(read("app/candidats/[id]/candidate-detail.tsx")).not.toContain("Plan d'onboarding");
    expect(read("app/candidats/[id]/decision-finale/final-decision-view.tsx")).not.toContain("plan d'onboarding");
  });

  it("n'a plus de génération IA d'intégration", () => {
    const ai = read("lib/noa/ai.ts");
    expect(ai).not.toContain("generateIntegrationSynthesis");
    expect(ai).not.toContain("INTEGRATION_SYNTHESIS_SYSTEM");
  });

  it("ne le vend plus nulle part", () => {
    // L'assertion vise ces chaînes précises, pas le mot « onboarding » : il
    // reste légitime dans app/page.tsx pour l'assistant de création de compte
    // (companies.onboarding_completed), qui n'a rien à voir.
    const landing = read("app/page.tsx");
    for (const promesse of ["plans d'onboarding", "Plan d'onboarding", "onboardingPlans"]) {
      expect(landing, promesse).not.toContain(promesse);
    }
    // Le garde de redirection de la landing, lui, doit rester intact.
    expect(landing).toContain("recruiter?.company?.onboarding_completed");

    expect(read("app/ressources/resources-view.tsx")).not.toMatch(/onboarding/i);

    // La clause de transparence IA ne parle plus que du recrutement, mais reste
    // entière : Noa s'arrête à la décision.
    const confidentialite = read("app/confidentialite/page.tsx");
    expect(confidentialite).not.toContain("suivi d'intégration");
    expect(confidentialite).toContain("du recours à un système d'intelligence artificielle dans le cadre du processus de recrutement");
  });

  it("n'a détruit aucune table au passage", () => {
    for (const file of readdirSync(path.join(ROOT, "scripts"))) {
      if (!file.endsWith(".sql")) continue;
      const active = readFileSync(path.join(ROOT, "scripts", file), "utf8")
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n");
      expect(active, file).not.toMatch(/drop table[^;]*onboarding_work_preferences/i);
    }
  });
});
