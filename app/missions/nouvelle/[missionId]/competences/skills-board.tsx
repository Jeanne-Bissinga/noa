"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Plus, Check, Zap, Award } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, LinkBtn, BackLink, StepBar } from "@/components/noa/ui-primitives";
import { toggleSkill, addCustomSkill, fillSkillSuggestions } from "../actions";
import type { Mission, MissionSkill, MissionSkillCategory } from "@/lib/noa/types";
import type { SkillSuggestions } from "@/lib/noa/ai";

// Uniquement les métadonnées d'affichage par catégorie : les compétences
// elles-mêmes viennent du pool noa (jusqu'à 8 par catégorie, cf.
// generateSkillSuggestions) et de mission_skills (sélection retenue par le
// recruteur), jamais d'un catalogue générique statique.
const SKILLS_META: { category: MissionSkillCategory; title: string; badge: string }[] = [
  { category: "technique", title: "Compétences techniques", badge: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/20" },
  { category: "relationnelle", title: "Compétences relationnelles", badge: "bg-[#CCB8FF]/15 text-[#6b4ec4] border-[#CCB8FF]/20" },
  { category: "comportementale", title: "Compétences comportementales", badge: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/20" },
];

export function SkillsBoard({ mission, skills: initialSkills }: { mission: Mission; skills: MissionSkill[] }) {
  const [skills, setSkills] = useState<MissionSkill[]>(initialSkills);
  const [pool, setPool] = useState<SkillSuggestions | null>(null);
  const [filling, setFilling] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<MissionSkillCategory, string>>({
    technique: "", relationnelle: "", comportementale: "",
  });
  const [, startTransition] = useTransition();

  // Tant que le pool n'a pas été demandé et qu'aucune compétence n'existe
  // encore, on reste sur l'accroche "Laisser noa suggérer" plutôt que sur la
  // grille par catégorie.
  const isEmpty = skills.length === 0 && !pool;

  const handleToggle = (category: MissionSkillCategory, name: string) => {
    const existing = skills.find((s) => s.category === category && s.name === name);
    const position = skills.filter((s) => s.category === category).length;

    if (existing) {
      setSkills((prev) => prev.filter((s) => s.id !== existing.id));
    } else {
      // optimistic placeholder; replaced with the real row once the action resolves.
      // id dérivé de (category, name) : unique (un skill déjà présent part par la
      // branche `existing`) et déterministe, donc pas d'appel impur au rendu.
      const optimistic: MissionSkill = { id: `optimistic-${category}-${name}`, mission_id: mission.id, category, name, position };
      setSkills((prev) => [...prev, optimistic]);
    }

    startTransition(async () => {
      const created = await toggleSkill(mission.id, category, name, Boolean(existing), position);
      if (created) {
        setSkills((prev) => prev.map((s) => (s.name === name && s.category === category && s.id.startsWith("optimistic-") ? created : s)));
      }
    });
  };

  const handleAddCustom = (category: MissionSkillCategory) => {
    const name = customInputs[category].trim();
    if (!name) return;
    if (skills.some((s) => s.category === category && s.name === name)) return;

    const position = skills.filter((s) => s.category === category).length;
    setCustomInputs((prev) => ({ ...prev, [category]: "" }));

    startTransition(async () => {
      const created = await addCustomSkill(mission.id, category, name, position);
      if (created) setSkills((prev) => [...prev, created]);
    });
  };

  // Ne pré-sélectionne (insère en base) que les compétences indispensables ;
  // le pool complet (indispensables + complémentaires, jusqu'à 8/catégorie)
  // est gardé en état local pour afficher aussi les suggestions à cocher.
  const handleFillSuggestions = () => {
    setFilling(true);
    startTransition(async () => {
      const { inserted, pool: freshPool } = await fillSkillSuggestions(mission.id);
      setSkills((prev) => [...prev, ...inserted]);
      setPool(freshPool);
      setFilling(false);
    });
  };

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/missions/nouvelle/${mission.id}/resultats`} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={3} /></div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Compétences requises</h1>
        <p className="text-gray-400 text-sm mb-7">Définissez les compétences clés attendues pour ce poste.</p>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 rounded-2xl mb-5 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#CCB8FF]/10 flex items-center justify-center">
              <Award size={24} className="text-[#CCB8FF]" />
            </div>
            <div className="text-center max-w-xs">
              <p className="font-semibold text-[#010101] text-sm mb-1">Aucune compétence définie</p>
              <p className="text-xs text-gray-400 leading-relaxed">noa peut vous proposer les compétences clés adaptées au poste et à la mission que vous avez définie.</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleFillSuggestions}
                disabled={filling}
                className="flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60"
              >
                <Zap size={14} />
                {filling ? "noa analyse…" : "Laisser noa suggérer"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-8">
            {!pool && (
              <div className="flex justify-end -mb-1">
                <button
                  onClick={handleFillSuggestions}
                  disabled={filling}
                  title="Affiche jusqu'à 8 compétences suggérées par catégorie, dont celles jugées indispensables déjà cochées"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] bg-[#99BAF8]/10 hover:bg-[#99BAF8]/20 px-3 py-2 rounded-xl transition-all disabled:opacity-60"
                >
                  <Zap size={12} />
                  {filling ? "noa suggère…" : "Voir les suggestions noa"}
                </button>
              </div>
            )}
            {SKILLS_META.map((cat) => {
              const catSkills = skills.filter((s) => s.category === cat.category);
              const selectedNames = new Set(catSkills.map((s) => s.name));
              const poolItems = pool?.[cat.category] ?? [];
              // Suggestions du pool non retenues : affichées non cochées, à choisir.
              const unselectedPool = poolItems.filter((p) => !selectedNames.has(p.name));
              // Compétences retenues qui ne viennent pas du pool (ajout manuel,
              // ou sélection d'une session précédente) : toujours affichées.
              const poolNames = new Set(poolItems.map((p) => p.name));
              const customSelected = catSkills.filter((s) => !poolNames.has(s.name));
              const checkedCount = catSkills.length;
              return (
                <Card key={cat.category} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${cat.badge}`}>
                      {cat.title}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">{checkedCount} sélectionnée{checkedCount > 1 ? "s" : ""}</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {catSkills.length === 0 && unselectedPool.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Aucune compétence pour cette catégorie.</p>
                      )}
                      {customSelected.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleToggle(cat.category, s.name)}
                          title="Retirer"
                          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all bg-[#010101] text-white border-[#010101] hover:bg-gray-800"
                        >
                          <Check size={9} className="inline mr-1 mb-0.5" />
                          {s.name}
                        </button>
                      ))}
                      {poolItems.map((p) => {
                        const active = selectedNames.has(p.name);
                        return (
                          <button
                            key={p.name}
                            onClick={() => handleToggle(cat.category, p.name)}
                            title={active ? "Retirer" : "Ajouter (suggestion noa)"}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                              active
                                ? "bg-[#010101] text-white border-[#010101] hover:bg-gray-800"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {active && <Check size={9} className="inline mr-1 mb-0.5" />}
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1 border-t border-gray-100">
                      <input
                        value={customInputs[cat.category]}
                        onChange={(e) => setCustomInputs((prev) => ({ ...prev, [cat.category]: e.target.value }))}
                        placeholder="Ajouter une compétence…"
                        className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#99BAF8] placeholder-gray-300"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustom(cat.category);
                          }
                        }}
                      />
                      <button
                        className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                        onClick={() => handleAddCustom(cat.category)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!isEmpty && (
          <div className="flex justify-end">
            <LinkBtn href={`/missions/nouvelle/${mission.id}/coherence`} variant="primary" size="lg">Voir le récapitulatif<ChevronRight size={17} /></LinkBtn>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
