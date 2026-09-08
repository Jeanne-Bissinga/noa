"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Search, UserCheck } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar } from "@/components/noa/ui-primitives";
import { CANDIDATE_AVATAR_COLOR, formatDate, initials as initialsOf } from "@/lib/noa/labels";
import {
  OVERVIEW_FILTER_LABEL,
  STEP_LABEL,
  WORK_PREFERENCES_STATUS_LABEL,
  matchesFilter,
  matchesSearch,
  requiresManagerAction,
  type IntegrationOverview,
  type OverviewFilter,
} from "@/lib/noa/onboarding/overview";
import type { Candidate } from "@/lib/noa/types";

// Tableau de pilotage des intégrations.
//
// Six colonnes : Personne · Poste · Étape actuelle · Préférences · Point
// d'attention · Prochaine action. Il n'y a plus de badge de statut — c'est lui
// qui affichait « Plan à valider » à côté d'une étape « Plan à préparer ».
// Une ligne porte une étape et une action, jamais deux vocabulaires pour le
// même état.
//
// Ce composant filtre, trie et rend. Il ne calcule aucun statut : tout vient de
// getIntegrationOverview, la même fonction que la fiche individuelle.

export interface IntegrationRow {
  candidate: Candidate;
  missionTitle: string | null;
  overview: IntegrationOverview;
}

const FILTERS: OverviewFilter[] = [
  "tous",
  "action_requise",
  "a_preparer",
  "en_cours",
  "preferences_en_attente",
  "attention",
  "termines",
];

export function IntegrationsBoard({ rows }: { rows: IntegrationRow[] }) {
  const [filter, setFilter] = useState<OverviewFilter>("tous");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      rows
        .filter((r) => matchesFilter(r.overview, filter))
        .filter((r) => matchesSearch(r.candidate, r.missionTitle, query))
        .sort(
          (a, b) =>
            a.overview.sortWeight - b.overview.sortWeight ||
            // À rang égal, l'échéance la plus proche d'abord ; les lignes sans
            // calendrier ferment la marche.
            (a.overview.nextDueAt ?? "9999").localeCompare(b.overview.nextDueAt ?? "9999") ||
            a.candidate.last_name.localeCompare(b.candidate.last_name, "fr"),
        ),
    [rows, filter, query],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f, rows.filter((r) => matchesFilter(r.overview, f)).length]),
      ) as Record<OverviewFilter, number>,
    [rows],
  );

  return (
    <AppLayout headerTitle="Intégrations">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
            Intégrations
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Suivez l&apos;avancement des nouvelles recrues pendant leurs 90 premiers jours.
          </p>
        </div>

        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par prénom, nom ou poste"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] transition-all bg-white placeholder-gray-300 text-black"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap mb-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-[#010101] border-[#010101] text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {OVERVIEW_FILTER_LABEL[f]}
              <span className={`ml-1.5 ${filter === f ? "text-white/60" : "text-gray-300"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <UserCheck size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-[#010101]">Aucune personne recrutée pour l&apos;instant</p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Les candidats passés au statut « Recruté » apparaîtront ici avec leur intégration.
            </p>
          </Card>
        ) : visible.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-gray-400">Aucune personne ne correspond à ce filtre.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {visible.map(({ candidate, missionTitle, overview }) => {
              const name = `${candidate.first_name} ${candidate.last_name}`;
              const avatarColor = CANDIDATE_AVATAR_COLOR[candidate.status] ?? "bg-gray-100 text-gray-500";
              const actionable = requiresManagerAction(overview.primaryNextAction);

              return (
                <Link
                  key={candidate.id}
                  href={`/integrations/${candidate.id}`}
                  className="block bg-white rounded-2xl border border-black/[0.06] hover:border-gray-200 transition-all p-4"
                >
                  <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-4 items-center">
                    {/* Personne et poste */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        initials={initialsOf(candidate.first_name, candidate.last_name)}
                        color={avatarColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#010101] truncate">{name}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {missionTitle ?? candidate.title ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Étape actuelle */}
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400">Étape</p>
                      <p className="text-xs font-semibold text-[#010101] truncate">
                        {STEP_LABEL[overview.currentStep]}
                      </p>
                      {overview.dayNumber !== null && overview.dayNumber > 0 ? (
                        <p className="text-[10px] text-gray-400 mt-0.5">Jour {overview.dayNumber} / 90</p>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {overview.startDate ? `Arrivée le ${formatDate(overview.startDate)}` : "Arrivée à définir"}
                        </p>
                      )}
                    </div>

                    {/* Préférences */}
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400">Préférences</p>
                      <p className="text-xs font-medium text-gray-600 truncate">
                        {WORK_PREFERENCES_STATUS_LABEL[overview.workPreferencesStatus]}
                      </p>
                    </div>

                    {/* Point d'attention et prochaine action */}
                    <div className="min-w-0">
                      {overview.attentionCount > 0 ? (
                        <p className="text-[11px] font-semibold text-orange-500 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {overview.attentionCount} point{overview.attentionCount > 1 ? "s" : ""} d&apos;attention
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-300">Aucun point d&apos;attention</p>
                      )}
                      <p
                        className={`text-xs mt-1 truncate ${
                          actionable ? "font-semibold text-[#3a6fd4]" : "text-gray-400"
                        }`}
                      >
                        {overview.primaryNextAction.label}
                      </p>
                    </div>

                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
