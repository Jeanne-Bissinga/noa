"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, Btn, BackLink, Textarea } from "@/components/noa/ui-primitives";
import { RecordingGuidance } from "@/components/noa/recording-guidance";
import { TranscriptCapture } from "@/components/noa/transcript-capture";
import { formatDate, INTEGRATION_INTERVIEW_SHORT, INTEGRATION_INTERVIEW_SUBTITLE, INTERVIEW_LABEL } from "@/lib/noa/labels";
import { GOAL_STATUS_LABEL } from "@/lib/noa/onboarding/progress";
import { highlightPreferences } from "@/lib/noa/onboarding/work-preferences";
import { contextSourceLabel, type PreferenceContext } from "@/lib/noa/onboarding/personalization";
import type { IntegrationSection } from "@/lib/noa/onboarding/interview-questions";
import type { InterviewPhase } from "@/lib/noa/onboarding/interview-phase";
import type { MilestoneDigest } from "@/lib/noa/onboarding/interview-history";
import {
  addIntegrationAction, finishIntegrationInterview, prepareIntegrationInterview,
  regenerateIntegrationSynthesis, removeIntegrationAction, saveIntegrationConclusion,
  saveIntegrationNotes, saveIntegrationTranscript, setIntegrationActionStatus,
} from "./actions";
import type {
  Candidate, IntegrationInterviewType, ManagerConclusion, MissionObjective, OnboardingAction,
  OnboardingGoal, OnboardingInterviewConclusion, Synthesis,
} from "@/lib/noa/types";

// L'écran d'un entretien d'intégration : préparation, conduite, restitution.
//
// Une seule route, trois états déduits des données — pas de navigation à
// mémoriser, et rien ne peut se désynchroniser entre l'URL et la base.
//
// L'enregistrement, la transcription et la prise de notes sont exactement ceux
// des entretiens de recrutement : mêmes composants, même comportement.

const CONCLUSION_LABEL: Record<ManagerConclusion, string> = {
  conforme: "Tout se déroule comme prévu",
  ajustements: "Ajustements nécessaires",
  attention: "Point d'attention particulier",
};

const CONCLUSION_STYLE: Record<ManagerConclusion, string> = {
  conforme: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/40",
  ajustements: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/40",
  attention: "bg-orange-50 text-orange-500 border-orange-200",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</p>;
}

// ─── Conseils pour cet échange ──────────────────────────────────────────────

/**
 * Trois conseils au plus, tirés des préférences de travail. Ils portent sur la
 * manière de mener l'échange, jamais sur ce qui est attendu de la personne :
 * l'objectif reste l'objectif, quelle que soit sa façon de travailler.
 */
function AdviceCard({ context }: { context: PreferenceContext }) {
  if (context.kind === "none") return null;
  const highlights = context.kind === "noa" ? highlightPreferences(context.scores, 3) : [];

  const advice =
    highlights.length > 0
      ? highlights.map((h) => h.recommendation)
      : context.kind === "disc"
      ? [DISC_ADVICE[context.primary]]
      : context.kind === "mbti"
      ? [MBTI_ADVICE(context.type)]
      : context.kind === "big_five"
      ? BIG_FIVE_ADVICE(context.levels)
      : [];

  if (advice.length === 0) return null;

  return (
    <Card className="p-5 mb-4">
      <Eyebrow>Conseils pour cet échange</Eyebrow>
      <p className="text-[11px] text-gray-400 mt-1 mb-3">
        Tirés de {contextSourceLabel(context)?.toLowerCase()}. Ils portent sur la manière de mener
        l&apos;échange, pas sur ce qui est attendu.
      </p>
      <ul className="flex flex-col gap-1.5">
        {advice.slice(0, 4).map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
            <span className="text-gray-300 mt-0.5">•</span>
            {line}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const DISC_ADVICE: Record<"D" | "I" | "S" | "C", string> = {
  D: "Allez droit au but : priorités, résultats attendus, marge de décision.",
  I: "Laissez de la place à l'échange et reliez la mission à sa contribution.",
  S: "Avancez par étapes et nommez ce qui reste stable dans les prochaines semaines.",
  C: "Appuyez-vous sur des critères précis, des exemples et des informations structurées.",
};

function MBTI_ADVICE(type: string): string {
  const parts: string[] = [];
  if (type[0] === "I") parts.push("prévoir du temps de réflexion avant de demander une réaction");
  else parts.push("laisser de la place à l'échange à voix haute");
  if (type[3] === "J") parts.push("annoncer le déroulé de l'entretien");
  else parts.push("garder de la souplesse dans l'ordre des sujets");
  return `Le résultat déclaré peut suggérer une préférence pour ${parts.join(", et pour ")}.`;
}

function BIG_FIVE_ADVICE(levels: Record<string, string>): string[] {
  const advice: string[] = [];
  if (levels.conscientiousness === "high") advice.push("Présentez le cadre et les échéances de façon explicite.");
  if (levels.extraversion === "low") advice.push("Préservez des temps de silence, ne comblez pas les pauses.");
  if (levels.emotional_stability === "low") advice.push("Annoncez les changements en amont et donnez du contexte.");
  if (levels.openness === "high") advice.push("Ouvrez la discussion sur les pistes d'évolution du poste.");
  return advice;
}

// ─── Préparation ────────────────────────────────────────────────────────────

function Preparation({
  candidateId, milestone, missionText, sections, goals, objectives, context, previous, openActions,
}: {
  candidateId: string;
  milestone: IntegrationInterviewType;
  missionText: string | null;
  sections: IntegrationSection[];
  goals: OnboardingGoal[];
  objectives: MissionObjective[];
  context: PreferenceContext;
  previous: MilestoneDigest | null;
  openActions: OnboardingAction[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const outcomes = goals.filter((g) => g.phase === "j90");
  const milestones = goals.filter((g) => g.phase !== "j90");

  return (
    <>
      {/* Ce qui a été dit au jalon précédent passe AVANT le profil : un fait
          observé prime sur une hypothèse de départ. */}
      {previous && (
        <Card className="p-5 mb-4">
          <Eyebrow>Ce qui a été dit au {INTEGRATION_INTERVIEW_SHORT[previous.milestone]}</Eyebrow>
          {previous.synthesis?.content && (
            <p className="text-xs text-gray-600 leading-relaxed mt-2">{previous.synthesis.content}</p>
          )}
          {previous.conclusion && (
            <p className="text-[11px] text-gray-500 mt-2">
              Conclusion : {CONCLUSION_LABEL[previous.conclusion.conclusion]}
              {previous.conclusion.note ? ` — ${previous.conclusion.note}` : ""}
            </p>
          )}
        </Card>
      )}

      {openActions.length > 0 && (
        <Card className="p-5 mb-4">
          <Eyebrow>Actions décidées précédemment</Eyebrow>
          <p className="text-[11px] text-gray-400 mt-1 mb-3">À reprendre pendant l&apos;échange.</p>
          <ul className="flex flex-col gap-1.5">
            {openActions.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 text-xs text-gray-600">
                <span className="flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {a.label}
                </span>
                {a.due_date && <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(a.due_date)}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {missionText && (
        <Card className="p-5 mb-4">
          <Eyebrow>Mission</Eyebrow>
          <p className="text-xs text-gray-600 leading-relaxed mt-2 whitespace-pre-wrap">{missionText}</p>
        </Card>
      )}

      {outcomes.length > 0 && (
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-2">
            <Target size={13} className="text-gray-400" />
            <Eyebrow>Résultats attendus à J90</Eyebrow>
          </div>
          <ul className="flex flex-col gap-1.5 mt-3">
            {outcomes.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 text-xs text-gray-600">
                <span className="flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {g.label}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{GOAL_STATUS_LABEL[g.status]}</span>
              </li>
            ))}
          </ul>
          {objectives.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-3">
              Cette campagne ne définissait pas d&apos;objectifs.
            </p>
          )}
        </Card>
      )}

      {milestones.length > 0 && (
        <Card className="p-5 mb-4">
          <Eyebrow>Jalons</Eyebrow>
          <ul className="flex flex-col gap-1.5 mt-3">
            {milestones.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 text-xs text-gray-600">
                <span className="flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {g.phase.toUpperCase()} · {g.label}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{GOAL_STATUS_LABEL[g.status]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AdviceCard context={context} />

      <Card className="p-5 mb-4">
        <Eyebrow>Questions préparées</Eyebrow>
        <p className="text-[11px] text-gray-400 mt-1 mb-3">
          Le socle est le même pour tout le monde. Les préférences de travail n&apos;ajoutent qu&apos;un
          repère, jamais un objectif.
        </p>
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="text-xs font-semibold text-[#010101] mb-2">{section.title}</p>
              <ul className="flex flex-col gap-2">
                {section.questions.map((q) => (
                  <li key={q.id} className="text-xs text-gray-600 leading-relaxed">
                    <span className="flex items-start gap-2">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>
                        {q.q}
                        {q.fromPreferences && (
                          <span className="ml-1.5 text-[10px] text-[#6b4ec4]">question complémentaire</span>
                        )}
                      </span>
                    </span>
                    {q.helper && <p className="text-[11px] text-gray-400 ml-4 mt-0.5">{q.helper}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <Btn
        variant="primary"
        size="lg"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await prepareIntegrationInterview(candidateId, milestone);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending ? "Préparation…" : "Préparer l'entretien"}
        {!pending && <Check size={15} />}
      </Btn>
    </>
  );
}

// ─── Conduite ───────────────────────────────────────────────────────────────

function Conduite({
  candidateId, milestone, sections, initialAnswers, initialTranscript,
}: {
  candidateId: string;
  milestone: IntegrationInterviewType;
  sections: IntegrationSection[];
  initialAnswers: Record<string, string>;
  initialTranscript: string | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [transcript, setTranscript] = useState(initialTranscript ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const setAnswer = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }));

  // Les notes se sauvegardent à la sortie du champ : le manager écrit pendant
  // qu'il écoute, il ne doit rien avoir à valider.
  const persistNotes = () => {
    startTransition(() => {
      saveIntegrationNotes(candidateId, milestone, answers);
    });
  };

  return (
    <>
      <RecordingGuidance value={transcript} onChange={setTranscript} accent="green" />

      <Card className="p-5 my-4">
        <Eyebrow>Guide d&apos;entretien</Eyebrow>
        <p className="text-[11px] text-gray-400 mt-1 mb-4">
          Prenez vos notes sous chaque question. Elles sont enregistrées au fil de l&apos;échange.
        </p>

        <div className="flex flex-col gap-5">
          {sections.map((section) => (
            <div key={section.id}>
              <p className="text-xs font-semibold text-[#010101] mb-3">{section.title}</p>
              <div className="flex flex-col gap-4">
                {section.questions.map((q) => (
                  <div key={q.id}>
                    <p className="text-xs text-[#010101] leading-relaxed font-medium">{q.q}</p>
                    {q.helper && <p className="text-[11px] text-gray-400 mt-0.5">{q.helper}</p>}
                    {q.probes.length > 0 && (
                      <p className="text-[10px] text-gray-300 mt-1">Relances : {q.probes.join(" · ")}</p>
                    )}
                    <textarea
                      rows={2}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      onBlur={persistNotes}
                      placeholder="Vos notes…"
                      className="w-full mt-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#75DA9F]/40 focus:border-[#75DA9F] transition-all bg-white resize-none placeholder-gray-300 text-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <TranscriptCapture
        value={transcript}
        onChange={setTranscript}
        onPersist={(text) => saveIntegrationTranscript(candidateId, milestone, text)}
        accent="green"
      />

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      <div className="mt-4">
        <Btn
          variant="primary"
          size="lg"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await finishIntegrationInterview(candidateId, milestone, { transcript, answers });
              if (result.error) {
                setError(result.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          {pending ? "Enregistrement…" : "Terminer l'entretien"}
          {!pending && <Check size={15} />}
        </Btn>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          Noa rédigera une synthèse de l&apos;échange à partir de vos notes. Vous pourrez la relire et
          décider des actions.
        </p>
      </div>
    </>
  );
}

// ─── Restitution ────────────────────────────────────────────────────────────

function Restitution({
  candidateId, milestone, sections, answers, synthesis, conclusion, ownActions, goals,
}: {
  candidateId: string;
  milestone: IntegrationInterviewType;
  sections: IntegrationSection[];
  answers: Record<string, string>;
  synthesis: Synthesis | null;
  conclusion: OnboardingInterviewConclusion | null;
  ownActions: OnboardingAction[];
  goals: OnboardingGoal[];
}) {
  const [choice, setChoice] = useState<ManagerConclusion | null>(conclusion?.conclusion ?? null);
  const [note, setNote] = useState(conclusion?.note ?? "");
  const [newAction, setNewAction] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const suggested = (synthesis?.advice ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const isFinal = milestone === "integration_j90";

  return (
    <>
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <Eyebrow>Synthèse</Eyebrow>
          <Btn
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await regenerateIntegrationSynthesis(candidateId, milestone);
                router.refresh();
              })
            }
          >
            <Sparkles size={12} />
            Régénérer
          </Btn>
        </div>
        {synthesis?.content ? (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{synthesis.content}</p>
        ) : (
          <p className="text-xs text-gray-300">Aucune synthèse pour l&apos;instant.</p>
        )}
      </Card>

      <Card className="p-5 mb-4">
        <Eyebrow>Actions</Eyebrow>
        <p className="text-[11px] text-gray-400 mt-1 mb-3">
          Elles seront reprises au prochain entretien.
        </p>

        {suggested.length > 0 && ownActions.length === 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            <p className="text-[11px] text-gray-400">Proposées par Noa :</p>
            {suggested.map((s, i) => (
              <button
                key={i}
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await addIntegrationAction(candidateId, milestone, { label: s, dueDate: null, owner: null });
                    router.refresh();
                  })
                }
                className="flex items-center gap-2 text-left text-xs text-gray-600 hover:text-[#010101] border border-dashed border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 transition-all"
              >
                <Plus size={12} className="text-gray-300 flex-shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {ownActions.map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-100">
              <button
                type="button"
                aria-label={a.status === "done" ? "Rouvrir" : "Marquer faite"}
                onClick={() =>
                  startTransition(async () => {
                    await setIntegrationActionStatus(candidateId, a.id, a.status === "done" ? "todo" : "done");
                    router.refresh();
                  })
                }
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  a.status === "done" ? "bg-[#75DA9F] border-[#75DA9F] text-white" : "border-gray-300"
                }`}
              >
                {a.status === "done" && <Check size={10} />}
              </button>
              <span className={`flex-1 text-xs ${a.status === "done" ? "text-gray-400 line-through" : "text-gray-600"}`}>
                {a.label}
              </span>
              {a.due_date && <span className="text-[10px] text-gray-400">{formatDate(a.due_date)}</span>}
              <button
                type="button"
                aria-label="Supprimer"
                onClick={() =>
                  startTransition(async () => {
                    await removeIntegrationAction(candidateId, a.id);
                    router.refresh();
                  })
                }
                className="p-1 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Ajouter une action…"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#75DA9F]/40 bg-white placeholder-gray-300 text-black"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Échéance"
            className="px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none bg-white text-black"
          />
          <Btn
            variant="secondary"
            size="sm"
            disabled={pending || !newAction.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await addIntegrationAction(candidateId, milestone, {
                  label: newAction,
                  dueDate: dueDate || null,
                  owner: null,
                });
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setNewAction("");
                setDueDate("");
                router.refresh();
              })
            }
          >
            <Plus size={13} />
          </Btn>
        </div>
      </Card>

      {goals.length > 0 && (
        <Card className="p-5 mb-4">
          <Eyebrow>Jalons et résultats</Eyebrow>
          <p className="text-[11px] text-gray-400 mt-1 mb-3">
            Mettez-les à jour depuis le plan d&apos;onboarding.
          </p>
          <ul className="flex flex-col gap-1.5">
            {goals.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 text-xs text-gray-600">
                <span className="flex items-start gap-2 leading-relaxed">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {g.phase.toUpperCase()} · {g.label}
                </span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{GOAL_STATUS_LABEL[g.status]}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5 mb-4">
        <Eyebrow>Notes de l&apos;entretien</Eyebrow>
        <div className="flex flex-col gap-3 mt-3">
          {sections.map((section) =>
            section.questions
              .filter((q) => (answers[q.id] ?? "").trim())
              .map((q) => (
                <div key={q.id}>
                  <p className="text-[11px] font-semibold text-[#010101]">{q.q}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5 whitespace-pre-wrap">
                    {answers[q.id]}
                  </p>
                </div>
              )),
          )}
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>Votre conclusion</Eyebrow>
        <div className="flex gap-2 flex-wrap my-3">
          {(["conforme", "ajustements", "attention"] as ManagerConclusion[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setChoice(value)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                choice === value ? CONCLUSION_STYLE[value] : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {CONCLUSION_LABEL[value]}
            </button>
          ))}
        </div>

        <Textarea
          label="Note (facultatif)"
          rows={3}
          value={note}
          onChange={setNote}
          placeholder="Ce que vous souhaitez retenir de cet échange."
        />

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        {saved && !error && (
          <div className="flex items-center gap-1.5 mt-3">
            <Check size={12} className="text-[#1e8f52]" />
            <p className="text-[11px] text-gray-400">Conclusion enregistrée.</p>
          </div>
        )}

        <div className="mt-4">
          <Btn
            variant="primary"
            disabled={pending}
            onClick={() => {
              if (!choice) {
                setError("Choisissez une conclusion.");
                return;
              }
              setError(null);
              startTransition(async () => {
                const result = await saveIntegrationConclusion(candidateId, milestone, choice, note);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setSaved(true);
                router.refresh();
              });
            }}
          >
            {pending ? "Enregistrement…" : isFinal ? "Clôturer le parcours" : "Enregistrer la conclusion"}
          </Btn>
        </div>

        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
          Noa réunit ce qui a été dit et observé. L&apos;appréciation et les décisions qui en découlent
          vous appartiennent.
        </p>
      </Card>
    </>
  );
}

// ─── Écran ──────────────────────────────────────────────────────────────────

export function InterviewScreen(props: {
  candidate: Candidate;
  milestone: IntegrationInterviewType;
  phase: InterviewPhase;
  missionTitle: string | null;
  missionText: string | null;
  sections: IntegrationSection[];
  answers: Record<string, string>;
  transcript: string | null;
  scheduledAt: string | null;
  goals: OnboardingGoal[];
  objectives: MissionObjective[];
  context: PreferenceContext;
  previous: MilestoneDigest | null;
  openActions: OnboardingAction[];
  ownActions: OnboardingAction[];
  synthesis: Synthesis | null;
  conclusion: OnboardingInterviewConclusion | null;
}) {
  const { candidate, milestone, phase } = props;
  const name = `${candidate.first_name} ${candidate.last_name}`;

  const phaseBadge =
    phase === "preparation" ? "À préparer" : phase === "conduite" ? "À réaliser" : "Terminé";
  const phaseColor = phase === "restitution" ? "green" : phase === "conduite" ? "yellow" : "gray";

  return (
    <AppLayout headerTitle={name}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/integrations/${candidate.id}`} label="Retour au plan d'onboarding" />

        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {INTERVIEW_LABEL[milestone]}
            </h1>
            <p className="text-xs text-gray-400 mt-1">{INTEGRATION_INTERVIEW_SUBTITLE[milestone]}</p>
            {props.scheduledAt && (
              <p className="text-[11px] text-gray-400 mt-1">Prévu le {formatDate(props.scheduledAt)}</p>
            )}
          </div>
          <Badge color={phaseColor}>{phaseBadge}</Badge>
        </div>

        {phase === "preparation" && (
          <Preparation
            candidateId={candidate.id}
            milestone={milestone}
            missionText={props.missionText}
            sections={props.sections}
            goals={props.goals}
            objectives={props.objectives}
            context={props.context}
            previous={props.previous}
            openActions={props.openActions}
          />
        )}

        {phase === "conduite" && (
          <Conduite
            candidateId={candidate.id}
            milestone={milestone}
            sections={props.sections}
            initialAnswers={props.answers}
            initialTranscript={props.transcript}
          />
        )}

        {phase === "restitution" && (
          <Restitution
            candidateId={candidate.id}
            milestone={milestone}
            sections={props.sections}
            answers={props.answers}
            synthesis={props.synthesis}
            conclusion={props.conclusion}
            ownActions={props.ownActions}
            goals={props.goals}
          />
        )}
      </div>
    </AppLayout>
  );
}
