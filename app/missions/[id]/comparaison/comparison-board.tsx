"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronRight, Circle, Clock, Sparkles } from "lucide-react";
import { Card, Badge, Avatar, LinkBtn } from "@/components/noa/ui-primitives";
import {
  CANDIDATE_STATUS_LABEL, CANDIDATE_BADGE, CANDIDATE_AVATAR_COLOR,
  DECISION_STATUS_LABEL, DECISION_STATUS_COLOR, INTERVIEW_LABEL,
} from "@/lib/noa/labels";
import type { CandidateStatus, DecisionStage, DecisionStatus } from "@/lib/noa/types";

export type ComparisonSkillBlock = {
  category: string;
  label: string;
  items: { id: string; name: string; justification: string | null }[];
};

export type ComparisonDecision = {
  id: string;
  status: DecisionStatus;
  stage: DecisionStage;
  /** Déjà formatée côté serveur : le composant n'a pas à connaître la locale. */
  date: string;
  author: string | null;
  reason: string | null;
};

export type ComparisonCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  status: CandidateStatus;
  score: number | null;
  /** Compétences de la mission retrouvées dans le CV, par identifiant. */
  coveredSkillIds: string[];
  /** Compétences confirmées au premier entretien (critère répondu « Oui »/« Partiel »). */
  screeningValidatedSkillIds: string[];
  /** Compétences confirmées à l'entretien technique, par un exemple vécu. */
  topgradingValidatedSkillIds: string[];
  screeningAdvice: string | null;
  topgradingAdvice: string | null;
  noaOverview: string | null;
  /** Verdict de la recommandation finale ("Recommandation : recruter/à discuter/écarter"), pas encore formulé si null. */
  noaVerdict: string | null;
  decisions: ComparisonDecision[];
};

// Mêmes libellés/tonalités que la fiche de décision finale (decision-finale/
// final-decision-view.tsx) : un même verdict ne doit pas changer de couleur
// selon l'écran où le recruteur le lit.
const VERDICT_STYLE: Record<string, { label: string; badge: "green" | "blue" | "red" }> = {
  "Recommandation : recruter": { label: "Suggestion : recruter", badge: "green" },
  "Recommandation : à discuter": { label: "Suggestion : à discuter", badge: "blue" },
  "Recommandation : écarter": { label: "Suggestion : écarter", badge: "red" },
};

// DECISION_STAGE_LABEL sert de titre ("Premier entretien") ; l'historique, lui,
// se lit comme une phrase ("Retenu à l'issue du premier entretien"), d'où cette
// seconde table au complément de phrase.
const DECISION_STAGE_SENTENCE: Record<DecisionStage, string> = {
  screening: "à l'issue du premier entretien",
  topgrading: "à l'issue de l'entretien technique",
  final: "en décision finale",
};

type SectionKey = "skills" | "interviews" | "decisions";

const SECTION_KEYS: SectionKey[] = ["skills", "interviews", "decisions"];

/**
 * Une seule fiche par candidat, découpée en sections dépliantes. L'état
 * d'ouverture est partagé par toutes les fiches : on compare une section chez
 * l'un et chez l'autre, jamais les compétences d'un candidat face aux
 * décisions d'un autre. Ouvrir « Compétences » l'ouvre donc partout.
 */
function Section({
  id, label, icon, summary, open, onToggle, children,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-black/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center gap-2 py-3.5 text-left cursor-pointer group"
      >
        <ChevronRight
          size={14}
          className={`shrink-0 text-gray-300 group-hover:text-gray-500 transition-all ${open ? "rotate-90" : ""}`}
        />
        {icon}
        <span className="text-xs font-semibold text-[#010101]">{label}</span>
        <span className="ml-auto pl-3 text-[11px] text-gray-400 text-right">{summary}</span>
      </button>
      <div id={id} hidden={!open} className="pb-4 pl-6">
        {children}
      </div>
    </div>
  );
}

// Une bordure de couleur par étape (même bleu/violet que les badges de statut
// candidat) : sur une fiche qui empile 2-3 blocs de texte au ton neutre, c'est
// ce repère qui permet de savoir d'un coup d'oeil de quel entretien on lit la
// synthèse, sans avoir à relire le petit libellé au-dessus.
const STAGE_ACCENT = {
  screening: "border-[#99BAF8] bg-[#99BAF8]/[0.06]",
  topgrading: "border-[#CCB8FF] bg-[#CCB8FF]/[0.08]",
  overview: "border-[#3a6fd4] bg-[#3a6fd4]/[0.04]",
} as const;

const StageBlock = ({ label, text, empty, icon, accent, badge }: {
  label: string;
  text: string | null;
  empty: string;
  icon?: React.ReactNode;
  accent: keyof typeof STAGE_ACCENT;
  badge?: { label: string; color: "green" | "blue" | "red" };
}) => (
  <div className={`mb-3 last:mb-0 rounded-lg border-l-2 pl-2.5 py-2 pr-2 ${STAGE_ACCENT[accent]}`}>
    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1">
      {icon}
      {label}
      {badge && <span className="ml-auto"><Badge color={badge.color}>{badge.label}</Badge></span>}
    </p>
    <p className={`text-xs leading-relaxed ${text ? "text-gray-700" : "text-gray-400"}`}>{text ?? empty}</p>
  </div>
);

// `repérées` couvre les deux sources. Dire « dans le CV » d'un total qui compte
// aussi les compétences confirmées en entretien serait faux : une compétence
// confirmée peut très bien ne figurer nulle part dans le CV.
function coverageSummary(covered: number, validated: number, total: number): string {
  if (total === 0) return "Aucune compétence définie";
  if (validated === 0) return `${covered} sur ${total} dans le CV`;
  const confirmees = validated === 1 ? "1 confirmée" : `${validated} confirmées`;
  return `${covered} sur ${total} repérées, dont ${confirmees} en entretien`;
}

function interviewsSummary(c: ComparisonCandidate): string {
  if (c.screeningAdvice && c.topgradingAdvice) return "Les deux entretiens sont synthétisés";
  if (c.screeningAdvice) return "Premier entretien seulement";
  if (c.topgradingAdvice) return "Entretien technique seulement";
  return "Pas encore de synthèse";
}

function decisionsSummary(count: number): string {
  if (count === 0) return "Aucune décision";
  return count === 1 ? "1 décision tracée" : `${count} décisions tracées`;
}

function CandidateCard({
  candidate: c, skillBlocks, totalSkills, open, onToggle,
}: {
  candidate: ComparisonCandidate;
  skillBlocks: ComparisonSkillBlock[];
  totalSkills: number;
  open: Record<SectionKey, boolean>;
  onToggle: (key: SectionKey) => void;
}) {
  const decided = c.status === "Recrute" || c.status === "Non retenu";
  const covered = new Set(c.coveredSkillIds);
  const confirmedAt = { screening: new Set(c.screeningValidatedSkillIds), topgrading: new Set(c.topgradingValidatedSkillIds) };
  const validated = new Set([...c.screeningValidatedSkillIds, ...c.topgradingValidatedSkillIds]);
  const coveredOrValidated = new Set([...c.coveredSkillIds, ...validated]);
  const verdictStyle = c.noaVerdict ? VERDICT_STYLE[c.noaVerdict] : undefined;

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar
          initials={c.initials}
          color={CANDIDATE_AVATAR_COLOR[c.status] ?? "bg-gray-100 text-gray-500"}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/candidats/${c.id}`}
            className="block text-base font-bold text-[#010101] hover:text-[#3a6fd4] transition-colors truncate"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {c.firstName} {c.lastName}
          </Link>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="text-[11px] text-gray-400">{decided ? "Décision prise" : "Étape en cours"}</span>
            <Badge color={CANDIDATE_BADGE[c.status]}>{CANDIDATE_STATUS_LABEL[c.status]}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 mb-1">
        {c.score !== null ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
              <span>Note globale</span>
              <span className="font-bold text-gray-500 tabular-nums">{c.score} sur 100</span>
            </div>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-[#99BAF8]" style={{ width: `${c.score}%` }} />
            </div>
          </>
        ) : (
          <p className="text-[11px] text-gray-400">{`Pas encore de note pour ${c.firstName}.`}</p>
        )}
      </div>

      <div className="mt-3">
        <Section
          id={`${c.id}-skills`}
          label="Compétences attendues"
          summary={coverageSummary(coveredOrValidated.size, validated.size, totalSkills)}
          open={open.skills}
          onToggle={() => onToggle("skills")}
        >
          {skillBlocks.length === 0 ? (
            <p className="text-xs text-gray-400">Aucune compétence n&apos;a encore été définie pour cette campagne.</p>
          ) : (
            skillBlocks.map((block) => (
              <div key={block.category} className="mb-4 last:mb-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{block.label}</p>
                <ul className="flex flex-col gap-1.5">
                  {block.items.map((skill) => {
                    const isValidated = validated.has(skill.id);
                    const isCovered = covered.has(skill.id);
                    // Le pourquoi de la compétence reste lisible au survol : il
                    // disparaissait dès qu'il y avait quelque chose à dire sur
                    // le candidat, c'est-à-dire quand il servait le plus.
                    // Dire À QUEL entretien la compétence a été confirmée : « au
                    // premier entretien » et « à l'entretien technique » ne valent
                    // pas la même chose, la seconde reposant sur un exemple vécu.
                    const stages = [
                      confirmedAt.screening.has(skill.id) ? INTERVIEW_LABEL.screening.toLowerCase() : null,
                      confirmedAt.topgrading.has(skill.id) ? INTERVIEW_LABEL.topgrading.toLowerCase() : null,
                    ].filter(Boolean);
                    const provenance = stages.length > 0
                      ? `Confirmée au ${stages.join(" et au ")}`
                      : isCovered
                        ? "Repérée dans le CV, pas encore confirmée en entretien"
                        : null;
                    const title = [provenance, skill.justification].filter(Boolean).join("\n\n") || undefined;
                    return (
                      <li key={skill.id} className="flex items-start gap-2">
                        {/* Une seule coche, d'une seule couleur : la marque dit
                            « cette compétence est couverte », un point c'est
                            tout. D'où vient cette couverture — un exemple donné
                            en entretien, ou une mention de CV — se lit dans la
                            phrase au survol et dans le résumé de la section,
                            pas dans une nuance de vert ou de bleu. */}
                        {isValidated || isCovered ? (
                          <Check size={13} className="text-[#3a6fd4] mt-0.5 shrink-0" />
                        ) : (
                          <Circle size={13} className="text-gray-200 mt-0.5 shrink-0" />
                        )}
                        <span
                          className={`text-xs leading-snug ${isValidated || isCovered ? "text-[#010101]" : "text-gray-400"}`}
                          title={title}
                        >
                          {skill.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </Section>

        <Section
          id={`${c.id}-interviews`}
          label="Synthèses d'entretien"
          summary={interviewsSummary(c)}
          open={open.interviews}
          onToggle={() => onToggle("interviews")}
        >
          <StageBlock
            label="Premier entretien"
            text={c.screeningAdvice}
            empty={`Le premier entretien de ${c.firstName} n'a pas encore été synthétisé.`}
            accent="screening"
          />
          <StageBlock
            label="Entretien technique"
            text={c.topgradingAdvice}
            empty={`L'entretien technique de ${c.firstName} n'a pas encore été synthétisé.`}
            accent="topgrading"
          />
          <StageBlock
            label="Ce que noa retient de l'ensemble"
            icon={<Sparkles size={11} className="text-[#3a6fd4]" />}
            text={c.noaOverview}
            empty={`noa n'a pas encore d'avis d'ensemble sur ${c.firstName}.`}
            accent="overview"
            badge={verdictStyle ? { label: verdictStyle.label, color: verdictStyle.badge } : undefined}
          />
        </Section>

        <Section
          id={`${c.id}-decisions`}
          label="Décisions déjà prises"
          icon={<Clock size={12} className="text-gray-400" />}
          summary={decisionsSummary(c.decisions.length)}
          open={open.decisions}
          onToggle={() => onToggle("decisions")}
        >
          {c.decisions.length === 0 ? (
            <p className="text-xs text-gray-400">
              {`Aucune décision n'a encore été prise pour ${c.firstName}.`}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {c.decisions.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge color={DECISION_STATUS_COLOR[d.status]}>{DECISION_STATUS_LABEL[d.status]}</Badge>
                    <span className="text-xs text-gray-500">{DECISION_STAGE_SENTENCE[d.stage]}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {d.author ? `Le ${d.date}, par ${d.author}.` : `Le ${d.date}.`}
                  </p>
                  {d.reason && <p className="text-xs text-gray-600 mt-1 leading-snug">{d.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-auto pt-4 border-t border-black/[0.06] flex flex-col gap-2.5">
        {c.status === "Recrute" ? (
          <p className="text-xs text-gray-600 leading-relaxed">
            {`Le recrutement de ${c.firstName} ${c.lastName} est acté pour ce poste.`}
          </p>
        ) : c.status === "Non retenu" ? (
          <p className="text-xs text-gray-600 leading-relaxed">
            {`La candidature de ${c.firstName} ${c.lastName} n'a pas été retenue pour ce poste.`}
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-400 leading-relaxed">
              {`La décision finale concernant ${c.firstName} reste à prendre.`}
            </p>
            <LinkBtn href={`/candidats/${c.id}/decision-finale`} variant="secondary" size="sm" className="w-fit">
              {`Décider pour ${c.firstName}`}
            </LinkBtn>
          </>
        )}
      </div>
    </Card>
  );
}

export function ComparisonBoard({
  candidates, skillBlocks, totalSkills,
}: {
  candidates: ComparisonCandidate[];
  skillBlocks: ComparisonSkillBlock[];
  totalSkills: number;
}) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    // Seul l'historique des décisions est déplié d'emblée : c'est la section la
    // plus courte, quand la liste des compétences et les textes de synthèse
    // rallongent vite la fiche. Leur résumé en tête de section suffit à
    // comparer sans rien ouvrir.
    skills: false,
    interviews: false,
    decisions: true,
  });

  const allOpen = SECTION_KEYS.every((key) => open[key]);
  const toggle = (key: SectionKey) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = () => {
    const next = !allOpen;
    setOpen({ skills: next, interviews: next, decisions: next });
  };

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={toggleAll}
          className="shrink-0 text-xs font-semibold text-gray-400 hover:text-[#010101] transition-colors cursor-pointer"
        >
          {allOpen ? "Tout replier" : "Tout déplier"}
        </button>
      </div>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${Math.max(candidates.length, 1)}, minmax(0, 1fr))` }}
      >
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            skillBlocks={skillBlocks}
            totalSkills={totalSkills}
            open={open}
            onToggle={toggle}
          />
        ))}
      </div>
    </>
  );
}
