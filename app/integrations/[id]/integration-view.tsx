"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRight, Check, ChevronDown, ChevronRight,
} from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Badge, Btn, BackLink } from "@/components/noa/ui-primitives";
import { formatDate, INTEGRATION_INTERVIEW_SUBTITLE } from "@/lib/noa/labels";
import { contextSourceLabel, type PreferenceContext } from "@/lib/noa/onboarding/personalization";
import { summarizeGoals } from "@/lib/noa/onboarding/progress";
import {
  STEP_LABEL,
  WORK_PREFERENCES_STATUS_LABEL,
  situationLabel,
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
  Candidate, IntegrationInterviewType, OnboardingGoal,
  OnboardingInterviewConclusion, OnboardingWorkPreferences,
} from "@/lib/noa/types";

// Fiche d'un plan d'onboarding : ce qu'il y a à faire pour cette personne,
// aujourd'hui.
//
// Composant de rendu. Il ne dérive aucun état : tout le vocabulaire vient de
// `overview`, produit par la même fonction que la liste. C'est ce qui garantit
// que les deux écrans disent la même chose.
//
// ─── Une seule bannière ─────────────────────────────────────────────────────
// L'écran précédent empilait une carte par alerte, si bien qu'un dossier en
// retard sur trois jalons affichait trois cartes orange au titre identique
// avant même le parcours. Il n'y a plus qu'un bandeau, qui dit la chose la plus
// urgente et propose son geste. Le reste se lit dans le parcours.

const TIMELINE_STYLE: Record<TimelineState, { dot: string; badge: "gray" | "yellow" | "green" }> = {
  a_venir: { dot: "bg-gray-100 text-gray-400", badge: "gray" },
  courante: { dot: "bg-[#FEE831]/40 text-[#8a6a00]", badge: "yellow" },
  termine: { dot: "bg-[#75DA9F] text-white", badge: "green" },
};

const SECTION_TITLE = "text-[10px] font-bold uppercase tracking-widest text-gray-400";

// ─── Bandeau de priorité ────────────────────────────────────────────────────

function PriorityBanner({
  overview, firstName, cta,
}: {
  overview: IntegrationOverview;
  firstName: string;
  cta: React.ReactNode;
}) {
  const { primaryNextAction: action, stepQualifier, overdueCount } = overview;
  const late = stepQualifier === "en_retard";
  const jalon = STEP_LABEL[overview.currentStep];

  const { title, detail } = ((): { title: string; detail: string } => {
    switch (action.kind) {
      case "creer_plan":
        return {
          title: "Le plan d'onboarding n'est pas encore préparé",
          detail: `Noa le génère à partir des éléments définis pendant le recrutement de ${firstName}.`,
        };
      case "verifier_plan":
        return {
          title: "Le plan 30-60-90 attend votre relecture",
          detail: "Sa validation programme les quatre entretiens du parcours.",
        };
      case "definir_date":
        return {
          title: "La date d'arrivée n'est pas fixée",
          detail: "Elle détermine le calendrier des entretiens J1, J30, J60 et J90.",
        };
      case "inviter_preferences":
        return {
          title: `Invitez ${firstName} à décrire ses préférences de travail`,
          detail: "Elles servent à préparer le J1, sans le bloquer.",
        };
      case "preparer_entretien":
      case "realiser_entretien":
        return {
          title: late ? `L'entretien ${jalon} est en retard` : `L'entretien ${jalon} est la prochaine étape`,
          detail: late
            ? overdueCount > 1
              ? `Il doit avoir lieu avant de poursuivre le parcours. ${overdueCount - 1} autre${
                  overdueCount > 2 ? "s étapes sont également dépassées" : " étape est également dépassée"
                }.`
              : "Il doit avoir lieu avant de poursuivre le parcours."
            : INTEGRATION_INTERVIEW_SUBTITLE[action.interviewType as IntegrationInterviewType],
        };
      case "attente_collaborateur":
        return {
          title: `En attente de ${firstName}`,
          detail: "L'invitation aux préférences de travail a été envoyée, la réponse n'est pas encore arrivée.",
        };
      case "aucune":
        return overview.globalStatus === "termine"
          ? { title: "Parcours terminé", detail: "Les 90 premiers jours sont clos. Tout reste consultable." }
          : { title: "Rien à faire dans l'immédiat", detail: `La prochaine étape est l'entretien ${jalon}.` };
    }
  })();

  return (
    <Card
      className={`p-4 mb-5 border ${
        late ? "border-orange-200 bg-orange-50/40" : "border-[#99BAF8]/40 bg-[#99BAF8]/6"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5 min-w-0">
          {late && <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#010101]">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{detail}</p>
          </div>
        </div>
        <div className="flex-shrink-0">{cta}</div>
      </div>
    </Card>
  );
}

// ─── Section repliable ──────────────────────────────────────────────────────

function Section({
  title, summary, defaultOpen, children,
}: {
  title: string;
  /** Ce que la section dit quand elle est repliée. */
  summary: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 mb-4">
      <details open={defaultOpen} className="group">
        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className={SECTION_TITLE}>{title}</p>
            <p className="text-xs text-gray-500 mt-1 truncate">{summary}</p>
          </div>
          <ChevronDown
            size={15}
            className="text-gray-300 flex-shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    </Card>
  );
}

// ─── Ligne de préparatif ────────────────────────────────────────────────────

function PrepRow({
  title, value, action, highlighted,
}: {
  title: string;
  value: string;
  action: React.ReactNode;
  /** Vrai quand c'est le geste mis en avant par le parcours. */
  highlighted: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all ${
        highlighted ? "border-[#99BAF8]/50 bg-[#99BAF8]/6" : "border-gray-100"
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#010101]">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{value}</p>
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
          aria-label="Date d'arrivée"
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
        {pending ? "Préparation…" : "Préparer le plan"}
        {!pending && <ArrowRight size={13} />}
      </Btn>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ─── Fiche ──────────────────────────────────────────────────────────────────

export function IntegrationDetail({
  candidate, missionTitle, overview, timeline, goals, conclusions, preparedInterviewIds,
  preferences, context,
}: {
  candidate: Candidate;
  missionTitle: string | null;
  overview: IntegrationOverview;
  timeline: TimelineStep[];
  goals: OnboardingGoal[];
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
  const sourceLabel = contextSourceLabel(context);
  const preferencesComplete = overview.workPreferencesStatus === "complete";
  const interviewSteps = timeline.filter((s) => s.key !== "avant_arrivee");

  // Les trois préparatifs sont réglés : la section se replie, elle n'a plus
  // qu'une valeur d'archive.
  const prepSettled = preferencesComplete && overview.startDate !== null && overview.planValidated;
  const summary = summarizeGoals(j90Goals);
  const goalsSummary = [
    `${summary.total} objectif${summary.total > 1 ? "s" : ""}`,
    summary.atteints > 0 && `${summary.atteints} atteint${summary.atteints > 1 ? "s" : ""}`,
    summary.partiels > 0 && `${summary.partiels} en progression`,
    summary.bloques > 0 && `${summary.bloques} bloqué${summary.bloques > 1 ? "s" : ""}`,
    summary.nonAtteints > 0 && `${summary.nonAtteints} non commencé${summary.nonAtteints > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  // Le geste du bandeau, quand il y en a un. Les mêmes commandes vivent aussi
  // dans leur section : le bandeau raccourcit le chemin, il ne le remplace pas.
  const bannerCta =
    action.kind === "creer_plan" ? (
      <CreatePlanButton candidateId={candidate.id} />
    ) : action.kind === "inviter_preferences" && onboardingId ? (
      <Btn variant="primary" size="sm" onClick={() => setInviting(true)}>
        Inviter à compléter
      </Btn>
    ) : action.kind === "verifier_plan" ? (
      <Link
        href={`/integrations/${candidate.id}/plan`}
        className="inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all cursor-pointer px-3 py-1.5 text-xs bg-[#010101] text-white hover:opacity-90"
      >
        Vérifier le plan
      </Link>
    ) : (action.kind === "preparer_entretien" || action.kind === "realiser_entretien") &&
      action.interviewType ? (
      <Link
        href={`/integrations/${candidate.id}/entretiens/${action.interviewType.replace("integration_", "")}`}
        className="inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all cursor-pointer px-3 py-1.5 text-xs bg-[#010101] text-white hover:opacity-90"
      >
        {action.label}
      </Link>
    ) : null;

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

        <BackLink href="/integrations" label="Plans d'onboarding" />

        {/* ── En-tête, sans carte : le nom n'a pas besoin d'un cadre ── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              Plan d&apos;onboarding de {name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {missionTitle ?? candidate.title ?? "—"}
              {" · "}
              {overview.startDate ? `Arrivée le ${formatDate(overview.startDate)}` : "Arrivée à définir"}
              {overview.dayNumber !== null && overview.dayNumber > 0 && ` · Jour ${overview.dayNumber} / 90`}
            </p>
          </div>
          <Link
            href={`/candidats/${candidate.id}`}
            className="text-[11px] font-medium text-gray-400 hover:text-[#3a6fd4] hover:underline flex-shrink-0"
          >
            Voir le recrutement
          </Link>
        </div>

        <PriorityBanner overview={overview} firstName={firstName} cta={bannerCta} />

        {/* ── Le parcours ── */}
        <Card className="p-5 mb-4">
          <p className={`${SECTION_TITLE} mb-3`}>Parcours des 90 jours</p>

          <div className="flex flex-col gap-2">
            {interviewSteps.map((step) => {
              const type = interviewTypeOfStep(step.key) as IntegrationInterviewType;
              const style = TIMELINE_STYLE[step.state];
              const isPrepared = step.interview ? prepared.has(step.interview.id) : false;
              const conclusion = step.interview
                ? conclusions.find((c) => c.interview_id === step.interview!.id)
                : undefined;
              const isCurrent = step.state === "courante";

              // Seule l'étape courante porte un qualificatif de temps. Les
              // suivantes restent neutres même si leur date est passée : trois
              // étapes signalées ne disent pas où reprendre.
              const badgeLabel = isCurrent
                ? overview.stepQualifier === "en_retard"
                  ? "En retard"
                  : isPrepared
                  ? "À réaliser"
                  : "À préparer"
                : TIMELINE_STATE_LABEL[step.state];

              return (
                <Link
                  key={step.key}
                  href={`/integrations/${candidate.id}/entretiens/${step.key}`}
                  className={`flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                    isCurrent ? "border-[#99BAF8]/50 bg-[#99BAF8]/6" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${style.dot}`}
                    >
                      {step.state === "termine" ? <Check size={12} /> : step.label}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#010101]">
                        Entretien {step.label}
                        {step.scheduledAt && (
                          <span className="font-normal text-gray-400"> · {formatDate(step.scheduledAt)}</span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {step.state === "termine"
                          ? conclusion
                            ? "Conclu"
                            : "Réalisé"
                          : INTEGRATION_INTERVIEW_SUBTITLE[type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      color={
                        isCurrent && overview.stepQualifier === "en_retard" ? "orange" : style.badge
                      }
                    >
                      {badgeLabel}
                    </Badge>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* ── Avant l'arrivée ── */}
        {overview.globalStatus !== "termine" && (
          <Section
            title="Avant l'arrivée"
            summary={
              prepSettled
                ? "Préférences complétées · Date fixée · Plan validé"
                : "Trois points à régler, dans l'ordre que vous voulez"
            }
            defaultOpen={!prepSettled}
          >
            <div className="flex flex-col gap-2">
              <PrepRow
                title="Préférences de travail"
                value={WORK_PREFERENCES_STATUS_LABEL[overview.workPreferencesStatus]}
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

              <PrepRow
                title="Date d'arrivée"
                value={overview.startDate ? formatDate(overview.startDate) : "À définir"}
                highlighted={action.kind === "definir_date"}
                action={
                  onboardingId ? (
                    <ArrivalDateField onboardingId={onboardingId} current={overview.startDate} />
                  ) : (
                    <Badge color="gray">Après préparation</Badge>
                  )
                }
              />

              <PrepRow
                title="Plan 30-60-90"
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
                      {overview.planValidated ? "Consulter" : "Vérifier le plan"}
                    </Link>
                  ) : (
                    <CreatePlanButton candidateId={candidate.id} />
                  )
                }
              />
            </div>
          </Section>
        )}

        {/* ── Résultats attendus à 90 jours ── */}
        {j90Goals.length > 0 && (
          <Section title="Objectifs à 90 jours" summary={goalsSummary} defaultOpen={false}>
            <div className="flex flex-col">
              {j90Goals.map((goal) => (
                <GoalTracker key={goal.id} goal={goal} />
              ))}
            </div>
          </Section>
        )}

        {/* ── Préférences complétées ── */}
        {preferencesComplete && (
          <WorkPreferencesResult firstName={firstName} context={context} preferences={preferences} />
        )}

        {sourceLabel && !preferencesComplete && (
          <p className="text-[11px] text-gray-400">Préférences : {sourceLabel}.</p>
        )}
      </div>
    </AppLayout>
  );
}
