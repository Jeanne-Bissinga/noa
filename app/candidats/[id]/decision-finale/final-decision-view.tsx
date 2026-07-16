"use client";

import { useState, useTransition } from "react";
import { Check, X, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Avatar, Badge, Btn, BackLink } from "@/components/noa/ui-primitives";
import { initials as initialsOf } from "@/lib/noa/labels";
import { decideFinal } from "../actions";
import type { Candidate } from "@/lib/noa/types";

export function FinalDecisionView({ candidate, score }: { candidate: Candidate; score: number | null }) {
  const [pendingAction, setPendingAction] = useState<"non_retenu" | "retenu" | null>(null);
  const [, startTransition] = useTransition();

  const name = `${candidate.first_name} ${candidate.last_name}`;
  const avatarColor = score !== null && score >= 75
    ? "bg-[#75DA9F]/20 text-[#1e8f52]"
    : score !== null && score >= 50
    ? "bg-[#99BAF8]/20 text-[#3a6fd4]"
    : "bg-red-50 text-red-400";

  const recommendation = score === null
    ? { label: "Score en attente", tone: "bg-gray-100 text-gray-500" }
    : score >= 75
    ? { label: "Profil recommandé", tone: "bg-[#75DA9F]/15 text-[#1e8f52]" }
    : score >= 50
    ? { label: "Profil à discuter", tone: "bg-[#99BAF8]/15 text-[#3a6fd4]" }
    : { label: "Profil insuffisant", tone: "bg-red-50 text-red-500" };

  const handleDecide = (action: "non_retenu" | "retenu") => {
    setPendingAction(action);
    startTransition(async () => {
      await decideFinal(candidate.id, action, score);
    });
  };

  return (
    <AppLayout headerTitle={name}>
      <div className="max-w-2xl mx-auto">
        <BackLink href={`/candidats/${candidate.id}`} />

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar initials={initialsOf(candidate.first_name, candidate.last_name)} color={avatarColor} size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">Décision finale</span>
                <Badge color="green">Finaliste</Badge>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-8 mb-5 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-5 font-semibold">Note globale</p>
          <div className="inline-flex items-end gap-1.5 mb-3">
            <span className="text-8xl font-bold text-[#010101] leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>
              {score ?? "-"}
            </span>
            <span className="text-3xl text-gray-200 font-light mb-2">/100</span>
          </div>
          <div className="flex justify-center mb-5">
            <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${recommendation.tone}`}>
              <TrendingUp size={14} />
              {recommendation.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Cette note est une aide à la décision calculée à partir des grilles de Screening et de Topgrading. Elle ne se substitue pas à votre jugement.
          </p>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Btn variant="danger" onClick={() => handleDecide("non_retenu")} disabled={pendingAction !== null}>
            <X size={15} />{pendingAction === "non_retenu" ? "…" : "Ne pas retenir"}
          </Btn>
          <Btn variant="primary" size="lg" onClick={() => handleDecide("retenu")} disabled={pendingAction !== null}>
            <Check size={15} />{pendingAction === "retenu" ? "…" : "Marquer comme recruté"}
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
