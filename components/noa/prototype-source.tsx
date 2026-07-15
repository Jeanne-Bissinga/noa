import { useState } from "react";
import {
  Search, Bell, Settings, LogOut, Briefcase, Users, BookOpen,
  ChevronRight, Plus, AlertTriangle, Check, X, Upload,
  FileText, Target, Award, ArrowLeft, Edit3, Mic, Eye,
  BarChart2, TrendingUp, Zap,
} from "lucide-react";

type Screen =
  | "signup" | "login" | "onboarding"
  | "campaign-why"
  | "transition-job"
  | "job-summary"
  | "job-mission" | "job-results" | "job-skills" | "job-coherence" | "job-final"
  | "transition-candidate"
  | "add-candidate"
  | "transition-screening"
  | "screening-grid"
  | "screening-decision"
  | "transition-topgrading"
  | "topgrading-grid"
  | "topgrading-decision"
  | "transition-final"
  | "final-decision"
  | "dashboard" | "missions" | "mission-detail" | "candidates" | "candidate-detail"
  | "candidate-synthesis" | "candidate-transcript"
  | "interview-prep"
  | "resources";

// ─── Logo ───────────────────────────────────────────────────────────────────
const NoaLogo = ({ scale = 1 }: { scale?: number }) => (
  <svg width={129 * scale} height={27 * scale} viewBox="0 0 129 27" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.00012207" y="14.2831" width="19.8793" height="10.7042" rx="5.35211" fill="#75DA9F"/>
    <rect x="20.9717" y="14.2831" width="8.51968" height="10.7042" rx="4.25984" fill="#99BAF8"/>
    <rect x="0.00012207" y="1.61292" width="10.7042" height="10.7042" rx="5.35211" fill="#FEE831"/>
    <rect x="12.0149" y="1.61292" width="17.4763" height="10.7042" rx="5.35211" fill="#CCB8FF"/>
    <path d="M57.9226 0.0921588C60.9024 0.0921588 63.2679 1.09056 65.0189 3.08736C66.77 5.05344 67.6455 7.72608 67.6455 11.1053V26.1734H58.6138V12.3034C58.6138 10.8288 58.2298 9.6768 57.4618 8.84736C56.6938 7.9872 55.6647 7.55712 54.3744 7.55712C53.0228 7.55712 51.9629 7.9872 51.1949 8.84736C50.4269 9.6768 50.0429 10.8288 50.0429 12.3034V26.1734H41.0112V0.322559H50.0429V4.00896C50.8416 2.8416 51.9168 1.90464 53.2685 1.19808C54.6202 0.460799 56.1716 0.0921588 57.9226 0.0921588Z" fill="white"/>
    <path d="M84.6281 26.496C82.0476 26.496 79.7283 25.9584 77.67 24.8832C75.6425 23.808 74.0451 22.272 72.8777 20.2752C71.7104 18.2784 71.1267 15.9283 71.1267 13.225C71.1267 10.5523 71.7104 8.2176 72.8777 6.2208C74.0758 4.224 75.6886 2.688 77.7161 1.6128C79.7744 0.537599 82.0937 0 84.6742 0C87.2547 0 89.5587 0.537599 91.5862 1.6128C93.6444 2.688 95.2572 4.224 96.4246 6.2208C97.6227 8.2176 98.2217 10.5523 98.2217 13.225C98.2217 15.8976 97.6227 18.2477 96.4246 20.2752C95.2572 22.272 93.6444 23.808 91.5862 24.8832C89.528 25.9584 87.2086 26.496 84.6281 26.496ZM84.6281 18.6624C85.8876 18.6624 86.9321 18.2016 87.7616 17.28C88.6217 16.3277 89.0518 14.976 89.0518 13.225C89.0518 11.4739 88.6217 10.1376 87.7616 9.216C86.9321 8.2944 85.903 7.8336 84.6742 7.8336C83.4454 7.8336 82.4163 8.2944 81.5868 9.216C80.7574 10.1376 80.3427 11.4739 80.3427 13.225C80.3427 15.0067 80.742 16.3584 81.5408 17.28C82.3395 18.2016 83.3686 18.6624 84.6281 18.6624Z" fill="white"/>
    <path d="M100.422 13.225C100.422 10.5523 100.898 8.2176 101.85 6.2208C102.833 4.224 104.154 2.688 105.813 1.6128C107.503 0.537599 109.377 0 111.435 0C113.217 0 114.753 0.35328 116.043 1.05984C117.333 1.7664 118.331 2.71872 119.038 3.9168V0.322559H128.07V26.1734H119.038V22.5792C118.331 23.7773 117.318 24.7296 115.997 25.4362C114.706 26.1427 113.186 26.496 111.435 26.496C109.377 26.496 107.503 25.9584 105.813 24.8832C104.154 23.808 102.833 22.272 101.85 20.2752C100.898 18.2477 100.422 15.8976 100.422 13.225ZM119.038 13.225C119.038 11.5661 118.577 10.2605 117.656 9.30816C116.765 8.35584 115.659 7.87968 114.338 7.87968C112.986 7.87968 111.865 8.35584 110.974 9.30816C110.083 10.2298 109.638 11.5354 109.638 13.225C109.638 14.8838 110.083 16.2048 110.974 17.1878C111.865 18.1402 112.986 18.6163 114.338 18.6163C115.659 18.6163 116.765 18.1402 117.656 17.1878C118.577 16.2355 119.038 14.9146 119.038 13.225Z" fill="white"/>
  </svg>
);

// ─── Primitives ───────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const Btn = ({
  children, variant = "primary", onClick, className = "", size = "md", disabled = false,
}: {
  children: React.ReactNode; variant?: BtnVariant; onClick?: () => void;
  className?: string; size?: BtnSize; disabled?: boolean;
}) => {
  const sz = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3 text-sm" }[size];
  const v = {
    primary: "bg-[#99BAF8] text-[#010101] hover:bg-[#85abf5] active:bg-[#7099e8]",
    secondary: "bg-white border border-gray-200 text-[#010101] hover:bg-gray-50",
    ghost: "text-gray-500 hover:text-[#010101] hover:bg-gray-100",
    danger: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-semibold rounded-xl transition-all cursor-pointer ${sz} ${v} ${disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`bg-white rounded-2xl border border-black/[0.06] ${className}`} onClick={onClick}>{children}</div>
);

type BadgeColor = "blue" | "violet" | "green" | "yellow" | "gray" | "red" | "orange";
const Badge = ({ children, color }: { children: React.ReactNode; color: BadgeColor }) => {
  const c: Record<BadgeColor, string> = {
    blue: "bg-[#99BAF8]/20 text-[#3a6fd4]",
    violet: "bg-[#CCB8FF]/25 text-[#6b4ec4]",
    green: "bg-[#75DA9F]/20 text-[#1e8f52]",
    yellow: "bg-[#FEE831]/30 text-[#8a6a00]",
    gray: "bg-gray-100 text-gray-500",
    red: "bg-red-50 text-red-500",
    orange: "bg-orange-50 text-orange-500",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c[color]}`}>
      {children}
    </span>
  );
};

const InputField = ({
  label, placeholder, type = "text", required = false, hint,
}: { label: string; placeholder?: string; type?: string; required?: boolean; hint?: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-[#010101]">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] transition-all bg-white placeholder-gray-300"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const Textarea = ({
  label, placeholder, value, onChange, rows = 4, hint,
}: { label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number; hint?: string }) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-semibold text-[#010101]">{label}</label>}
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] transition-all bg-white resize-none placeholder-gray-300"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const StepBar = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center gap-1.5">
    {steps.map((step, i) => (
      <div key={i} className="flex items-center gap-1.5">
        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
          i < current ? "bg-[#75DA9F] text-white" : i === current ? "border border-dashed border-[#75DA9F] text-[#75DA9F]" : "bg-gray-100 text-gray-400"
        }`}>
          {i < current ? <Check size={11} /> : i + 1}
        </div>
        <span className={`text-xs font-medium hidden lg:block ${i === current ? "text-[#010101]" : "text-gray-400"}`}>{step}</span>
        {i < steps.length - 1 && <div className={`w-6 h-px ${i < current ? "bg-[#75DA9F]" : "bg-gray-200"}`} />}
      </div>
    ))}
  </div>
);

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 text-gray-400 hover:text-gray-500 text-xs font-medium mb-5 transition-colors group w-fit"
  >
    <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
    Retour
  </button>
);

// ─── Layout ────────────────────────────────────────────────────────────────────
const Sidebar = ({ current, navigate }: { current: Screen; navigate: (s: Screen) => void }) => {
  const nav = [
    { label: "Dashboard", icon: BarChart2, screen: "dashboard" as Screen },
    { label: "Campagnes de recrutement", icon: Briefcase, screen: "missions" as Screen },
    { label: "Candidats", icon: Users, screen: "candidates" as Screen },
    { label: "Ressources", icon: BookOpen, screen: "resources" as Screen },
  ];
  return (
    <aside className="w-60 h-full bg-[#010101] flex flex-col flex-shrink-0">
      <div className="p-6 pb-5">
        <NoaLogo scale={0.78} />
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {nav.map(item => {
          const Icon = item.icon;
          const active = current === item.screen;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active ? "bg-[#99BAF8]/20 text-[#99BAF8]" : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-3 border-t border-white/10 flex flex-col gap-0.5">
        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all">
          <Settings size={17} />
          Paramètres
        </button>
        <button
          onClick={() => navigate("signup")}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
};

const AppHeader = ({ title }: { title?: string }) => (
  <header className="h-15 bg-white border-b border-black/[0.06] flex items-center px-6 gap-4 flex-shrink-0" style={{ height: 60 }}>
    {title && <span className="font-semibold text-[#010101] text-sm mr-auto">{title}</span>}
    <div className={`flex items-center gap-2 bg-gray-50 rounded-xl px-3.5 py-2 border border-gray-100 ${title ? "" : "flex-1 max-w-xs"}`}>
      <Search size={14} className="text-gray-400 flex-shrink-0" />
      <input placeholder="Rechercher..." className="bg-transparent text-sm focus:outline-none text-gray-600 placeholder-gray-400 w-full" />
    </div>
    <button className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all">
      <Bell size={17} className="text-gray-500" />
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#99BAF8] rounded-full border-2 border-white" />
    </button>
    <div className="w-8 h-8 rounded-full bg-[#CCB8FF]/30 flex items-center justify-center text-xs font-bold text-[#6b4ec4] select-none">
      ML
    </div>
  </header>
);

const AppLayout = ({
  children, current, navigate, headerTitle,
}: {
  children: React.ReactNode; current: Screen; navigate: (s: Screen) => void; headerTitle?: string;
}) => (
  <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
    <Sidebar current={current} navigate={navigate} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader title={headerTitle} />
      <main className="flex-1 overflow-y-auto p-7 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
        {children}
      </main>
    </div>
  </div>
);

// ─── Candidate avatar helper ───────────────────────────────────────────────────
const Avatar = ({ initials, color, size = "md" }: { initials: string; color: string; size?: "sm" | "md" | "lg" }) => {
  const sz = { sm: "w-8 h-8 text-xs", md: "w-11 h-11 text-base", lg: "w-14 h-14 text-xl" }[size];
  return (
    <div className={`${sz} rounded-2xl flex items-center justify-center font-bold flex-shrink-0 ${color}`} style={{ fontFamily: "Poppins, sans-serif" }}>
      {initials}
    </div>
  );
};

// ─── Screen 1: Sign up ─────────────────────────────────────────────────────────
const SignupScreen = ({ navigate }: { navigate: (s: Screen) => void; }) => {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <NoaLogo scale={0.85} />
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Recruter avec méthode,<br />sans expertise RH.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            noa guide chaque étape de vos recrutements grâce à une méthodologie éprouvée, pensée pour les managers de PME tech.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { n: "94%", label: "de recrutements réussis avec la méthode Topgrading", color: "text-[#75DA9F]" },
            { n: "3×", label: "plus vite qu'un process traditionnel", color: "text-[#99BAF8]" },
          ].map(s => (
            <div key={s.n} className="flex-1 bg-white/5 rounded-2xl p-5">
              <div className={`text-3xl font-bold mb-1.5 ${s.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.n}</div>
              <div className="text-white/50 text-xs leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>
          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Créer mon compte</h2>
          <p className="text-gray-400 text-sm mb-8">Commencez à recruter avec méthode en moins de 5 minutes.</p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <InputField label="Prénom" placeholder="Marie" required />
            <InputField label="Nom" placeholder="Leroy" required />
          </div>
          <div className="flex flex-col gap-4 mb-4">
            <InputField label="Email professionnel" type="email" placeholder="marie.leroy@techco.fr" required />
            <InputField label="Mot de passe" type="password" placeholder="••••••••" required />
            <InputField label="Nom de l'entreprise" placeholder="TechCo SAS" required />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <InputField label="SIRET" placeholder="123 456 789 00012" required />
            <InputField label="Fonction" placeholder="CTO, DG, Manager..." required />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Taille de l'équipe</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600">
                <option>1–10 personnes</option>
                <option>11–19 personnes</option>
                <option>20–49 personnes</option>
                <option>50-199 personnes</option>
                <option>199+ personnes</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Objectif principal</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] text-gray-600">
                <option>Structurer mes recrutements</option>
                <option>Gagner du temps</option>
                <option>Réduire les erreurs de cast</option>
                <option>Préparer une montée en charge</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 mb-7 cursor-pointer group">
            <div
              onClick={() => setAgreed(!agreed)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreed ? "bg-[#99BAF8] border-[#99BAF8]" : "border-gray-300 group-hover:border-[#99BAF8]"
              }`}
            >
              {agreed && <Check size={11} className="text-white" />}
            </div>
            <span className="text-sm text-gray-500 leading-relaxed">
              J'accepte les{" "}
              <span className="text-[#3a6fd4] underline">Conditions Générales d'Utilisation</span>{" "}
              et la{" "}
              <span className="text-[#3a6fd4] underline">Politique de confidentialité</span>
            </span>
          </label>

          <Btn variant="primary" size="lg" className="w-full justify-center" onClick={() => navigate("onboarding")} disabled={!agreed}>
            Créer mon compte
            <ChevronRight size={17} />
          </Btn>

          <p className="text-center text-xs text-gray-400 mt-5">
            Déjà un compte ?{" "}
            <span className="text-[#3a6fd4] cursor-pointer hover:underline" onClick={() => navigate("login")}>Se connecter</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Screen: Login ────────────────────────────────────────────────────────────
const LoginScreen = ({ navigate }: { navigate: (s: Screen) => void }) => {
  const [email, setEmail] = useState("marie.leroy@techco.fr");
  const [password, setPassword] = useState("••••••••");
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <div className="hidden lg:flex lg:w-[42%] bg-[#010101] flex-col p-12 justify-between flex-shrink-0">
        <NoaLogo scale={0.85} />
        <div>
          <h1 className="text-white font-bold text-4xl leading-tight mb-5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bon retour<br />parmi nous.
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Continuez là où vous en étiez. Vos campagnes et candidats vous attendent.
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { n: "94%", label: "de recrutements réussis avec la méthode Topgrading", color: "text-[#75DA9F]" },
            { n: "3×", label: "plus vite qu'un process traditionnel", color: "text-[#99BAF8]" },
          ].map(s => (
            <div key={s.n} className="flex-1 bg-white/5 rounded-2xl p-5">
              <div className={`text-3xl font-bold mb-1.5 ${s.color}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.n}</div>
              <div className="text-white/50 text-xs leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm py-8">
          <div className="lg:hidden mb-8"><NoaLogo /></div>
          <h2 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Se connecter</h2>
          <p className="text-gray-400 text-sm mb-8">Accédez à votre espace noa.</p>

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#010101]">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marie.leroy@techco.fr"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] placeholder-gray-300 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#010101]">Mot de passe</label>
                <span className="text-xs text-[#3a6fd4] cursor-pointer hover:underline">Mot de passe oublié ?</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/40 focus:border-[#99BAF8] placeholder-gray-300 transition-all"
              />
            </div>
          </div>

          <Btn
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={() => navigate("dashboard")}
            disabled={!email.trim() || !password.trim()}
          >
            Se connecter
            <ChevronRight size={17} />
          </Btn>

          <p className="text-center text-xs text-gray-400 mt-5">
            Pas encore de compte ?{" "}
            <span className="text-[#3a6fd4] cursor-pointer hover:underline" onClick={() => navigate("signup")}>Créer un compte</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Screen 2: Onboarding ─────────────────────────────────────────────────────
const TECH_STACK_SUGGESTIONS = [
  // Languages
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin", "Swift", "PHP", "Ruby", "C#", "Scala",
  // Frontend
  "React", "Next.js", "Vue.js", "Nuxt", "Angular", "Svelte", "Tailwind CSS", "Storybook",
  // Backend
  "Node.js", "NestJS", "FastAPI", "Django", "Laravel", "Spring Boot", "tRPC", "GraphQL", "REST API",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Supabase", "PlanetScale", "SQLite",
  // Cloud & Infra
  "AWS", "GCP", "Azure", "Vercel", "Netlify", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CircleCI",
  // Tools
  "Git", "Figma", "Linear", "Notion", "Datadog", "Sentry", "Stripe",
];

const OnboardingScreen = ({ navigate }: { navigate: (s: Screen) => void }) => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [autreText, setAutreText] = useState("");
  const [stack, setStack] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState("");

  const questions = [
    { q: "Décrivez l'activité principale de votre entreprise.", type: "textarea", placeholder: "Ex : Nous développons un SaaS B2B de gestion de projets pour des équipes de 10 à 200 personnes." },
    { q: "Dans quel secteur opérez-vous principalement ?", type: "choice", options: ["SaaS / Logiciel", "Fintech", "Healthtech", "E-commerce / Marketplace", "Deeptech / IA", "Autre"] },
    { q: "Quelle est votre stack technique ?", type: "stack" },
    { q: "Quelles sont vos 3 valeurs fondamentales ?", type: "textarea", placeholder: "Ex : Transparence, Excellence, Autonomie" },
    { q: "Comment décrieriez-vous votre culture de travail ?", type: "choice", options: ["Très structurée et processée", "Agile et itérative", "Collaborative et horizontale", "Orientée résultats", "En construction"] },
    { q: "Quels sont vos principaux défis RH aujourd'hui ?", type: "choice", options: ["Attirer les bons profils", "Évaluer objectivement", "Réduire le time-to-hire", "Fidéliser les talents", "Tous ces sujets"] },
  ];

  const toggleStack = (tag: string) =>
    setStack(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const addCustomStack = () => {
    const val = stackInput.trim();
    if (val && !stack.includes(val)) setStack(prev => [...prev, val]);
    setStackInput("");
  };

  const cur = questions[step];

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-start justify-center p-8">
      <div className="w-full max-w-xl pt-8">
        <div className="flex items-center justify-between mb-10">
          <NoaLogo scale={0.78} />
          <span className="text-xs text-gray-400 font-medium">{step + 1} / {questions.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1 mb-10">
          <div className="bg-[#99BAF8] h-1 rounded-full transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
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

          {cur.type === "textarea" && <Textarea placeholder={cur.placeholder} rows={3} />}

          {cur.type === "stack" && (
            <div className="flex flex-col gap-4">
              {/* Selected tags */}
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
              {/* Custom input */}
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
              {/* Suggestions grouped by category */}
              {[
                { label: "Langages", tags: ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin", "Swift", "PHP", "Ruby", "C#", "Scala"] },
                { label: "Frontend", tags: ["React", "Next.js", "Vue.js", "Nuxt", "Angular", "Svelte", "Tailwind CSS", "Storybook"] },
                { label: "Backend", tags: ["Node.js", "NestJS", "FastAPI", "Django", "Laravel", "Spring Boot", "tRPC", "GraphQL", "REST API"] },
                { label: "Base de données", tags: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Supabase", "PlanetScale", "SQLite"] },
                { label: "Cloud & Infra", tags: ["AWS", "GCP", "Azure", "Vercel", "Netlify", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "CircleCI"] },
                { label: "Outils", tags: ["Git", "Figma", "Linear", "Notion", "Datadog", "Sentry", "Stripe"] },
              ].map(group => (
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

        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Btn variant="secondary" onClick={() => { setStep(s => s - 1); setSelected([]); }}>
              <ArrowLeft size={15} />
              Retour
            </Btn>
          ) : <div />}
          <Btn variant="primary" onClick={() => step < questions.length - 1 ? (setStep(s => s + 1), setSelected([]), setStackInput("")) : navigate("dashboard")}>
            {step < questions.length - 1 ? "Continuer" : "Terminer la configuration"}
            <ChevronRight size={15} />
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Screen 3: Campaign — why ──────────────────────────────────────────────────
// Mini SVG illustrations for recruitment context cards
const IlluScale = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#75DA9F" fillOpacity="0.12" />
    {/* 3 rising bars */}
    <rect x="12" y="32" width="7" height="9" rx="2" fill="#75DA9F" fillOpacity="0.5" />
    <rect x="22.5" y="25" width="7" height="16" rx="2" fill="#75DA9F" fillOpacity="0.75" />
    <rect x="33" y="17" width="7" height="24" rx="2" fill="#75DA9F" />
    {/* arrow up */}
    <polyline points="33,17 37,12 41,17" stroke="#1e8f52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IlluReplacement = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#99BAF8" fillOpacity="0.12" />
    {/* person leaving (faded) */}
    <circle cx="18" cy="19" r="5" fill="#99BAF8" fillOpacity="0.35" />
    <path d="M10 38c0-5 3.6-8 8-8" stroke="#99BAF8" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* arrow right */}
    <line x1="22" y1="26" x2="32" y2="26" stroke="#3a6fd4" strokeWidth="1.8" strokeLinecap="round" />
    <polyline points="29,22 33,26 29,30" stroke="#3a6fd4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* person arriving (solid) */}
    <circle cx="38" cy="19" r="5" fill="#99BAF8" />
    <path d="M30 38c0-5 3.6-8 8-8" stroke="#99BAF8" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

const IlluReorg = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#CCB8FF" fillOpacity="0.12" />
    {/* org chart nodes */}
    <circle cx="26" cy="15" r="5" fill="#CCB8FF" />
    <line x1="26" y1="20" x2="26" y2="26" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="16" y1="26" x2="36" y2="26" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="16" y1="26" x2="16" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="26" y1="26" x2="26" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <line x1="36" y1="26" x2="36" y2="30" stroke="#CCB8FF" strokeWidth="1.5" />
    <circle cx="16" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.55" />
    <circle cx="26" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.8" />
    <circle cx="36" cy="34" r="4" fill="#CCB8FF" fillOpacity="0.55" />
    {/* shuffle arrows */}
    <path d="M20 40 Q26 43 32 40" stroke="#6b4ec4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <polyline points="30,38 32,40 30,42" stroke="#6b4ec4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IlluNewRole = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#FEE831" fillOpacity="0.15" />
    {/* lightbulb shape */}
    <path d="M26 13c-5 0-9 4-9 9 0 3.5 1.8 6.5 4.5 8.2V33h9v-2.8C33.2 28.5 35 25.5 35 22c0-5-4-9-9-9z" fill="#FEE831" fillOpacity="0.7" />
    <rect x="21.5" y="33" width="9" height="2.5" rx="1.2" fill="#FEE831" fillOpacity="0.9" />
    <rect x="23" y="35.5" width="6" height="2" rx="1" fill="#c8a800" fillOpacity="0.7" />
    {/* spark lines */}
    <line x1="26" y1="9" x2="26" y2="11" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="34" y1="12" x2="33" y2="13.4" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="38" y1="20" x2="36.5" y2="20" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18" y1="12" x2="19" y2="13.4" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="14" y1="20" x2="15.5" y2="20" stroke="#c8a800" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IlluOther = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="26" fill="#e5e7eb" fillOpacity="0.6" />
    {/* question mark */}
    <path d="M22 20c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2-1.5 3-3 4v2" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <circle cx="26" cy="33" r="1.5" fill="#9ca3af" />
  </svg>
);

const CampaignWhyScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const [reason, setReason] = useState("");
  const [autreDetail, setAutreDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_STEPS = [
    "Analyse du contexte de recrutement…",
    "Identification des enjeux du poste…",
    "Rédaction du résumé de la fiche…",
    "Finalisation en cours…",
  ];

  const handleCreate = () => {
    setLoading(true);
    setLoadingStep(0);
    const steps = [600, 1200, 1900, 2600];
    steps.forEach((delay, i) => setTimeout(() => setLoadingStep(i), delay));
    setTimeout(() => navigate("job-summary"), 3200);
  };
  const reasons = [
    { id: "scale", label: "Scale / Croissance", desc: "Soutenir la montée en charge de l'équipe", ring: "ring-[#75DA9F]/50 bg-[#75DA9F]/8", dot: "bg-[#75DA9F]", Illu: IlluScale },
    { id: "replacement", label: "Remplacement", desc: "Remplacer un collaborateur qui quitte le poste", ring: "ring-[#99BAF8]/50 bg-[#99BAF8]/8", dot: "bg-[#99BAF8]", Illu: IlluReplacement },
    { id: "reorg", label: "Réorganisation", desc: "Adapter l'équipe à un nouveau périmètre", ring: "ring-[#CCB8FF]/50 bg-[#CCB8FF]/8", dot: "bg-[#CCB8FF]", Illu: IlluReorg },
    { id: "newrole", label: "Création de poste", desc: "Un besoin nouveau, un rôle qui n'existait pas encore", ring: "ring-[#FEE831]/60 bg-[#FEE831]/12", dot: "bg-[#FEE831]", Illu: IlluNewRole },
    { id: "other", label: "Autre", desc: "Un contexte particulier à préciser", ring: "ring-gray-300 bg-gray-50", dot: "bg-gray-400", Illu: IlluOther },
  ];
  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Nouvelle mission">
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("missions")} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={0} /></div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Pourquoi ce recrutement ?</h1>
        <p className="text-gray-400 text-sm mb-7">Identifier le motif permet à noa de calibrer les objectifs et compétences attendus.</p>

        <div className="flex flex-col gap-2.5 mb-7">
          {reasons.map(r => {
            const isSelected = reason === r.id;
            const isOtherOpen = r.id === "other" && isSelected;
            return (
              <div
                key={r.id}
                className={`rounded-2xl transition-all overflow-hidden ${
                  isSelected ? `ring-2 ${r.ring}` : "bg-white hover:border hover:border-gray-100"
                }`}
              >
                <button
                  onClick={() => { setReason(r.id); if (r.id !== "other") setAutreDetail(""); }}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-current" : "border-gray-300"}`}>
                    {isSelected && <div className={`w-2 h-2 rounded-full ${r.dot}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#010101]">{r.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                  </div>
                  <div className="flex-shrink-0 opacity-80">
                    <r.Illu />
                  </div>
                </button>
                {isOtherOpen && (
                  <div className="px-5 pb-4 pt-0 border-t border-gray-200/60">
                    <input
                      autoFocus
                      value={autreDetail}
                      onChange={e => setAutreDetail(e.target.value)}
                      placeholder="Décrivez brièvement le contexte de ce recrutement…"
                      className="w-full bg-transparent text-sm text-[#010101] placeholder-gray-400 focus:outline-none pt-3"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Card className="p-6 mb-7">
          <div className="flex flex-col gap-4">
            <InputField label="Titre du poste" placeholder="Ex : Développeur Full-Stack Senior" required />
            <Textarea
              label="Missions macro du poste"
              placeholder="Décrivez en quelques lignes les grandes responsabilités. Pas besoin d'être exhaustif, noa enrichira la description ensuite."
              rows={4}
              hint="3 à 5 lignes suffisent pour démarrer."
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={handleCreate} disabled={!reason || loading}>
            {loading ? "Création en cours…" : "Créer ma fiche de poste"}
            {!loading && <ChevronRight size={17} />}
          </Btn>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 max-w-xs text-center">
            {/* Animated noa logo mark */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl bg-[#99BAF8]/20 animate-ping" style={{ animationDuration: "1.4s" }} />
              <div className="relative w-16 h-16 rounded-2xl bg-[#99BAF8]/10 flex items-center justify-center">
                <Zap size={28} className="text-[#3a6fd4]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4] mb-2">noa travaille pour vous</p>
              <p className="text-sm font-semibold text-[#010101] min-h-[1.5rem] transition-all">{LOADING_STEPS[loadingStep]}</p>
            </div>
            {/* Progress bar */}
            <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#99BAF8] rounded-full transition-all duration-700"
                style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

// ─── Screen 4: Job — mission ────────────────────────────────────────────────────
const MISSION_SUGGESTIONS = [
  {
    label: "Orientée livraison produit",
    text: "Concevoir et livrer les fonctionnalités backend et frontend qui permettront à l'équipe de tenir sa roadmap trimestrielle. Être le référent technique sur les intégrations tierces et contribuer à la montée en compétences des développeurs juniors.",
  },
  {
    label: "Orientée impact business",
    text: "Développer les intégrations API et les modules critiques qui réduiront le délai de déploiement client de 3 semaines à 3 jours. Prendre en charge les décisions d'architecture et garantir la qualité du code sur les sujets à fort enjeu.",
  },
];

// ─── Screen: Job summary validation ───────────────────────────────────────────
const JobSummaryScreen = ({
  navigate, current, missionText, setMissionText,
}: { navigate: (s: Screen) => void; current: Screen; missionText: string; setMissionText: (v: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(missionText);

  const handleEdit = () => { setDraft(missionText); setEditing(true); };
  const handleSave = () => { setMissionText(draft); setEditing(false); };

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("campaign-why")} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={1} /></div>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-[#99BAF8]/15 flex items-center justify-center">
            <Zap size={14} className="text-[#3a6fd4]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4]">Proposé par noa</p>
        </div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Mission du poste</h1>
        <p className="text-gray-400 text-sm mb-7">
          noa a rédigé une mission à partir de votre contexte. Validez-la ou réécrivez-la — elle sera utilisée tout au long du recrutement.
        </p>

        {/* Mission field */}
        <Card className="p-6 mb-4">
          {!editing ? (
            <>
              <p className="text-sm text-[#010101] leading-relaxed whitespace-pre-line mb-5">{missionText}</p>
              <button
                onClick={handleEdit}
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
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={5}
                className="w-full text-sm text-[#010101] leading-relaxed bg-gray-50 rounded-xl border border-gray-200 p-3 focus:outline-none focus:border-[#99BAF8] resize-none"
              />
              {/* Method reminder */}
              <div className="bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-3.5 text-xs text-gray-500 leading-relaxed">
                <p className="font-semibold text-[#3a6fd4] mb-1">Méthode — 1 à 5 phrases</p>
                <p>Résumez la raison d'être du poste et son impact stratégique. Soyez précis et mesurable.</p>
              </div>
              {/* Do / Don't */}
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
                    ].map(d => (
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
                    ].map(d => (
                      <li key={d} className="flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
                        <div className="w-1 h-1 rounded-full bg-red-300 mt-1.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Btn variant="primary" size="sm" onClick={handleSave}>Enregistrer</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setEditing(false)}>Annuler</Btn>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-between items-center mt-6">
          {!editing && (
            <button onClick={handleEdit} className="text-sm text-gray-400 hover:text-gray-500 transition-colors font-medium">
              Cette mission ne me convient pas
            </button>
          )}
          {editing && <div />}
          <Btn variant="primary" size="lg" onClick={() => navigate("job-results")} disabled={editing}>
            Ça me convient, on continue
            <ChevronRight size={17} />
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
};

const JobMissionScreen = ({ navigate, current, missionText, setMissionText }: { navigate: (s: Screen) => void; current: Screen; missionText: string; setMissionText: (v: string) => void }) => {
  const mission = missionText;
  const setMission = setMissionText;
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("campaign-why")} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={1} /></div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Mission du poste</h1>
        <p className="text-gray-400 text-sm mb-7">
          Besoin d'aide pour formuler la mission ? noa peut vous en proposer une base à partir du titre de poste et du contexte renseignés.
        </p>

        <Card className="p-6 mb-4 relative">
          <div className="relative">
            <Textarea value={mission} onChange={setMission} rows={5} />
            <button
              onClick={() => setShowSuggestions(o => !o)}
              title="Obtenir des suggestions"
              className={`absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                showSuggestions ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-400 hover:bg-[#99BAF8]/20 hover:text-[#3a6fd4]"
              }`}
            >
              <Zap size={13} />
            </button>
          </div>

          {showSuggestions && (
            <div className="mt-4 pt-4 border-t border-black/[0.05]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Suggestions noa</p>
              <div className="flex flex-col gap-3">
                {MISSION_SUGGESTIONS.map(s => (
                  <div key={s.label} className="bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#3a6fd4] mb-1.5">{s.label}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{s.text}</p>
                    <button
                      onClick={() => { setMission(s.text); setShowSuggestions(false); }}
                      className="text-[10px] font-bold text-[#3a6fd4] hover:underline"
                    >
                      Utiliser cette suggestion
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#75DA9F]/10 border border-[#75DA9F]/25 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-full bg-[#75DA9F] flex items-center justify-center">
                <Check size={9} className="text-white" />
              </div>
              <span className="text-xs font-bold text-[#1e8f52]">Orienté impact</span>
            </div>
            <p className="text-xs text-gray-500 italic leading-relaxed">
              "Développer les intégrations API qui réduiront le délai de déploiement client de 3 semaines à 3 jours."
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                <X size={9} className="text-red-500" />
              </div>
              <span className="text-xs font-bold text-red-500">À éviter</span>
            </div>
            <p className="text-xs text-gray-400 italic leading-relaxed">
              "Participer au développement de la plateforme et collaborer avec les équipes."
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={() => navigate("job-results")}>Continuer<ChevronRight size={17} /></Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 5: Job — results ───────────────────────────────────────────────────
type Objective = { id: number; title: string; metric: string; deadline: string; threshold: string };

const OBJ_SUGGESTIONS = [
  { title: "Livrer 8 fonctionnalités en production", metric: "Nb de fonctionnalités livrées et validées QA", deadline: "6 mois", threshold: "8 fonctionnalités minimum, sans régression majeure" },
  { title: "Réduire le temps de déploiement client", metric: "Délai moyen de mise en production", deadline: "3 mois", threshold: "< 3 jours (vs 3 semaines actuellement)" },
  { title: "Améliorer la couverture de tests", metric: "Taux de couverture sur les modules critiques", deadline: "2 mois", threshold: "> 80 %" },
];

const isVague = (o: Objective) =>
  o.title.length > 3 && (o.metric.trim() === "" || o.deadline.trim() === "" || o.threshold.trim() === "");

const ObjCard = ({
  obj, index, onUpdate, onRemove,
}: {
  obj: Objective; index: number;
  onUpdate: (key: keyof Objective, val: string) => void;
  onRemove: () => void;
}) => {
  const [showSug, setShowSug] = useState(false);
  const vague = isVague(obj);

  return (
    <Card className={`p-4 transition-all ${vague ? "border-orange-200 bg-orange-50/20" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Objectif {index + 1}</span>
        <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-all">
          <X size={13} />
        </button>
      </div>

      {/* Title row with spark */}
      <div className="flex items-center gap-2 mb-3">
        <input
          value={obj.title}
          onChange={e => onUpdate("title", e.target.value)}
          placeholder="Intitulé de l'objectif"
          className="flex-1 text-sm font-semibold bg-transparent focus:outline-none text-[#010101] placeholder-gray-200"
        />
        <button
          onClick={() => setShowSug(o => !o)}
          title="Obtenir des suggestions"
          className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
            showSug ? "bg-[#99BAF8] text-[#010101]" : "bg-[#99BAF8] text-blue-600 hover:bg-[#99BAF8]/20 hover:text-[#3a6fd4]"
          }`}
        >
          <Zap size={11} />
        </button>
      </div>

      {/* Suggestion panel */}
      {showSug && (
        <div className="mb-3 bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a6fd4] mb-2">Suggestions noa</p>
          <div className="flex flex-col gap-2">
            {OBJ_SUGGESTIONS.map(s => (
              <div key={s.title} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#010101]">{s.title}</p>
                  <p className="text-[10px] text-gray-400">{s.metric} · {s.deadline} · {s.threshold}</p>
                </div>
                <button
                  onClick={() => {
                    onUpdate("title", s.title);
                    onUpdate("metric", s.metric);
                    onUpdate("deadline", s.deadline);
                    onUpdate("threshold", s.threshold);
                    setShowSug(false);
                  }}
                  className="text-[10px] font-bold text-[#3a6fd4] hover:underline whitespace-nowrap flex-shrink-0 pt-0.5"
                >
                  Utiliser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-fields */}
      <div className="grid grid-cols-3 gap-2">
        {(["metric", "deadline", "threshold"] as const).map((k, ki) => (
          <div key={k} className="flex flex-col gap-1">
            <input
              value={obj[k]}
              onChange={e => onUpdate(k, e.target.value)}
              placeholder={["Métrique", "Délai", "Seuil de réussite"][ki]}
              className="text-xs bg-gray-50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#99BAF8]/30 text-gray-600 placeholder-gray-300"
            />
            {obj.title.length > 3 && obj[k].trim() === "" && (
              <span className="flex items-center gap-1 text-orange-400 text-[10px] px-1">
                <AlertTriangle size={9} />
                {["Ajouter une métrique", "Préciser un délai", "Définir un seuil"][ki]}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

const NOA_OBJ_SUGGESTIONS: Objective[] = [
  { id: 1, title: "Livrer le module d'intégrations API", metric: "3 intégrations tierces", deadline: "3 mois", threshold: "Livrées en production et documentées" },
  { id: 2, title: "Réduire le temps de déploiement client", metric: "Délai moyen de mise en production", deadline: "6 mois", threshold: "< 3 jours (vs 3 semaines actuellement)" },
  { id: 3, title: "Améliorer la couverture de tests", metric: "Taux de couverture sur les modules critiques", deadline: "2 mois", threshold: "> 80 %" },
];

const JobResultsScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [filling, setFilling] = useState(false);

  const update = (id: number, key: keyof Objective, val: string) =>
    setObjectives(prev => prev.map(o => o.id === id ? { ...o, [key]: val } : o));
  const remove = (id: number) => setObjectives(prev => prev.filter(o => o.id !== id));
  const add = () => setObjectives(prev => [...prev, { id: Date.now(), title: "", metric: "", deadline: "", threshold: "" }]);

  const fillSuggestions = () => {
    setFilling(true);
    NOA_OBJ_SUGGESTIONS.forEach((obj, i) => {
      setTimeout(() => {
        setObjectives(prev => [...prev, { ...obj, id: Date.now() + i }]);
        if (i === NOA_OBJ_SUGGESTIONS.length - 1) setFilling(false);
      }, i * 380);
    });
  };

  const isEmpty = objectives.length === 0;

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("job-summary")} />
        <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={2} /></div>
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Résultats attendus</h1>
        <p className="text-gray-400 text-sm mb-7">Définissez les objectifs mesurables attendus pour ce poste dans les 6 premiers mois.</p>

        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 rounded-2xl mb-5 gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#99BAF8]/10 flex items-center justify-center">
              <Target size={24} className="text-[#99BAF8]" />
            </div>
            <div className="text-center max-w-xs">
              <p className="font-semibold text-[#010101] text-sm mb-1">Aucun objectif défini</p>
              <p className="text-xs text-gray-400 leading-relaxed">noa peut vous proposer des objectifs mesurables adaptés au poste et à la mission que vous avez définie.</p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={fillSuggestions}
                disabled={filling}
                className="flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60"
              >
                <Zap size={14} />
                {filling ? "noa rédige…" : "Laisser noa suggérer"}
              </button>
              <button
                onClick={add}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:border-gray-300 transition-all"
              >
                <Plus size={14} />
                Ajouter manuellement
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {objectives.map((obj, i) => (
                <ObjCard
                  key={obj.id}
                  obj={obj}
                  index={i}
                  onUpdate={(k, v) => update(obj.id, k, v)}
                  onRemove={() => remove(obj.id)}
                />
              ))}
            </div>
            <button
              onClick={add}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-[#99BAF8] hover:text-[#3a6fd4] transition-all mb-8"
            >
              <Plus size={15} />
              Ajouter un objectif
            </button>
          </>
        )}

        <div className="flex justify-end mt-2">
          <Btn variant="primary" size="lg" onClick={() => navigate("job-skills")} disabled={isEmpty}>
            Continuer<ChevronRight size={17} />
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 6: Job — skills ────────────────────────────────────────────────────
type SkillBlock = { title: string; badge: string; accentText: string; skills: { name: string; checked: boolean }[]; suggestions: string[] };

const SKILLS_CATALOGUE = [
  {
    title: "Compétences techniques",
    badge: "bg-[#99BAF8]/15 text-[#3a6fd4] border-[#99BAF8]/20",
    accentText: "text-[#3a6fd4]",
    catalogue: [
      "TypeScript / JavaScript avancé", "React & Next.js", "Node.js / API REST",
      "PostgreSQL ou équivalent", "Tests unitaires (Jest, Vitest)", "CI/CD (GitHub Actions, Docker)",
      "GraphQL", "Redis", "AWS / GCP", "Kubernetes", "Python", "Architecture microservices",
      "Docker", "MongoDB", "Terraform", "Elasticsearch",
    ],
    suggestions: ["GraphQL", "Redis", "AWS / GCP", "Kubernetes", "Python", "Architecture microservices"],
  },
  {
    title: "Compétences relationnelles",
    badge: "bg-[#CCB8FF]/15 text-[#6b4ec4] border-[#CCB8FF]/20",
    accentText: "text-[#6b4ec4]",
    catalogue: [
      "Communication claire avec des non-techniques", "Autonomie sur des sujets complexes",
      "Feedback constructif en code review", "Facilitation de décisions techniques en équipe",
      "Écoute active", "Gestion des conflits", "Influence sans autorité", "Présentation en comité",
      "Négociation", "Intelligence émotionnelle", "Travail en équipe cross-fonctionnelle",
    ],
    suggestions: ["Écoute active", "Gestion des conflits", "Influence sans autorité", "Présentation en comité"],
  },
  {
    title: "Compétences comportementales",
    badge: "bg-[#75DA9F]/15 text-[#1e8f52] border-[#75DA9F]/20",
    accentText: "text-[#1e8f52]",
    catalogue: [
      "Orienté livraison et résultats", "Curiosité et veille technologique",
      "Fiabilité dans les engagements", "Capacité à gérer l'ambiguïté",
      "Initiative", "Résilience", "Vision long terme", "Exemplarité",
      "Ownership", "Adaptabilité", "Rigueur", "Esprit critique",
    ],
    suggestions: ["Initiative", "Résilience", "Vision long terme", "Exemplarité"],
  },
];

const SKILLS_INITIAL: SkillBlock[] = SKILLS_CATALOGUE.map(c => ({
  title: c.title,
  badge: c.badge,
  accentText: c.accentText,
  skills: c.catalogue.map(name => ({ name, checked: false })),
  suggestions: c.suggestions,
}));

const NOA_CHECKED: [number, number][] = [
  [0,0],[0,1],[0,2],[0,3],
  [1,0],[1,1],[1,2],
  [2,0],[2,1],[2,2],
];

const JobSkillsScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const emptyBlocks = SKILLS_INITIAL.map(b => ({ ...b, skills: b.skills.map(s => ({ ...s, checked: false })) }));
  const [blocks, setBlocks] = useState<SkillBlock[]>(emptyBlocks);
  const [filling, setFilling] = useState(false);
  const [filled, setFilled] = useState(false);

  const toggle = (bi: number, si: number) =>
    setBlocks(prev => prev.map((b, i) => i === bi ? { ...b, skills: b.skills.map((s, j) => j === si ? { ...s, checked: !s.checked } : s) } : b));

  const addSkill = (bi: number, name: string) =>
    setBlocks(prev => prev.map((b, i) => i === bi && !b.skills.find(s => s.name === name)
      ? { ...b, skills: [...b.skills, { name, checked: true }] }
      : b));

  const fillSuggestions = () => {
    setFilling(true);
    const suggested = SKILLS_INITIAL.map((b, bi) => ({
      ...b,
      skills: b.skills.map((s, si) => ({ ...s, checked: NOA_CHECKED.some(([nbi, nsi]) => nbi === bi && nsi === si) })),
    }));
    setTimeout(() => { setBlocks(suggested); setFilling(false); setFilled(true); }, 1800);
  };

  const isEmpty = !filled && blocks.every(b => b.skills.every(s => !s.checked));

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("job-results")} />
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
                onClick={fillSuggestions}
                disabled={filling}
                className="flex items-center gap-2 bg-[#010101] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-60"
              >
                <Zap size={14} />
                {filling ? "noa analyse…" : "Laisser noa suggérer"}
              </button>
              <button
                onClick={() => setFilled(true)}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl hover:border-gray-300 transition-all"
              >
                <Plus size={14} />
                Ajouter manuellement
              </button>
            </div>
          </div>
        ) : (
          <>
            {filled && (
              <div className="flex items-center gap-2 bg-[#75DA9F]/10 border border-[#75DA9F]/25 rounded-xl px-4 py-2.5 mb-5">
                <Zap size={13} className="text-[#1e8f52] flex-shrink-0" />
                <p className="text-xs text-[#1e8f52] font-medium">noa a présélectionné les compétences clés. Ajustez librement.</p>
              </div>
            )}
          </>
        )}

        {!isEmpty && <div className="flex flex-col gap-4 mb-8">
          {blocks.map((block, bi) => {
            const cat = SKILLS_CATALOGUE[bi];
            const checkedCount = block.skills.filter(s => s.checked).length;
            const customInputKey = `custom-${bi}`;
            return (
              <Card key={block.title} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${block.badge}`}>
                    {block.title}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">{checkedCount} sélectionnée{checkedCount > 1 ? "s" : ""}</span>
                </div>

                {/* Tags cliquables du catalogue */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.catalogue.map(name => {
                      const si = block.skills.findIndex(s => s.name === name);
                      const active = si >= 0 && block.skills[si].checked;
                      return (
                        <button
                          key={name}
                          onClick={() => si >= 0 ? toggle(bi, si) : addSkill(bi, name)}
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
                  </div>
                  {/* Champ custom */}
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <input
                      id={customInputKey}
                      placeholder="Ajouter une compétence…"
                      className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#99BAF8] placeholder-gray-300"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val) { addSkill(bi, val); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                    <button
                      className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                      onClick={() => {
                        const el = document.getElementById(customInputKey) as HTMLInputElement;
                        if (el?.value.trim()) { addSkill(bi, el.value.trim()); el.value = ""; }
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>}

        {!isEmpty && <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={() => navigate("job-coherence")}>Voir le récapitulatif<ChevronRight size={17} /></Btn>
        </div>}
      </div>
    </AppLayout>
  );
};

// ─── Screen 7: Recap ──────────────────────────────────────────────────────────
const JobCoherenceScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => (
  <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
    <div className="max-w-2xl mx-auto">
      <BackLink onClick={() => navigate("job-skills")} />
      <div className="mb-8"><StepBar steps={["Contexte", "Mission", "Résultats", "Compétences", "Récapitulatif"]} current={4} /></div>

      <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Récapitulatif</h1>
      <p className="text-gray-400 text-sm mb-7">Vérifiez que votre fiche de poste est complète avant de la valider.</p>

      {/* Context banner */}
      <div className="flex items-center gap-3 bg-[#010101] text-white rounded-2xl px-5 py-3.5 mb-5">
        <IlluScale />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#75DA9F] mb-0.5">Contexte</p>
          <p className="text-sm font-semibold">Développeur Full-Stack Senior · Scale / Croissance</p>
          <p className="text-xs text-white/50 mt-0.5">TechCo SAS · créée le 13 juillet 2025</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {/* Mission */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#99BAF8]/12 flex items-center justify-center">
                <FileText size={12} className="text-[#3a6fd4]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Mission</span>
            </div>
            <button onClick={() => navigate("job-summary")} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
              <Edit3 size={10} />Modifier
            </button>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Rejoindre l'équipe produit pour concevoir et développer les nouvelles fonctionnalités de la plateforme, en autonomie sur les sujets complexes et en appui des développeurs juniors.
          </p>
        </Card>

        {/* Résultats */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#75DA9F]/12 flex items-center justify-center">
                <Target size={12} className="text-[#1e8f52]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Résultats attendus</span>
            </div>
            <button onClick={() => navigate("job-results")} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
              <Edit3 size={10} />Modifier
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { o: "Livrer le module d'intégrations API", m: "3 intégrations · 3 mois" },
              { o: "Réduire le délai de déploiement client", m: "< 3 jours · 6 mois" },
              { o: "Améliorer la couverture de tests", m: "> 80 % · 2 mois" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#75DA9F]/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1e8f52] text-[9px] font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-sm text-[#010101] font-medium">{r.o}</span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{r.m}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compétences */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#CCB8FF]/12 flex items-center justify-center">
                <Award size={12} className="text-[#6b4ec4]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Compétences</span>
            </div>
            <button onClick={() => navigate("job-skills")} className="text-[10px] font-semibold text-gray-300 hover:text-[#3a6fd4] flex items-center gap-1 transition-colors">
              <Edit3 size={10} />Modifier
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Techniques", color: "bg-[#99BAF8]/10 text-[#3a6fd4]", items: ["TypeScript / JS avancé", "React & Next.js", "Node.js / API REST", "PostgreSQL"] },
              { label: "Relationnelles", color: "bg-[#CCB8FF]/10 text-[#6b4ec4]", items: ["Communication claire", "Autonomie confirmée", "Code review"] },
              { label: "Comportementales", color: "bg-[#75DA9F]/10 text-[#1e8f52]", items: ["Orienté résultats", "Curiosité tech", "Fiabilité"] },
            ].map(cat => (
              <div key={cat.label}>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block ${cat.color}`}>{cat.label}</span>
                <ul className="flex flex-col gap-1">
                  {cat.items.map(item => (
                    <li key={item} className="text-xs text-gray-500 flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Btn variant="primary" size="lg" onClick={() => navigate("job-final")}>
          <Check size={15} />
          Valider la fiche de poste
        </Btn>
      </div>
    </div>
  </AppLayout>
);

// ─── Screen 8: Finalized job ───────────────────────────────────────────────────
const JOB_FINAL_TEXT = `Développeur Full-Stack Senior — TechCo SAS
Scale / Croissance · 13 juillet 2025

MISSION
Rejoindre l'équipe produit en tant que Développeur Full-Stack Senior pour concevoir et développer les nouvelles fonctionnalités de la plateforme. Travailler en autonomie sur des sujets techniques complexes tout en contribuant à la montée en compétences de l'équipe junior. Être l'interlocuteur technique principal pour les intégrations tierces.

RÉSULTATS ATTENDUS
• Livrer le module d'intégrations API — 3 intégrations · 3 mois
• Réduire le délai de déploiement client — < 3 jours · 6 mois
• Améliorer la couverture de tests — > 80% · 2 mois
• Monter en compétences l'équipe junior — 2 sessions de pairing / mois · 6 mois

COMPÉTENCES REQUISES
Techniques : TypeScript / JS avancé, React & Next.js, Node.js / API REST, PostgreSQL
Relationnelles : Communication claire, Autonomie confirmée, Code review bienveillant
Comportementales : Orienté résultats, Curiosité tech, Fiabilité`;

const JobFinalScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JOB_FINAL_TEXT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
  <AppLayout current={current} navigate={navigate} headerTitle="Développeur Full-Stack Senior">
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Développeur Full-Stack Senior</h1>
          </div>
          <p className="text-gray-400 text-sm">TechCo SAS · Scale / Croissance · 13 juillet 2025</p>
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
          <Btn variant="secondary" size="sm"><Edit3 size={13} />Modifier</Btn>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {[
          {
            icon: <FileText size={12} className="text-[#3a6fd4]" />, bg: "bg-[#99BAF8]/12", title: "Mission",
            content: (
              <p className="text-sm text-gray-600 leading-relaxed">
                Rejoindre l'équipe produit en tant que Développeur Full-Stack Senior pour concevoir et développer les nouvelles fonctionnalités de la plateforme. Travailler en autonomie sur des sujets techniques complexes tout en contribuant à la montée en compétences de l'équipe junior. Être l'interlocuteur technique principal pour les intégrations tierces.
              </p>
            ),
          },
          {
            icon: <Target size={12} className="text-[#1e8f52]" />, bg: "bg-[#75DA9F]/12", title: "Résultats attendus",
            content: (
              <div className="flex flex-col gap-2.5">
                {[
                  { o: "Livrer le module d'intégrations API", m: "3 intégrations · 3 mois" },
                  { o: "Réduire le délai de déploiement client", m: "< 3 jours · 6 mois" },
                  { o: "Améliorer la couverture de tests", m: "> 80% · 2 mois" },
                  { o: "Monter en compétences l'équipe junior", m: "2 sessions de pairing / mois · 6 mois" },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#75DA9F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#1e8f52] text-[9px] font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#010101]">{r.o}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.m}</div>
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            icon: <Award size={12} className="text-[#6b4ec4]" />, bg: "bg-[#CCB8FF]/12", title: "Compétences",
            content: (
              <div className="grid grid-cols-3 gap-5">
                {[
                  { t: "Techniques", c: "bg-[#99BAF8]/10 text-[#3a6fd4]", items: ["TypeScript / JS avancé", "React & Next.js", "Node.js / API REST", "PostgreSQL"] },
                  { t: "Relationnelles", c: "bg-[#CCB8FF]/10 text-[#6b4ec4]", items: ["Communication claire", "Autonomie confirmée", "Code review bienveillant"] },
                  { t: "Comportementales", c: "bg-[#75DA9F]/10 text-[#1e8f52]", items: ["Orienté résultats", "Curiosité tech", "Fiabilité"] },
                ].map(cat => (
                  <div key={cat.t}>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-lg mb-2 inline-block ${cat.c}`}>{cat.t}</div>
                    <ul className="flex flex-col gap-1">
                      {cat.items.map(item => (
                        <li key={item} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-gray-300 mt-1 leading-none">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ),
          },
        ].map(section => (
          <Card key={section.title} className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${section.bg}`}>{section.icon}</div>
              <h3 className="font-semibold text-[#010101] text-sm">{section.title}</h3>
            </div>
            {section.content}
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Btn variant="secondary" onClick={() => navigate("job-coherence")}><ArrowLeft size={15} />Retour</Btn>
        <Btn variant="primary" size="lg" onClick={() => navigate("transition-candidate")}>
          Ajouter des candidats
          <Plus size={17} />
        </Btn>
      </div>
    </div>
  </AppLayout>
  );
};

// ─── Screen 9: Add candidate ───────────────────────────────────────────────────
const AddCandidateScreen = ({ navigate, current, onCreated }: { navigate: (s: Screen) => void; current: Screen; onCreated: () => void }) => {
  const [cvDone, setCvDone] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [extra1, setExtra1] = useState(false);

  const handleCvImport = () => {
    setParsing(true);
    setTimeout(() => {
      setFirstName("Alexandre");
      setLastName("Martin");
      setParsing(false);
      setCvDone(true);
    }, 1600);
  };

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Ajouter un candidat">
      <div className="max-w-xl mx-auto">
        <BackLink onClick={() => navigate("job-final")} />
        <h1 className="text-2xl font-bold text-[#010101] mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Importer un candidat</h1>
        <p className="text-gray-400 text-sm mb-7">noa crée automatiquement la fiche candidat à partir du CV importé.</p>

        <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 mb-7">
          <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Mission associée</div>
            <div className="text-sm font-semibold text-[#010101]">Développeur Full-Stack Senior</div>
          </div>
        </div>

        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-[#010101]">CV du candidat</span>
            <span className="text-xs text-red-400 font-medium">* Obligatoire</span>
          </div>
          <div
            onClick={!cvDone && !parsing ? handleCvImport : undefined}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              cvDone ? "border-[#75DA9F] bg-[#75DA9F]/5" : parsing ? "border-[#99BAF8] bg-[#99BAF8]/4" : "cursor-pointer border-gray-200 hover:border-[#99BAF8] hover:bg-[#99BAF8]/4"
            }`}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#99BAF8]/15 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#99BAF8]/40 border-t-[#3a6fd4] rounded-full animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#010101]">alexandre_martin_cv.pdf</div>
                  <div className="text-xs text-[#3a6fd4] mt-1">noa extrait les informations…</div>
                </div>
              </div>
            ) : cvDone ? (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-11 h-11 rounded-full bg-[#75DA9F]/20 flex items-center justify-center">
                  <Check size={18} className="text-[#1e8f52]" />
                </div>
                <div className="text-sm font-semibold text-[#010101]">alexandre_martin_cv.pdf</div>
                <div className="text-xs text-gray-400">124 Ko · importé avec succès</div>
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

          {/* Champs nom / prénom — apparaissent après import */}
          {(cvDone || parsing) && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-[#010101]">Identité du candidat</span>
                {cvDone && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full">
                    <Zap size={9} />noa a pré-rempli
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Prénom</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Nom</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Nom de famille"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#99BAF8] placeholder:text-gray-300 transition-colors"
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
              onClick={() => setExtra1(true)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                extra1 ? "border-[#CCB8FF]/30 bg-[#CCB8FF]/5" : "border-dashed border-gray-200 hover:border-gray-300"
              }`}
            >
              {extra1 ? (
                <>
                  <div className="w-7 h-7 rounded-lg bg-[#CCB8FF]/20 flex items-center justify-center">
                    <FileText size={13} className="text-[#6b4ec4]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#010101]">lettre_motivation.pdf</div>
                    <div className="text-xs text-gray-400">48 Ko</div>
                  </div>
                </>
              ) : (
                <>
                  <Plus size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Ajouter une pièce jointe (portfolio, lettre de motivation…)</span>
                </>
              )}
            </button>
            <button className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition-all text-left">
              <Plus size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Ajouter une deuxième pièce jointe</span>
            </button>
          </div>
        </Card>

        <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={onCreated} disabled={!cvDone || !firstName.trim() || !lastName.trim()}>
            Créer la fiche candidat
            <ChevronRight size={17} />
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Candidate header ──────────────────────────────────────────────────────────
const CandidateHeader = ({ step, badge, candidate }: { step: string; badge: BadgeColor; candidate?: CandidateData }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-4">
      <Avatar initials={candidate?.initials ?? "SR"} color={candidate?.avatarColor ?? "bg-[#99BAF8]/20 text-[#3a6fd4]"} size="md" />
      <div>
        <h1 className="text-xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>{candidate?.name ?? "Sophie Renard"}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-400">{candidate?.campaign ?? "Développeur Full-Stack Senior"}</span>
          <Badge color={badge}>{step}</Badge>
        </div>
      </div>
    </div>
    <Btn variant="secondary" size="sm"><Eye size={13} />Voir le CV</Btn>
  </div>
);

// ─── Screen 10: Screening grid ─────────────────────────────────────────────────
const ScreeningGridScreen = ({ navigate, current, candidate }: { navigate: (s: Screen) => void; current: Screen; candidate?: CandidateData }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [recording, setRecording] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [interviewDone, setInterviewDone] = useState(false);

  const questions = [
    {
      id: 1, q: "Expérience en développement React de niveau senior (> 3 ans)", crit: "Prérequis non négociable",
      probes: ["Sur combien d'années avez-vous utilisé React en contexte professionnel ?", "Quels sont vos projets React les plus complexes livrés en production ?", "Quelles librairies de l'écosystème maîtrisez-vous (state management, routing, testing) ?"],
    },
    {
      id: 2, q: "Maîtrise TypeScript dans un contexte professionnel", crit: "Prérequis non négociable",
      probes: ["Dans quels projets avez-vous utilisé TypeScript ?", "Avez-vous migré une base JS vers TypeScript ? Comment avez-vous géré la transition ?", "Comment gérez-vous les types complexes (génériques, types conditionnels) ?"],
    },
    {
      id: 3, q: "Expérience en environnement startup ou PME tech (< 50 pers.)", crit: "Critère important",
      probes: ["Pouvez-vous décrire la taille et le contexte de votre dernière structure ?", "Comment gériez-vous la dette technique avec peu de ressources ?", "Avez-vous participé à des décisions d'architecture en autonomie ?"],
    },
    {
      id: 4, q: "Disponibilité sous 4 semaines maximum", crit: "Contrainte logistique",
      probes: ["Quelle est votre date de disponibilité réelle ?", "Avez-vous un préavis en cours ? Est-il négociable ?", "Y a-t-il des contraintes de localisation ou de déplacement ?"],
    },
    {
      id: 5, q: "Prétentions salariales dans la fourchette 60–75 k€", crit: "Contrainte budgétaire",
      probes: ["Quelle est votre rémunération actuelle (fixe + variable) ?", "Quelles sont vos attentes pour ce poste ?", "Y a-t-il d'autres éléments importants pour vous (télétravail, RTT, BSPCE) ?"],
    },
    {
      id: 6, q: "A déjà accompagné ou mentoré des développeurs juniors", crit: "Critère important",
      probes: ["Pouvez-vous me donner un exemple concret de junior que vous avez accompagné ?", "Sur combien de temps ? Quel a été l'impact mesurable ?", "Comment adaptez-vous votre pédagogie selon le profil du junior ?"],
    },
  ];

  const allAnswered = questions.every(q => answers[q.id]);
  const btnStyle = (opt: string, id: number) => {
    const sel = answers[id] === opt;
    if (!sel) return "bg-gray-50 text-gray-400 hover:bg-gray-100";
    if (opt === "Oui") return "bg-[#75DA9F]/20 text-[#1e8f52] ring-1 ring-[#75DA9F]/40";
    if (opt === "Partiel") return "bg-[#FEE831]/25 text-[#8a6a00] ring-1 ring-[#FEE831]/50";
    return "bg-red-50 text-red-500 ring-1 ring-red-200";
  };

  return (
    <AppLayout current={current} navigate={navigate}>
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("add-candidate")} />
        <CandidateHeader step="Screening" badge="blue" candidate={candidate} />

        {/* ── Bandeau enregistrement ── */}
        <div className={`rounded-2xl border p-4 mb-5 transition-all ${recording ? "bg-red-50 border-red-200" : "bg-[#010101] border-[#010101]"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecording(r => !r)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${recording ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
            >
              {recording
                ? <span className="w-3 h-3 rounded-sm bg-white" />
                : <Mic size={17} className="text-white" />}
            </button>
            <div className="flex-1">
              {recording
                ? <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><p className="text-sm font-semibold text-red-700">Enregistrement en cours…</p></div>
                : <p className="text-sm font-semibold text-white">Enregistrer l'entretien</p>}
              <p className={`text-xs mt-0.5 ${recording ? "text-red-500" : "text-white/50"}`}>
                {recording ? "Cliquez pour arrêter l'enregistrement." : "La transcription ne peut pas être générée sans enregistrement."}
              </p>
            </div>
          </div>
          {!recording && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/10">
              <AlertTriangle size={12} className="text-[#FEE831] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/70">Informez le candidat qu'il est enregistré avant de démarrer l'entretien.</p>
            </div>
          )}
        </div>

        {/* ── Grille ── */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#99BAF8]/12 flex items-center justify-center">
              <FileText size={11} className="text-[#3a6fd4]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Grille de screening</h3>
          </div>
          <p className="text-xs text-gray-400 mb-1">Cochez la réponse pour chaque critère. Déroulez un critère pour retrouver<span className="font-bold"> les questions de relance.</span></p>
          <div className="flex flex-col">
            {questions.map((q, i) => {
              const open = !!expanded[q.id];
              return (
                <div key={q.id} className={`${i < questions.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <div className="flex items-start gap-3 py-3.5">
                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                      className="mt-0.5 w-5 h-5 rounded-md bg-gray-100 hover:bg-[#99BAF8]/15 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      <ChevronRight size={11} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#010101] leading-snug">{q.q}</p>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">{q.crit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {["Oui", "Partiel", "Non"].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${btnStyle(opt, q.id)}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Accordéon questions */}
                  {open && (
                    <div className="ml-8 mb-3 bg-[#99BAF8]/6 border border-[#99BAF8]/15 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#3a6fd4] uppercase tracking-widest mb-2">Questions de relance</p>
                      <ul className="flex flex-col gap-1.5">
                        {q.probes.map((probe, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-[#99BAF8] flex-shrink-0 mt-0.5">—</span>
                            {probe}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Notes libres ── */}
        <Card className="p-4 mb-6 bg-gray-50 border-gray-50">
          <div className="flex items-start gap-3">
            <Edit3 size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
            <textarea rows={2} placeholder="Notes libres pendant l'entretien…" className="w-full bg-transparent text-xs focus:outline-none text-gray-600 placeholder-gray-300 resize-none" />
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            {allAnswered ? <span className="text-[#1e8f52] font-medium">✓ Grille complète</span> : <span>{questions.filter(q => answers[q.id]).length}/{questions.length} critères renseignés</span>}
          </div>
          {interviewDone ? (
            <button
              onClick={() => navigate("screening-decision")}
              className="flex items-center gap-2 px-5 py-3 bg-[#010101] text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all"
            >
              Aller à la synthèse
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => { setRecording(false); setInterviewDone(true); }}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#010101] text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {recording && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
              Finir l'entretien
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 11: Screening decision ─────────────────────────────────────────────
const ScreeningDecisionScreen = ({ navigate, current, onDecideLater, candidate }: { navigate: (s: Screen) => void; current: Screen; onDecideLater?: () => void; candidate?: CandidateData }) => {
  const [question, setQuestion] = useState("");
  const [searching, setSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const handleSearch = () => {
    if (!question.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setAnswer(`Dans l'entretien, ${candidate?.name ?? "le candidat"} a mentionné avoir « guidé quelqu'un qui débutait » chez Flowtech, sans préciser la durée ni l'impact concret. Croisé avec son CV (poste Lead Front-End 2022–présent), la période correspond. Le mentoring est probable mais reste déclaratif — aucun exemple chiffré n'a été donné. À vérifier en Topgrading avec des questions du type : durée de l'accompagnement, évolution du junior, retour du manager.`);
    }, 1600);
  };

  return (
    <AppLayout current={current} navigate={navigate}>
      <div className="max-w-2xl mx-auto">
        <CandidateHeader step="Screening · Synthèse" badge="blue" candidate={candidate} />

        {/* ── Votre grille (évaluation recruteur) ── */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-500" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Votre évaluation</h3>
            <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Remplie pendant l'entretien</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Issue de la grille que vous avez complétée critère par critère.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Prérequis validés", v: "5/6", c: "bg-[#75DA9F]/10 text-[#1e8f52]" },
              { l: "Critères partiels", v: "1/6", c: "bg-[#FEE831]/20 text-[#8a6a00]" },
              { l: "Points d'attention", v: "0/6", c: "bg-red-50 text-red-500" },
            ].map(s => (
              <div key={s.l} className={`rounded-2xl p-4 text-center ${s.c}`}>
                <div className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{s.v}</div>
                <div className="text-xs mt-1 opacity-75">{s.l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Analyse noa (depuis la transcription) ── */}
        <div className="rounded-2xl border border-[#99BAF8]/30 bg-gradient-to-b from-[#99BAF8]/5 to-white p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#FEE831]/25 flex items-center justify-center">
              <Zap size={11} className="text-[#8a6a00]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Analyse noa</h3>
            <span className="ml-auto text-[10px] text-[#3a6fd4] bg-[#99BAF8]/15 px-2 py-0.5 rounded-full font-medium">Générée depuis la transcription</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Proposition d'analyse. La décision vous appartient.</p>

          {/* Points forts */}
          <div className="bg-white rounded-xl border border-[#75DA9F]/20 p-4 mb-3">
            <h4 className="text-[10px] font-bold text-[#1e8f52] uppercase tracking-widest mb-3">Points forts identifiés</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { t: "React senior confirmé", d: "5 ans d'expérience, projets complexes livrés en production (migration Next.js, LCP −40 %)" },
                { t: "TypeScript maîtrisé", d: "Utilisé quotidiennement depuis 3 ans dans un contexte professionnel, migration JS → TS réalisée" },
                { t: "Expérience startup vérifiée", d: "2 postes précédents en structures < 30 personnes — habitué aux contraintes PME et à l'autonomie" },
                { t: "Disponibilité conforme", d: "Disponible sous 3 semaines — en dessous de la contrainte maximale de 4 semaines" },
                { t: "Prétentions dans la fourchette", d: "67 k€ annoncé, dans la cible 60–75 k€ — pas de friction budgétaire" },
              ].map(item => (
                <li key={item.t} className="flex items-start gap-2.5 text-xs">
                  <Check size={12} className="text-[#75DA9F] flex-shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-[#010101]">{item.t} — </span><span className="text-gray-500">{item.d}</span></span>
                </li>
              ))}
            </ul>
          </div>

          {/* Points à approfondir */}
          <div className="bg-white rounded-xl border border-[#FEE831]/30 p-4 mb-4">
            <h4 className="text-[10px] font-bold text-[#8a6a00] uppercase tracking-widest mb-3">Points à approfondir au prochain entretien</h4>
            <ul className="flex flex-col gap-3">
              {[
                { t: "Mentoring junior", d: "Déclaré mais non étayé — aucun exemple concret (durée, contexte, impact mesurable) donné pendant l'entretien." },
                { t: "Taille exacte des équipes passées", d: "Expérience startup confirmée verbalement, mais la taille réelle des équipes n'a pas été précisée. À vérifier pour s'assurer de la cohérence avec < 50 pers." },
                { t: "Gestion des désaccords techniques", d: "Non abordée en Screening. Contexte important au vu du rôle senior et de la dynamique d'équipe actuelle." },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-[#FEE831]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-[#8a6a00]">{i + 1}</span>
                  </div>
                  <span><span className="font-semibold text-[#010101]">{item.t} — </span><span className="text-gray-600 leading-relaxed">{item.d}</span></span>
                </li>
              ))}
            </ul>
          </div>

          {/* Conseil noa */}
          <div className="bg-[#010101] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-[#FEE831]" />
              <p className="text-[10px] font-bold text-[#FEE831] uppercase tracking-widest">Conseil noa</p>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              5 critères sur 6 sont validés avec des éléments concrets. Le seul point d'incertitude — le mentoring junior — reste déclaratif. Le profil mérite d'être approfondi en Topgrading : le risque de passer à côté de ce candidat est supérieur au risque de le faire avancer.
            </p>
          </div>
        </div>

        {/* ── Question libre ── */}
        <Card className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-[#010101]">Poser une question sur l'entretien</p>
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">Interrogez un moment précis de l'entretien. La réponse est recherchée dans la transcription et croisée avec le profil du candidat.</p>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ex : qu'a-t-il dit exactement sur son expérience de mentoring ?"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#99BAF8] focus:ring-2 focus:ring-[#99BAF8]/20 placeholder-gray-300 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!question.trim() || searching}
              className="px-4 py-2.5 bg-[#010101] text-white text-xs font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {searching ? "…" : "Rechercher"}
            </button>
          </div>
          {searching && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#3a6fd4] rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-400">Recherche dans la transcription…</p>
            </div>
          )}
          {answer && !searching && (
            <div className="mt-3 bg-[#99BAF8]/6 border border-[#99BAF8]/20 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#3a6fd4] uppercase tracking-widest mb-2">Réponse trouvée dans la transcription</p>
              <p className="text-xs text-gray-600 leading-relaxed">{answer}</p>
              <button onClick={() => { setAnswer(null); setQuestion(""); }} className="text-[10px] text-gray-400 hover:text-gray-500 underline mt-2 block">Nouvelle question</button>
            </div>
          )}
        </Card>

        {/* ── CTAs ── */}
        <div className="flex items-center gap-3">
          <Btn variant="danger" onClick={() => navigate("candidates")}><X size={15} />Ne pas retenir</Btn>
          <Btn variant="secondary" onClick={() => { onDecideLater?.(); navigate("candidate-detail"); }}>Décider plus tard</Btn>
          <Btn variant="primary" size="lg" className="ml-auto" onClick={() => navigate("transition-topgrading")}><Check size={15} />Retenir pour la suite</Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 12: Topgrading grid ────────────────────────────────────────────────
const TopgradingGridScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [interviewDone, setInterviewDone] = useState(false);

  const episodes = [
    {
      co: "Scaleway", period: "2021–2025", role: "Senior Frontend Engineer",
      qs: [
        { q: "Quelles étaient vos missions principales ?", probes: ["Quelles étaient vos responsabilités techniques au quotidien ?", "Combien de personnes dans l'équipe front ?", "Étiez-vous autonome sur les choix d'architecture ?"] },
        { q: "Quelle est votre réalisation dont vous êtes le plus fier ?", probes: ["Décrivez le contexte et l'enjeu du projet.", "Quel était votre rôle précis ?", "Quel a été l'impact mesurable (perf, adoption, revenus) ?", "Qu'est-ce que votre manager de l'époque dirait de vous ?"] },
        { q: "Qu'est-ce qui vous a amené à quitter ce poste ?", probes: ["Qu'est-ce qui vous a poussé à chercher autre chose ?", "Si c'était à refaire, resteriez-vous plus longtemps ?", "Qu'aurait dû changer l'entreprise pour vous retenir ?"] },
      ],
    },
    {
      co: "Skello", period: "2019–2021", role: "Développeur Full-Stack",
      qs: [
        { q: "Quelles étaient vos missions principales ?", probes: ["Quelle était la répartition front / back dans votre quotidien ?", "Avec quelles équipes travailliez-vous (produit, design, data) ?", "Quels étaient vos principaux livrables ?"] },
        { q: "Comment gérez-vous un désaccord technique avec votre manager ?", probes: ["Pouvez-vous me donner un exemple concret ?", "Comment avez-vous exprimé votre point de vue ?", "Quel a été le résultat ? Avez-vous eu raison, tort, ou les deux en partie ?"] },
        { q: "Quelle était l'ambiance dans l'équipe ?", probes: ["Comment décririez-vous la culture technique ?", "Y avait-il des tensions ? Comment étaient-elles gérées ?", "Qu'est-ce qui vous manque le plus de cette équipe ?"] },
      ],
    },
    {
      co: "Freelance", period: "2017–2019", role: "Développeur Web indépendant",
      qs: [
        { q: "Quels types de clients et projets ?", probes: ["Quels secteurs et types de clients (startups, agences, grands comptes) ?", "Quel était le projet le plus complexe techniquement ?", "Comment gériez-vous la relation client (brief, livrables, retours) ?"] },
        { q: "Comment organisez-vous votre travail en autonomie ?", probes: ["Comment structuriez-vous votre semaine type ?", "Comment gériez-vous les imprévus et les changements de scope ?", "Pourquoi avez-vous choisi d'arrêter le freelance à ce moment-là ?"] },
      ],
    },
  ];

  return (
    <AppLayout current={current} navigate={navigate}>
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("screening-decision")} />
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar initials="AM" color="bg-[#CCB8FF]/20 text-[#6b4ec4]" size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Alexandre Martin</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">Entretien Topgrading</span>
                <Badge color="violet">Topgrading</Badge>
              </div>
            </div>
          </div>
          <Btn variant="secondary" size="sm"><Eye size={13} />Voir le CV</Btn>
        </div>

        {/* ── Bandeau enregistrement ── */}
        <div className={`rounded-2xl border p-4 mb-5 transition-all ${recording ? "bg-red-50 border-red-200" : "bg-[#010101] border-[#010101]"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRecording(r => !r)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${recording ? "bg-red-500" : "bg-white/10 hover:bg-white/20"}`}
            >
              {recording
                ? <span className="w-3 h-3 rounded-sm bg-white" />
                : <Mic size={17} className="text-white" />}
            </button>
            <div className="flex-1">
              {recording
                ? <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><p className="text-sm font-semibold text-red-700">Enregistrement en cours…</p></div>
                : <p className="text-sm font-semibold text-white">Enregistrer l'entretien</p>}
              <p className={`text-xs mt-0.5 ${recording ? "text-red-500" : "text-white/50"}`}>
                {recording ? "Cliquez pour arrêter l'enregistrement." : "La transcription ne peut pas être générée sans enregistrement."}
              </p>
            </div>
          </div>
          {!recording && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/10">
              <AlertTriangle size={12} className="text-[#FEE831] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/70">Informez le candidat qu'il est enregistré avant de démarrer l'entretien.</p>
            </div>
          )}
        </div>

        {/* ── Contexte ── */}
        <div className="bg-[#CCB8FF]/10 border border-[#CCB8FF]/25 rounded-2xl p-4 mb-5">
          <p className="text-xs text-[#6b4ec4] leading-relaxed">
            Le Topgrading explore le parcours chronologique. Posez les questions dans l'ordre et notez les réponses. Déroulez chaque question pour afficher les relances.
          </p>
        </div>

        {/* ── Grille épisodes ── */}
        <div className="flex flex-col gap-4 mb-6">
          {episodes.map((ep, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-[#010101] text-sm">{ep.co}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{ep.role}</div>
                </div>
                <Badge color="violet">{ep.period}</Badge>
              </div>
              <div className="flex flex-col gap-2.5">
                {ep.qs.map((item, qi) => {
                  const key = `${i}-${qi}`;
                  const open = !!expanded[key];
                  return (
                    <div key={qi} className="bg-gray-50 rounded-xl overflow-hidden">
                      {/* Question header */}
                      <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2">
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="w-5 h-5 rounded-md bg-white border border-gray-200 hover:border-[#CCB8FF] flex items-center justify-center flex-shrink-0 transition-colors"
                        >
                          <ChevronRight size={10} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
                        </button>
                        <p className="text-xs font-semibold text-gray-700 flex-1">{item.q}</p>
                      </div>
                      {/* Accordéon relances */}
                      {open && (
                        <div className="mx-3.5 mb-3 bg-[#CCB8FF]/10 border border-[#CCB8FF]/20 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-[#6b4ec4] uppercase tracking-widest mb-2">Questions de relance</p>
                          <ul className="flex flex-col gap-1.5">
                            {item.probes.map((probe, pi) => (
                              <li key={pi} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="text-[#CCB8FF] flex-shrink-0 mt-0.5">—</span>
                                {probe}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Note textarea */}
                      <div className="px-3.5 pb-3">
                        <textarea
                          value={notes[key] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [key]: e.target.value }))}
                          rows={2}
                          placeholder="Notes…"
                          className="w-full bg-transparent text-xs focus:outline-none text-gray-600 placeholder-gray-300 resize-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Notez les réponses au fur et à mesure de l'entretien.</p>
          {interviewDone ? (
            <button
              onClick={() => navigate("topgrading-decision")}
              className="flex items-center gap-2 px-5 py-3 bg-[#010101] text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all"
            >
              Aller à la synthèse
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => { setRecording(false); setInterviewDone(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-[#010101] text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              {recording && <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />}
              Finir l'entretien
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 13: Topgrading decision ───────────────────────────────────────────
const TopgradingDecisionScreen = ({ navigate, current, onDecideLater }: { navigate: (s: Screen) => void; current: Screen; onDecideLater?: () => void }) => {
  const [question, setQuestion] = useState("");
  const [searching, setSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const handleSearch = () => {
    if (!question.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setAnswer("Chez Scaleway (2021–2025), Alexandre Martin a décrit avoir « pris l'initiative de structurer les code reviews et d'animer des sessions de pair-programming hebdomadaires » avec un développeur junior. Il a précisé que ce junior a été promu en moins d'un an. Pas d'exemple similaire mentionné pour les autres postes. Cohérent avec le profil Lead sur son CV, mais un seul cas documenté sur l'ensemble du parcours.");
    }, 1600);
  };

  return (
    <AppLayout current={current} navigate={navigate}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar initials="AM" color="bg-[#CCB8FF]/20 text-[#6b4ec4]" size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Alexandre Martin</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-400">Topgrading · Synthèse</span>
                <Badge color="violet">Topgrading</Badge>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 italic">Proposition d'analyse. La décision vous appartient.</span>
        </div>

        {/* ── Votre évaluation (recruteur) ── */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-500" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Votre évaluation</h3>
            <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Issue de vos notes d'entretien</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Synthèse des réponses et observations notées pendant l'entretien Topgrading.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Points forts", v: "7", c: "bg-[#75DA9F]/10 text-[#1e8f52]" },
              { l: "Points nuancés", v: "2", c: "bg-[#FEE831]/20 text-[#8a6a00]" },
              { l: "Points d'attention", v: "1", c: "bg-red-50 text-red-500" },
            ].map(s => (
              <div key={s.l} className={`rounded-2xl p-4 text-center ${s.c}`}>
                <div className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>{s.v}</div>
                <div className="text-xs mt-1 opacity-75">{s.l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Analyse noa (depuis la transcription) ── */}
        <div className="rounded-2xl border border-[#CCB8FF]/30 bg-gradient-to-b from-[#CCB8FF]/5 to-white p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-md bg-[#FEE831]/25 flex items-center justify-center">
              <Zap size={11} className="text-[#8a6a00]" />
            </div>
            <h3 className="font-semibold text-[#010101] text-sm">Analyse noa</h3>
            <span className="ml-auto text-[10px] text-[#6b4ec4] bg-[#CCB8FF]/20 px-2 py-0.5 rounded-full font-medium">Générée depuis la transcription</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Proposition d'analyse. La décision vous appartient.</p>

          {/* Analyse par dimension */}
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 mb-3">
            {[
              { l: "Pattern de performance", v: "Progression constante et accélérée : junior à senior en 4 ans, avec prise de responsabilités lead non demandée chez Flowtech. Cohérent à chaque étape.", pos: true },
              { l: "Raisons de départ", v: "Toutes les transitions sont motivées par la recherche d'un impact plus grand — aucune friction managériale signalée. Raisons vérifiables et cohérentes avec le parcours.", pos: true },
              { l: "Autonomie vérifiée", v: "3 ans en freelance avec gestion complète de la relation client et des livrables. Patterns d'autonomie confirmés également chez Scaleway (initiatives techniques non sollicitées).", pos: true },
              { l: "Mentoring junior", v: "Confirmé chez Flowtech : accompagnement sur 18 mois, code reviews structurées, pair-programming hebdomadaire — junior promu en moins d'un an. Un seul cas documenté.", pos: true },
              { l: "Gestion des désaccords", v: "Exemple concret chez Skello : désaccord sur l'architecture API, résolu par documentation et test comparatif sur scope limité. Approche mature et mesurée.", pos: true },
              { l: "Ambiance et dynamique d'équipe", v: "Décrit les équipes positivement dans tous les contextes, sans complaisance — cite des tensions réelles chez Skello résolues par la transparence.", pos: true },
              { l: "Organisation en freelance", v: "Semaine structurée en blocs, outils de suivi utilisés (Notion + Toggl). Gestion des imprévus via buffer systématique.", pos: true },
              { l: "Profondeur technique déclarée vs. vérifiable", v: "Les compétences avancées (migration TypeScript, architecture Next.js) sont mentionnées mais non testées. Aucune question technique posée en Topgrading.", pos: false, neutral: true },
              { l: "Projet de carrière à long terme", v: "Aspire à un rôle Lead dans 2–3 ans, pas nécessairement manager. Mérite d'être confronté aux plans de croissance de l'équipe.", pos: false, neutral: true },
              { l: "Stabilité à long terme", v: "Durée moyenne des postes : 2,5 ans. Le passage en freelance reste peu expliqué — raison principale évoquée (besoin d'indépendance) non approfondie.", pos: false },
            ].map(item => (
              <div key={item.l} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.pos ? "bg-[#75DA9F]/20" : item.neutral ? "bg-[#FEE831]/25" : "bg-red-50"}`}>
                  {item.pos ? <Check size={10} className="text-[#1e8f52]" /> : item.neutral ? <span className="text-[8px] font-bold text-[#8a6a00]">~</span> : <AlertTriangle size={9} className="text-red-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#010101]">{item.l}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.v}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Conseil noa */}
          <div className="bg-[#010101] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={12} className="text-[#FEE831]" />
              <p className="text-[10px] font-bold text-[#FEE831] uppercase tracking-widest">Conseil noa</p>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Le parcours est cohérent et la progression est réelle. Le mentoring junior est résolu positivement. L'autonomie est vérifiée sur la durée. Le seul point qui mérite une attention particulière est la stabilité long terme — mais compte tenu des autres indicateurs, ce candidat est un finaliste crédible.
            </p>
          </div>
        </div>

        {/* ── Question libre ── */}
        <Card className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <FileText size={11} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-[#010101]">Poser une question sur l'entretien</p>
          </div>
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">Interrogez un moment précis de l'entretien. La réponse est recherchée dans la transcription et croisée avec le profil du candidat.</p>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Ex : qu'a-t-il dit sur son expérience de mentoring ?"
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#CCB8FF] focus:ring-2 focus:ring-[#CCB8FF]/20 placeholder-gray-300 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!question.trim() || searching}
              className="px-4 py-2.5 bg-[#010101] text-white text-xs font-semibold rounded-xl hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              {searching ? "…" : "Rechercher"}
            </button>
          </div>
          {searching && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#6b4ec4] rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-gray-400">Recherche dans la transcription…</p>
            </div>
          )}
          {answer && !searching && (
            <div className="mt-3 bg-[#CCB8FF]/8 border border-[#CCB8FF]/25 rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#6b4ec4] uppercase tracking-widest mb-2">Réponse trouvée dans la transcription</p>
              <p className="text-xs text-gray-600 leading-relaxed">{answer}</p>
              <button onClick={() => { setAnswer(null); setQuestion(""); }} className="text-[10px] text-gray-400 hover:text-gray-500 underline mt-2 block">Nouvelle question</button>
            </div>
          )}
        </Card>

        {/* ── CTAs ── */}
        <div className="flex items-center gap-3">
          <Btn variant="danger" onClick={() => navigate("candidates")}><X size={15} />Ne pas retenir</Btn>
          <Btn variant="secondary" onClick={() => { onDecideLater?.(); navigate("candidate-detail"); }}>Décider plus tard</Btn>
          <Btn variant="primary" size="lg" className="ml-auto" onClick={() => navigate("transition-final")}><Check size={15} />Retenir pour la suite</Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Screen 14: Final decision ─────────────────────────────────────────────────
const FinalDecisionScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const score = 82;
  const blocks = [
    { l: "Résultats attendus", s: 85, bar: "bg-[#75DA9F]" },
    { l: "Compétences techniques", s: 90, bar: "bg-[#99BAF8]" },
    { l: "Compétences relationnelles", s: 78, bar: "bg-[#CCB8FF]" },
    { l: "Compétences comportementales", s: 80, bar: "bg-[#FEE831]" },
    { l: "Fit culturel", s: 75, bar: "bg-[#99BAF8]/60" },
  ];
  return (
    <AppLayout current={current} navigate={navigate}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar initials="AM" color="bg-[#75DA9F]/20 text-[#1e8f52]" size="md" />
            <div>
              <h1 className="text-xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Alexandre Martin</h1>
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
            <span className="text-8xl font-bold text-[#010101] leading-none" style={{ fontFamily: "Poppins, sans-serif" }}>{score}</span>
            <span className="text-3xl text-gray-200 font-light mb-2">/100</span>
          </div>
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#75DA9F]/15 text-[#1e8f52] text-sm font-bold">
              <TrendingUp size={14} />
              Profil recommandé
            </span>
          </div>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            Cette note est une aide à la décision calculée à partir de vos critères. Elle ne se substitue pas à votre jugement.
          </p>
        </Card>

        <Card className="p-6 mb-5">
          <h3 className="font-semibold text-[#010101] text-sm mb-5">Détail par bloc</h3>
          <div className="flex flex-col gap-4">
            {blocks.map(b => (
              <div key={b.l}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-600">{b.l}</span>
                  <span className="text-xs font-bold text-[#010101]">{b.s}/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${b.bar} transition-all`} style={{ width: `${b.s}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 mb-7 bg-gray-50/80 border-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-[#010101] mb-2.5">Forces</div>
              <ul className="flex flex-col gap-1.5">
                {["Stack technique parfaitement maîtrisée", "Parcours progressif et cohérent", "Disponibilité rapide (3 semaines)"].map(s => (
                  <li key={s} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-[#75DA9F] font-bold mt-0.5">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="text-xs font-bold text-[#010101] mb-2.5">À surveiller</div>
              <ul className="flex flex-col gap-1.5">
                {["Fit culturel à confirmer à l'usage", "Prétentions en haut de fourchette"].map(s => (
                  <li key={s} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-orange-400 font-bold mt-0.5">·</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Btn variant="danger" onClick={() => navigate("candidates")}><X size={15} />Ne pas retenir</Btn>
          <Btn variant="primary" size="lg" onClick={() => navigate("candidates")}><Check size={15} />Marquer comme recruté</Btn>
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const DashboardScreen = ({ navigate, current, navigateToMission }: { navigate: (s: Screen) => void; current: Screen; navigateToMission: (m: MissionData) => void }) => (
  <AppLayout current={current} navigate={navigate} headerTitle="Dashboard">
    <div className="max-w-5xl mx-auto">

      {/* ── Hero banner ── */}
      <div className="bg-[#010101] rounded-2xl px-7 py-6 mb-7 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-500 mb-1.5">Mardi 15 juillet 2025</p>
          <h1 className="text-2xl font-bold text-white mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bonjour, Marie 👋
          </h1>
          <p className="text-sm text-gray-400">
            Vous avez <span className="font-bold text-white">2 décisions</span> en attente cette semaine.
          </p>
        </div>
        <button
          onClick={() => navigate("campaign-why")}
          className="flex items-center gap-2 bg-white text-[#010101] text-sm font-bold px-5 py-3 rounded-xl hover:bg-gray-100 transition-all flex-shrink-0"
        >
          <Plus size={15} />
          Nouvelle mission
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 gap-3.5 mb-7">
        {[
          { l: "Recrutements actifs", v: "3", icon: <Briefcase size={15} />, c: "bg-[#99BAF8]/10 border-[#99BAF8]/20", t: "text-[#3a6fd4]", sub: "+1 ce mois" },
          { l: "Candidats en cours", v: "12", icon: <Users size={15} />, c: "bg-[#CCB8FF]/10 border-[#CCB8FF]/20", t: "text-[#6b4ec4]", sub: "4 nouveaux" },
          { l: "Entretiens prévus", v: "5", icon: <BarChart2 size={15} />, c: "bg-[#75DA9F]/10 border-[#75DA9F]/20", t: "text-[#1e8f52]", sub: "Cette semaine" },
          { l: "Décisions en attente", v: "2", icon: <AlertTriangle size={15} />, c: "bg-[#FEE831]/10 border-[#FEE831]/30", t: "text-[#8a6a00]", sub: "À traiter" },
        ].map(s => (
          <Card key={s.l} className={`p-5 ${s.c}`}>
            <div className={`flex items-center gap-1.5 mb-3 ${s.t}`}>{s.icon}<span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.sub}</span></div>
            <div className={`text-4xl font-bold ${s.t}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.v}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* ── Recrutements actifs ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#010101] text-sm">Recrutements actifs</h2>
          <button onClick={() => navigate("missions")} className="text-xs text-[#3a6fd4] font-semibold hover:underline flex items-center gap-1">Voir tout <ChevronRight size={11} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MISSIONS.map(m => (
            <div
              key={m.title}
              onClick={() => navigateToMission(m)}
              className="group bg-white rounded-2xl border border-black/[0.06] p-4 hover:border-[#99BAF8]/40 hover:shadow-sm hover:shadow-[#99BAF8]/10 transition-all cursor-pointer"
            >
              <div className="font-semibold text-sm text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-snug mb-1.5">{m.title}</div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  m.statusColor === "green" ? "bg-[#75DA9F]" : m.statusColor === "blue" ? "bg-[#99BAF8]" : m.statusColor === "yellow" ? "bg-[#FEE831]" : "bg-[#CCB8FF]"
                }`} />
                <span className="text-[10px] text-gray-400 font-medium">{m.status}</span>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[10px] text-gray-400">{m.date}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <Users size={11} />{m.candidates.length} candidat{m.candidates.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Candidats récents ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#010101] text-sm">Candidats récents</h2>
          <button onClick={() => navigate("candidates")} className="text-xs text-[#3a6fd4] font-semibold hover:underline flex items-center gap-1">Voir tout <ChevronRight size={11} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "Alexandre Martin", i: "AM", role: "Dév. Full-Stack Senior", s: "Topgrading", b: "violet" as BadgeColor, ac: "bg-[#CCB8FF]/20 text-[#6b4ec4]" },
            { n: "Sophie Renard", i: "SR", role: "Product Manager", s: "Screening", b: "blue" as BadgeColor, ac: "bg-[#99BAF8]/20 text-[#3a6fd4]" },
            { n: "Thomas Nguyen", i: "TN", role: "Head of CS", s: "Décision finale", b: "green" as BadgeColor, ac: "bg-[#75DA9F]/20 text-[#1e8f52]" },
          ].map(c => (
            <div
              key={c.n}
              onClick={() => navigate("final-decision")}
              className="group bg-white rounded-2xl border border-black/[0.06] p-4 hover:border-[#99BAF8]/40 hover:shadow-sm hover:shadow-[#99BAF8]/10 transition-all cursor-pointer flex items-center gap-3"
            >
              <Avatar initials={c.i} color={c.ac} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#010101] truncate group-hover:text-[#3a6fd4] transition-colors">{c.n}</div>
                <div className="text-[10px] text-gray-400 truncate">{c.role}</div>
              </div>
              <Badge color={c.b}>{c.s}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actions rapides ── */}
      <div>
        <h2 className="font-bold text-[#010101] text-sm mb-3">Actions rapides</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ajouter un candidat", desc: "Importer un CV", icon: <Users size={15} />, color: "text-[#6b4ec4] bg-[#CCB8FF]/12", screen: "add-candidate" as Screen },
            { label: "Nouvelle mission", desc: "Créer une fiche de poste", icon: <Briefcase size={15} />, color: "text-[#3a6fd4] bg-[#99BAF8]/12", screen: "campaign-why" as Screen },
            { label: "Ressources", desc: "Méthode A-Player", icon: <BookOpen size={15} />, color: "text-[#1e8f52] bg-[#75DA9F]/12", screen: "resources" as Screen },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.screen)}
              className="group flex items-center gap-3 bg-white rounded-2xl border border-black/[0.06] px-4 py-3.5 hover:border-gray-200 hover:shadow-sm transition-all text-left"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>{a.icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors">{a.label}</div>
                <div className="text-[10px] text-gray-400">{a.desc}</div>
              </div>
              <ChevronRight size={13} className="ml-auto text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

    </div>
  </AppLayout>
);

// ─── Missions list ─────────────────────────────────────────────────────────────
const MissionsScreen = ({ navigate, current, navigateToMission }: { navigate: (s: Screen) => void; current: Screen; navigateToMission: (m: MissionData) => void }) => (
  <AppLayout current={current} navigate={navigate} headerTitle="Missions">
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Campagne de recrutement</h1>
          <p className="text-gray-400 text-sm mt-1">{MISSIONS.length} missions actives</p>
        </div>
        <Btn variant="primary" onClick={() => navigate("campaign-why")}><Plus size={15} />Nouvelle mission</Btn>
      </div>
      <div className="flex flex-col gap-4">
        {MISSIONS.map(m => (
          <Card key={m.title} className="p-6 hover:border-[#99BAF8]/25 transition-all cursor-pointer" onClick={() => navigateToMission(m)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#010101]">{m.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">{m.reason}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">Créée le {m.date}</span>
                </div>
              </div>
              <Badge color={m.statusColor}>{m.status}</Badge>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users size={12} />
                {m.candidates.length} candidat{m.candidates.length !== 1 ? "s" : ""}
              </div>
              
            </div>
          </Card>
        ))}
      </div>
    </div>
  </AppLayout>
);

// ─── Mission detail ────────────────────────────────────────────────────────────
const KANBAN_COLS: { key: string; label: string; color: string; dot: string }[] = [
  { key: "Screening",       label: "Screening",       color: "border-[#99BAF8]/40 bg-[#99BAF8]/4", dot: "bg-[#99BAF8]" },
  { key: "Topgrading",      label: "Topgrading",      color: "border-[#CCB8FF]/40 bg-[#CCB8FF]/4", dot: "bg-[#CCB8FF]" },
  { key: "Décision finale", label: "Décision finale", color: "border-[#75DA9F]/40 bg-[#75DA9F]/4", dot: "bg-[#75DA9F]" },
  { key: "Non retenu",      label: "Non retenu",      color: "border-gray-200 bg-gray-50",          dot: "bg-gray-300" },
];

const MissionDetailScreen = ({ navigate, current, mission, onSelectCandidate }: { navigate: (s: Screen) => void; current: Screen; mission: MissionData; onSelectCandidate: (name: string) => void }) => {
  const [jobOpen, setJobOpen] = useState(false);
  const allCandidates = mission.candidates;

  return (
    <AppLayout current={current} navigate={navigate} headerTitle={mission.title}>
      <div className="max-w-5xl mx-auto">
        <BackLink onClick={() => navigate("missions")} />

        {/* ── Section 1 : Titre + avancement + fiche de poste ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {mission.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge color={mission.statusColor}>{mission.status}</Badge>
              <span className="text-xs text-gray-400">{mission.reason} · Créée le {mission.date}</span>
            </div>
          </div>
        </div>

        {/* ── Avancement pleine largeur ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Avancement du recrutement</p>
          <ProcessFrise active={mission.processStep} />
          
        </Card>

        {/* ── Fiche de poste pleine largeur ── */}
        <Card className="overflow-hidden mb-8">
          {/* En-tête toujours visible : titre + mission */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#99BAF8]/15 flex items-center justify-center text-[#3a6fd4] flex-shrink-0 mt-0.5">
                  <FileText size={15} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#010101] mb-2">Fiche de poste</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{mission.mission}</p>
                </div>
              </div>
              <button
                onClick={() => setJobOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:text-[#2a5cb8] flex-shrink-0 mt-0.5 transition-colors"
              >
                {jobOpen ? "Réduire" : "Voir plus de détails"}
                <ChevronRight size={13} className={`transition-transform ${jobOpen ? "rotate-90" : ""}`} />
              </button>
            </div>
          </div>

          {/* Détails dépliables */}
          {jobOpen && (
            <div className="px-5 pb-5 pt-1 border-t border-black/[0.04]">
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Résultats attendus</p>
                  <div className="flex flex-col gap-2.5">
                    {mission.objectives.map(o => (
                      <div key={o.l} className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${o.ok ? "bg-[#75DA9F]/20 text-[#1e8f52]" : "bg-orange-50 text-orange-400"}`}>
                          {o.ok ? <Check size={10} /> : <AlertTriangle size={9} />}
                        </div>
                        <div>
                          <p className="text-sm text-[#010101] font-medium leading-snug">{o.l}</p>
                          <p className="text-xs text-gray-400">{o.m}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Compétences</p>
                  <div className="flex flex-col gap-3">
                    {mission.skills.map(block => (
                      <div key={block.l}>
                        <p className="text-[10px] font-semibold text-gray-400 mb-1.5">{block.l}</p>
                        <div className="flex flex-wrap gap-1">
                          {block.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-medium bg-gray-100 text-gray-500 rounded-lg px-2 py-0.5">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── Section 2 : Kanban candidats ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>
              Candidats
              <span className="ml-2 text-sm font-normal text-gray-400">{allCandidates.length}</span>
            </h2>
            <Btn variant="primary" size="sm" onClick={() => navigate("add-candidate")}>
              <Plus size={13} />Ajouter un candidat
            </Btn>
          </div>

          {allCandidates.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
                <Users size={18} />
              </div>
              <p className="text-sm font-semibold text-[#010101]">Aucun candidat pour le moment</p>
              <p className="text-xs text-gray-400">Importez un premier CV pour démarrer l'évaluation.</p>
              <Btn variant="primary" size="sm" onClick={() => navigate("add-candidate")}>
                <Plus size={13} />Ajouter un candidat
              </Btn>
            </Card>
          ) : (
            <div className="grid grid-cols-4 gap-3 items-start">
              {KANBAN_COLS.map(col => {
                const cards = allCandidates.filter(c => c.s === col.key);
                return (
                  <div key={col.key} className={`rounded-2xl border p-3 ${col.color}`}>
                    {/* Colonne header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                      <span className="text-xs font-bold text-[#010101]">{col.label}</span>
                      <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-white/70 rounded-lg px-1.5 py-0.5">{cards.length}</span>
                    </div>

                    {/* Cartes */}
                    <div className="flex flex-col gap-2">
                      {cards.length === 0 && (
                        <div className="py-6 flex flex-col items-center gap-1.5 text-center">
                          <p className="text-[10px] text-gray-300 font-medium">Aucun candidat</p>
                        </div>
                      )}
                      {cards.map(c => (
                        <div
                          key={c.n}
                          onClick={() => onSelectCandidate(c.n)}
                          className="bg-white rounded-xl border border-black/[0.06] p-3 cursor-pointer hover:border-[#99BAF8]/40 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <Avatar initials={c.i} color={c.ac} size="sm" />
                            <span className="text-xs font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight">{c.n}</span>
                          </div>
                          {c.sc !== null ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-1">
                                <div className="h-1 rounded-full bg-[#99BAF8]" style={{ width: `${c.sc}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 tabular-nums">{c.sc}/100</span>
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-300 mt-1">Pas encore noté</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

// ─── Candidates list ───────────────────────────────────────────────────────────
// ─── Candidate data ────────────────────────────────────────────────────────────
type CandidateStepStatus = "done" | "current" | "pending" | "none";
type CvExperience = { role: string; company: string; period: string; bullets: string[] };
type CandidateData = {
  name: string; initials: string; campaign: string;
  avatarColor: string; badgeColor: BadgeColor; status: string;
  screening: CandidateStepStatus;
  topgrading: CandidateStepStatus;
  decision: CandidateStepStatus;
  score: number | null;
  screeningDate?: string; screeningInterviewer?: string;
  topgradingDate?: string; topgradingInterviewer?: string;
  title?: string; location?: string; email?: string;
  summary?: string;
  experiences?: CvExperience[];
  education?: { degree: string; school: string; year: string };
  skills?: string[];
};

const CANDIDATES: CandidateData[] = [
  {
    name: "Alexandre Martin", initials: "AM", campaign: "Développeur Full-Stack Senior",
    avatarColor: "bg-[#CCB8FF]/20 text-[#6b4ec4]", badgeColor: "violet", status: "Topgrading",
    screening: "done", topgrading: "current", decision: "pending", score: null,
    screeningDate: "8 juil. 2025", screeningInterviewer: "Marie Lambert",
    title: "Lead Front-End Engineer", location: "Paris, France", email: "a.martin@email.com",
    summary: "Développeur front-end senior avec 7 ans d'expérience en environnements scale-up. Spécialisé React/TypeScript, passionné par les architectures performantes et l'expérience utilisateur.",
    experiences: [
      { role: "Lead Front-End Engineer", company: "Flowtech", period: "2022 – présent", bullets: ["Pilotage de l'architecture front sur 3 produits SaaS", "Migration complète vers Next.js, réduisant le LCP de 40 %", "Management d'une équipe de 4 développeurs front"] },
      { role: "Développeur Front-End Senior", company: "Agence Pixel", period: "2019 – 2022", bullets: ["Intégration de design systems pour 12 clients grands comptes", "Mise en place d'un système de design tokens partagé (−40 % de temps d'intégration)", "Introduction de React dans les projets de l'agence"] },
      { role: "Développeur Front-End", company: "StartupLab", period: "2017 – 2019", bullets: ["Développement de l'interface de la v1 du produit de 0 à 40k utilisateurs", "Implémentation des animations et micro-interactions"] },
    ],
    education: { degree: "Master Informatique — Génie Logiciel", school: "Université Paris-Saclay", year: "2017" },
    skills: ["TypeScript", "React", "Next.js", "GraphQL", "Tailwind CSS", "Figma", "Jest", "CI/CD"],
  },
  {
    name: "Sophie Renard", initials: "SR", campaign: "Développeur Full-Stack Senior",
    avatarColor: "bg-[#99BAF8]/20 text-[#3a6fd4]", badgeColor: "blue", status: "Screening",
    screening: "current", topgrading: "pending", decision: "pending", score: null,
    title: "Full-Stack Developer", location: "Lyon, France", email: "s.renard@email.com",
    summary: "Développeuse full-stack polyvalente, à l'aise du back-end Node.js jusqu'au front React. Expérience en startup et en ESN, cherche à évoluer dans un contexte produit ambitieux.",
    experiences: [
      { role: "Full-Stack Developer", company: "Nexio SaaS", period: "2021 – présent", bullets: ["Développement de nouvelles fonctionnalités sur une plateforme B2B (React + Node.js)", "Refonte de l'API REST en architecture modulaire", "Participation aux rituels agile et revues de code"] },
      { role: "Développeuse Web", company: "ESN Sopra", period: "2019 – 2021", bullets: ["Missions en régie chez 3 clients grands comptes", "Intégration front-end et développement de services back Java Spring"] },
    ],
    education: { degree: "Diplôme d'Ingénieur — Informatique", school: "INSA Lyon", year: "2019" },
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "REST API", "Agile"],
  },
  {
    name: "Thomas Nguyen", initials: "TN", campaign: "Product Manager",
    avatarColor: "bg-[#75DA9F]/20 text-[#1e8f52]", badgeColor: "green", status: "Décision finale",
    screening: "done", topgrading: "done", decision: "current", score: 74,
    screeningDate: "1 juil. 2025", screeningInterviewer: "Marie Lambert",
    topgradingDate: "7 juil. 2025", topgradingInterviewer: "Marie Lambert",
    title: "Senior Product Manager", location: "Paris, France", email: "t.nguyen@email.com",
    summary: "PM senior avec 6 ans d'expérience sur des produits B2B complexes. Forte appétence data, habitué à travailler avec des équipes tech et design distribuées.",
    experiences: [
      { role: "Senior Product Manager", company: "Kantify", period: "2021 – présent", bullets: ["Ownership du produit core (30k MAU), roadmap et priorisation trimestrielle", "Lancement de 2 nouvelles lignes de produits, +35 % de revenu ARR", "Collaboration quotidienne avec 2 équipes d'ingénierie"] },
      { role: "Product Manager", company: "Doctolib", period: "2018 – 2021", bullets: ["Delivery de la feature agenda intelligent (1M+ utilisateurs)", "Coordination avec les équipes réglementaires et médicales", "A/B testing et analyse des métriques de conversion"] },
    ],
    education: { degree: "MSc Management — Spécialité Digital", school: "HEC Paris", year: "2018" },
    skills: ["Product Strategy", "Roadmapping", "SQL", "Figma", "Amplitude", "OKR", "Agile / SCRUM"],
  },
  {
    name: "Clara Dubois", initials: "CD", campaign: "Product Manager",
    avatarColor: "bg-[#FEE831]/20 text-[#8a6a00]", badgeColor: "yellow", status: "Screening",
    screening: "current", topgrading: "pending", decision: "pending", score: null,
    title: "Product Manager", location: "Bordeaux, France", email: "c.dubois@email.com",
    summary: "PM avec 4 ans d'expérience en SaaS B2B, spécialisée dans les cycles de découverte produit et la conduite du changement. Apprécie les environnements où l'impact est mesurable.",
    experiences: [
      { role: "Product Manager", company: "Skillup", period: "2021 – présent", bullets: ["Responsable du module formation et parcours apprenant", "Réduction du churn de 18 % grâce à une refonte de l'onboarding", "Animation des comités produit mensuels avec les parties prenantes"] },
      { role: "Chargée de projet digital", company: "Groupe La Poste", period: "2019 – 2021", bullets: ["Pilotage de la refonte d'outils internes (6 000 utilisateurs)", "Coordination des prestataires et des équipes métier"] },
    ],
    education: { degree: "Master Management de Projets Digitaux", school: "Sciences Po Bordeaux", year: "2019" },
    skills: ["Product Discovery", "Figma", "Jira", "Google Analytics", "SQL (notions)", "UX Research"],
  },
  {
    name: "Marc Lefèvre", initials: "ML", campaign: "Head of Customer Success",
    avatarColor: "bg-red-50 text-red-400", badgeColor: "red", status: "Non retenu",
    screening: "done", topgrading: "done", decision: "done", score: 41,
    screeningDate: "25 juin 2025", screeningInterviewer: "Marie Lambert",
    topgradingDate: "2 juil. 2025", topgradingInterviewer: "Marie Lambert",
    title: "Customer Success Manager", location: "Nantes, France", email: "m.lefevre@email.com",
    summary: "CSM avec 5 ans d'expérience en SaaS. Gestion de portefeuilles clients PME et ETI, forte orientation satisfaction client et renouvellement.",
    experiences: [
      { role: "Customer Success Manager", company: "Sellsy", period: "2020 – présent", bullets: ["Gestion d'un portefeuille de 80 clients (ARR 1,2M€)", "NPS porté de 32 à 51 en 18 mois", "Formation et onboarding des nouveaux clients"] },
      { role: "Account Manager", company: "Sage", period: "2018 – 2020", bullets: ["Suivi commercial de 120 comptes PME", "Renouvellement de contrats et upsell"] },
    ],
    education: { degree: "BTS Négociation et Digitalisation de la Relation Client", school: "Lycée Livet, Nantes", year: "2018" },
    skills: ["CRM (Salesforce, HubSpot)", "Onboarding", "NPS", "Gestion de portefeuille", "Excel"],
  },
  {
    name: "Emma Bernard", initials: "EB", campaign: "Développeur Full-Stack Senior",
    avatarColor: "bg-[#CCB8FF]/20 text-[#6b4ec4]", badgeColor: "blue", status: "Screening",
    screening: "current", topgrading: "pending", decision: "pending", score: null,
    title: "Software Engineer — Back-End", location: "Toulouse, France", email: "e.bernard@email.com",
    summary: "Ingénieure back-end spécialisée Python/Django et architecture microservices. Expérience en fintech et e-commerce, à l'aise avec les systèmes à fort volume.",
    experiences: [
      { role: "Software Engineer", company: "Payfit", period: "2022 – présent", bullets: ["Développement de services de paie et de conformité (Django, PostgreSQL)", "Optimisation des performances API (−60 % de temps de réponse)", "Participation à la migration microservices"] },
      { role: "Back-End Developer", company: "ManoMano", period: "2020 – 2022", bullets: ["Développement de l'API catalogue produit (10M+ références)", "Mise en place de pipelines de données avec Kafka"] },
    ],
    education: { degree: "Diplôme d'Ingénieur — Systèmes d'Information", school: "ENSEEIHT Toulouse", year: "2020" },
    skills: ["Python", "Django", "PostgreSQL", "Kafka", "Docker", "Kubernetes", "REST API", "Redis"],
  },
];

// ─── Candidates list ──────────────────────────────────────────────────────────
const CAND_KANBAN_COLS: { key: string; label: string; border: string; bg: string; dot: string; emptyText: string }[] = [
  { key: "Screening",       label: "Screening",       border: "border-[#99BAF8]/35", bg: "bg-[#99BAF8]/5",  dot: "bg-[#99BAF8]",  emptyText: "Aucun candidat en screening" },
  { key: "Topgrading",      label: "Topgrading",      border: "border-[#CCB8FF]/35", bg: "bg-[#CCB8FF]/5",  dot: "bg-[#CCB8FF]",  emptyText: "Aucun candidat en topgrading" },
  { key: "Décision finale", label: "Décision finale", border: "border-[#75DA9F]/35", bg: "bg-[#75DA9F]/5",  dot: "bg-[#75DA9F]",  emptyText: "Aucune décision en attente" },
  { key: "Non retenu",      label: "Non retenu",      border: "border-gray-200",     bg: "bg-gray-50",      dot: "bg-gray-300",   emptyText: "Aucun candidat non retenu" },
];

const CandidatesScreen = ({ navigate, current, onSelect }: { navigate: (s: Screen) => void; current: Screen; onSelect: (c: CandidateData) => void }) => {
  const [candidates, setCandidates] = useState<CandidateData[]>(CANDIDATES);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, name: string) => {
    setDragging(name);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (!dragging) return;
    setCandidates(prev => prev.map(c => c.name === dragging ? { ...c, status: colKey } : c));
    setDragging(null);
    setDragOver(null);
  };

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Candidats">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Candidats</h1>
            <p className="text-gray-400 text-sm mt-1">{candidates.length} candidats en cours d'évaluation</p>
          </div>
          <Btn variant="primary" onClick={() => navigate("add-candidate")}><Plus size={15} />Ajouter un candidat</Btn>
        </div>

        <div className="grid grid-cols-4 gap-3 items-start">
          {CAND_KANBAN_COLS.map(col => {
            const cards = candidates.filter(c => c.status === col.key);
            const isOver = dragOver === col.key;
            return (
              <div
                key={col.key}
                onDragOver={e => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, col.key)}
                className={`rounded-2xl border p-3 transition-all ${
                  isOver
                    ? "border-[#99BAF8] bg-[#99BAF8]/10 scale-[1.01]"
                    : `${col.border} ${col.bg}`
                }`}
              >
                {/* Header colonne */}
                <div className="flex items-center gap-2 px-1 mb-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="text-xs font-bold text-[#010101]">{col.label}</span>
                  <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-white/80 rounded-lg px-1.5 py-0.5 border border-black/[0.05]">{cards.length}</span>
                </div>

                {/* Cartes */}
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {cards.length === 0 && !isOver && (
                    <div className="py-8 flex items-center justify-center rounded-xl border-2 border-dashed border-transparent">
                      <p className="text-[10px] text-gray-300 font-medium text-center">{col.emptyText}</p>
                    </div>
                  )}
                  {isOver && cards.length === 0 && (
                    <div className="py-8 rounded-xl border-2 border-dashed border-[#99BAF8]/40 bg-[#99BAF8]/5" />
                  )}
                  {cards.map(c => (
                    <div
                      key={c.name}
                      draggable
                      onDragStart={e => handleDragStart(e, c.name)}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClick={() => { if (!dragging) { onSelect(c); navigate("candidate-detail"); } }}
                      className={`bg-white rounded-xl border border-black/[0.06] p-3.5 cursor-grab active:cursor-grabbing hover:border-[#99BAF8]/40 hover:shadow-sm transition-all group select-none ${
                        dragging === c.name ? "opacity-40 scale-95" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <Avatar initials={c.initials} color={c.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#010101] group-hover:text-[#3a6fd4] transition-colors leading-tight truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.campaign}</p>
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
                    </div>
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
};

// ─── Candidate detail ─────────────────────────────────────────────────────────
const STEP_META: Record<string, { desc: string; dest: Screen }> = {
  Screening: {
    desc: "Cet entretien permet d'évaluer rapidement l'adéquation du profil avec le poste et de valider les prérequis essentiels.",
    dest: "screening-grid",
  },
  Topgrading: {
    desc: "Cet entretien permet d'analyser en profondeur le parcours du candidat, ses réalisations passées et ses comportements en situation réelle.",
    dest: "topgrading-grid",
  },
  Décision: {
    desc: "Toutes les étapes d'évaluation sont complètes. Vous pouvez maintenant prendre votre décision finale.",
    dest: "final-decision",
  },
};

type SubStep = "prep" | "interview" | "decision";
const SUB_STEPS: { key: SubStep; label: string }[] = [
  { key: "prep", label: "Préparation" },
  { key: "interview", label: "Entretien" },
  { key: "decision", label: "Décision" },
];
const SUB_STEP_DEST: Record<string, Record<SubStep, { dest: Screen; label: string }>> = {
  Screening: {
    prep:      { dest: "interview-prep",      label: "Préparer" },
    interview: { dest: "screening-grid",      label: "Commencer" },
    decision:  { dest: "screening-decision",  label: "Décider" },
  },
  Topgrading: {
    prep:      { dest: "interview-prep",      label: "Préparer" },
    interview: { dest: "topgrading-grid",     label: "Commencer" },
    decision:  { dest: "topgrading-decision", label: "Décider" },
  },
};

const CandidateFrise = ({ screening, topgrading, decision, navigate, onPrepare, subStep, onSubStep }: {
  screening: CandidateStepStatus; topgrading: CandidateStepStatus; decision: CandidateStepStatus;
  navigate: (s: Screen) => void; onPrepare?: (step: string) => void;
  subStep: Record<string, SubStep>; onSubStep: (step: string, s: SubStep) => void;
}) => {
  const steps = [
    { label: "Screening", status: screening },
    { label: "Topgrading", status: topgrading },
    { label: "Décision", status: decision },
  ];
  const activeStep = steps.find(s => s.status === "current");

  return (
    <div className="flex flex-col gap-5">
      {/* ── Main frise ── */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const done = step.status === "done";
          const cur = step.status === "current";
          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? "bg-[#75DA9F] text-white" : cur ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-300"
                }`}>
                  {done ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  cur ? "text-[#010101]" : done ? "text-[#1e8f52]" : "text-gray-300"
                }`}>{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-16 mx-1 mb-5 flex-shrink-0 ${done ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Sous-frise étape en cours ── */}
      {activeStep && (activeStep.label === "Screening" || activeStep.label === "Topgrading") && (() => {
        const stepKey = activeStep.label;
        const curSub = subStep[stepKey] ?? "prep";
        const curSubIdx = SUB_STEPS.findIndex(s => s.key === curSub);
        const destMap = SUB_STEP_DEST[stepKey];
        const accentBg = stepKey === "Screening" ? "bg-[#99BAF8]/8 border-[#99BAF8]/20" : "bg-[#CCB8FF]/8 border-[#CCB8FF]/20";
        const accentText = stepKey === "Screening" ? "text-[#3a6fd4]" : "text-[#6b4ec4]";
        const accentCircle = stepKey === "Screening" ? "bg-[#99BAF8] text-white" : "bg-[#CCB8FF] text-[#6b4ec4]";

        return (
          <div className={`rounded-xl border ${accentBg} p-4`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${accentText} mb-4`}>Sous-étapes — {stepKey}</p>

            {/* Sub-step nodes */}
            <div className="flex items-start gap-0 mb-4">
              {SUB_STEPS.map((sub, si) => {
                const isDone = si < curSubIdx;
                const isCur = si === curSubIdx;
                const isUpcoming = si > curSubIdx;
                const canClick = isDone; // done nodes are revisitable
                return (
                  <div key={sub.key} className="flex items-start">
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        disabled={isUpcoming}
                        onClick={() => {
                          if (!canClick) return;
                          onSubStep(stepKey, sub.key);
                          if (sub.key === "prep" && onPrepare) {
                            onPrepare(stepKey);
                          } else {
                            navigate(destMap[sub.key].dest);
                          }
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                          ${isDone ? "bg-[#75DA9F] text-white hover:opacity-80 cursor-pointer" : isCur ? `${accentCircle}` : "bg-gray-100 text-gray-300 cursor-default"}`}
                      >
                        {isDone ? <Check size={11} /> : si + 1}
                      </button>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${
                        isCur ? "text-[#010101]" : isDone ? "text-[#1e8f52]" : "text-gray-300"
                      }`}>{sub.label}</span>
                      {isDone && (
                        <button
                          onClick={() => {
                            onSubStep(stepKey, sub.key);
                            if (sub.key === "prep" && onPrepare) onPrepare(stepKey);
                            else navigate(destMap[sub.key].dest);
                          }}
                          className={`text-[10px] underline ${accentText} hover:opacity-70 transition-opacity`}
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                    {si < SUB_STEPS.length - 1 && (
                      <div className={`h-px w-12 mx-1 mt-3.5 flex-shrink-0 ${isDone ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA étape courante */}
            <div className="flex gap-2 flex-wrap">
              {curSub === "prep" && (
                <Btn variant="primary" size="sm" onClick={() => { onSubStep(stepKey, "prep"); if (onPrepare) onPrepare(stepKey); }}>
                  <FileText size={13} />Préparer l'entretien
                </Btn>
              )}
              {curSub === "interview" && (
                <Btn variant="primary" size="sm" onClick={() => { navigate(destMap.interview.dest); }}>
                  Commencer l'entretien <ChevronRight size={14} />
                </Btn>
              )}
              {curSub === "decision" && (
                <Btn variant="primary" size="sm" onClick={() => navigate(destMap.decision.dest)}>
                  Prendre une décision <ChevronRight size={14} />
                </Btn>
              )}
              {curSub === "prep" && (
                <Btn variant="secondary" size="sm" onClick={() => { onSubStep(stepKey, "interview"); navigate(destMap.interview.dest); }}>
                  Passer l'entretien directement <ChevronRight size={14} />
                </Btn>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Étape Décision ── */}
      {activeStep?.label === "Décision" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-bold text-[#010101] mb-1">Prendre la décision finale</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{STEP_META["Décision"]?.desc}</p>
          <Btn variant="primary" size="sm" onClick={() => navigate(STEP_META["Décision"].dest)}>
            Prendre une décision <ChevronRight size={14} />
          </Btn>
        </div>
      )}
    </div>
  );
};

const STEP_SUMMARIES: Record<string, { short: string; full: string; transcript: string[] }> = {
  Screening: {
    short: "Points forts : autonomie, clarté de communication. Point de vigilance : peu d'expérience en gestion d'équipe.",
    full: "Le candidat a démontré une bonne compréhension des enjeux du poste. Son expérience en environnement scale-up est cohérente avec nos attentes. Points forts : autonomie, clarté de communication. Point de vigilance : peu d'expérience en gestion d'équipe directe.",
    transcript: [
      "Parlez-moi de votre parcours en quelques minutes.",
      "J'ai débuté en agence sur des projets React, puis rejoint une startup Series A où j'ai pris en charge le front complet — de 0 à 40k utilisateurs. J'ai ensuite évolué vers une position plus transversale, avec des échanges réguliers avec le product et le design.",
      "Qu'est-ce qui vous attire dans ce poste en particulier ?",
      "La combinaison scale-up + problème métier complexe. Je cherche un endroit où mon impact est mesurable et où je peux collaborer avec une équipe solide. Votre stack (Next.js, TypeScript) correspond exactement à mon expertise.",
      "Comment gérez-vous les désaccords techniques dans une équipe ?",
      "Je privilégie la discussion documentée — RFC ou ADR selon la criticité. Si le désaccord persiste, je propose de tester les deux approches sur un scope limité et de décider sur la data.",
    ],
  },
  Topgrading: {
    short: "Parcours solide avec des résultats mesurables. Motivations d'évolution alignées avec le poste.",
    full: "Entretien chronologique complet réalisé sur 90 minutes. Le candidat a présenté un parcours solide avec des résultats mesurables à chaque étape. Capacité à prendre des décisions difficiles confirmée. Motivations d'évolution alignées avec le poste proposé.",
    transcript: [
      "Reprenons depuis votre premier poste. Chez Agence Pixel, quel était votre rôle exact ?",
      "Développeur front junior, en charge des intégrations HTML/CSS et des animations. J'ai rapidement pris en main React quand l'agence a basculé ses projets vers ce framework.",
      "Qu'est-ce que vous avez accompli dont vous êtes le plus fier à ce stade ?",
      "J'ai proposé et mis en place un système de design tokens partagé entre trois projets clients, ce qui a réduit le temps d'intégration de 40%. C'était une initiative personnelle, non demandée.",
      "Pourquoi avez-vous quitté ce poste ?",
      "L'agence est passée sur du dev offshore et le rôle est devenu principalement de la supervision. Je voulais continuer à coder et évoluer dans un environnement produit.",
      "Chez Flowtech, vous étiez lead front. Comment avez-vous géré la montée en compétences de l'équipe ?",
      "Mise en place de code reviews systématiques, sessions de pair-programming hebdomadaires, et une documentation vivante des patterns qu'on validait ensemble. Deux juniors ont été promus en moins d'un an.",
    ],
  },
};

// Shared navigation state for candidate sub-pages
type CandidateNavState = {
  step: string;
  from: Screen;
};

const CvModal = ({ candidate, onClose }: { candidate: CandidateData; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div
      className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      {/* Modal header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
        <div className="flex items-center gap-3">
          <Avatar initials={candidate.initials} color={candidate.avatarColor} size="sm" />
          <div>
            <p className="text-sm font-bold text-[#010101]">{candidate.name}</p>
            <p className="text-[10px] text-gray-400">CV · Lecture seule</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
          <X size={13} className="text-gray-500" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* En-tête identité */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${candidate.avatarColor}`}>
            {candidate.initials}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{candidate.name}</h2>
            {candidate.title && <p className="text-sm text-gray-500 mt-0.5">{candidate.title}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {candidate.location && <span className="text-[10px] text-gray-400">{candidate.location}</span>}
              {candidate.email && <span className="text-[10px] text-gray-400">{candidate.email}</span>}
            </div>
          </div>
        </div>

        {/* Résumé */}
        {candidate.summary && (
          <>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Résumé</p>
              <p className="text-xs text-gray-600 leading-relaxed">{candidate.summary}</p>
            </div>
          </>
        )}

        {/* Expériences */}
        {candidate.experiences && candidate.experiences.length > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Expériences</p>
              <div className="flex flex-col gap-0">
                {candidate.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#99BAF8] mt-1.5 flex-shrink-0" />
                      {i < candidate.experiences!.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-[#010101]">{exp.role}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{exp.period}</span>
                      </div>
                      <p className="text-[10px] font-medium text-[#3a6fd4] mb-2">{exp.company}</p>
                      <ul className="flex flex-col gap-1">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
                            <span className="text-gray-300 flex-shrink-0 mt-0.5">—</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Formation */}
        {candidate.education && (
          <>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Formation</p>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#CCB8FF] mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#010101]">{candidate.education.degree}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{candidate.education.school} · {candidate.education.year}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Compétences */}
        {candidate.skills && candidate.skills.length > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Compétences</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map(skill => (
                  <span key={skill} className="text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full px-3 py-1">{skill}</span>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  </div>
);

const CandidateDetailScreen = ({ navigate, current, candidate, justCreated = false, onDismissCreated, onPrepare, subStep, onSubStep }: {
  navigate: (s: Screen) => void; current: Screen; candidate: CandidateData;
  justCreated?: boolean; onDismissCreated?: () => void; onPrepare?: (step: string) => void;
  subStep: Record<string, SubStep>; onSubStep: (step: string, s: SubStep) => void;
}) => {
  const [cvOpen, setCvOpen] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, "retained" | "rejected" | null>>({
    Screening: null,
    Topgrading: null,
  });
  const [synthNav, setSynthNav] = useState<CandidateNavState | null>(null);

  const goToSynthesis = (step: string) => {
    setSynthNav({ step, from: "candidate-detail" });
    navigate("candidate-synthesis");
  };

  const allDone = candidate.screening === "done" && candidate.topgrading === "done";
  const scoreColor = candidate.score !== null
    ? candidate.score >= 75 ? "text-[#1e8f52]" : candidate.score >= 50 ? "text-[#3a6fd4]" : "text-red-400"
    : "";
  const scoreBg = candidate.score !== null
    ? candidate.score >= 75 ? "bg-[#75DA9F]/12 border-[#75DA9F]/25" : candidate.score >= 50 ? "bg-[#99BAF8]/12 border-[#99BAF8]/25" : "bg-red-50 border-red-100"
    : "";

  const completedSteps = [
    candidate.screening === "done" && { label: "Screening", date: candidate.screeningDate!, interviewer: candidate.screeningInterviewer! },
    candidate.topgrading === "done" && { label: "Topgrading", date: candidate.topgradingDate!, interviewer: candidate.topgradingInterviewer! },
  ].filter(Boolean) as { label: string; date: string; interviewer: string }[];

  // Sub-screen: Synthesis
  if (synthNav?.from === "candidate-detail" && current === "candidate-synthesis" && synthNav) {
    const data = STEP_SUMMARIES[synthNav.step];
    return (
      <AppLayout current="candidate-detail" navigate={navigate} headerTitle={`Synthèse — ${synthNav.step}`}>
        <div className="max-w-2xl mx-auto">
          <BackLink onClick={() => { setSynthNav(null); navigate("candidate-detail"); }} />
          <Card className="p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={candidate.initials} color={candidate.avatarColor} size="md" />
              <div>
                <p className="text-sm font-bold text-[#010101]">{candidate.name}</p>
                <p className="text-[10px] text-gray-400">{synthNav.step} · {completedSteps.find(s => s.label === synthNav.step)?.date}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Synthèse complète</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data?.full}</p>
            </div>
            <button
              onClick={() => { setSynthNav({ step: synthNav.step, from: "candidate-synthesis" }); navigate("candidate-transcript"); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#3a6fd4] hover:underline"
            >
              <FileText size={13} />Voir le détail de l'entretien complet <ChevronRight size={11} />
            </button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Sub-screen: Transcript (read-only)
  if (synthNav?.from === "candidate-synthesis" && current === "candidate-transcript" && synthNav) {
    const data = STEP_SUMMARIES[synthNav.step];
    return (
      <AppLayout current="candidate-detail" navigate={navigate} headerTitle={`Entretien — ${synthNav.step}`}>
        <div className="max-w-2xl mx-auto">
          <BackLink onClick={() => { setSynthNav({ step: synthNav.step, from: "candidate-detail" }); navigate("candidate-synthesis"); }} />
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lecture seule</span>
            <span className="text-[10px] text-gray-300">— Cet entretien ne peut pas être modifié</span>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <Avatar initials={candidate.initials} color={candidate.avatarColor} size="md" />
              <div>
                <p className="text-sm font-bold text-[#010101]">{candidate.name}</p>
                <p className="text-[10px] text-gray-400">{synthNav.step} · {completedSteps.find(s => s.label === synthNav.step)?.date} · {completedSteps.find(s => s.label === synthNav.step)?.interviewer}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {(data?.transcript || []).map((line, i) => {
                const isQuestion = i % 2 === 0;
                return (
                  <div key={i} className={`flex gap-3 ${isQuestion ? "" : "flex-row-reverse"}`}>
                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 ${isQuestion ? "bg-[#99BAF8]/20 text-[#3a6fd4]" : "bg-[#75DA9F]/15 text-[#1e8f52]"}`}>
                      {isQuestion ? "Q" : "R"}
                    </div>
                    <div className={`flex-1 rounded-xl px-3.5 py-3 text-xs leading-relaxed ${isQuestion ? "bg-gray-50 text-gray-700" : "bg-[#75DA9F]/8 text-gray-700 text-right"}`}>
                      {line}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout current={current} navigate={navigate} headerTitle={candidate.name}>
      {cvOpen && <CvModal candidate={candidate} onClose={() => setCvOpen(false)} />}
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("candidates")} />

        {/* ── Bannière création ── */}
        {justCreated && (
          <div className="flex items-center gap-3 bg-[#75DA9F]/10 border border-[#75DA9F]/30 rounded-2xl px-5 py-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#75DA9F]/20 flex items-center justify-center flex-shrink-0">
              <Check size={15} className="text-[#1e8f52]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#010101]">Fiche candidat créée avec succès</p>
              <p className="text-xs text-gray-500 mt-0.5">Le profil de {candidate.name} est prêt. Vous pouvez démarrer le processus d'évaluation.</p>
            </div>
            <button onClick={onDismissCreated} className="w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center flex-shrink-0 transition-all">
              <X size={11} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* ── En-tête ── */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar initials={candidate.initials} color={candidate.avatarColor} size="lg" />
              <div>
                <h1 className="text-lg font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>{candidate.name}</h1>
                {candidate.title && null}
                <p className="text-xs text-gray-400 mt-0.5">{candidate.campaign}</p>
              </div>
            </div>
            <button
              onClick={() => setCvOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#010101] hover:border-gray-300 px-3 py-2 rounded-xl transition-all"
            >
              <FileText size={13} />Voir le CV
            </button>
          </div>

          {candidate.experiences && candidate.experiences.length > 0 && (
            <>
              <div className="h-px bg-gray-100 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Expériences</p>
              <div className="flex flex-col gap-0">
                {candidate.experiences.map((exp, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-[#99BAF8] mt-1.5 flex-shrink-0" />
                      {i < candidate.experiences!.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-[#010101]">{exp.role}</p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{exp.period}</span>
                      </div>
                      <p className="text-[10px] font-medium text-[#3a6fd4] mb-2">{exp.company}</p>
                      <ul className="flex flex-col gap-1">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
                            <span className="text-gray-300 flex-shrink-0 mt-0.5">—</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── Frise ── */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Avancement</p>
          <CandidateFrise
            screening={candidate.screening}
            topgrading={candidate.topgrading}
            decision={candidate.decision}
            navigate={navigate}
            onPrepare={onPrepare}
            subStep={subStep}
            onSubStep={onSubStep}
          />
        </Card>

        {/* ── Étapes réalisées ── */}
        {completedSteps.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Étapes réalisées</p>
            {completedSteps.map(step => {
              const dec = decisions[step.label];
              const summary = STEP_SUMMARIES[step.label];
              return (
                <Card
                  key={step.label}
                  className="p-5 hover:border-gray-200 transition-all cursor-pointer"
                  onClick={() => goToSynthesis(step.label)}
                >
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#75DA9F]/15 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-[#1e8f52]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#010101]">{step.label}</p>
                        <p className="text-[10px] text-gray-400">{step.date} · {step.interviewer}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>

                  {/* Aperçu synthèse */}
                  {summary && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 pl-8">{summary.short}</p>
                  )}

                  {/* Décision bloc */}
                  <div onClick={e => e.stopPropagation()}>
                    {dec === null && (
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-[#010101] mb-2.5">Votre décision suite à cet entretien :</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDecisions(d => ({ ...d, [step.label]: "retained" }))}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-[#75DA9F]/12 border border-[#75DA9F]/25 text-[#1e8f52] hover:bg-[#75DA9F]/20 px-3.5 py-2 rounded-xl transition-all"
                          >
                            <Check size={12} />Retenir pour la suite
                          </button>
                          <button
                            onClick={() => setDecisions(d => ({ ...d, [step.label]: "rejected" }))}
                            className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-all"
                          >
                            <X size={12} />Non retenu
                          </button>
                        </div>
                      </div>
                    )}
                    {dec === "retained" && (
                      <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#75DA9F]/15 flex items-center justify-center"><Check size={10} className="text-[#1e8f52]" /></div>
                        <span className="text-xs font-semibold text-[#1e8f52]">Retenu pour la suite</span>
                        <button onClick={() => setDecisions(d => ({ ...d, [step.label]: null }))} className="ml-auto text-[10px] text-gray-400 hover:text-gray-500 underline">Modifier</button>
                      </div>
                    )}
                    {dec === "rejected" && (
                      <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center"><X size={10} className="text-red-400" /></div>
                        <span className="text-xs font-semibold text-red-400">Non retenu</span>
                        <button onClick={() => setDecisions(d => ({ ...d, [step.label]: null }))} className="ml-auto text-[10px] text-gray-400 hover:text-gray-500 underline">Modifier</button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}


        {/* ── Note globale ── */}
        {allDone && candidate.score !== null && (
          <Card className={`p-5 border ${scoreBg}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Note globale</p>
            <div className="flex items-center gap-5">
              <div className={`text-5xl font-bold ${scoreColor}`} style={{ fontFamily: "Poppins, sans-serif" }}>
                {candidate.score}
                <span className="text-xl font-normal text-gray-400">/100</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-white rounded-full h-2.5 mb-1.5 overflow-hidden border border-black/[0.06]">
                  <div className={`h-full rounded-full ${candidate.score >= 75 ? "bg-[#75DA9F]" : candidate.score >= 50 ? "bg-[#99BAF8]" : "bg-red-400"}`} style={{ width: `${candidate.score}%` }} />
                </div>
                <p className="text-xs text-gray-400">
                  {candidate.score >= 75 ? "Profil très solide — recommandé à l'embauche" : candidate.score >= 50 ? "Profil correct — à discuter en équipe" : "Profil insuffisant — non retenu"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

// ─── Process steps frise ──────────────────────────────────────────────────────
const PROCESS_STEPS = ["Cadrage", "Screening", "Topgrading", "Décision"];

const ProcessFrise = ({ active }: { active: number }) => (
  <div className="flex items-center gap-0">
    {PROCESS_STEPS.map((step, i) => {
      const done = i < active;
      const current = i === active;
      return (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              done ? "bg-[#75DA9F] text-white" : current ? "bg-[#99BAF8] text-[#010101]" : "bg-gray-100 text-gray-400"
            }`}>
              {done ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs font-semibold whitespace-nowrap ${
              current ? "text-[#010101]" : done ? "text-[#1e8f52]" : "text-gray-400"
            }`}>
              {step}
            </span>
          </div>
          {i < PROCESS_STEPS.length - 1 && (
            <div className={`h-px w-12 mx-1 mb-5 flex-shrink-0 transition-all ${done ? "bg-[#75DA9F]" : "bg-gray-200"}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Transition screen ────────────────────────────────────────────────────────
type TransitionConfig = {
  step: number;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  nextLabel?: string;
  next: Screen;
  back?: Screen;
};

const TransitionScreen = ({
  navigate, current, config,
}: {
  navigate: (s: Screen) => void;
  current: Screen;
  config: TransitionConfig;
}) => (
  <AppLayout current={current} navigate={navigate}>
    <div className="flex items-center justify-center min-h-full">
      <div className="max-w-lg w-full text-center flex flex-col items-center gap-8 py-16">
        {/* Frise */}
        <ProcessFrise active={config.step} />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#99BAF8]/15 flex items-center justify-center text-[#3a6fd4]">
          {config.icon}
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#3a6fd4]">
            {config.eyebrow}
          </span>
          <h1 className="text-3xl font-bold text-[#010101] leading-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
            {config.title}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            {config.description}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {config.back && (
            <Btn variant="secondary" onClick={() => navigate(config.back!)}>
              <ArrowLeft size={15} />
              Retour
            </Btn>
          )}
          <Btn variant="primary" size="lg" onClick={() => navigate(config.next)}>
            {config.nextLabel ?? "Continuer"}
            <ChevronRight size={17} />
          </Btn>
        </div>
      </div>
    </div>
  </AppLayout>
);

// ─── Transition configs ────────────────────────────────────────────────────────
const TRANSITIONS: Record<string, (navigate: (s: Screen) => void, current: Screen) => React.ReactNode> = {
  "transition-job": (navigate, current) => (
    <TransitionScreen navigate={navigate} current={current} config={{
      step: 0,
      icon: <FileText size={28} />,
      eyebrow: "Étape suivante",
      title: "Créer la fiche de poste",
      description: "Une fiche de poste structurée est le socle de tout recrutement fiable. noa vous guide étape par étape pour définir la mission, les résultats attendus et les compétences clés, à partir de vos réponses.",
      nextLabel: "Créer la fiche de poste",
      next: "job-mission",
    }} />
  ),
  "transition-candidate": (navigate, current) => (
    <TransitionScreen navigate={navigate} current={current} config={{
      step: 1,
      icon: <Users size={28} />,
      eyebrow: "Étape suivante",
      title: "Ajouter un candidat",
      description: "La fiche de poste est prête. Importez le CV d'un candidat pour que noa génère automatiquement sa fiche et prépare la grille d'évaluation adaptée au poste.",
      nextLabel: "Ajouter un candidat",
      next: "add-candidate",
    }} />
  ),
  "transition-screening": (navigate, current) => (
    <TransitionScreen navigate={navigate} current={current} config={{
      step: 2,
      icon: <Search size={28} />,
      eyebrow: "Screening",
      title: "Préparer l'entretien de screening",
      description: "Le screening permet de vérifier rapidement les prérequis objectifs du poste. noa a généré une grille de questions standardisées à partir de la fiche de poste, à compléter pendant l'entretien téléphonique.",
      nextLabel: "Démarrer le screening",
      next: "screening-grid",
    }} />
  ),
  "transition-topgrading": (navigate, current) => (
    <TransitionScreen navigate={navigate} current={current} config={{
      step: 3,
      icon: <Award size={28} />,
      eyebrow: "Topgrading",
      title: "Préparer l'entretien Topgrading",
      description: "Le Topgrading explore chronologiquement le parcours du candidat pour identifier ses patterns de performance réels, au-delà des formulations d'un CV.",
      nextLabel: "Démarrer le Topgrading",
      next: "topgrading-grid",
    }} />
  ),
  "transition-final": (navigate, current) => (
    <TransitionScreen navigate={navigate} current={current} config={{
      step: 4,
      icon: <TrendingUp size={28} />,
      eyebrow: "Décision finale",
      title: "Consulter la note globale",
      description: "noa a calculé une note de synthèse à partir de l'ensemble des évaluations : résultats attendus, compétences et fit culturel. Cette note est une aide à votre décision, pas une réponse définitive.",
      nextLabel: "Voir la note globale",
      next: "final-decision",
    }} />
  ),
};

// ─── Mission data ──────────────────────────────────────────────────────────────
type MissionData = {
  title: string;
  reason: string;
  status: string;
  statusColor: BadgeColor;
  date: string;
  progress: number;
  processStep: number;
  mission: string;
  objectives: { l: string; m: string; ok: boolean }[];
  skills: { l: string; tags: string[] }[];
  candidates: { n: string; i: string; s: string; b: BadgeColor; sc: number | null; ac: string }[];
};

const MISSIONS: MissionData[] = [
  {
    title: "Développeur Full-Stack Senior",
    reason: "Scale / Croissance",
    status: "Recrutement en cours",
    statusColor: "violet",
    date: "13 juil. 2025",
    progress: 65,
    processStep: 2,
    mission: "Concevoir, développer et maintenir des fonctionnalités backend et frontend dans un contexte de forte croissance. Contribuer à l'amélioration continue de l'architecture et des pratiques d'ingénierie de l'équipe.",
    objectives: [
      { l: "Livrer la refonte de l'API en 3 mois", m: "Taux de couverture tests > 80 %", ok: true },
      { l: "Réduire le temps de réponse moyen à < 200 ms", m: "Monitoring Datadog", ok: true },
      { l: "Contribuer à 2 sprints par trimestre", m: "Vélocité équipe stable", ok: false },
    ],
    skills: [
      { l: "Techniques", tags: ["React", "Node.js", "PostgreSQL", "Docker"] },
      { l: "Relationnelles", tags: ["Communication", "Feedback"] },
      { l: "Comportementales", tags: ["Autonomie", "Rigueur", "Curiosité"] },
    ],
    candidates: [
      { n: "Alexandre Martin", i: "AM", s: "Topgrading", b: "violet", sc: 82, ac: "bg-[#CCB8FF]/20 text-[#6b4ec4]" },
      { n: "Sophie Renard", i: "SR", s: "Screening", b: "blue", sc: null, ac: "bg-[#99BAF8]/20 text-[#3a6fd4]" },
      { n: "Emma Bernard", i: "EB", s: "Screening", b: "blue", sc: null, ac: "bg-[#CCB8FF]/20 text-[#6b4ec4]" },
      { n: "Marc Lefèvre", i: "ML", s: "Non retenu", b: "red", sc: 41, ac: "bg-red-50 text-red-400" },
      { n: "Thomas Nguyen", i: "TN", s: "Décision finale", b: "green", sc: 74, ac: "bg-[#75DA9F]/20 text-[#1e8f52]" },
    ],
  },
  {
    title: "Product Manager",
    reason: "Création de poste",
    status: "Recrutement en cours",
    statusColor: "violet",
    date: "2 juil. 2025",
    progress: 45,
    processStep: 2,
    mission: "Définir et prioriser la roadmap produit en étroite collaboration avec les équipes tech et design. Incarner la voix de l'utilisateur dans chaque décision pour maximiser l'impact business.",
    objectives: [
      { l: "Lancer 3 fonctionnalités majeures en 6 mois", m: "NPS utilisateur > 40", ok: true },
      { l: "Réduire le time-to-market de 30 %", m: "Cycle de sprint moyen < 2 semaines", ok: true },
      { l: "Structurer les process discovery", m: "Interviews utilisateurs mensuels", ok: false },
    ],
    skills: [
      { l: "Techniques", tags: ["Figma", "SQL", "Amplitude", "Jira"] },
      { l: "Relationnelles", tags: ["Facilitation", "Alignement", "Écoute"] },
      { l: "Comportementales", tags: ["Vision", "Priorisation", "Clarté"] },
    ],
    candidates: [
      { n: "Clara Dubois", i: "CD", s: "Screening", b: "blue", sc: null, ac: "bg-[#FEE831]/20 text-[#8a6a00]" },
      { n: "Pierre Morin", i: "PM", s: "Screening", b: "blue", sc: null, ac: "bg-[#99BAF8]/20 text-[#3a6fd4]" },
      { n: "Léa Fontaine", i: "LF", s: "Non retenu", b: "red", sc: 38, ac: "bg-red-50 text-red-400" },
    ],
  },
  {
    title: "Head of Customer Success",
    reason: "Remplacement",
    status: "En attente de candidat",
    statusColor: "yellow",
    date: "10 juil. 2025",
    progress: 20,
    processStep: 0,
    mission: "Piloter et faire grandir l'équipe Customer Success. Garantir la satisfaction et la rétention des clients en déployant une approche proactive et orientée impact mesurable.",
    objectives: [
      { l: "Atteindre un taux de rétention > 92 %", m: "Churn mensuel < 1 %", ok: true },
      { l: "Structurer les parcours d'onboarding client", m: "Time-to-value < 30 jours", ok: false },
    ],
    skills: [
      { l: "Techniques", tags: ["Salesforce", "Intercom", "Tableau"] },
      { l: "Relationnelles", tags: ["Empathie", "Gestion de conflits"] },
      { l: "Comportementales", tags: ["Leadership", "Organisation"] },
    ],
    candidates: [],
  },
];

// ─── Root ──────────────────────────────────────────────────────────────────────
const JOB_MISSION_DEFAULT = "Rejoindre l'équipe produit en tant que Développeur Full-Stack Senior pour concevoir et développer les nouvelles fonctionnalités de la plateforme. Travailler en autonomie sur des sujets techniques complexes tout en contribuant à la montée en compétences des développeurs juniors.";

// ─── Resources ────────────────────────────────────────────────────────────────
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

const ResourcesScreen = ({ navigate, current }: { navigate: (s: Screen) => void; current: Screen }) => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <AppLayout current={current} navigate={navigate} headerTitle="Ressources">
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
            Des ressources pratiques pour chaque phase du recrutement structuré — de la définition du poste à la décision finale.
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
};

// ─── Interview Prep ────────────────────────────────────────────────────────────
type PrepQuestion = { text: string; crit?: string };
type PrepGridSection = { title: string; subtitle?: string; period?: string; questions: PrepQuestion[] };

const PREP_META: Record<string, {
  goal: string;
  gridIntro: string;
  gridSections: PrepGridSection[];
  guideIntro: string;
  guideSections: { title: string; subtitle?: string; questions: { q: string; probes: string[] }[] }[];
}> = {
  Screening: {
    goal: "Le Screening est un entretien court (20–30 min) visant à valider rapidement l'adéquation du profil avec les prérequis du poste : compétences techniques, disponibilité, attentes salariales et motivation.",
    gridIntro: "Même grille que celle utilisée pendant l'entretien. Pour chaque critère, vous cocherez Oui / Partiel / Non. Modifiez les intitulés avant de commencer.",
    gridSections: [
      {
        title: "Grille de screening",
        questions: [
          { text: "Expérience en développement React de niveau senior (> 3 ans)", crit: "Prérequis non négociable" },
          { text: "Maîtrise TypeScript dans un contexte professionnel", crit: "Prérequis non négociable" },
          { text: "Expérience en environnement startup ou PME tech (< 50 pers.)", crit: "Critère important" },
          { text: "A déjà accompagné ou mentoré des développeurs juniors", crit: "Critère important" },
          { text: "Disponibilité sous 4 semaines maximum", crit: "Contrainte logistique" },
          { text: "Prétentions salariales dans la fourchette 60–75 k€", crit: "Contrainte budgétaire" },
        ],
      },
    ],
    guideIntro: "Pour chaque critère de la grille, voici les questions à poser et les relances pour creuser la réponse.",
    guideSections: [
      {
        title: "Prérequis techniques",
        questions: [
          {
            q: "Expérience React senior",
            probes: [
              "Sur combien d'années avez-vous utilisé React en contexte professionnel ?",
              "Quels sont les projets les plus complexes que vous avez menés avec React ?",
              "Avez-vous travaillé sur des architectures front-end à fort volume (> 10k utilisateurs) ?",
              "Quelles librairies de l'écosystème React maîtrisez-vous (state management, routing, testing) ?",
            ],
          },
          {
            q: "Maîtrise TypeScript",
            probes: [
              "Dans quels contextes avez-vous utilisé TypeScript ?",
              "Avez-vous migré des projets JS vers TypeScript ? Si oui, comment avez-vous géré la transition ?",
              "Comment gérez-vous les types complexes (génériques, types conditionnels) ?",
            ],
          },
        ],
      },
      {
        title: "Contexte professionnel",
        questions: [
          {
            q: "Expérience en startup / PME tech",
            probes: [
              "Pouvez-vous décrire la taille et le contexte de votre dernière structure (< 50 personnes) ?",
              "Comment gériez-vous la dette technique et les itérations rapides dans ce contexte ?",
              "Avez-vous participé à des décisions d'architecture avec peu de ressources ?",
            ],
          },
          {
            q: "Mentoring de développeurs juniors",
            probes: [
              "Pouvez-vous me donner un exemple concret de junior que vous avez accompagné ?",
              "Sur combien de temps ? Quel a été l'impact mesurable pour cette personne ?",
              "Comment adaptez-vous votre approche pédagogique selon le profil ?",
            ],
          },
        ],
      },
      {
        title: "Disponibilité & attentes",
        questions: [
          {
            q: "Disponibilité & logistique",
            probes: [
              "Quelle est votre date de disponibilité réelle ?",
              "Avez-vous un préavis en cours ? Est-il négociable ?",
              "Y a-t-il des contraintes de localisation ou de déplacement à prendre en compte ?",
            ],
          },
          {
            q: "Prétentions salariales",
            probes: [
              "Quelle est votre rémunération actuelle (fixe + variable) ?",
              "Quelles sont vos attentes pour ce poste ?",
              "Y a-t-il d'autres éléments importants pour vous (télétravail, RTT, BSPCE) ?",
            ],
          },
        ],
      },
    ],
  },
  Topgrading: {
    goal: "Le Topgrading est un entretien approfondi (60–90 min) basé sur le parcours chronologique du candidat. L'objectif est d'identifier ses patterns de performance, comportements récurrents, réalisations mesurables et axes de développement.",
    gridIntro: "La grille reprend exactement les épisodes et questions de la grille d'évaluation Topgrading. Pour chaque poste, notez librement les réponses.",
    gridSections: [
      {
        title: "Scaleway",
        subtitle: "Senior Frontend Engineer",
        period: "2021–2025",
        questions: [
          { text: "Quelles étaient vos missions principales ?" },
          { text: "Quelle est votre réalisation dont vous êtes le plus fier ?" },
          { text: "Qu'est-ce qui vous a amené à quitter ce poste ?" },
        ],
      },
      {
        title: "Skello",
        subtitle: "Développeur Full-Stack",
        period: "2019–2021",
        questions: [
          { text: "Quelles étaient vos missions principales ?" },
          { text: "Comment gérez-vous un désaccord technique avec votre manager ?" },
          { text: "Quelle était l'ambiance dans l'équipe ?" },
        ],
      },
      {
        title: "Freelance",
        subtitle: "Développeur Web indépendant",
        period: "2017–2019",
        questions: [
          { text: "Quels types de clients et projets ?" },
          { text: "Comment organisez-vous votre travail en autonomie ?" },
        ],
      },
    ],
    guideIntro: "Pour chaque épisode du parcours, voici les questions à poser et les relances pour aller chercher des exemples concrets et mesurables.",
    guideSections: [
      {
        title: "Scaleway",
        subtitle: "2021–2025 · Senior Frontend Engineer",
        questions: [
          {
            q: "Missions principales",
            probes: [
              "Quelles étaient vos responsabilités techniques au quotidien ?",
              "Combien de personnes composaient l'équipe front ? Quel était votre rôle dans l'équipe ?",
              "Étiez-vous autonome sur les choix d'architecture ou dépendant d'un lead technique ?",
            ],
          },
          {
            q: "Réalisation dont vous êtes le plus fier",
            probes: [
              "Décrivez le contexte et l'enjeu du projet.",
              "Quel était votre rôle précis ?",
              "Quel a été l'impact mesurable (performance, adoption, revenus) ?",
              "Qu'est-ce que votre manager de l'époque dirait de votre contribution ?",
            ],
          },
          {
            q: "Raison de départ",
            probes: [
              "Qu'est-ce qui vous a poussé à chercher autre chose ?",
              "Si c'était à refaire, resteriez-vous plus longtemps ? Pourquoi ?",
              "Qu'aurait dû changer l'entreprise pour vous retenir ?",
            ],
          },
        ],
      },
      {
        title: "Skello",
        subtitle: "2019–2021 · Développeur Full-Stack",
        questions: [
          {
            q: "Missions principales",
            probes: [
              "Quelle était la répartition front / back dans votre quotidien ?",
              "Avec quelles équipes travailliez-vous (produit, design, data) ?",
              "Quels étaient vos principaux livrables ?",
            ],
          },
          {
            q: "Désaccord technique avec un manager",
            probes: [
              "Pouvez-vous me donner un exemple concret ?",
              "Comment avez-vous exprimé votre point de vue ?",
              "Quel a été le résultat ? Avez-vous eu raison, tort, ou les deux en partie ?",
            ],
          },
          {
            q: "Ambiance & dynamique d'équipe",
            probes: [
              "Comment décrieriez-vous la culture technique de l'équipe ?",
              "Y avait-il des tensions ? Comment étaient-elles gérées ?",
              "Qu'est-ce qui vous manque le plus de cette équipe ?",
            ],
          },
        ],
      },
      {
        title: "Freelance",
        subtitle: "2017–2019 · Développeur Web indépendant",
        questions: [
          {
            q: "Clients & projets",
            probes: [
              "Quels secteurs et types de clients (startups, agences, grands comptes) ?",
              "Quel était le projet le plus complexe techniquement ?",
              "Comment gériez-vous la relation client (brief, livrables, retours) ?",
            ],
          },
          {
            q: "Organisation en autonomie",
            probes: [
              "Comment structuriez-vous votre semaine type ?",
              "Comment gériez-vous les imprévus et les changements de scope ?",
              "Pourquoi avez-vous choisi d'arrêter le freelance à ce moment-là ?",
            ],
          },
        ],
      },
    ],
  },
};

const GUIDE_FORMATS = ["Visioconférence", "Téléphone", "Présentiel"];
const GUIDE_DURATIONS = ["20 min", "30 min", "45 min", "60 min", "90 min"];

const InterviewPrepScreen = ({ navigate, current, candidate, step, onPrepDone }: {
  navigate: (s: Screen) => void; current: Screen; candidate: CandidateData; step: string; onPrepDone?: () => void;
}) => {
  const meta = PREP_META[step] ?? PREP_META["Screening"];
  const [gridGenerated, setGridGenerated] = useState(false);
  const [gridGenerating, setGridGenerating] = useState(false);
  const [editedSections, setEditedSections] = useState<PrepGridSection[]>([]);
  const [format, setFormat] = useState("");
  const [duration, setDuration] = useState("");
  const [guideGenerated, setGuideGenerated] = useState(false);
  const [guideGenerating, setGuideGenerating] = useState(false);

  const canGenerateGuide = gridGenerated && format && duration;

  const handleGenerateGrid = () => {
    setGridGenerating(true);
    setTimeout(() => {
      setEditedSections(meta.gridSections.map(s => ({ ...s, questions: s.questions.map(q => ({ ...q })) })));
      setGridGenerating(false);
      setGridGenerated(true);
    }, 1800);
  };

  const handleGenerateGuide = () => {
    setGuideGenerating(true);
    setTimeout(() => { setGuideGenerating(false); setGuideGenerated(true); }, 1800);
  };

  const updateQuestion = (si: number, qi: number, val: string) => {
    setEditedSections(prev => prev.map((s, i) => i === si ? { ...s, questions: s.questions.map((q, j) => j === qi ? { ...q, text: val } : q) } : s));
  };
  const addQuestion = (si: number) => {
    setEditedSections(prev => prev.map((s, i) => i === si ? { ...s, questions: [...s.questions, { text: "" }] } : s));
  };
  const removeQuestion = (si: number, qi: number) => {
    setEditedSections(prev => prev.map((s, i) => i === si ? { ...s, questions: s.questions.filter((_, j) => j !== qi) } : s));
  };

  return (
    <AppLayout current={current} navigate={navigate} headerTitle={`Préparer le ${step}`}>
      <div className="max-w-2xl mx-auto">
        <BackLink onClick={() => navigate("candidate-detail")} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step === "Screening" ? "bg-[#99BAF8]/15" : "bg-[#CCB8FF]/15"}`}>
            <FileText size={17} className={step === "Screening" ? "text-[#3a6fd4]" : "text-[#6b4ec4]"} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#010101]" style={{ fontFamily: "Poppins, sans-serif" }}>Préparer le {step}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{candidate.name} · {candidate.campaign}</p>
          </div>
        </div>

        {/* Objectif */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Objectif de l'entretien</p>
          <p className="text-sm text-gray-600 leading-relaxed">{meta.goal}</p>
        </Card>

        {/* Grille d'entretien */}
        <Card className="p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grille d'entretien</p>
            {gridGenerated && <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full"><Zap size={9} />Générée par noa</span>}
          </div>

          {!gridGenerated && !gridGenerating && (
            <button
              onClick={handleGenerateGrid}
              className="w-full group flex items-center gap-4 bg-[#010101] text-white rounded-xl px-5 py-4 hover:bg-gray-900 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-[#FEE831]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Générer la grille d'entretien</p>
                <p className="text-xs text-gray-400 mt-0.5">noa adapte la grille au poste et au profil de {candidate.name}.</p>
              </div>
              <ChevronRight size={15} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          )}

          {gridGenerating && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-5 py-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#3a6fd4] rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-500">noa génère la grille…</p>
            </div>
          )}

          {gridGenerated && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-400 leading-relaxed">{meta.gridIntro}</p>

              {step === "Screening" && editedSections[0] && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex flex-col divide-y divide-gray-50">
                    {editedSections[0].questions.map((q, qi) => (
                      <div key={qi} className="flex items-start gap-4 px-4 py-3.5 group">
                        <div className="flex-1 min-w-0">
                          <input
                            value={q.text}
                            onChange={e => updateQuestion(0, qi, e.target.value)}
                            className="w-full text-sm text-[#010101] bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#99BAF8] focus:outline-none py-0.5 leading-snug transition-colors"
                          />
                          {q.crit && <span className="text-[10px] text-gray-400 mt-1 block">{q.crit}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-25 select-none pointer-events-none">
                          {["Oui", "Partiel", "Non"].map(opt => (
                            <span key={opt} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-500">{opt}</span>
                          ))}
                        </div>
                        <button onClick={() => removeQuestion(0, qi)} className="mt-1.5 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-50 bg-gray-50">
                    <button onClick={() => addQuestion(0)} className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#3a6fd4] transition-colors">
                      <Plus size={11} />Ajouter un critère
                    </button>
                  </div>
                </div>
              )}

              {step === "Topgrading" && (
                <div className="flex flex-col gap-3">
                  {editedSections.map((section, si) => (
                    <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-[#010101] text-sm">{section.title}</p>
                          {section.subtitle && <p className="text-xs text-gray-400 mt-0.5">{section.subtitle}</p>}
                        </div>
                        {section.period && <Badge color="violet">{section.period}</Badge>}
                      </div>
                      <div className="flex flex-col gap-2 p-3 bg-gray-50">
                        {section.questions.map((q, qi) => (
                          <div key={qi} className="flex items-start gap-2 bg-white rounded-xl px-3.5 py-2.5 group">
                            <input
                              value={q.text}
                              onChange={e => updateQuestion(si, qi, e.target.value)}
                              className="flex-1 text-xs font-semibold text-gray-600 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#99BAF8] focus:outline-none py-0.5 leading-relaxed transition-colors"
                            />
                            <button onClick={() => removeQuestion(si, qi)} className="mt-1 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addQuestion(si)} className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-[#3a6fd4] transition-colors mt-1 pl-1">
                          <Plus size={11} />Ajouter une question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Format & durée */}
        <Card className="p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Format de l'entretien</p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-[#010101] mb-2">Format</p>
              <div className="flex flex-col gap-1.5">
                {GUIDE_FORMATS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all text-left ${format === f ? "border-[#99BAF8] bg-[#99BAF8]/8 text-[#3a6fd4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${format === f ? "border-[#3a6fd4]" : "border-gray-300"}`}>
                      {format === f && <div className="w-1.5 h-1.5 rounded-full bg-[#3a6fd4]" />}
                    </div>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#010101] mb-2">Durée</p>
              <div className="flex flex-wrap gap-2">
                {GUIDE_DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${duration === d ? "border-[#99BAF8] bg-[#99BAF8]/10 text-[#3a6fd4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Guide d'entretien */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Guide d'entretien</p>
            {guideGenerated && <span className="flex items-center gap-1 text-[10px] font-semibold text-[#1e8f52] bg-[#75DA9F]/12 border border-[#75DA9F]/25 px-2 py-0.5 rounded-full"><Zap size={9} />Générée par noa</span>}
          </div>

          {!canGenerateGuide && !guideGenerated && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
              {!gridGenerated ? "Générez d'abord la grille d'entretien." : "Renseignez le format et la durée pour générer le guide."}
            </p>
          )}

          {canGenerateGuide && !guideGenerated && !guideGenerating && (
            <button
              onClick={handleGenerateGuide}
              className="w-full group flex items-center gap-4 bg-[#010101] text-white rounded-xl px-5 py-4 hover:bg-gray-900 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-[#FEE831]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Générer le guide d'entretien</p>
                <p className="text-xs text-gray-400 mt-0.5">{format} · {duration} · Adapté au profil de {candidate.name}</p>
              </div>
              <ChevronRight size={15} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          )}

          {guideGenerating && (
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-5 py-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-[#3a6fd4] rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-gray-500">noa rédige le guide…</p>
            </div>
          )}

          {guideGenerated && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-gray-500">{meta.guideIntro}</p>
              {meta.guideSections.map((section, si) => (
                <div key={si} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex items-baseline gap-2">
                    <p className="text-xs font-semibold text-[#010101]">{section.title}</p>
                    {section.subtitle && <p className="text-[10px] text-gray-400">{section.subtitle}</p>}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {section.questions.map((item, qi) => (
                      <div key={qi} className="px-4 py-3">
                        <p className="text-[11px] font-semibold text-[#010101] mb-2">{item.q}</p>
                        <ul className="flex flex-col gap-1.5">
                          {item.probes.map((probe, pi) => (
                            <li key={pi} className="flex gap-2 text-[11px] text-gray-600">
                              <span className="mt-0.5 flex-shrink-0 w-1 h-1 rounded-full bg-gray-300 mt-[6px]" />
                              {probe}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Btn variant="primary" size="lg" onClick={() => { onPrepDone?.(); navigate("candidate-detail"); }}>
            <Check size={15} />Préparation terminée
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("signup");
  const [selectedMission, setSelectedMission] = useState<MissionData>(MISSIONS[0]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData>(CANDIDATES[0]);
  const [candidateJustCreated, setCandidateJustCreated] = useState(false);
  const [interviewPrepStep, setInterviewPrepStep] = useState<string>("Screening");
  const [jobMissionText, setJobMissionText] = useState(JOB_MISSION_DEFAULT);
  const [subStep, setSubStep] = useState<Record<string, SubStep>>({ Screening: "prep", Topgrading: "prep" });
  const handleSubStep = (step: string, s: SubStep) => setSubStep(prev => ({ ...prev, [step]: s }));
  const navigate = (s: Screen) => setScreen(s);
  const navigateToMission = (m: MissionData) => { setSelectedMission(m); setScreen("mission-detail"); };
  const p = { navigate, current: screen };

  if (screen === "signup") return <SignupScreen navigate={navigate} />;
  if (screen === "login") return <LoginScreen navigate={navigate} />;
  if (screen === "onboarding") return <OnboardingScreen navigate={navigate} />;
  if (screen === "campaign-why") return <CampaignWhyScreen {...p} />;
  if (screen === "job-summary") return <JobSummaryScreen {...p} missionText={jobMissionText} setMissionText={setJobMissionText} />;
  if (screen in TRANSITIONS) return <>{TRANSITIONS[screen](navigate, screen)}</>;
  if (screen === "job-mission") return <JobMissionScreen {...p} missionText={jobMissionText} setMissionText={setJobMissionText} />;
  if (screen === "job-results") return <JobResultsScreen {...p} />;
  if (screen === "job-skills") return <JobSkillsScreen {...p} />;
  if (screen === "job-coherence") return <JobCoherenceScreen {...p} />;
  if (screen === "job-final") return <JobFinalScreen {...p} />;
  if (screen === "add-candidate") return <AddCandidateScreen {...p} onCreated={() => { setCandidateJustCreated(true); navigate("candidate-detail"); }} />;
  if (screen === "screening-grid") return <ScreeningGridScreen {...p} candidate={selectedCandidate} />;
  if (screen === "screening-decision") return <ScreeningDecisionScreen {...p} candidate={selectedCandidate} onDecideLater={() => handleSubStep("Screening", "decision")} />;
  if (screen === "topgrading-grid") return <TopgradingGridScreen {...p} />;
  if (screen === "topgrading-decision") return <TopgradingDecisionScreen {...p} onDecideLater={() => handleSubStep("Topgrading", "decision")} />;
  if (screen === "final-decision") return <FinalDecisionScreen {...p} />;
  if (screen === "missions") return <MissionsScreen {...p} navigateToMission={navigateToMission} />;
  if (screen === "mission-detail") return <MissionDetailScreen
    {...p}
    mission={selectedMission}
    onSelectCandidate={(name) => {
      const cand = CANDIDATES.find(c => c.name === name);
      if (cand) { setSelectedCandidate(cand); navigate("candidate-detail"); }
    }}
  />;
  if (screen === "candidates") return <CandidatesScreen {...p} onSelect={setSelectedCandidate} />;
  if (screen === "candidate-detail" || screen === "candidate-synthesis" || screen === "candidate-transcript")
    return <CandidateDetailScreen
      {...p}
      candidate={selectedCandidate}
      justCreated={candidateJustCreated}
      onDismissCreated={() => setCandidateJustCreated(false)}
      subStep={subStep}
      onSubStep={handleSubStep}
      onPrepare={(step) => { setInterviewPrepStep(step); navigate("interview-prep"); }}
    />;
  if (screen === "interview-prep") return <InterviewPrepScreen
    {...p}
    candidate={selectedCandidate}
    step={interviewPrepStep}
    onPrepDone={() => handleSubStep(interviewPrepStep, "interview")}
  />;
  if (screen === "resources") return <ResourcesScreen {...p} />;
  return <DashboardScreen {...p} navigateToMission={navigateToMission} />;
}
