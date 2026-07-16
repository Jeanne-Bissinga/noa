"use client";

import { useActionState, useRef, useState } from "react";
import { Briefcase, ChevronRight, Check, Upload, Plus, Zap, FileText } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink } from "@/components/noa/ui-primitives";
import { createCandidate, type CreateCandidateState } from "../actions";
import type { Mission } from "@/lib/noa/types";

const initialState: CreateCandidateState = {};

export function AddCandidateForm({ mission }: { mission: Mission | null }) {
  const boundAction = createCandidate.bind(null, mission?.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [cvDone, setCvDone] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setParsing(true);
    setCvDone(false);
    // Fake "noa parsing" animation kept for UX flavor, the real submission
    // only happens once the recruiter validates the (real) name fields below
    // and clicks "Créer la fiche candidat".
    setTimeout(() => {
      setParsing(false);
      setCvDone(true);
    }, 1400);
  };

  const canSubmit = Boolean(mission) && cvDone && firstName.trim() && lastName.trim() && !pending;

  return (
    <AppLayout headerTitle="Ajouter un candidat">
      <div className="max-w-xl mx-auto">
        <BackLink href={mission ? `/missions/${mission.id}` : "/candidats"} />
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Importer un candidat</h1>
        <p className="text-gray-400 text-sm mb-7">noa crée automatiquement la fiche candidat à partir du CV importé.</p>

        {!mission ? (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
            Aucune mission associée. Revenez à la fiche d'une mission pour ajouter un candidat via le bouton « Ajouter un candidat ».
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 mb-7">
            <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Mission associée</div>
              <div className="text-sm font-semibold text-[#010101]">{mission.title}</div>
            </div>
          </div>
        )}

        {state?.error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction}>
          <Card className="p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-[#010101]">CV du candidat</span>
              <span className="text-xs text-red-400 font-medium">* Obligatoire</span>
            </div>
            <div
              onClick={() => { if (!cvDone && !parsing) fileInputRef.current?.click(); }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                cvDone ? "border-[#75DA9F] bg-[#75DA9F]/5" : parsing ? "border-[#99BAF8] bg-[#99BAF8]/4" : "cursor-pointer border-gray-200 hover:border-[#99BAF8] hover:bg-[#99BAF8]/4"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="cvFile"
                accept=".pdf,.doc,.docx,image/*"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
              />
              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#99BAF8]/15 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#99BAF8]/40 border-t-[#3a6fd4] rounded-full animate-spin" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#010101]">{file?.name}</div>
                    <div className="text-xs text-[#3a6fd4] mt-1">noa extrait les informations…</div>
                  </div>
                </div>
              ) : cvDone ? (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-11 h-11 rounded-full bg-[#75DA9F]/20 flex items-center justify-center">
                    <Check size={18} className="text-[#1e8f52]" />
                  </div>
                  <div className="text-sm font-semibold text-[#010101]">{file?.name}</div>
                  <div className="text-xs text-gray-400">
                    {file ? `${Math.round(file.size / 1024)} Ko · importé avec succès` : "importé avec succès"}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Upload size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#010101]">Déposer le CV ici</div>
                    <div className="text-xs text-gray-400 mt-1">PDF, Word ou image · 10 Mo max</div>
                  </div>
                  <span className="inline-flex items-center gap-2 font-semibold rounded-xl transition-all px-5 py-2.5 text-sm bg-white border border-gray-200 text-[#010101] hover:bg-gray-50 mt-1">
                    Parcourir les fichiers
                  </span>
                </div>
              )}
            </div>

            {(cvDone || parsing) && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#010101]">Identité du candidat</span>
                  {cvDone && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full">
                      <Zap size={9} />À compléter
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Prénom</label>
                    <input
                      type="text"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Nom</label>
                    <input
                      type="text"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom de famille"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Poste</label>
                    <input
                      type="text"
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex. Développeur Full Stack"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Localisation</label>
                    <input
                      type="text"
                      name="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex. Paris"
                      className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors text-black"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 mb-7">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Pièces jointes supplémentaires (optionnel)</div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled
                className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 opacity-60 cursor-not-allowed transition-all text-left"
              >
                <Plus size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Ajouter une pièce jointe (portfolio, lettre de motivation…), bientôt disponible</span>
              </button>
            </div>
          </Card>

          <div className="flex justify-end">
            <Btn variant="primary" size="lg" type="submit" disabled={!canSubmit}>
              {pending ? "Création en cours…" : (
                <>
                  <FileText size={15} />
                  Créer la fiche candidat
                  <ChevronRight size={17} />
                </>
              )}
            </Btn>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
