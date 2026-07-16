"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search, Bell, Settings, LogOut, Briefcase, Users, BarChart2,
} from "lucide-react";
import { NoaLogo } from "@/components/noa/ui-primitives";
import { signOut } from "@/app/(app)/actions";

// Ressources masquée pour l'instant (page pas prête) : la route reste, seule
// l'entrée de nav est retirée. Réajouter { label: "Ressources", icon: BookOpen, href: "/ressources" } pour la ré-activer.
const NAV = [
  { label: "Dashboard", icon: BarChart2, href: "/dashboard" },
  { label: "Campagnes de recrutement", icon: Briefcase, href: "/missions" },
  { label: "Candidats", icon: Users, href: "/candidats" },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="w-60 h-full bg-[#010101] flex flex-col flex-shrink-0">
      <div className="p-6 pb-5">
        <NoaLogo scale={0.78} />
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                active ? "bg-[#99BAF8]/20 text-[#99BAF8]" : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 pb-5 pt-3 border-t border-white/10 flex flex-col gap-0.5">
        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all">
          <Settings size={17} />
          Paramètres
        </button>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={17} />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
};

export const AppHeader = ({ title }: { title?: string }) => (
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

export const AppLayout = ({
  children, headerTitle,
}: {
  children: React.ReactNode; headerTitle?: string;
}) => (
  <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <AppHeader title={headerTitle} />
      <main className="flex-1 overflow-y-auto p-7 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
        {children}
      </main>
    </div>
  </div>
);
