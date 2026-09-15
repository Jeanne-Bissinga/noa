"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Btn } from "@/components/noa/ui-primitives";
import {
  ANSWER_SCALE,
  firstUnansweredIndex,
  isAnswerValue,
  type AnswerValue,
  type WorkPreferenceQuestion,
} from "@/lib/noa/preferences/questions";
import {
  BIG_FIVE_LEVELS,
  BIG_FIVE_LEVEL_LABEL,
  BIG_FIVE_TRAITS,
  BIG_FIVE_TRAIT_LABEL,
  MBTI_TYPES,
  type MbtiType,
} from "@/lib/noa/preferences/declared-tests";
import { DISC_PROFILES } from "@/lib/noa/preferences/disc";
import { NOTICE_PARAGRAPHS, NOTICE_TITLE, PRIVACY_PATH } from "@/lib/noa/preferences/information-notice";
import { completeQuestionnaire, saveQuestionnaireAnswer, submitDeclaredTest } from "./actions";
import { ThankYou } from "./thank-you";
import type { BigFiveLevel, BigFiveTrait, DiscProfile } from "@/lib/noa/types";

// Parcours du candidat : information, départ, puis test déclaré OU
// questionnaire Noa.
//
// Aucun choix présélectionné au départ. Chaque réponse du questionnaire est
// enregistrée immédiatement côté serveur : fermer l'onglet et revenir reprend
// à la première question sans réponse — rien ne vit seulement dans le
// navigateur.
//
// La liste des questions arrive en prop plutôt que d'être importée ici : c'est
// ce qui permettra, plus tard, de ne poser que les questions des dimensions
// pertinentes pour le poste. Aujourd'hui, ce sont toujours les 24.
//
// Vocabulaire : « préférences de travail », « questionnaire Noa ». Jamais
// « test », « score », « profil » à l'écran.

type Branch = null | "declared" | "questionnaire";
type DeclaredKind = null | "disc" | "mbti" | "big_five";

const choiceClass = (selected: boolean) =>
  `w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
    selected
      ? "bg-[#99BAF8] border-[#99BAF8] text-[#010101] font-semibold"
      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
  }`;

const chipClass = (selected: boolean) =>
  `px-3 h-10 rounded-xl border text-sm font-semibold transition-all ${
    selected
      ? "bg-[#CCB8FF] border-[#CCB8FF] text-[#010101]"
      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
  }`;

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
      {children}
    </h1>
  );
}

// ─── Départ ─────────────────────────────────────────────────────────────────

function Start({ onChoose }: { onChoose: (b: Exclude<Branch, null>) => void }) {
  return (
    <div>
      <Title>Vos préférences de travail</Title>
      <p className="text-sm text-gray-500 mt-3 leading-relaxed">
        Chacun a une manière différente de travailler, de collaborer et de recevoir des retours.
      </p>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">Il n&apos;y a pas de bonne ou de mauvaise réponse.</p>

      {/* Avant toute question : pourquoi on demande, et ce qui ne sera pas
          fait de ces réponses. Pas de case à cocher — cf. le commentaire de
          lib/noa/preferences/information-notice.ts. */}
      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-sm font-semibold text-[#010101] mb-2">{NOTICE_TITLE}</p>
        {NOTICE_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="text-[13px] text-gray-500 leading-relaxed mt-2 first:mt-0">
            {paragraph}
          </p>
        ))}
        <a
          href={PRIVACY_PATH}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[12px] text-[#3a6fd4] underline mt-3 hover:opacity-80"
        >
          Politique de confidentialité
        </a>
      </div>

      <p className="text-sm font-semibold text-[#010101] mt-7 mb-3">
        Avez-vous déjà réalisé l&apos;un des tests suivants ? DISC, MBTI ou Big Five.
      </p>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => onChoose("declared")} className={choiceClass(false)}>
          Oui, j&apos;ai déjà réalisé un test
        </button>
        <button type="button" onClick={() => onChoose("questionnaire")} className={choiceClass(false)}>
          Non, répondre au questionnaire Noa
        </button>
      </div>
    </div>
  );
}

// ─── Test déclaré ───────────────────────────────────────────────────────────

function DeclaredTest({ token, onDone, onBack }: { token: string; onDone: () => void; onBack: () => void }) {
  const [kind, setKind] = useState<DeclaredKind>(null);
  const [discPrimary, setDiscPrimary] = useState<DiscProfile | null>(null);
  const [discSecondary, setDiscSecondary] = useState<DiscProfile | null>(null);
  const [mbti, setMbti] = useState<MbtiType | null>(null);
  const [bigFive, setBigFive] = useState<Partial<Record<BigFiveTrait, BigFiveLevel>>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Impossible de soumettre tant que le formulaire n'est pas complet — la
  // validation serveur refait la même vérification.
  const canSubmit =
    (kind === "disc" && discPrimary !== null && discSecondary !== discPrimary) ||
    (kind === "mbti" && mbti !== null) ||
    (kind === "big_five" && BIG_FIVE_TRAITS.every((t) => bigFive[t] !== undefined));

  const submit = () => {
    if (!kind || !canSubmit) return;
    setError(null);
    const payload =
      kind === "disc" ? { primary: discPrimary, secondary: discSecondary }
      : kind === "mbti" ? { type: mbti }
      : bigFive;
    startTransition(async () => {
      const result = await submitDeclaredTest(token, kind, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft size={12} /> Retour
      </button>
      <Title>Votre résultat</Title>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">Quel test avez-vous réalisé ?</p>

      <div className="flex gap-2 mt-4">
        {([
          ["disc", "DISC"],
          ["mbti", "MBTI"],
          ["big_five", "Big Five"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setKind(value)} className={chipClass(kind === value)}>
            {label}
          </button>
        ))}
      </div>

      {kind === "disc" && (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold text-[#010101] mb-2">
              Profil principal <span className="text-red-400">*</span>
            </p>
            <div className="flex gap-2">
              {DISC_PROFILES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setDiscPrimary(p);
                    if (discSecondary === p) setDiscSecondary(null);
                  }}
                  className={`${chipClass(discPrimary === p)} w-12`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#010101] mb-2">Profil secondaire</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => setDiscSecondary(null)} className={chipClass(discSecondary === null)}>
                Aucun
              </button>
              {DISC_PROFILES.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={p === discPrimary}
                  onClick={() => setDiscSecondary(p)}
                  className={`${chipClass(discSecondary === p)} w-12 disabled:opacity-30`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {kind === "mbti" && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-[#010101] mb-2">
            Votre type <span className="text-red-400">*</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setMbti(t)} className={chipClass(mbti === t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === "big_five" && (
        <div className="mt-6 flex flex-col gap-4">
          {BIG_FIVE_TRAITS.map((trait) => (
            <div key={trait}>
              <p className="text-sm font-semibold text-[#010101] mb-2">
                {BIG_FIVE_TRAIT_LABEL[trait]} <span className="text-red-400">*</span>
              </p>
              <div className="flex gap-2">
                {BIG_FIVE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setBigFive((b) => ({ ...b, [trait]: level }))}
                    className={`${chipClass(bigFive[trait] === level)} flex-1`}
                  >
                    {BIG_FIVE_LEVEL_LABEL[level]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-4">{error}</p>}

      {kind && (
        <Btn variant="primary" size="lg" onClick={submit} disabled={!canSubmit || pending} className="justify-center w-full mt-7">
          {pending ? "Enregistrement…" : "Enregistrer mon résultat"}
        </Btn>
      )}
    </div>
  );
}

// ─── Questionnaire Noa ──────────────────────────────────────────────────────

function Questionnaire({
  token,
  questions,
  initialAnswers,
  onDone,
  onBack,
}: {
  token: string;
  questions: WorkPreferenceQuestion[];
  initialAnswers: Record<string, number>;
  onDone: () => void;
  onBack: () => void;
}) {
  const TOTAL = questions.length;
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  // Reprise : première question sans réponse. Tout répondu = dernière question,
  // pour pouvoir terminer.
  const [index, setIndex] = useState(() => firstUnansweredIndex(initialAnswers, questions) ?? TOTAL - 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const question = questions[index];
  const current = answers[question.id];
  const answered = isAnswerValue(current);
  const isLast = index === TOTAL - 1;

  const choose = (value: AnswerValue) => {
    setError(null);
    setAnswers((a) => ({ ...a, [question.id]: value }));
    // Sauvegarde immédiate : la reprise repose sur la base, pas sur cet onglet.
    startTransition(async () => {
      const result = await saveQuestionnaireAnswer(token, question.id, value);
      if (result.error) setError(result.error);
    });
  };

  const next = () => {
    if (!answered) return;
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    startTransition(async () => {
      const result = await completeQuestionnaire(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  };

  return (
    <div>
      {index === 0 ? (
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft size={12} /> Retour
        </button>
      ) : null}
      <Title>Questionnaire de préférences de travail</Title>
      <p className="text-xs text-gray-400 mt-1">{TOTAL} questions · environ 5 minutes</p>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400">
            Question {index + 1} / {TOTAL}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mb-5">
          <div className="h-full bg-[#99BAF8] rounded-full transition-all" style={{ width: `${((index + 1) / TOTAL) * 100}%` }} />
        </div>

        <p className="text-sm font-semibold text-[#010101] leading-relaxed min-h-14">{question.text}</p>

        <div className="flex flex-col gap-2 mt-5">
          {ANSWER_SCALE.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className={choiceClass(current === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-4">{error}</p>}

      <div className="flex items-center justify-between mt-7">
        <Btn variant="ghost" size="sm" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ArrowLeft size={13} /> Précédent
        </Btn>
        <Btn variant="primary" onClick={next} disabled={!answered || pending}>
          {isLast ? (pending ? "Enregistrement…" : "Terminer") : "Suivant"}
          {!isLast && <ArrowRight size={14} />}
        </Btn>
      </div>
    </div>
  );
}

// ─── Orchestration ──────────────────────────────────────────────────────────

export function PreferencesFlow({
  token,
  firstName,
  questions,
  initialAnswers,
}: {
  token: string;
  firstName: string;
  /** Les questions réellement posées. Aujourd'hui toujours les 24. */
  questions: WorkPreferenceQuestion[];
  initialAnswers: Record<string, number>;
}) {
  // Reprise : des réponses déjà enregistrées ramènent directement au
  // questionnaire, sans repasser par le choix de départ.
  const [branch, setBranch] = useState<Branch>(Object.keys(initialAnswers).length > 0 ? "questionnaire" : null);
  const [done, setDone] = useState(false);

  if (done) return <ThankYou />;

  if (branch === "declared") {
    return <DeclaredTest token={token} onDone={() => setDone(true)} onBack={() => setBranch(null)} />;
  }
  if (branch === "questionnaire") {
    return (
      <Questionnaire
        token={token}
        questions={questions}
        initialAnswers={initialAnswers}
        onDone={() => setDone(true)}
        onBack={() => setBranch(null)}
      />
    );
  }

  return (
    <div>
      {firstName && <p className="text-xs text-gray-400 mb-2">Bonjour {firstName},</p>}
      <Start onChoose={setBranch} />
    </div>
  );
}
