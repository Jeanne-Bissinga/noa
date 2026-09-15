import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMissionSkills, getSyntheses, getInterview } from "@/lib/noa/queries";
import { generatePreferenceTopics } from "@/lib/noa/ai";
import {
  briefingMatchesScorecard,
  keepGroundedTopics,
  parsePreferenceBriefing,
  type PreferenceTopic,
} from "@/lib/noa/preferences/briefing";
import { buildPreferenceContext, supportsInterviewTopics } from "@/lib/noa/preferences/context";
import { highlightPreferences, parseWorkPreferenceScores } from "@/lib/noa/preferences/scoring";
import { getWorkPreferencesByCandidate } from "@/lib/noa/preferences/queries";
import type { Candidate, RecruiterWithCompany } from "@/lib/noa/types";
import type { CandidateContext, JobSpecContext } from "@/lib/noa/ai";

// Production des sujets à approfondir, au moment de préparer l'entretien
// technique.
//
// ─── Généré une fois, puis figé ─────────────────────────────────────────────
// Le briefing est écrit en base à la première préparation, et relu ensuite. Ce
// n'est pas une optimisation : c'est ce qui permet à la synthèse de remontrer
// le signal initial TEL QU'IL A ÉTÉ FORMULÉ AVANT l'entretien. Le régénérer
// après coup produirait un autre texte, écrit en connaissance des réponses —
// donc plus du tout un signal initial.
//
// Il est régénéré dans un seul cas : la Scorecard a changé. Un sujet rattaché
// à une compétence qui n'est plus attendue n'a plus lieu d'être.
//
// ─── Jamais bloquant ────────────────────────────────────────────────────────
// Pas de préférences, pas de Scorecard, pas de clé IA, appel en échec : la
// fonction renvoie une liste vide et la préparation se déroule exactement comme
// avant. Rien ici ne peut empêcher de préparer ou de mener l'entretien.

export async function ensureInterviewBriefing(
  candidate: Candidate,
  recruiter: RecruiterWithCompany,
  context: { job: JobSpecContext; cand: CandidateContext },
): Promise<PreferenceTopic[]> {
  void recruiter;

  const preferences = await getWorkPreferencesByCandidate(candidate.id);
  if (preferences?.status !== "completed") return [];

  // Seul le questionnaire Noa ouvre un sujet d'évaluation. Un test déclaré
  // (DISC, MBTI, Big Five) n'alimente que les conseils de conduite : sa
  // projection sur les six préférences est une heuristique, pas une réponse
  // donnée par la personne.
  const preferenceContext = buildPreferenceContext(preferences);
  if (!supportsInterviewTopics(preferenceContext)) return [];

  const scorecard = candidate.mission_id ? await getMissionSkills(candidate.mission_id) : [];
  if (scorecard.length === 0) return [];
  const scorecardSkillIds = scorecard.map((s) => s.id);

  // Déjà produit pour cette Scorecard : on relit, on ne régénère pas.
  if (preferences.interview_briefing && briefingMatchesScorecard(preferences.interview_briefing, scorecardSkillIds)) {
    return parsePreferenceBriefing(preferences.interview_briefing, scorecard);
  }

  // L'entretien est passé : le signal initial ne se réécrit plus, même si la
  // Scorecard a bougé entre-temps.
  const interview = await getInterview(candidate.id, "topgrading");
  if (interview?.status === "termine") {
    return parsePreferenceBriefing(preferences.interview_briefing, scorecard);
  }

  const scores = parseWorkPreferenceScores(preferences.questionnaire_scores);
  if (!scores) return [];
  const highlights = highlightPreferences(scores);
  if (highlights.length === 0) return [];

  const screeningInterview = await getInterview(candidate.id, "screening");
  const syntheses = screeningInterview ? await getSyntheses(candidate.id) : [];
  const screeningSynthesis =
    syntheses.filter((s) => s.interview_id === screeningInterview?.id && s.authored_by === "noa").pop()?.content ?? null;

  let topics: PreferenceTopic[] = [];
  try {
    const raw = await generatePreferenceTopics({
      job: context.job,
      candidate: context.cand,
      scorecard: scorecard.map((s) => ({
        id: s.id,
        category: s.category,
        name: s.name,
        justification: s.justification,
      })),
      // Des phrases déjà rédigées, jamais une moyenne ni une orientation brute.
      preferences: highlights.map((h) => ({ dimension: h.dimension, label: h.label })),
      screeningSynthesis,
    });
    topics = keepGroundedTopics(raw, scorecard, highlights.map((h) => h.dimension));
  } catch (e) {
    const err = e as { message?: string };
    console.error(`[noa] ensureInterviewBriefing : sujets non générés, la préparation continue — ${err?.message ?? String(e)}`);
    return [];
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  await supabase
    .from("onboarding_work_preferences")
    .update({
      interview_briefing: { version: 1, topics, scorecardSkillIds },
      briefing_generated_at: now,
      updated_at: now,
    })
    .eq("id", preferences.id);

  return topics;
}
