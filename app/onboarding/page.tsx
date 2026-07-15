"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ChevronRight, FileText, Plus, X } from "lucide-react";
import { NoaLogo, Card, Btn, Textarea } from "@/components/noa/ui-primitives";
import { completeOnboarding } from "./actions";

const STACK_GROUPS = [
  { label: "Langages", tags: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin", "Swift", "PHP", "Ruby", "C#", "Scala"] },
  { label: "Frontend", tags: ["React", "Next.js", "Vue.js", "Nuxt", "Angular", "Svelte", "Tailwind CSS", "Storybook"] },
  { label: "Backend", tags: ["Node.js", "NestJS", "FastAPI", "Django", "Laravel", "Spring Boot", "tRPC", "GraphQL", "REST API"] },
  { label: "Base de données", tags: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Supabase", "PlanetScale", "SQLite"] },
  { label: "Cloud & Infra", tags: ["AWS", "GCP", "Azure", "Vercel", "Netlify", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CircleCI"] },
  { label: "Outils", tags: ["Git", "Figma", "Linear", "Notion", "Datadog", "Sentry", "Stripe"] },
];

type Question = {
  q: string;
  type: "textarea" | "choice" | "stack";
  placeholder?: string;
  options?: string[];
};

const QUESTIONS: Question[] = [
  { q: "Décrivez l'activité principale de votre entreprise.", type: "textarea", placeholder: "Ex : Nous développons un SaaS B2B de gestion de projets pour des équipes de 10 à 200 personnes." },
  { q: "Dans quel secteur opérez-vous principalement ?", type: "choice", options: ["SaaS / Logiciel", "Fintech", "Healthtech", "E-commerce / Marketplace", "Deeptech / IA", "Autre"] },
  { q: "Quelle est votre stack technique ?", type: "stack" },
  { q: "Quelles sont vos 3 valeurs fondamentales ?", type: "textarea", placeholder: "Ex : Transparence, Excellence, Autonomie" },
  { q: "Comment décrieriez-vous votre culture de travail ?", type: "choice", options: ["Très structurée et processée", "Agile et itérative", "Collaborative et horizontale", "Orientée résultats", "En construction"] },
  { q: "Quels sont vos principaux défis RH aujourd'hui ?", type: "choice", options: ["Attirer les bons profils", "Évaluer objectivement", "Réduire le time-to-hire", "Fidéliser les talents", "Tous ces sujets"] },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [autreText, setAutreText] = useState("");
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Persisted answers across steps
  const [activityDescription, setActivityDescription] = useState("");
  const [sector, setSector] = useState("");
  const [valeursFondamentales, setValeursFondamentales] = useState("");
  const [cultureTravail, setCultureTravail] = useState<string[]>([]);
  const [hrChallenges, setHrChallenges] = useState<string[]>([]);

  const toggleStack = (tag: string) =>
    setStack(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomStack = () => {
    const val = stackInput.trim();
    if (val && !stack.includes(val)) setStack(prev => [...prev, val]);
    setStackInput("");
  };

  const cur = QUESTIONS[step];

  const persistCurrentStepAnswer = () => {
    if (step === 1) setSector(selected.includes("Autre") ? autreText : selected.join(", "));
    if (step === 4) setCultureTravail(selected);
    if (step === 5) setHrChallenges(selected);
  };

  const goNext = () => {
    persistCurrentStepAnswer();
    setSelected([]);
    setStackInput("");
    setStep(s => s + 1);
  };

  const goBack = () => {
    setSelected([]);
    setStep(s => s - 1);
  };

  const handleFinish = () => {
    persistCurrentStepAnswer();
    const finalHrChallenges = step === 5 ? selected : hrChallenges;
    const finalCultureValues = [valeursFondamentales, cultureTravail.length ? cultureTravail.join(", ") : null]
      .filter(Boolean)
      .join(" — ");

    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          activityDescription,
          sector,
          techStack: stack,
          cultureValues: finalCultureValues,
          hrChallenges: finalHrChallenges.join(", "),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-start justify-center p-8">
      <div className="w-full max-w-xl pt-8">
        <div className="flex items-center justify-between mb-10">
          <NoaLogo scale={0.78} />
          <span className="text-xs text-gray-400 font-medium">{step + 1} / {QUESTIONS.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1 mb-10">
          <div className="bg-[#99BAF8] h-1 rounded-full transition-all" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>

        <Card className="p-8 mb-6 shadow-sm shadow-black/[0.04]">
          <div className="inline-flex items-center gap-1.5 bg-[#99BAF8]/12 text-[#3a6fd4] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <FileText size={11} />
            Profil entreprise
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Ces informations permettent à noa de pré-remplir automatiquement vos futures fiches de poste.
          </p>
          <h2 className="text-xl font-bold text-[#010101] mb-6 leading-snug" style={{ fontFamily: "Poppins, sans-serif" }}>
            {cur.q}
          </h2>

          {cur.type === "textarea" && (
            <Textarea
              placeholder={cur.placeholder}
              rows={3}
              value={step === 0 ? activityDescription : valeursFondamentales}
              onChange={(v) => (step === 0 ? setActivityDescription(v) : setValeursFondamentales(v))}
            />
          )}

          {cur.type === "stack" && (
            <div className="flex flex-col gap-4">
              {stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {stack.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleStack(tag)}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-[#010101] text-white px-3 py-1.5 rounded-full transition-all hover:bg-gray-700"
                    >
                      {tag}
                      <X size={10} />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={stackInput}
                  onChange={e => setStackInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomStack(); } }}
                  placeholder="Ajouter une techno personnalisée…"
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder-gray-400"
                />
                <button
                  onClick={addCustomStack}
                  disabled={!stackInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#99BAF8]/15 text-[#3a6fd4] font-semibold text-sm hover:bg-[#99BAF8]/25 disabled:opacity-40 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              {STACK_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tags.map(tag => {
                      const active = stack.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleStack(tag)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                            active
                              ? "bg-[#010101] text-white border-[#010101]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#99BAF8] hover:text-[#3a6fd4]"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {cur.type === "choice" && cur.options && (
            <div className="flex flex-col gap-2">
              {cur.options.map(opt => (
                <div key={opt} className="flex flex-col gap-0">
                  <button
                    onClick={() => {
                      setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
                      if (opt !== "Autre") setAutreText("");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      selected.includes(opt)
                        ? "border-[#99BAF8] bg-[#99BAF8]/10 text-[#010101] font-medium"
                        : "border-gray-100 hover:border-gray-200 text-gray-600"
                    } ${opt === "Autre" && selected.includes("Autre") ? "rounded-b-none border-b-0" : ""}`}
                  >
                    {opt}
                  </button>
                  {opt === "Autre" && selected.includes("Autre") && (
                    <div className="border border-[#99BAF8] border-t-0 rounded-b-xl bg-[#99BAF8]/5 px-4 pb-3 pt-2.5">
                      <input
                        autoFocus
                        value={autreText}
                        onChange={e => setAutreText(e.target.value)}
                        placeholder="Précisez votre secteur…"
                        className="w-full bg-transparent text-sm text-[#010101] placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Btn variant="secondary" onClick={goBack}>
              <ArrowLeft size={15} />
              Retour
            </Btn>
          ) : <div />}
          <Btn variant="primary" onClick={step < QUESTIONS.length - 1 ? goNext : handleFinish} disabled={isPending}>
            {isPending ? "Enregistrement..." : step < QUESTIONS.length - 1 ? "Continuer" : "Terminer la configuration"}
            <ChevronRight size={15} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
