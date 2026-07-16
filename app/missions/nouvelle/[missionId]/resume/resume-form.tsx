"use client";

import { useActionState, useState } from "react";
import { ChevronRight, Zap, Edit3, Check, X } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink, StepBar } from "@/components/noa/ui-primitives";
import { saveMissionText, type SaveMissionTextState } from "../actions";
import type { Mission } from "@/lib/noa/types";

const initialState: SaveMissionTextState = {};

export function ResumeForm({ mission, noaFallback = false }: { mission: Mission; noaFallback?: boolean }) {
  const boundAction = saveMissionText.bind(null, mission.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [editing, setEditing] = useState(!mission.mission_text);
  const [draft, setDraft] = useState(mission.mission_text ?? "");

  return (
    <AppLayout headerTitle={mission.title}>
      <div className="max-w-2xl mx-auto">
        <BackLink href="/missions/nouvelle" />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={1} /></div>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${noaFallback ? "bg-amber-100" : "bg-[#99BAF8]/15"}`}>
            <Zap size={14} className={noaFallback ? "text-amber-500" : "text-[#3a6fd4]"} />
          </div>
          <p className={`text-xs font-bold uppercase tracking-widest ${noaFallback ? "text-amber-500" : "text-[#3a6fd4]"}`}>
            {noaFallback ? "Votre texte" : "Proposé par noa"}
          </p>
        </div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Mission du poste</h1>
        <p className="text-gray-400 text-sm mb-7">
          {noaFallback
            ? "noa n'a pas pu rédiger la mission pour le moment, voici le texte que vous avez saisi. Complétez-le ou réécrivez-le, il sera utilisé tout au long du recrutement."
            : "noa a rédigé une mission à partir de votre contexte. Validez-la ou réécrivez-la, elle sera utilisée tout au long du recrutement."}
        </p>

        {state?.error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <Card className="p-6 mb-4">
            {!editing ? (
              <>
                <input type="hidden" name="missionText" value={mission.mission_text ?? ""} />
                <p className="text-sm text-[#010101] leading-relaxed whitespace-pre-line mb-5">{mission.mission_text || "Aucune mission rédigée pour le moment."}</p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#3a6fd4] transition-colors"
                >
                  <Edit3 size={12} />
                  Modifier cette mission
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  autoFocus
                  name="missionText"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  className="w-full text-sm text-[#010101] leading-relaxed bg-gray-50 rounded-xl border border-gray-200 p-3 focus:outline-none focus:border-[#99BAF8] resize-none"
                />
                <div className="bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-3.5 text-xs text-gray-500 leading-relaxed">
                  <p className="font-semibold text-[#3a6fd4] mb-1">Méthode, 1 à 5 phrases</p>
                  <p>Résumez la raison d'être du poste et son impact stratégique. Soyez précis et mesurable.</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#75DA9F]/8 border border-[#75DA9F]/20 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1e8f52] mb-2 flex items-center gap-1">
                      <Check size={10} />À faire
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {[
                        "Formuler l'impact attendu en termes mesurables",
                        "Préciser le périmètre d'action concret",
                        `Ex : "Doubler le CA en 2 ans en pilotant la stratégie commerciale"`,
                      ].map((d) => (
                        <li key={d} className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
                          <div className="w-1 h-1 rounded-full bg-[#75DA9F] mt-1.5 flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50/60 border border-red-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
                      <X size={10} />À éviter
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {[
                        "Les formulations vagues sans chiffre ni résultat",
                        "Lister des tâches plutôt que des missions",
                        `Ex : "Développer les ventes" → trop vague`,
                      ].map((d) => (
                        <li key={d} className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
                          <div className="w-1 h-1 rounded-full bg-red-300 mt-1.5 flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Btn variant="primary" size="sm" type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Btn>
                  <Btn variant="secondary" size="sm" type="button" onClick={() => { setDraft(mission.mission_text ?? ""); setEditing(false); }}>Annuler</Btn>
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-between items-center mt-6">
            {!editing && (
              <button type="button" onClick={() => setEditing(true)} className="text-sm text-gray-400 hover:text-gray-500 transition-colors font-medium">
                Cette mission ne me convient pas
              </button>
            )}
            {editing && <div />}
            {!editing && (
              <Btn variant="primary" size="lg" type="submit" disabled={pending}>
                Ça me convient, on continue
                <ChevronRight size={17} />
              </Btn>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
