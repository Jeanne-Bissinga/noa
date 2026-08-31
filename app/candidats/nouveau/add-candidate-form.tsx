"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronRight, Check, Upload, Plus, Zap, FileText } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, BackLink } from "@/components/noa/ui-primitives";
import { useRegisterTestFiller } from "@/components/noa/test-fill-context";
import { createCandidate, extractCvProfile, type CreateCandidateState } from "../actions";
import type { CandidateProfileExtract } from "@/lib/noa/ai";
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
  // Profil complet extrait par noa (expériences, compétences, résumé…) : les 4
  // champs ci-dessus n'en montrent qu'une partie, le reste est resoumis tel quel
  // à la création pour ne pas relancer une extraction.
  const [profile, setProfile] = useState<CandidateProfileExtract | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simule un CV déjà importé et déjà analysé (sans appeler l'IA d'extraction) :
  // un vrai fichier factice est posé sur l'input pour satisfaire la validation
  // serveur (cvFile obligatoire), et un profil fixe est fourni directement pour
  // que createCandidate n'ait pas besoin de relancer l'extraction lui-même.
  useRegisterTestFiller(() => {
    const fakeFile = new File(["%PDF-1.4 donnée de test, pas un vrai CV"], "cv-test.pdf", { type: "application/pdf" });
    const transfer = new DataTransfer();
    transfer.items.add(fakeFile);
    if (fileInputRef.current) fileInputRef.current.files = transfer.files;

    const fixedProfile: CandidateProfileExtract = {
      firstName: "Alex",
      lastName: "Dupont (test)",
      title: "Développeur Full-Stack",
      location: "Paris",
      email: "alex.dupont.test@example.com",
      summary: "Développeur full-stack, 5 ans d'expérience React/TypeScript/Node.js (donnée de test).",
      experiences: [
        { role: "Senior Frontend Engineer", company: "Scaleway", period: "2021–2025", bullets: ["Réalisation clé (donnée de test)."] },
      ],
      skills: ["React", "TypeScript", "Node.js"],
    };

    setFile(fakeFile);
    setParsing(false);
    setCvDone(true);
    setExtractError(null);
    setProfile(fixedProfile);
    setFirstName(fixedProfile.firstName);
    setLastName(fixedProfile.lastName);
    setTitle(fixedProfile.title);
    setLocation(fixedProfile.location);
  });

  const handleFileSelected = async (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setParsing(true);
    setCvDone(false);
    setProfile(null);
    setExtractError(null);

    const payload = new FormData();
    payload.append("cvFile", selected);

    try {
      const result = await extractCvProfile(payload);
      if ("error" in result) {
        setExtractError(result.error);
        if (result.rejected) {
          // Fichier refusé : on le retire du formulaire plutôt que de laisser le
          // recruteur remplir la fiche pour rien. Réinitialiser value permet de
          // resélectionner le même fichier après l'avoir converti.
          setFile(null);
          setParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      } else {
        setProfile(result.profile);
        // Préremplissage : le recruteur relit et corrige, il n'a plus à saisir.
        setFirstName(result.profile.firstName);
        setLastName(result.profile.lastName);
        setTitle(result.profile.title);
        setLocation(result.profile.location);
      }
    } catch {
      setExtractError("noa n'a pas réussi à lire ce CV. Complétez la fiche à la main.");
    }

    // Le CV reste importable même si l'extraction échoue : la saisie manuelle
    // prend le relais, elle ne doit jamais être bloquée par noa.
    setParsing(false);
    setCvDone(true);
  };

  const prefilled = Boolean(profile && (profile.firstName || profile.lastName || profile.title || profile.location));
  const canSubmit = cvDone && firstName.trim() && lastName.trim() && !pending && !parsing;

  // Un candidat se rattache toujours à une campagne. Sans elle, proposer un
  // import de CV n'a pas de sens : on l'annonce et on donne la marche à suivre
  // plutôt que d'afficher un formulaire inutilisable sous un bandeau d'erreur.
  if (!mission) {
    return (
      <AppLayout headerTitle="Ajouter un candidat">
        <div className="max-w-xl mx-auto">
          <BackLink href="/candidats" />
          <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Choisissez d&apos;abord une campagne
          </h1>
          <p className="text-gray-400 text-sm mb-7">
            Un candidat est toujours rattaché à une campagne de recrutement : c&apos;est elle qui porte la fiche de poste
            et la grille d&apos;évaluation sur lesquelles il sera évalué.
          </p>
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Briefcase size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed text-gray-600">
                Ouvrez la campagne concernée, puis utilisez son bouton « Ajouter un candidat ». Si vous n&apos;en avez pas
                encore, commencez par en créer une.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/missions">
                <Btn variant="primary">Voir mes campagnes<ChevronRight size={15} /></Btn>
              </Link>
              <Link href="/missions/nouvelle">
                <Btn variant="secondary"><Plus size={15} />Créer une campagne</Btn>
              </Link>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerTitle="Ajouter un candidat">
      <div className="max-w-xl mx-auto">
        <BackLink href={`/missions/${mission.id}`} />
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Importer un candidat</h1>
        <p className="text-gray-400 text-sm mb-7">noa crée automatiquement la fiche candidat à partir du CV importé.</p>

        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 mb-7">
            <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Campagne associée</div>
            <div className="text-sm font-semibold text-[#010101]">{mission.title}</div>
          </div>
        </div>

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
                accept=".pdf,.docx,image/*"
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
                    <div className="text-xs text-gray-400 mt-1">PDF, Word (.docx) ou image · 10 Mo max</div>
                  </div>
                  <span className="inline-flex items-center gap-2 font-semibold rounded-xl transition-all px-5 py-2.5 text-sm bg-white border border-gray-200 text-[#010101] hover:bg-gray-50 mt-1">
                    Parcourir les fichiers
                  </span>
                </div>
              )}
            </div>

            {/* Refus de format/taille : affiché ici et non dans le bloc identité,
                qui n'est pas rendu quand aucun CV n'a été retenu. */}
            {extractError && !cvDone && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">{extractError}</p>
            )}

            {(cvDone || parsing) && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-[#010101]">Identité du candidat</span>
                  {cvDone && (
                    prefilled ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full">
                        <Zap size={9} />Prérempli par noa
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                        <Zap size={9} />À compléter
                      </span>
                    )
                  )}
                </div>

                {prefilled && (
                  <p className="text-[11px] text-gray-400 mb-3">Vérifiez les informations extraites du CV avant de créer la fiche.</p>
                )}

                {extractError && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">{extractError}</p>
                )}

                {profile && <input type="hidden" name="profile" value={JSON.stringify(profile)} />}
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
