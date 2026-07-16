"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { LinkBtn, Avatar } from "@/components/noa/ui-primitives";
import { initials, CANDIDATE_AVATAR_COLOR } from "@/lib/noa/labels";
import { moveCandidate } from "./actions";
import type { Candidate, CandidateStatus } from "@/lib/noa/types";

const CAND_KANBAN_COLS: { key: CandidateStatus; label: string; border: string; bg: string; dot: string; emptyText: string }[] = [
  { key: "Screening", label: "Screening", border: "border-[#99BAF8]/35", bg: "bg-[#99BAF8]/5", dot: "bg-[#99BAF8]", emptyText: "Aucun candidat en screening" },
  { key: "Topgrading", label: "Topgrading", border: "border-[#CCB8FF]/35", bg: "bg-[#CCB8FF]/5", dot: "bg-[#CCB8FF]", emptyText: "Aucun candidat en topgrading" },
  { key: "Decision finale", label: "Décision finale", border: "border-[#75DA9F]/35", bg: "bg-[#75DA9F]/5", dot: "bg-[#75DA9F]", emptyText: "Aucune décision en attente" },
  { key: "Non retenu", label: "Non retenu", border: "border-gray-200", bg: "bg-gray-50", dot: "bg-gray-300", emptyText: "Aucun candidat non retenu" },
];

export function CandidatesBoard({ candidates: initialCandidates }: { candidates: Candidate[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, colKey: CandidateStatus) => {
    e.preventDefault();
    const id = dragging;
    setDragOver(null);
    setDragging(null);
    if (!id) return;

    const current = candidates.find((c) => c.id === id);
    if (!current || current.status === colKey) return;

    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: colKey } : c)));

    startTransition(async () => {
      try {
        await moveCandidate(id, colKey);
      } catch {
        // revert optimistic update on failure
        setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: current.status } : c)));
      }
    });
  };

  return (
    <AppLayout headerTitle="Candidats">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Candidats</h1>
            <p className="text-gray-400 text-sm mt-1">{candidates.length} candidats en cours d'évaluation</p>
          </div>
          <LinkBtn href="/missions" variant="primary">
            <Plus size={15} />Ajouter un candidat
          </LinkBtn>
        </div>

        <div className="grid grid-cols-4 gap-3 items-start">
          {CAND_KANBAN_COLS.map((col) => {
            const cards = candidates.filter((c) => c.status === col.key);
            const isOver = dragOver === col.key;
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`rounded-2xl border p-3 transition-all ${
                  isOver ? "border-[#99BAF8] bg-[#99BAF8]/10 scale-[1.01]" : `${col.border} ${col.bg}`
                }`}
              >
                <div className="flex items-center gap-2 px-1 mb-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="text-xs font-bold text-[#010101]">{col.label}</span>
                  <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-white/80 rounded-lg px-1.5 py-0.5 border border-black/[0.05]">{cards.length}</span>
                </div>

                <div className="flex flex-col gap-2 min-h-[60px]">
                  {cards.length === 0 && !isOver && (
                    <div className="py-8 flex items-center justify-center rounded-xl border-2 border-dashed border-transparent">
                      <p className="text-[10px] text-gray-300 font-medium text-center">{col.emptyText}</p>
                    </div>
                  )}
                  {isOver && cards.length === 0 && (
                    <div className="py-8 rounded-xl border-2 border-dashed border-[#99BAF8]/40 bg-[#99BAF8]/5" />
                  )}
                  {cards.map((c) => (
                    <Link
                      key={c.id}
                      href={`/candidats/${c.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClickCapture={(e) => { if (dragging) e.preventDefault(); }}
                      className={`bg-white rounded-xl border border-black/[0.06] p-3.5 cursor-grab active:cursor-grabbing hover:border-[#99BAF8]/40 hover:shadow-sm transition-all group select-none block ${
                        dragging === c.id ? "opacity-40 scale-95" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <Avatar initials={initials(c.first_name, c.last_name)} color={CANDIDATE_AVATAR_COLOR[c.status]} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight truncate">{c.first_name} {c.last_name}</p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.title ?? "-"}</p>
                        </div>
                      </div>
                      {c.score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1">
                            <div className="h-1 rounded-full bg-[#99BAF8]" style={{ width: `${c.score}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 tabular-nums flex-shrink-0">{c.score}/100</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-300">Pas encore noté</p>
                      )}
                    </Link>
                  ))}
                  {isOver && cards.length > 0 && (
                    <div className="h-12 rounded-xl border-2 border-dashed border-[#99BAF8]/40 bg-[#99BAF8]/5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
