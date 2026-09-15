"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWorkPreferencesToken } from "@/lib/noa/preferences/tokens";
import {
  findWorkPreferenceQuestion,
  isAnswerValue,
} from "@/lib/noa/preferences/questions";
import { scoreWorkPreferences } from "@/lib/noa/preferences/scoring";
import { parseBigFiveResult, parseDiscResult, parseMbtiResult } from "@/lib/noa/preferences/declared-tests";
import { ERROR_MESSAGE, userError } from "@/lib/noa/errors";
import type { AssessmentType } from "@/lib/noa/types";

// Écritures du collaborateur sur ses préférences de travail.
//
// Le token est revérifié à chaque action, intégralement : rien de ce qui
// vient du navigateur ne fait foi. L'identifiant de la ligne est déduit du
// token côté serveur, jamais reçu. Les valeurs sont validées par les mêmes
// fonctions pures que celles qui les relisent (declared-tests.ts,
// work-preferences.ts) — une valeur qui ne se relit pas ne s'écrit pas.

export type PreferencesActionState = { error?: string; done?: boolean };

const FAILURE_MESSAGE = {
  introuvable: "Ce lien n'est pas valide.",
  expire: "Ce lien a expiré.",
  indisponible: "Le service est momentanément indisponible.",
} as const;

async function resolve(token: string) {
  const resolved = await resolveWorkPreferencesToken(token);
  if (!resolved.ok) return { error: FAILURE_MESSAGE[resolved.reason] } as const;
  const supabase = createAdminClient();
  if (!supabase) return { error: FAILURE_MESSAGE.indisponible } as const;
  return { preferences: resolved.preferences, supabase } as const;
}

/**
 * Enregistre une réponse du questionnaire Noa, au fil de l'eau : c'est ce qui
 * permet de reprendre plus tard à la première question sans réponse.
 */
export async function saveQuestionnaireAnswer(
  token: string,
  questionId: string,
  value: unknown,
): Promise<PreferencesActionState> {
  const ctx = await resolve(token);
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.preferences.completed) return { done: true };

  if (!findWorkPreferenceQuestion(questionId)) return { error: "Question inconnue." };
  if (!isAnswerValue(value)) return { error: "Réponse invalide." };

  const answers = { ...ctx.preferences.answers, [questionId]: value };
  const { error } = await ctx.supabase
    .from("onboarding_work_preferences")
    .update({ questionnaire_answers: answers, updated_at: new Date().toISOString() })
    .eq("id", ctx.preferences.preferencesId)
    .eq("status", "invited");

  if (error) return { error: userError("saveQuestionnaireAnswer", error, "Votre réponse n'a pas pu être enregistrée. Réessayez.") };
  return {};
}

/**
 * Termine le questionnaire Noa : les 24 réponses sont relues depuis la base
 * (pas depuis le client), scorées, et le résultat est figé. Idempotent : un
 * questionnaire déjà complété renvoie simplement `done`.
 */
export async function completeQuestionnaire(token: string): Promise<PreferencesActionState> {
  const ctx = await resolve(token);
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.preferences.completed) return { done: true };

  const scores = scoreWorkPreferences(ctx.preferences.answers);
  if (!scores) return { error: "Toutes les questions doivent être répondues avant de terminer." };

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("onboarding_work_preferences")
    .update({
      status: "completed",
      source: "noa_questionnaire",
      assessment_type: "noa_work_preferences" satisfies AssessmentType,
      structured_result: { scores },
      questionnaire_scores: scores,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", ctx.preferences.preferencesId)
    .eq("status", "invited");

  if (error) return { error: userError("completeQuestionnaire", error, ERROR_MESSAGE.reponses) };
  return { done: true };
}

/**
 * Enregistre un test déclaré. Toute donnée du questionnaire Noa commencée
 * puis abandonnée est effacée : la personne a changé de branche, ces réponses
 * partielles ne doivent pas rester.
 */
export async function submitDeclaredTest(
  token: string,
  type: string,
  payload: unknown,
): Promise<PreferencesActionState> {
  const ctx = await resolve(token);
  if ("error" in ctx) return { error: ctx.error };
  if (ctx.preferences.completed) return { done: true };

  let assessmentType: AssessmentType;
  let structured: Record<string, unknown> | null;

  if (type === "disc") {
    assessmentType = "disc";
    const disc = parseDiscResult(payload);
    if (!disc) return { error: "Indiquez un profil principal, et un profil secondaire différent ou aucun." };
    structured = { primary: disc.primary, secondary: disc.secondary };
  } else if (type === "mbti") {
    assessmentType = "mbti";
    const mbti = parseMbtiResult(payload);
    if (!mbti) return { error: "Choisissez l'un des seize types MBTI." };
    structured = { type: mbti.type };
  } else if (type === "big_five") {
    assessmentType = "big_five";
    const bigFive = parseBigFiveResult(payload);
    if (!bigFive) return { error: "Indiquez un niveau pour chacune des cinq dimensions." };
    structured = { ...bigFive };
  } else {
    return { error: "Test non pris en charge." };
  }

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("onboarding_work_preferences")
    .update({
      status: "completed",
      source: "declared_test",
      assessment_type: assessmentType,
      structured_result: structured,
      questionnaire_answers: null,
      questionnaire_scores: null,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", ctx.preferences.preferencesId)
    .eq("status", "invited");

  if (error) return { error: userError("submitDeclaredTest", error, "Votre résultat n'a pas pu être enregistré. Réessayez.") };
  return { done: true };
}
