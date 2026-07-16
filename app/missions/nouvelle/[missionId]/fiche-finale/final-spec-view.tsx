"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check, Edit3, FileText, Target, Award, Plus } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, LinkBtn } from "@/components/noa/ui-primitives";
import { saveFinalSpec } from "../actions";
import type { Mission, MissionObjective } from "@/lib/noa/types";

export function FinalSpecView({
  mission, companyName, reasonLabel, dateLabel, objectives, skillsByCategory, finalSpecText,
}: {
  mission: Mission;
  companyName: string;
  reasonLabel: string;
  dateLabel: string;
  objectives: MissionObjective[];
  skillsByCategory: { category: string; label: string; items: string[] }[];
  finalSpecText: string;
}) {
  const [copied, setCopied] = useState(false);

  // Persist the composed final spec the first time this screen is reached
  // (mission.final_spec_text was null), without needing an explicit save action.
  useEffect(() => {
    if (!mission.final_spec_text) {
      saveFinalSpec(mission.id, finalSpecText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalSpecText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{mission.title}</h1>
            </div>
            <p className="text-gray-400 text-sm">{companyName} · {reasonLabel} · {dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                copied
                  ? "bg-[#75DA9F]/15 border-[#75DA9F]/30 text-[#1e8f52]"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-[#010101]"
              }`}
            >
              {copied ? <Check size={13} /> : <FileText size={13} />}
              {copied ? "Copié !" : "Copier la fiche"}
            </button>
            <LinkBtn href={`/missions/nouvelle/${mission.id}/coherence`} variant="secondary" size="sm"><Edit3 size={13} />Modifier</LinkBtn>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#99BAF8]/12">
                <FileText size={12} className="text-[#3a6fd4]" />
              </div>
              <h3 className="font-semibold text-[#010101] text-sm">Mission</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{mission.mission_text || "-"}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#75DA9F]/12">
                <Target size={12} className="text-[#1e8f52]" />
              </div>
              <h3 className="font-semibold text-[#010101] text-sm">Résultats attendus</h3>
            </div>
            {objectives.length === 0 ? (
              <p className="text-sm text-gray-400">-</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {objectives.map((o, i) => (
                  <div key={o.id} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#75DA9F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#1e8f52] text-[9px] font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#010101]">{o.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{[o.threshold, o.deadline].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#CCB8FF]/12">
                <Award size={12} className="text-[#6b4ec4]" />
              </div>
              <h3 className="font-semibold text-[#010101] text-sm">Compétences</h3>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {skillsByCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block bg-gray-100 text-gray-500">{cat.label}</div>
                  {cat.items.length === 0 ? (
                    <p className="text-xs text-gray-300">-</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {cat.items.map((item) => (
                        <li key={item} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-1 leading-none">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <LinkBtn href={`/missions/nouvelle/${mission.id}/coherence`} variant="secondary"><ArrowLeft size={15} />Retour</LinkBtn>
          <LinkBtn href={`/missions/nouvelle/${mission.id}/transition-candidat`} variant="primary" size="lg">
            Ajouter des candidats
            <Plus size={17} />
          </LinkBtn>
        </div>
      </div>
    </AppLayout>
  );
}
