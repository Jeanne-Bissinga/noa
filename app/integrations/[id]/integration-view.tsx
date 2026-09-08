"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRight, Calendar, Check, ChevronRight, FileText, Info, Sparkles, Target,
} from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, Btn, BackLink } from "@/components/noa/ui-primitives";
import { formatDate } from "@/lib/noa/labels";
import { INTEGRATION_INTERVIEW_SUBTITLE } from "@/lib/noa/labels";
import { contextSourceLabel, type PreferenceContext } from "@/lib/noa/onboarding/personalization";
import {
  STEP_LABEL,
  WORK_PREFERENCES_STATUS_LABEL,
  type IntegrationOverview,
} from "@/lib/noa/onboarding/overview";
import {
  TIMELINE_STATE_LABEL,
  interviewTypeOfStep,
  type TimelineState,
  type TimelineStep,
} from "@/lib/noa/onboarding/timeline";
import { GoalTracker } from "./goal-tracker";
import { WorkPreferencesResult } from "./work-preferences-card";
import { InvitePreferencesModal } from "./invite-preferences-modal";
import { prepareOnboarding, setArrivalDate } from "./actions";
import type {
  Candidate, IntegrationInterviewType, OnboardingAction, OnboardingGoal,
  OnboardingInterviewConclusion, OnboardingWorkPreferences,
} from "@/lib/noa/types";

// Fiche d'intégration : ce qu'il y a à faire pour cette personne, aujourd'hui.
//
// Composant de rendu. Il ne dérive aucun état : tout le vocabulaire vient de
// `overview`, produit par la même fonction que la liste /integrations. C'est ce
// qui garantit que les deux écrans disent la même chose.
//
// Le parcours tient en cinq étapes : la préparation avant l'arrivée, puis les
// quatre entretiens. Les trois préparatifs sont proposés en parallèle — aucun
// n'est désactivé par un autre, l'objectif est que tout soit prêt à J1.

const TIMELINE_STYLE: Record<TimelineState, { dot: string; text: string; badge: "gray" | "yellow" | "green" | "orange" }> = {
  a_venir: { dot: "bg-gray-100 text-gray-400", text: "text-gray-400", badge: "gray" },
  en_attente: { dot: "bg-[#FEE831]/40 text-[#8a6a00]", text: "text-[#8a6a00]", badge: "yellow" },
  termine: { dot: "bg-[#75DA9F] text-white", text: "text-[#1e8f52]", badge: "green" },
  attention: { dot: "bg-orange-100 text-orange-500", text: "text-orange-500", badge: "orange" },
};

// ─── Carte d'un préparatif ──────────────────────────────────────────────────

function PrepCard({
  icon, title, value, hint, action, highlighted,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint?: string;
  action: React.ReactNode;
  /** Vrai quand c'est le geste mis en avant par le parcours. */
  highlighted: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all ${
        highlighted ? "border-[#99BAF8]/50 bg-[#99BAF8]/6" : "border-gray-100"
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#010101]">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{value}</p>
        {hint && <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

// ─── Date d'arrivée ─────────────────────────────────────────────────────────

function ArrivalDateField({ onboardingId, current }: { onboardingId: string; current: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await setArrivalDate(onboardingId, value || null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  if (!editing) {
    return (
      <Btn variant={current ? "secondary" : "primary"} size="sm" onClick={() => setEditing(true)}>
        {current ? "Modifier" : "Définir la date"}
      </Btn>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 bg-white text-black"
        />
        <Btn variant="primary" size="sm" onClick={save} disabled={pending}>
          {pending ? "…" : "Enregistrer"}
        </Btn>
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Création à la volée (personnes recrutées avant l'automatisation) ───────

function CreatePlanButton({ candidateId }: { candidateId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <Btn
        variant="primary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await prepareOnboarding(candidateId);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "Préparation…" : "Préparer l'intégration"}
        {!pending && <ArrowRight size={13} />}
      </Btn>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Fiche ──────────────────────────────────────────────────────────────────

export function IntegrationDetail({
  candidate, missionTitle, overview, timeline, goals, actions, conclusions, preparedInterviewIds,
  preferences, context,
}: {
  candidate: Candidate;
  missionTitle: string | null;
  overview: IntegrationOverview;
  timeline: TimelineStep[];
  goals: OnboardingGoal[];
  actions: OnboardingAction[];
  conclusions: OnboardingInterviewConclusion[];
  preparedInterviewIds: string[];
  preferences: OnboardingWorkPreferences | null;
  context: PreferenceContext;
}) {
  const [inviting, setInviting] = useState(false);

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const firstName = candidate.first_name;
  const { primaryNextAction: action, onboardingId } = overview;

  const prepared = new Set(preparedInterviewIds);
  const j90Goals = goals.filter((g) => g.phase === "j90");
  const openActions = actions.filter((a) => a.status === "todo");
  const sourceLabel = contextSourceLabel(context);
  const preferencesComplete = overview.workPreferencesStatus === "complete";
  const interviewSteps = timeline.filter((s) => s.key !== "avant_arrivee");

  return (
    <AppLayout headerTitle={name}>
      <div className="max-w-2xl mx-auto">
        {inviting && onboardingId && (
          <InvitePreferencesModal
            onboardingId={onboardingId}
            firstName={firstName}
            onClose={() => setInviting(false)}
          />
        )}

        <BackLink href="/integrations" label="Intégrations" />

        {/* ── En-tête ── */}
        <Card className="p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
                {name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {missionTitle ?? candidate.title ?? "—"}
                {sourceLabel && ` · ${sourceLabel}`}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {overview.startDate ? `Arrivée le ${formatDate(overview.startDate)}` : "Arrivée à définir"}
                {overview.dayNumber !== null && overview.dayNumber > 0 && (
                  <span className="text-gray-400"> · jour {overview.dayNumber} sur 90</span>
                )}
              </p>
            </div>
            <Link
              href={`/candidats/${candidate.id}`}
              className="text-[11px] font-medium text-gray-400 hover:text-[#3a6fd4] hover:underline flex-shrink-0"
            >
              Voir le recrutement
            </Link>
          </div>
        </Card>

        {/* ── Points d'attention ── */}
        {overview.alerts.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-4">
            {overview.alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 border ${
                  alert.level === "attention"
                    ? "border-orange-200 bg-orange-50/40"
                    : "border-[#99BAF8]/40 bg-[#99BAF8]/6"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {alert.level === "info" ? (
                    <Info size={15} className="text-[#3a6fd4] flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-[#010101]">{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Avant son arrivée ── */}
        {overview.globalStatus !== "termine" && (
          <Card className="p-5 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Avant son arrivée
            </p>
            <p className="text-[11px] text-gray-400 mb-4">
              Ces trois points se préparent dans l&apos;ordre que vous voulez.
            </p>

            <div className="flex flex-col gap-2">
              <PrepCard
                icon={<Sparkles size={14} />}
                title="Préférences de travail"
                value={WORK_PREFERENCES_STATUS_LABEL[overview.workPreferencesStatus]}
                hint={
                  preferencesComplete
                    ? undefined
                    : `${firstName} déclarera un test déjà passé ou répondra au questionnaire Noa. Utile avant le J1, sans le bloquer.`
                }
                highlighted={action.kind === "inviter_preferences"}
                action={
                  preferencesComplete ? (
                    <Badge color="green">Complété</Badge>
                  ) : onboardingId ? (
                    <Btn
                      variant={overview.workPreferencesStatus === "non_invite" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setInviting(true)}
                    >
                      {overview.workPreferencesStatus === "non_invite" ? "Inviter à compléter" : "Régénérer"}
                    </Btn>
                  ) : (
                    <Badge color="gray">Après préparation</Badge>
                  )
                }
              />

              <PrepCard
                icon={<Calendar size={14} />}
                title="Date d'arrivée"
                value={overview.startDate ? formatDate(overview.startDate) : "À définir"}
                hint="Elle fixe le calendrier des quatre entretiens : J1, J30, J60 et J90."
                highlighted={action.kind === "definir_date"}
                action={
                  onboardingId ? (
                    <ArrivalDateField onboardingId={onboardingId} current={overview.startDate} />
                  ) : (
                    <Badge color="gray">Après préparation</Badge>
                  )
                }
              />

              <PrepCard
                icon={<FileText size={14} />}
                title="Plan d'intégration"
                value={
                  overview.planValidated
                    ? "Validé"
                    : onboardingId
                    ? "Généré à partir du recrutement"
                    : "À générer depuis le recrutement"
                }
                highlighted={action.kind === "verifier_plan" || action.kind === "creer_plan"}
                action={
                  onboardingId ? (
                    <Link
                      href={`/integrations/${candidate.id}/plan`}
                      className="inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all cursor-pointer px-3 py-1.5 text-xs bg-white border border-gray-200 text-[#010101] hover:bg-gray-50"
                    >
                      {overview.planValidated ? "Voir le plan" : "Vérifier le plan"}
                    </Link>
                  ) : (
                    <CreatePlanButton candidateId={candidate.id} />
                  )
                }
              />
            </div>
          </Card>
        )}

        {/* ── Les quatre entretiens ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Entretiens</p>
          <p className="text-[11px] text-gray-400 mb-4">
            Quatre échanges entre vous et {firstName}, préparés à partir du recrutement.
          </p>

          <div className="flex flex-col gap-2">
            {interviewSteps.map((step) => {
              const type = interviewTypeOfStep(step.key) as IntegrationInterviewType;
              const style = TIMELINE_STYLE[step.state];
              const isPrepared = step.interview ? prepared.has(step.interview.id) : false;
              const conclusion = step.interview
                ? conclusions.find((c) => c.interview_id === step.interview!.id)
                : undefined;
              const isNext = action.interviewType === type;

              return (
                <Link
                  key={step.key}
                  href={`/integrations/${candidate.id}/entretiens/${step.key}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border transition-all ${
                    isNext ? "border-[#99BAF8]/50 bg-[#99BAF8]/6" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${style.dot}`}
                    >
                      {step.state === "termine" ? <Check size={12} /> : step.label}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#010101]">Entretien {step.label}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {step.state === "termine"
                          ? conclusion
                            ? "Conclu"
                            : "Réalisé"
                          : INTEGRATION_INTERVIEW_SUBTITLE[type]}
                      </p>
                      {step.scheduledAt && step.state !== "termine" && (
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          Prévu le {formatDate(step.scheduledAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge color={style.badge}>
                      {step.state === "en_attente" && !isPrepared
                        ? "À préparer"
                        : step.state === "en_attente"
                        ? "À réaliser"
                        : TIMELINE_STATE_LABEL[step.state]}
                    </Badge>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* ── Actions en cours ── */}
        {openActions.length > 0 && (
          <Card className="p-5 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Actions en cours
            </p>
            <p className="text-[11px] text-gray-400 mb-3">
              Décidées pendant les entretiens. Elles seront reprises au prochain échange.
            </p>
            <ul className="flex flex-col gap-1.5">
              {openActions.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 text-xs text-gray-600">
                  <span className="flex items-start gap-2 leading-relaxed">
                    <span className="text-gray-300 mt-0.5">•</span>
                    {a.label}
                  </span>
                  {a.due_date && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(a.due_date)}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* ── Résultats attendus ── */}
        {j90Goals.length > 0 && (
          <Card className="p-5 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={13} className="text-gray-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Résultats attendus à J90
              </p>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              Repris des objectifs définis pendant le recrutement.
            </p>
            <div className="flex flex-col gap-3">
              {j90Goals.map((goal) => (
                <GoalTracker key={goal.id} goal={goal} />
              ))}
            </div>
          </Card>
        )}

        {/* ── Préférences complétées ── */}
        {preferencesComplete && (
          <WorkPreferencesResult firstName={firstName} context={context} preferences={preferences} />
        )}
      </div>
    </AppLayout>
  );
}
