"use client";

import { useState } from "react";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";

const RESOURCES = [
  {
    step: "1. Cadrer le poste",
    color: "bg-[#99BAF8]/12 border-[#99BAF8]/20",
    tag: "text-[#3a6fd4] bg-[#99BAF8]/15",
    articles: [
      { title: "Pourquoi une fiche de poste vague sabote votre recrutement", duration: "5 min", type: "Article" },
      { title: "La méthode des 3 questions pour clarifier une mission", duration: "7 min", type: "Guide" },
      { title: "Définir des objectifs mesurables : la règle SMART appliquée au recrutement", duration: "6 min", type: "Article" },
    ],
  },
  {
    step: "2. Sourcer les bons profils",
    color: "bg-[#CCB8FF]/12 border-[#CCB8FF]/20",
    tag: "text-[#6b4ec4] bg-[#CCB8FF]/15",
    articles: [
      { title: "LinkedIn Recruiter vs approche directe : ce qui fonctionne vraiment", duration: "8 min", type: "Article" },
      { title: "Comment rédiger une annonce qui attire les A-Players (et repousse les autres)", duration: "6 min", type: "Guide" },
      { title: "Les 5 canaux de sourcing sous-estimés par les managers", duration: "4 min", type: "Article" },
    ],
  },
  {
    step: "3. Évaluer avec le Screening",
    color: "bg-[#FEE831]/10 border-[#FEE831]/30",
    tag: "text-[#8a6a00] bg-[#FEE831]/15",
    articles: [
      { title: "Le screening téléphonique : les 6 questions qui font la différence", duration: "5 min", type: "Guide" },
      { title: "Comment éviter les biais cognitifs lors d'un premier entretien", duration: "9 min", type: "Article" },
      { title: "Créer une grille de screening cohérente avec votre fiche de poste", duration: "6 min", type: "Tutoriel" },
    ],
  },
  {
    step: "4. Approfondir avec le Topgrading",
    color: "bg-[#75DA9F]/12 border-[#75DA9F]/20",
    tag: "text-[#1e8f52] bg-[#75DA9F]/15",
    articles: [
      { title: "Topgrading : l'entretien chronologique qui révèle les vrais A-Players", duration: "10 min", type: "Article" },
      { title: "Les questions CCAR pour décoder les comportements passés", duration: "7 min", type: "Guide" },
      { title: "Comment scorer un candidat de façon objective après un entretien", duration: "5 min", type: "Article" },
    ],
  },
  {
    step: "5. Décider et convaincre",
    color: "bg-gray-100 border-gray-200",
    tag: "text-gray-600 bg-gray-200",
    articles: [
      { title: "Comment structurer une décision de recrutement en équipe", duration: "5 min", type: "Article" },
      { title: "L'offre qui convainc un A-Player de vous rejoindre", duration: "6 min", type: "Guide" },
      { title: "Onboarding : les 30 premiers jours qui font tout", duration: "8 min", type: "Article" },
    ],
  },
];

export function ResourcesView() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <AppLayout headerTitle="Ressources">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-[#99BAF8]/12 text-[#3a6fd4] text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <BookOpen size={11} />Méthode A-Player
          </div>
          <h1 className="text-2xl font-bold text-[#010101] mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            Recruter des A-Players, étape par étape
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
            Des ressources pratiques pour chaque phase du recrutement structuré, de la définition du poste à la décision finale.
          </p>
        </div>

        {/* Steps accordion */}
        <div className="flex flex-col gap-3">
          {RESOURCES.map((section, i) => (
            <div key={i} className={`rounded-2xl border overflow-hidden transition-all ${section.color}`}>
              {/* Header */}
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${section.tag}`}>
                    {section.step.split(".")[0]}
                  </span>
                  <span className="text-sm font-semibold text-[#010101]">
                    {section.step.split(". ")[1]}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${open === i ? "rotate-180" : ""}`}>
                  <ChevronRight size={14} className="text-gray-400 rotate-90" />
                </div>
              </button>

              {/* Articles */}
              {open === i && (
                <div className="px-5 pb-4 flex flex-col gap-2 border-t border-black/[0.05]">
                  {section.articles.map((a, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-3 mt-2 group cursor-pointer hover:border hover:border-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-snug">{a.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{a.type} · {a.duration} de lecture</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#3a6fd4] flex-shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
