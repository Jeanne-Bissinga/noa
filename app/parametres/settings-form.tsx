"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { AppLayout } from "@/components/noa/app-shell";
import { Card, Btn, InputField, Textarea } from "@/components/noa/ui-primitives";
import type { RecruiterWithCompany } from "@/lib/noa/types";
import { updateCompany, updateProfile, deleteAccount, type SettingsFormState, type DeleteAccountState } from "./actions";

const initialSettingsState: SettingsFormState = {};
const initialDeleteState: DeleteAccountState = {};

// Mêmes options que app/inscription/page.tsx (select) et app/onboarding/page.tsx
// (choice), pour que l'édition dans les paramètres reste cohérente avec ce que
// l'utilisateur a vu au départ.
const TEAM_SIZE_OPTIONS = ["1–10 personnes", "11–19 personnes", "20–49 personnes", "50-199 personnes", "199+ personnes"];
const MAIN_OBJECTIVE_OPTIONS = ["Structurer mes recrutements", "Gagner du temps", "Réduire les erreurs de cast", "Préparer une montée en charge"];
const SECTOR_OPTIONS = ["SaaS / Logiciel", "Fintech", "Healthtech", "E-commerce / Marketplace", "Deeptech / IA"];
const HR_CHALLENGE_OPTIONS = ["Attirer les bons profils", "Évaluer objectivement", "Réduire le time-to-hire", "Fidéliser les talents", "Tous ces sujets"];
const CULTURE_OPTIONS = ["Très structurée et processée", "Agile et itérative", "Collaborative et horizontale", "Orientée résultats", "En construction"];

// company.culture_values stocke "valeursFondamentales, cultureDeTravail" en un
// seul texte (voir app/onboarding/actions.ts) — on retente de séparer les deux
// pour ré-afficher la culture de travail comme liste, comme à l'onboarding.
function splitCultureValues(raw: string | null): { coreValues: string; workCulture: string } {
  const value = raw ?? "";
  for (const opt of CULTURE_OPTIONS) {
    if (value === opt) return { coreValues: "", workCulture: opt };
    const suffix = `, ${opt}`;
    if (value.endsWith(suffix)) return { coreValues: value.slice(0, -suffix.length), workCulture: opt };
  }
  return { coreValues: value, workCulture: "" };
}

const STACK_GROUPS = [
  { label: "Langages", tags: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin", "Swift", "PHP", "Ruby", "C#", "Scala"] },
  { label: "Frontend", tags: ["React", "Next.js", "Vue.js", "Nuxt", "Angular", "Svelte", "Tailwind CSS", "Storybook"] },
  { label: "Backend", tags: ["Node.js", "NestJS", "FastAPI", "Django", "Laravel", "Spring Boot", "tRPC", "GraphQL", "REST API"] },
  { label: "Base de données", tags: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Supabase", "PlanetScale", "SQLite"] },
  { label: "Cloud & Infra", tags: ["AWS", "GCP", "Azure", "Vercel", "Netlify", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CircleCI"] },
  { label: "Outils", tags: ["Git", "Figma", "Linear", "Notion", "Datadog", "Sentry", "Stripe"] },
];

export function SettingsForm({ recruiter }: { recruiter: RecruiterWithCompany }) {
  return (
    <AppLayout headerTitle="Paramètres">
      <div className="max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#010101] mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
            Paramètres
          </h1>
          <p className="text-sm text-gray-400">
            Vos informations personnelles et le profil de votre entreprise, utilisé par noa pour ses suggestions.
          </p>
        </div>

        <ProfileCard recruiter={recruiter} />
        <CompanyCard recruiter={recruiter} />
        <DangerZone recruiter={recruiter} />
      </div>
    </AppLayout>
  );
}

function ProfileCard({ recruiter }: { recruiter: RecruiterWithCompany }) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialSettingsState);

  return (
    <Card className="p-7 shadow-sm shadow-black/[0.04]">
      <h2 className="font-bold text-[#010101] mb-4">Mon profil</h2>
      <form action={formAction} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Prénom" name="firstName" defaultValue={recruiter.first_name} required />
          <InputField label="Nom" name="lastName" defaultValue={recruiter.last_name} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Email" name="email" type="email" defaultValue={recruiter.email} required />
          <InputField label="Fonction" name="jobTitle" placeholder="CTO, DG, Manager..." defaultValue={recruiter.job_title ?? ""} />
        </div>

        {state.error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{state.error}</div>
        )}
        {state.success && (
          <div className="px-4 py-3 rounded-xl bg-[#75DA9F]/10 border border-[#75DA9F]/30 text-[#1e8f52] text-sm">
            {state.message ?? "Profil mis à jour."}
          </div>
        )}

        <div>
          <Btn type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Card>
  );
}

// Boutons à choix unique + option "Autre" à texte libre, même comportement que
// app/onboarding/page.tsx (type "choice").
function ChoiceList({
  options, value, onChange, allowOther = false,
}: { options: string[]; value: string; onChange: (v: string) => void; allowOther?: boolean }) {
  const matchedOption = options.find((o) => o === value);
  const isOther = allowOther && value !== "" && !matchedOption;
  const [otherText, setOtherText] = useState(isOther ? value : "");

  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
            value === opt
              ? "border-[#99BAF8] bg-[#99BAF8]/10 text-[#010101] font-medium"
              : "border-gray-100 hover:border-gray-200 text-gray-600"
          }`}
        >
          {opt}
        </button>
      ))}
      {allowOther && (
        <div className="flex flex-col gap-0">
          <button
            type="button"
            onClick={() => onChange(otherText)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              isOther
                ? "border-[#99BAF8] bg-[#99BAF8]/10 text-[#010101] font-medium rounded-b-none border-b-0"
                : "border-gray-100 hover:border-gray-200 text-gray-600"
            }`}
          >
            Autre
          </button>
          {isOther && (
            <div className="border border-[#99BAF8] border-t-0 rounded-b-xl bg-[#99BAF8]/5 px-4 pb-3 pt-2.5">
              <input
                autoFocus
                value={otherText}
                onChange={(e) => { setOtherText(e.target.value); onChange(e.target.value); }}
                placeholder="Précisez..."
                className="w-full bg-transparent text-sm text-[#010101] placeholder-gray-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ recruiter }: { recruiter: RecruiterWithCompany }) {
  const { company } = recruiter;
  const [state, formAction, isPending] = useActionState(updateCompany, initialSettingsState);

  const [sector, setSector] = useState(company.sector ?? "");
  const [hrChallenges, setHrChallenges] = useState(company.hr_challenges ?? "");
  const [techStack, setTechStack] = useState<string[]>(company.tech_stack ?? []);
  const [stackInput, setStackInput] = useState("");
  const initialCulture = splitCultureValues(company.culture_values);
  const [coreValues, setCoreValues] = useState(initialCulture.coreValues);
  const [workCulture, setWorkCulture] = useState(initialCulture.workCulture);
  const cultureValues = [coreValues.trim(), workCulture].filter(Boolean).join(", ");

  const addStackTag = () => {
    const val = stackInput.trim();
    if (val && !techStack.includes(val)) setTechStack((prev) => [...prev, val]);
    setStackInput("");
  };
  const removeStackTag = (tag: string) => setTechStack((prev) => prev.filter((t) => t !== tag));

  return (
    <Card className="p-7 shadow-sm shadow-black/[0.04]">
      <h2 className="font-bold text-[#010101] mb-4">Entreprise</h2>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="techStack" value={techStack.join(",")} />
        <input type="hidden" name="sector" value={sector} />
        <input type="hidden" name="hrChallenges" value={hrChallenges} />
        <input type="hidden" name="cultureValues" value={cultureValues} />

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nom de l'entreprise" name="name" defaultValue={company.name} required />
          <InputField label="SIRET" name="siret" defaultValue={company.siret ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#010101]">Taille de l'équipe</label>
            <select
              name="teamSize"
              defaultValue={company.team_size ?? TEAM_SIZE_OPTIONS[0]}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600"
            >
              {TEAM_SIZE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#010101]">Objectif principal</label>
            <select
              name="mainObjective"
              defaultValue={company.main_objective ?? MAIN_OBJECTIVE_OPTIONS[0]}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600"
            >
              {MAIN_OBJECTIVE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <Textarea
          label="Activité de l'entreprise"
          name="activityDescription"
          defaultValue={company.activity_description ?? ""}
          rows={3}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#010101]">Secteur</label>
          <ChoiceList options={SECTOR_OPTIONS} value={sector} onChange={setSector} allowOther />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#010101]">Stack technique</label>
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-1">
              {techStack.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeStackTag(tag)}
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
              onChange={(e) => setStackInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStackTag();
                }
              }}
              placeholder="Ajouter une techno…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder-gray-400"
            />
            <button
              type="button"
              onClick={addStackTag}
              disabled={!stackInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#99BAF8]/15 text-[#3a6fd4] font-semibold text-sm hover:bg-[#99BAF8]/25 disabled:opacity-40 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3 mt-1">
            {STACK_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag) => {
                    const active = techStack.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => (active ? removeStackTag(tag) : setTechStack((prev) => [...prev, tag]))}
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
        </div>

        <Textarea
          label="Valeurs fondamentales"
          placeholder="Ex : Transparence, Excellence, Autonomie"
          value={coreValues}
          onChange={setCoreValues}
          rows={2}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#010101]">Culture de travail</label>
          <ChoiceList options={CULTURE_OPTIONS} value={workCulture} onChange={setWorkCulture} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#010101]">Principal défi RH</label>
          <ChoiceList options={HR_CHALLENGE_OPTIONS} value={hrChallenges} onChange={setHrChallenges} />
        </div>

        {state.error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">{state.error}</div>
        )}
        {state.success && (
          <div className="px-4 py-3 rounded-xl bg-[#75DA9F]/10 border border-[#75DA9F]/30 text-[#1e8f52] text-sm">
            Informations enregistrées.
          </div>
        )}

        <div>
          <Btn type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Btn>
        </div>
      </form>
    </Card>
  );
}

function DangerZone({ recruiter }: { recruiter: RecruiterWithCompany }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, isPending] = useActionState(deleteAccount, initialDeleteState);
  const canDelete = confirmation.trim() === recruiter.company.name;

  return (
    <Card className="p-7 border-red-100 shadow-sm shadow-black/[0.04]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={16} className="text-red-500" />
        </div>
        <div>
          <h2 className="font-bold text-[#010101] mb-0.5">Supprimer le compte</h2>
          <p className="text-sm text-gray-400">
            Supprime définitivement votre compte, votre entreprise et toutes les données associées
            (campagnes, candidats, entretiens...). Cette action est irréversible.
          </p>
        </div>
      </div>

      {!open ? (
        <Btn variant="danger" onClick={() => setOpen(true)}>
          Supprimer mon compte
        </Btn>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Pour confirmer, tapez le nom de votre entreprise : <span className="font-semibold text-[#010101]">{recruiter.company.name}</span>
          </p>
          <input
            name="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={recruiter.company.name}
            className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white placeholder-gray-300 text-black"
          />
          {state.error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm">
              {state.error}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Btn type="submit" variant="danger" disabled={!canDelete || isPending}>
              {isPending ? "Suppression..." : "Supprimer définitivement"}
            </Btn>
            <Btn variant="ghost" onClick={() => { setOpen(false); setConfirmation(""); }}>
              Annuler
            </Btn>
          </div>
        </form>
      )}
    </Card>
  );
}
