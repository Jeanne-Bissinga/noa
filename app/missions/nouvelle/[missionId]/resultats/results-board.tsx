"use client";

import { useState, useTransition } from "react";
import {
  ChevronRight, Plus, X, Zap, Target, AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, LinkBtn, BackLink, StepBar } from "@/components/noa/ui-primitives";
import {
  addObjective, updateObjective, removeObjective, fillObjectiveSuggestions, regenerateObjectiveSuggestions, getObjectiveSuggestions,
} from "../actions";
import type { Mission, MissionObjective } from "@/lib/noa/types";
import type { ObjectiveSuggestion } from "@/lib/noa/ai";

const MAX_CARD_SUGGESTIONS = 3;

const isVague = (o: MissionObjective) =>
  o.label.length > 3 && (!o.metric?.trim() || !o.deadline?.trim() || !o.threshold?.trim());

// Une carte est "vierge" quand elle vient d'être ajoutée manuellement (aucun
// champ rempli) : c'est la seule situation où proposer des suggestions noa a
// du sens. Une carte déjà générée par noa, ou déjà éditée par le recruteur,
// n'a pas besoin qu'on lui en resuggère.
const isBlank = (o: MissionObjective) =>
  !o.label.trim() && !o.metric?.trim() && !o.deadline?.trim() && !o.threshold?.trim();

function ObjCard({
  obj, index, missionId, onLocalUpdate, onRemove, suggestions, loadingSuggestions, onRequestSuggestions,
}: {
  obj: MissionObjective; index: number; missionId: string;
  onLocalUpdate: (id: string, fields: Partial<MissionObjective>) => void;
  onRemove: (id: string) => void;
  suggestions: ObjectiveSuggestion[] | null;
  loadingSuggestions: boolean;
  onRequestSuggestions: () => void;
}) {
  const [showSug, setShowSug] = useState(false);
  const [, startTransition] = useTransition();
  const vague = isVague(obj);
  const blank = isBlank(obj);

  const commit = (fields: { label?: string; metric?: string; deadline?: string; threshold?: string }) => {
    startTransition(() => {
      updateObjective(obj.id, missionId, fields);
    });
  };

  const applySuggestion = (s: ObjectiveSuggestion) => {
    const fields = { label: s.label, metric: s.metric, deadline: s.deadline, threshold: s.threshold };
    onLocalUpdate(obj.id, fields);
    commit(fields);
    setShowSug(false);
  };

  const toggleSuggestions = () => {
    setShowSug((o) => !o);
    if (!suggestions && !loadingSuggestions) onRequestSuggestions();
  };

  return (
    <Card className={`p-4 transition-all ${vague ? "border-orange-200 bg-orange-50/20" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Objectif {index + 1}</span>
        <button
          onClick={() => {
            onRemove(obj.id);
            startTransition(() => { removeObjective(obj.id, missionId); });
          }}
          className="p-1 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-all"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          value={obj.label}
          onChange={(e) => onLocalUpdate(obj.id, { label: e.target.value })}
          onBlur={(e) => commit({ label: e.target.value })}
          placeholder="Intitulé de l'objectif"
          className="flex-1 text-sm font-semibold bg-transparent focus:outline-none text-[#010101] placeholder-gray-200"
        />
        {blank && (
          <button
            onClick={toggleSuggestions}
            title="Obtenir des suggestions noa"
            className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
              showSug ? "bg-[#99BAF8] text-[#010101]" : "bg-[#99BAF8] text-blue-600 hover:bg-[#99BAF8]/20 hover:text-[#3a6fd4]"
            }`}
          >
            <Zap size={11} />
          </button>
        )}
      </div>

      {showSug && blank && (
        <div className="mb-3 bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a6fd4] mb-2">Suggestions noa</p>
          {loadingSuggestions && !suggestions ? (
            <p className="text-xs text-gray-400">noa réfléchit…</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(suggestions ?? []).slice(0, MAX_CARD_SUGGESTIONS).map((s) => (
                <div key={s.label} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[#010101]">{s.label}</p>
                    <p className="text-[10px] text-gray-400">{s.metric} · {s.deadline} · {s.threshold}</p>
                  </div>
                  <button
                    onClick={() => applySuggestion(s)}
                    className="text-[10px] font-bold text-[#3a6fd4] hover:underline whitespace-nowrap flex-shrink-0 pt-0.5"
                  >
                    Utiliser
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {([
          ["metric", obj.metric ?? ""],
          ["deadline", obj.deadline ?? ""],
          ["threshold", obj.threshold ?? ""],
        ] as const).map(([k, val], ki) => (
          <div key={k} className="flex flex-col gap-1">
            <input
              value={val}
              onChange={(e) => onLocalUpdate(obj.id, { [k]: e.target.value } as Partial<MissionObjective>)}
              onBlur={(e) => commit({ [k]: e.target.value })}
              placeholder={["Métrique", "Délai", "Seuil de réussite"][ki]}
              className="text-xs bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/30 text-gray-600 placeholder-gray-300"
            />
            {obj.label.length > 3 && !val.trim() && (
              <span className="flex items-center gap-1 text-orange-400 text-[10px] px-1">
                <AlertTriangle size={9} />
                {["Ajouter une métrique", "Préciser un délai", "Définir un seuil"][ki]}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ResultsBoard({ mission, objectives: initialObjectives }: { mission: Mission; objectives: MissionObjective[] }) {
  const [objectives, setObjectives] = useState<MissionObjective[]>(initialObjectives);
  const [filling, setFilling] = useState(false);
  const [cardSuggestions, setCardSuggestions] = useState<ObjectiveSuggestion[] | null>(null);
  const [loadingCardSuggestions, setLoadingCardSuggestions] = useState(false);
  const [, startTransition] = useTransition();

  const localUpdate = (id: string, fields: Partial<MissionObjective>) =>
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...fields } : o)));

  const localRemove = (id: string) => setObjectives((prev) => prev.filter((o) => o.id !== id));

  const handleAdd = () => {
    startTransition(async () => {
      const created = await addObjective(mission.id, objectives.length);
      if (created) setObjectives((prev) => [...prev, created]);
    });
  };

  // Chargées une seule fois (paresseusement, au premier clic sur une carte
  // vierge) puis partagées par toutes les cartes : un seul appel noa pour
  // toute la grille plutôt qu'un par carte.
  const handleRequestCardSuggestions = () => {
    if (cardSuggestions || loadingCardSuggestions) return;
    setLoadingCardSuggestions(true);
    startTransition(async () => {
      const result = await getObjectiveSuggestions(mission.id);
      setCardSuggestions(result);
      setLoadingCardSuggestions(false);
    });
  };

  const handleFillSuggestions = () => {
    setFilling(true);
    startTransition(async () => {
      const created = await fillObjectiveSuggestions(mission.id, objectives.length);
      setObjectives((prev) => [...prev, ...created]);
      setFilling(false);
    });
  };

  // "Challenge" les KPI existants : à utiliser quand la vision du recruteur
  // (résumé exécutif) a été revue depuis leur dernière génération. Destructif
  // (remplace tout), d'où la confirmation avant l'appel.
  const handleRegenerate = () => {
    if (!window.confirm("noa va remplacer tous les objectifs actuels par une nouvelle proposition basée sur la mission à jour. Les éditions manuelles seront perdues. Continuer ?")) {
      return;
    }
    setFilling(true);
    startTransition(async () => {
      const created = await regenerateObjectiveSuggestions(mission.id);
      setObjectives(created);
      setFilling(false);
    });
  };

  const isEmpty = objectives.length === 0;

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/missions/nouvelle/${mission.id}/resume`} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={2} /></div>
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Résultats attendus</h1>
            <p className="text-gray-400 text-sm">Définissez les objectifs mesurables attendus pour ce poste dans les 6 premiers mois.</p>
          </div>
          {!isEmpty && (
            <button
              onClick={handleRegenerate}
              disabled={filling}
              title="Si la mission a changé, remplace les objectifs actuels par une nouvelle proposition noa"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] bg-[#99BAF8]/10 hover:bg-[#99BAF8]/20 px-3 py-2 rounded-xl transition-all disabled:opacity-60 flex-shrink-0 whitespace-nowrap"
            >
              <Zap size={12} />
              {filling ? "noa régénère…" : "Régénérer avec noa"}
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 rounded-2xl mb-5 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#99BAF8]/10 flex items-center justify-center">
              <Target size={24} className="text-[#99BAF8]" />
            </div>
            <div className="text-center max-w-xs">
              <p className="font-semibold text-[#010101] text-sm mb-1">Aucun objectif défini</p>
              <p className="text-xs text-gray-400 leading-relaxed">noa peut vous proposer des objectifs mesurables adaptés au poste et à la mission que vous avez définie.</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleFillSuggestions}
                disabled={filling}
                className="flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60"
              >
                <Zap size={14} />
                {filling ? "noa rédige…" : "Laisser noa suggérer"}
              </button>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:border-gray-300 transition-all"
              >
                <Plus size={14} />
                Ajouter manuellement
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {objectives.map((obj, i) => {
                const usedLabels = new Set(objectives.map((o) => o.label));
                const availableSuggestions = cardSuggestions?.filter((s) => !usedLabels.has(s.label)) ?? null;
                return (
                  <ObjCard
                    key={obj.id}
                    obj={obj}
                    index={i}
                    missionId={mission.id}
                    onLocalUpdate={localUpdate}
                    onRemove={localRemove}
                    suggestions={availableSuggestions}
                    loadingSuggestions={loadingCardSuggestions}
                    onRequestSuggestions={handleRequestCardSuggestions}
                  />
                );
              })}
            </div>
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-[#99BAF8] hover:text-[#3a6fd4] transition-all mb-8"
            >
              <Plus size={15} />
              Ajouter un objectif
            </button>
          </>
        )}

        <div className="flex justify-end mt-2">
          {isEmpty ? (
            <Btn variant="primary" size="lg" disabled>
              Continuer<ChevronRight size={17} />
            </Btn>
          ) : (
            <LinkBtn href={`/missions/nouvelle/${mission.id}/competences`} variant="primary" size="lg">
              Continuer<ChevronRight size={17} />
            </LinkBtn>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
