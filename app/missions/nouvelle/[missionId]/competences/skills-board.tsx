"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Plus, Check, Zap, Award } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, LinkBtn, BackLink, StepBar } from "@/components/noa/ui-primitives";
import { toggleSkill, addCustomSkill, fillSkillSuggestions } from "../actions";
import type { Mission, MissionSkill, MissionSkillCategory } from "@/lib/noa/types";

const SKILLS_CATALOGUE: { category: MissionSkillCategory; title: string; badge: string; catalogue: string[] }[] = [
  {
    category: "technique",
    title: "Compétences techniques",
    badge: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/20",
    catalogue: [
      "TypeScript / JavaScript avancé", "React & Next.js", "Node.js / API REST",
      "PostgreSQL ou équivalent", "Tests unitaires (Jest, Vitest)", "CI/CD (GitHub Actions, Docker)",
      "GraphQL", "Redis", "AWS / GCP", "Kubernetes", "Python", "Architecture microservices",
      "Docker", "MongoDB", "Terraform", "Elasticsearch",
    ],
  },
  {
    category: "relationnelle",
    title: "Compétences relationnelles",
    badge: "bg-[#CCB8FF]/15 text-[#6b4ec4] border-[#CCB8FF]/20",
    catalogue: [
      "Communication claire avec des non-techniques", "Autonomie sur des sujets complexes",
      "Feedback constructif en code review", "Facilitation de décisions techniques en équipe",
      "Écoute active", "Gestion des conflits", "Influence sans autorité", "Présentation en comité",
      "Négociation", "Intelligence émotionnelle", "Travail en équipe cross-fonctionnelle",
    ],
  },
  {
    category: "comportementale",
    title: "Compétences comportementales",
    badge: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/20",
    catalogue: [
      "Orienté livraison et résultats", "Curiosité et veille technologique",
      "Fiabilité dans les engagements", "Capacité à gérer l'ambiguïté",
      "Initiative", "Résilience", "Vision long terme", "Exemplarité",
      "Ownership", "Adaptabilité", "Rigueur", "Esprit critique",
    ],
  },
];

export function SkillsBoard({ mission, skills: initialSkills }: { mission: Mission; skills: MissionSkill[] }) {
  const [skills, setSkills] = useState<MissionSkill[]>(initialSkills);
  const [filling, setFilling] = useState(false);
  const [customInputs, setCustomInputs] = useState<Record<MissionSkillCategory, string>>({
    technique: "", relationnelle: "", comportementale: "",
  });
  const [, startTransition] = useTransition();

  const isEmpty = skills.length === 0;

  const handleToggle = (category: MissionSkillCategory, name: string) => {
    const existing = skills.find((s) => s.category === category && s.name === name);
    const position = skills.filter((s) => s.category === category).length;

    if (existing) {
      setSkills((prev) => prev.filter((s) => s.id !== existing.id));
    } else {
      // optimistic placeholder; replaced with the real row once the action resolves
      const optimistic: MissionSkill = { id: `optimistic-${Date.now()}`, mission_id: mission.id, category, name, position };
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

  const handleFillSuggestions = () => {
    setFilling(true);
    startTransition(async () => {
      const created = await fillSkillSuggestions(mission.id);
      setSkills((prev) => [...prev, ...created]);
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
            {SKILLS_CATALOGUE.map((cat) => {
              const catSkills = skills.filter((s) => s.category === cat.category);
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
                      {cat.catalogue.map((name) => {
                        const active = catSkills.some((s) => s.name === name);
                        return (
                          <button
                            key={name}
                            onClick={() => handleToggle(cat.category, name)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                              active
                                ? "bg-[#010101] text-white border-[#010101]"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {active && <Check size={9} className="inline mr-1 mb-0.5" />}
                            {name}
                          </button>
                        );
                      })}
                      {catSkills.filter((s) => !cat.catalogue.includes(s.name)).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleToggle(cat.category, s.name)}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all bg-[#010101] text-white border-[#010101]"
                        >
                          <Check size={9} className="inline mr-1 mb-0.5" />
                          {s.name}
                        </button>
                      ))}
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
